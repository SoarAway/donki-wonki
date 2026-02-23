import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '../components/atoms/Button';

interface Route {
    id: string;
    name: string;
    path: string;
    schedule: string;
    backgroundColor?: string;
}

export default function RouteManagement({ navigation }: any) {
    const [routes] = useState<Route[]>([
        {
            id: '1',
            name: 'Work',
            path: 'LRT Bandar Puteri - LRT SS15',
            schedule: 'Monday - Friday 7:00a.m.',
            backgroundColor: '#DFE5F0',
        },
        {
            id: '2',
            name: 'Home',
            path: 'LRT SS15 - LRT Bandar Puteri',
            schedule: 'Monday - Friday 5:00p.m.',
            backgroundColor: '#FFFFFF',
        },
    ]);

    return (
        <SafeAreaView style={styles.container}>
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
                    </View>
                ))}
            </ScrollView>

            <View style={styles.bottomContainer}>
                <Button
                    title="Add Route"
                    onPress={() => navigation.navigate('AddRoute')}
                    style={styles.addRouteButton}
                />
            </View>
        </SafeAreaView>
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
    editText: {
        fontSize: 14,
        color: '#3B6BB1',
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
