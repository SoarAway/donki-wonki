import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '../components/atoms/Button';

interface ScheduleEntry {
    day: string;
    time: string;
}

interface Route {
    id: string;
    name: string;
    path: string;
    schedules: ScheduleEntry[];
}

export default function RouteManagement({ navigation }: any) {
    const [routes] = useState<Route[]>([
        {
            id: '1',
            name: 'Work',
            path: 'LRT Bandar Puteri - LRT SS15',
            schedules: [
                { day: 'Monday', time: '7:00 AM' },
                { day: 'Tuesday', time: '8:00 AM' },
                { day: 'Wednesday', time: '8:30 AM' },
            ],
        },
        {
            id: '2',
            name: 'Home',
            path: 'LRT SS15 - LRT Bandar Puteri',
            schedules: [
                { day: 'Monday', time: '7:00 PM' },
                { day: 'Tuesday', time: '8:00 PM' },
                { day: 'Wednesday', time: '8:30 PM' },
            ],
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
                    <View key={route.id} style={styles.card}>
                        <Text style={styles.routeName}>{route.name}</Text>
                        <Text style={styles.routePath}>{route.path}</Text>

                        <View style={styles.scheduleList}>
                            {route.schedules.map((entry, index) => (
                                <Text key={index} style={styles.scheduleItem}>
                                    {entry.day} {entry.time}
                                </Text>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('AddRoute', { routeId: route.id })}
                            style={styles.editButton}
                        >
                            <Text style={styles.editText}>edit</Text>
                        </TouchableOpacity>
                    </View>
                ))}
                <View style={styles.bottomContainer}>
                    <Button
                        title="Add Route"
                        onPress={() => navigation.navigate('AddRoute')}
                        style={styles.addRouteButton}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFCFD',
    },
    header: {
        paddingHorizontal: 32,
        paddingTop: 100,
        paddingBottom: 20,
    },
    title: {
        fontSize: 27,
        fontWeight: 'bold',
        color: '#000000',
        letterSpacing: -0.5,
    },
    scrollView: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 32,
        paddingTop: 8,
        paddingBottom: 36,
    },
    card: {
        backgroundColor: '#F2F4FF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 18,
        shadowColor: '#4A5080',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 6,
        position: 'relative',
    },
    routeName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 6,
    },
    routePath: {
        fontSize: 14,
        color: '#333333',
        marginBottom: 10,
    },
    scheduleList: {
        marginBottom: 24,
    },
    scheduleItem: {
        fontSize: 14,
        color: '#2B5FC1',
        fontStyle: 'italic',
        lineHeight: 22,
    },
    editButton: {
        position: 'absolute',
        right: 18,
        bottom: 14,
    },
    editText: {
        fontSize: 14,
        color: '#2B5FC1',
        textDecorationLine: 'underline',
        fontStyle: 'italic',
    },
    bottomContainer: {
        paddingTop: 8,
        paddingBottom: 20,
    },
    addRouteButton: {
        backgroundColor: '#2D3A9C',
        borderRadius: 50,
        height: 50,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
