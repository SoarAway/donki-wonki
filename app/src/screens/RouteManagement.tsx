import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '../components/atoms/Button';
import { NavBar } from '../components/molecules/NavBar';
import { BaseScreen } from '../models/BaseScreen';
import { colorTokens, radius, shadows, spacing, typography } from '../components/config';
import { getRoutesByEmail } from '../services/api/apiEndpoints';
import { getUserId } from '../services/authStorage';

interface Route {
    id: string;
    name: string;
    path: string;
    schedule: string;
}

export default function RouteManagement({ navigation }: any) {
    const [routes, setRoutes] = useState<Route[]>([]);

    const loadRoutes = useCallback(async () => {
        try {
            const email = await getUserId();
            if (!email) {
                setRoutes([]);
                return;
            }

            const response = await getRoutesByEmail(email);
            const mappedRoutes: Route[] = (response.routes ?? []).map((raw: any) => {
                const routeId = String(raw.id ?? raw.routeId ?? '');
                const description = String(raw.description ?? raw.route_desc ?? 'Route');
                const departingLocation = String(raw.departingLocation ?? raw.departing_location ?? '-');
                const destinationLocation = String(raw.destinationLocation ?? raw.destination_location ?? '-');

                const schedules = Array.isArray(raw.schedules) ? raw.schedules : [];
                let scheduleText = '-';
                if (schedules.length > 0) {
                    const firstSchedule = schedules[0] ?? {};
                    const day = String(firstSchedule.dayOfWeek ?? firstSchedule.day_of_week ?? '').trim();
                    const timeFrom = String(firstSchedule.timeFrom ?? firstSchedule.time_from ?? '').trim();
                    scheduleText = `${day} ${timeFrom}`.trim() || '-';
                } else {
                    const day = String(raw.dayOfWeek ?? raw.day_of_week ?? '').trim();
                    const timeFrom = String(raw.timeFrom ?? raw.time_from ?? '').trim();
                    scheduleText = `${day} ${timeFrom}`.trim() || '-';
                }

                return {
                    id: routeId,
                    name: description,
                    path: `${departingLocation} - ${destinationLocation}`,
                    schedule: scheduleText,
                };
            });

            setRoutes(mappedRoutes);
        } catch {
            setRoutes([]);
        }
    }, []);

    useEffect(() => {
        loadRoutes();
    }, [loadRoutes]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', loadRoutes);
        return unsubscribe;
    }, [navigation, loadRoutes]);

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
                    <View key={route.id} style={styles.card}>
                        <Text style={styles.routeName}>{route.name}</Text>
                        <Text style={styles.routePath}>{route.path}</Text>

                        <View style={styles.scheduleList}>
                            <Text style={styles.scheduleItem}>{route.schedule}</Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('AddRoute', { routeId: route.id })}
                            style={styles.editButton}
                        >
                            <Text style={styles.editText}>edit</Text>
                        </TouchableOpacity>
                    </View>
                ))}
                {routes.length === 0 && (
                    <View style={styles.card}>
                        <Text style={styles.routeName}>No routes yet</Text>
                        <Text style={styles.routePath}>Tap Add Route to create your first route.</Text>
                    </View>
                )}
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
    card: {
        backgroundColor: colorTokens.surface_soft,
        borderRadius: radius.xl,
        padding: spacing[5],
        marginBottom: spacing[4] + 2,
        ...shadows.md,
        position: 'relative',
    },
    routeName: {
        fontSize: typography.sizes['2xl'] - 2,
        fontWeight: typography.weights.bold,
        color: colorTokens.text_primary,
        marginBottom: spacing[1] + 2,
    },
    routePath: {
        fontSize: typography.sizes.sm,
        color: colorTokens.text_secondary,
        marginBottom: spacing[2] + 2,
    },
    scheduleList: {
        marginBottom: spacing[6],
    },
    scheduleItem: {
        fontSize: typography.sizes.sm,
        color: colorTokens.secondary_accent,
        fontStyle: 'italic',
        lineHeight: typography.lineHeights.lg - 6,
    },
    editButton: {
        position: 'absolute',
        right: 18,
        bottom: 14,
    },
    editText: {
        fontSize: typography.sizes.sm,
        color: colorTokens.secondary_accent,
        textDecorationLine: 'underline',
        fontStyle: 'italic',
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
