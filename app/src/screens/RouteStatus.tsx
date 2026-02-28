import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Image,
    TouchableOpacity,
} from 'react-native';
import { Button } from '../components/atoms/Button';

interface RouteStatusProps {
    navigation?: any;
}

export default function RouteStatus({ navigation }: RouteStatusProps) {
    return (
        <SafeAreaView style={styles.container}>
            {/* Main content */}
            <View style={styles.content}>
                {/* Page title */}
                <Text style={styles.pageTitle}>Route Status</Text>

                {/* Section label */}
                <Text style={styles.sectionLabel}>Home</Text>

                {/* Status card */}
                <View style={styles.card}>
                    {/* Card header row: line name + timestamp */}
                    <View style={styles.cardHeader}>
                        <Text style={styles.lineName}>Kelana Jaya Line</Text>
                        <Text style={styles.timestamp}>4 mins ago</Text>
                    </View>

                    {/* Station row with pin icon */}
                    <View style={styles.stationRow}>
                        <Image
                            source={require('../assets/pin.png')}
                            style={styles.pinIcon}
                            resizeMode="contain"
                        />
                        <Text style={styles.stationText}>SS15 - Masjid Jamek</Text>
                    </View>

                    {/* Disruption message */}
                    <Text style={styles.disruptionText}>
                        A train has been taken out of service at KLCC station due to technical disruption. 
                    </Text>

                    {/* Reported time */}
                    <Text style={styles.reportedTime}>Predicted End Time: 4:10PM</Text>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Recommendation */}
                    <Text style={styles.recommendationLabel}>Recommendation:</Text>
                    <Text style={styles.recommendationText}>
                        Take Kelana Jaya Line (5 minutes wait)
                    </Text>

                    {/* Alternative */}
                    <Text style={styles.alternativeLabel}>Alternative:</Text>
                    <Text style={styles.alternativeText}>
                        Take Sri Petaling Line (15 minutes wait)
                    </Text>
                </View>
            </View>

            {/* Bottom action buttons */}
            <View style={styles.bottomButtons}>
                <Button
                    title="Done"
                    style={styles.doneButton}
                    onPress={() => navigation?.goBack()}
                />
                <TouchableOpacity
                    style={styles.reportButton}
                    activeOpacity={0.7}
                    onPress={() => { }}
                >
                    <Text style={styles.reportButtonText}>Report</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFCFD',
    },

    /* ── Main scrollable area ── */
    content: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 100,
    },

    /* Page title */
    pageTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 24,
        letterSpacing: -0.5,
    },

    /* Section label */
    sectionLabel: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 12,
    },

    /* ── Card ── */
    card: {
        backgroundColor: '#F0F1F6',
        borderRadius: 16,
        padding: 18,
    },

    /* Card header: line name + timestamp */
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    lineName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
        flexShrink: 1,
        marginRight: 8,
    },
    timestamp: {
        fontSize: 12,
        color: '#888888',
        marginTop: 3,
        fontStyle: 'italic',
    },

    /* Station row */
    stationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    pinIcon: {
        width: 14,
        height: 14,
        marginRight: 5,
        tintColor: '#2B308B',
    },
    stationText: {
        fontSize: 14,
        color: '#333333',
    },

    /* Disruption text */
    disruptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2B308B',
        marginBottom: 8,
    },

    /* Reported time */
    reportedTime: {
        fontSize: 13,
        fontStyle: 'italic',
        color: '#333333',
        marginBottom: 22,
    },

    /* Divider */
    divider: {
        height: 1,
        backgroundColor: '#D0D1D8',
        marginBottom: 20,
    },

    /* Recommendation */
    recommendationLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2E8B57',
        marginBottom: 2,
    },
    recommendationText: {
        fontSize: 14,
        color: '#333333',
        marginBottom: 22,
    },

    /* Alternative */
    alternativeLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FF0000',
        marginBottom: 2,
    },
    alternativeText: {
        fontSize: 14,
        color: '#333333',
    },

    /* ── Bottom buttons ── */
    bottomButtons: {
        paddingHorizontal: 32,
        paddingBottom: 40,
        paddingTop: 16,
        gap: 12,
    },

    doneButton: {
        backgroundColor: '#2B308B',
        borderRadius: 50,
        paddingVertical: 16,
    },

    reportButton: {
        backgroundColor: '#EBEBF0',
        borderRadius: 50,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#2B308B',
    },
});