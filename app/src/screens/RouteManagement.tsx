import React, {useCallback, useEffect, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';

import { Button } from '../components/atoms/Button';
import { NavBar } from '../components/molecules/NavBar';
import {RouteCard, type RouteCardData} from '../components/molecules/RouteCard';
import { BaseScreen } from '../models/BaseScreen';
import { colorTokens, radius, spacing, typography } from '../components/config';
import {deleteRoute, getRoutesByEmail} from '../services/api/apiEndpoints';
import {getUserId} from '../services/authStorage';

const pickString = (source: Record<string, unknown>, keys: string[]): string | null => {
    for (const key of keys) {
        const value = source[key];
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
    }
    return null;
};

const pickIdentifier = (source: Record<string, unknown>, keys: string[]): string | null => {
    for (const key of keys) {
        const value = source[key];
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            return String(value);
        }
    }
    return null;
};

const toCardData = (routeRecord: Record<string, unknown>, index: number): RouteCardData => {
    const routeId =
      pickIdentifier(routeRecord, ['route_id', 'routeId', 'id', '_id', 'routeID']) ??
      `__missing__-${index + 1}`;
    const routeName = pickString(routeRecord, ['route_desc', 'description', 'label', 'name']) ?? `Route ${index + 1}`;
    const departingStation = pickString(routeRecord, ['departing_station', 'departingStation']) ?? '';
    const departingLocation = pickString(routeRecord, ['departing_location', 'departingLocation']) ?? '';
    const destinationStation = pickString(routeRecord, ['destination_station', 'destinationStation']) ?? '';
    const destinationLocation = pickString(routeRecord, ['destination_location', 'destinationLocation']) ?? '';
    const day = pickString(routeRecord, ['day_of_week', 'dayOfWeek', 'day']) ?? 'Scheduled';
    const time =
      pickString(routeRecord, ['time']) ??
      [pickString(routeRecord, ['time_from', 'timeFrom']) ?? 'N/A', pickString(routeRecord, ['time_to', 'timeTo']) ?? ''].filter(Boolean).join(' - ');

    const departure = [departingStation, departingLocation].filter(Boolean).join(' ');
    const destination = [destinationStation, destinationLocation].filter(Boolean).join(' ');

    return {
        id: routeId,
        name: routeName,
        path: departure && destination ? `${departure} - ${destination}` : 'Route details unavailable',
        time: `${day} ${time}`,
    };
};

export default function RouteManagement({ navigation }: any) {
    const [routes, setRoutes] = useState<RouteCardData[]>([]);
    const [userEmail, setUserEmail] = useState('');

    const loadRoutes = useCallback(async () => {
        const email = await getUserId();
        if (!email) {
            setUserEmail('');
            setRoutes([]);
            return;
        }

        setUserEmail(email);

        const response = await getRoutesByEmail(email);
        const records = Array.isArray(response.routes) ? response.routes : [];
        setRoutes(records.map((record, index) => toCardData(record as Record<string, unknown>, index)));
    }, []);

    useEffect(() => {
        loadRoutes();
        const unsubscribe = navigation.addListener('focus', loadRoutes);
        return unsubscribe;
    }, [navigation, loadRoutes]);

    const handleDeleteRoute = (routeId: string) => {
        Alert.alert('Delete Route', 'Are you sure you want to delete this route?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    if (!userEmail) {
                        Alert.alert('Error', 'No signed-in user found. Please log in again.');
                        return;
                    }

                    try {
                        await deleteRoute({
                            email: userEmail,
                            route_id: routeId,
                        });
                        await loadRoutes();
                        Alert.alert('Success', 'Route deleted successfully.');
                    } catch {
                        Alert.alert('Error', 'Failed to delete route. Please try again.');
                    }
                },
            },
        ]);
    };

    const handleOpenEdit = (routeId: string) => {
        if (routeId.startsWith('__missing__')) {
            Alert.alert('Error', 'This route is missing a valid route ID from API response.');
            return;
        }
        navigation.navigate('EditRoute', {routeId});
    };

    return (
        <BaseScreen style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Route Management</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContainer}
            >
                {routes.map((route) => (
                    <RouteCard
                        key={route.id}
                        route={route}
                        onPress={handleOpenEdit}
                        onDelete={handleDeleteRoute}
                    />
                ))}
                <View style={styles.bottomContainer}>
                    <Button
                        title="Add Route"
                        onPress={() => navigation.navigate('AddRoute')}
                        style={styles.addRouteButton}
                    />
                </View>
            </ScrollView>
            <NavBar
                activeTab="Route"
                onTabPress={(tab) => {
                    if (tab === 'Home') {
                        navigation.navigate('Home');
                    } else if (tab === 'Route') {
                        navigation.navigate('RouteManagement');
                    } else if (tab === 'Community') {
                        navigation.navigate('Community');
                    }
                }}
            />
        </BaseScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorTokens.background_default,
    },
    header: {
        paddingHorizontal: spacing[8],
        paddingTop: spacing[24],
        paddingBottom: spacing[5],
    },
    title: {
        fontSize: typography.sizes['3xl'] - 3,
        fontWeight: typography.weights.bold,
        color: colorTokens.text_primary,
        letterSpacing: typography.letterSpacing.tight,
    },
    scrollView: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: spacing[8],
        paddingTop: spacing[2],
        paddingBottom: spacing[10] - spacing[1],
    },
    bottomContainer: {
        paddingTop: spacing[2],
        paddingBottom: spacing[5],
    },
    addRouteButton: {
        backgroundColor: colorTokens.primary_accent,
        borderRadius: radius.full,
        height: spacing[12] + 2,
    },
});
