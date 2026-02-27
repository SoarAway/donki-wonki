import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../components/atoms/Button';
import { NavBar } from '../components/molecules/NavBar';
import { BaseScreen } from '../models/BaseScreen';
import { colorTokens, radius, shadows, spacing, typography } from '../components/config';

interface Route {
    id: string;
    name: string;
    path: string;
    time: string;
    schedules: string[];
}

export default function RouteManagement({ navigation }: any) {
    const [routes] = useState<Route[]>([
        {
            id: '1',
            name: 'Work',
            path: 'LRT Bandar Puteri - LRT SS15',
            time: '7:00 AM',
            schedules: ['Monday', 'Tuesday', 'Wednesday'],
        },
        {
            id: '2',
            name: 'Home',
            path: 'LRT SS15 - LRT Bandar Puteri',
            time: '8:00 PM',
            schedules: ['Monday', 'Tuesday', 'Wednesday'],
        },
    ]);

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
                            <Text style={styles.scheduleItem}>
                            </Text>
                            <Text style={styles.scheduleItem}>{route.time}</Text>
                        </View>

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
    deleteButton: {
        position: 'absolute',
        right: 20,
        top: 15,
    },
    editText: {
        fontSize: typography.sizes.sm,
        color: colorTokens.secondary_accent,
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
        paddingTop: spacing[2],
        paddingBottom: spacing[5],
    },
    addRouteButton: {
        backgroundColor: colorTokens.primary_accent,
        borderRadius: radius.full,
        height: spacing[12] + 2,
    },
});
