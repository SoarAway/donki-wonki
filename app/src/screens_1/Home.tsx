import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Image,
} from 'react-native';
import { NavBar } from '../components/molecule/navBar';

interface DisruptionAlert {
    id: string;
    title: string;
    message: string;
    timestamp: string;
}

interface UpcomingRoute {
    id: string;
    name: string;
    path: string;
    schedule: string;
}

const disruptions: DisruptionAlert[] = [
    {
        id: '1',
        title: 'Disruption in Kelana Jaya Line',
        message: 'Leave 30 minutes earlier to reach destination on time',
        timestamp: '4 mins ago',
    },
];

const upcomingRoutes: UpcomingRoute[] = [
    {
        id: '1',
        name: 'Work',
        path: 'LRT Bandar Puteri - LRT SS15',
        schedule: 'Monday 7:00a.m.',
    },
    {
        id: '2',
        name: 'Home',
        path: 'LRT SS15 - LRT Bandar Puteri',
        schedule: 'Monday 5:00p.m.',
    },
];

export default function Home() {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.welcomeText}>Welcome!!</Text>
                    <Image
                        source={require('../assets/Logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Disruption Alerts */}
                {disruptions.map((alert) => (
                    <View key={alert.id} style={styles.alertCard}>
                        <View style={styles.alertTitleRow}>
                            <Text style={styles.alertIcon}>🚫</Text>
                            <Text style={styles.alertTitle}>{alert.title}</Text>
                        </View>
                        <Text style={styles.alertMessage}>{alert.message}</Text>
                        <Text style={styles.alertTimestamp}>{alert.timestamp}</Text>
                    </View>
                ))}

                {/* Upcoming Route Section */}
                <Text style={styles.sectionTitle}>Upcoming Route</Text>

                {upcomingRoutes.map((route) => (
                    <View key={route.id} style={styles.routeCard}>
                        <Text style={styles.routeName}>{route.name}</Text>
                        <Text style={styles.routePath}>{route.path}</Text>
                        <Text style={styles.routeSchedule}>{route.schedule}</Text>
                    </View>
                ))}
            </ScrollView>
            <NavBar activeTab="Home" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFCFD',
    },
    scrollView: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 32,
        paddingTop: 100,
        paddingBottom: 120,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000000',
        letterSpacing: -0.5,
    },
    logo: {
        width: 90,
        height: 90,
    },

    // Alert Card
    alertCard: {
        backgroundColor: '#FFE4E4',
        borderRadius: 14,
        padding: 16,
        marginBottom: 28,
    },
    alertTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    alertIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    alertTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#000000',
        flexShrink: 1,
    },
    alertMessage: {
        fontSize: 13,
        color: '#333333',
        marginBottom: 8,
        lineHeight: 18,
    },
    alertTimestamp: {
        fontSize: 12,
        color: '#CC2222',
        textAlign: 'right',
        fontStyle: 'italic',
    },

    // Section Title
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 16,
        letterSpacing: -0.3,
    },

    // Route Card
    routeCard: {
        backgroundColor: '#F0F1F6',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    routeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    routePath: {
        fontSize: 14,
        color: '#333333',
        marginBottom: 6,
    },
    routeSchedule: {
        fontSize: 14,
        color: '#2B5FC1',
        fontStyle: 'italic',
    },
});
