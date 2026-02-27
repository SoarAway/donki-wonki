import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../components/atoms/Button';
import { BaseScreen } from '../models/BaseScreen';
import { deleteRoute, getRoutesByEmail } from '../services/api/apiEndpoints';
import { getUserId } from '../services/authStorage';

interface Route {
    id: string;
    name: string;
    path: string;
    schedule: string;
    backgroundColor?: string;
}

export default function RouteManagement({ navigation }: any) {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [authEmail, setAuthEmail] = useState<string>('');

    const loadRoutes = useCallback(async () => {
        try {
            const email = await getUserId();
            if (!email) {
                setRoutes([]);
                return;
            }
            setAuthEmail(email);
            const response = await getRoutesByEmail(email);
            const mapped: Route[] = response.routes.map((raw: any) => {
                const schedules = Array.isArray(raw.schedules) ? raw.schedules : [];
                const first = schedules[0] || {};
                const days = schedules.map((s: any) => s.dayOfWeek).filter(Boolean);
                return {
                    id: String(raw.id ?? ''),
                    name: String(raw.description ?? 'Route'),
                    path: `${String(raw.departingLocation ?? '-')}` + ' - ' + `${String(raw.destinationLocation ?? '-')}`,
                    schedule: days.length > 0
                        ? `${days.join(', ')} ${String(first.timeFrom ?? '')}`.trim()
                        : 'No schedule',
                    backgroundColor: '#FFFFFF',
                };
            });
            setRoutes(mapped);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load routes.';
            Alert.alert('Error', message);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadRoutes();
        }, [loadRoutes]),
    );

    const handleDelete = async (routeId: string) => {
        if (!authEmail) {
            return;
        }
        try {
            await deleteRoute({ email: authEmail, route_id: routeId });
            await loadRoutes();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete route.';
            Alert.alert('Error', message);
        }
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
                    <View
                        key={route.id}
                        style={[
                            styles.card,
                            { backgroundColor: route.backgroundColor || '#FFFFFF' }
                        ]}
                    >
                        <Text style={styles.routeName}>{route.name}</Text>
                        <Text style={styles.routePath}>{route.path}</Text>
                        <Text style={styles.routeSchedule}>{route.schedule}</Text>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('AddRoute', { routeId: route.id })}
                            style={styles.editButton}
                        >
                            <Text style={styles.editText}>edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleDelete(route.id)}
                            style={styles.deleteButton}
                        >
                            <Text style={styles.deleteText}>delete</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.bottomContainer}>
                <Button
                    label="Add Route"
                    onPress={() => navigation.navigate('AddRoute')}
                    style={styles.addRouteButton}
                />
            </View>
        </BaseScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4FB',
    },
    header: {
        paddingHorizontal: 25,
        paddingTop: 80,
        paddingBottom: 25,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000000',
        letterSpacing: -0.5,
    },
    scrollView: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        position: 'relative',
    },
    routeName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 8,
    },
    routePath: {
        fontSize: 14,
        color: '#333333',
        marginBottom: 4,
    },
    routeSchedule: {
        fontSize: 14,
        color: '#3B6BB1',
        fontStyle: 'italic',
    },
    editButton: {
        position: 'absolute',
        right: 20,
        bottom: 15,
    },
    deleteButton: {
        position: 'absolute',
        right: 20,
        top: 15,
    },
    editText: {
        fontSize: 14,
        color: '#3B6BB1',
        textDecorationLine: 'underline',
        fontStyle: 'italic',
    },
    deleteText: {
        fontSize: 14,
        color: '#B14444',
        textDecorationLine: 'underline',
        fontStyle: 'italic',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    addRouteButton: {
        backgroundColor: '#1256A7',
        borderRadius: 14,
        height: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
});
