import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { BackButton } from '../components/atoms/BackButton';
import { Dropdown } from '../components/atoms/Dropdown';
import { Button } from '../components/atoms/Button';
import { BaseScreen } from '../models/BaseScreen';
import { colorTokens, radius, spacing, typography } from '../components/config';

const STATIONS = ['KL Sentral', 'KLCC', 'Bukit Bintang', 'Masjid Jamek', 'Titiwangsa'];

export default function AddRoute_2({ navigation, route }: any) {
    const params = route?.params ?? {};

    const label = params.label ?? 'Home';
    const departureLocation = params.departureLocation ?? 'Sunway University';
    const destinationLocation = params.destinationLocation ?? 'SS15';
    const days = params.days ?? 'Monday, Wednesday, Friday';
    const time = params.time ?? '5:00 p.m.';

    const [startStation, setStartStation] = useState('');
    const [destinationStation, setDestinationStation] = useState('');

    const handleSubmit = () => {
        if (!startStation || !destinationStation) {
            Alert.alert('Error', 'Please select both start and destination stations.');
            return;
        }
        Alert.alert('Success', 'Route submitted successfully!');
        if (navigation) navigation.goBack();
    };

    return (
        <BaseScreen style={styles.safeArea}>
            <View style={styles.header}>
                <BackButton onPress={() => navigation && navigation.goBack()} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
            >
                <View style={[styles.dropdownWrapper, { zIndex: 3000 }]}>
                    <Dropdown
                        label="Start Station:"
                        placeholder="Enter your start station"
                        options={STATIONS}
                        selectedValue={startStation}
                        onSelect={setStartStation}
                    />
                </View>

                <View style={[styles.dropdownWrapper, { zIndex: 2000 }]}>
                    <Dropdown
                        label="Destination Station:"
                        placeholder="Enter your destination station"
                        options={STATIONS}
                        selectedValue={destinationStation}
                        onSelect={setDestinationStation}
                    />
                </View>

                <Text style={styles.summaryTitle}>Summary:</Text>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Label: </Text>
                        <Text style={styles.summaryValue}>{label}</Text>
                    </Text>
                    <Text style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Departure Location: </Text>
                        <Text style={styles.summaryValue}>{departureLocation}</Text>
                    </Text>
                    <Text style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Destination location: </Text>
                        <Text style={styles.summaryValue}>{destinationLocation}</Text>
                    </Text>
                    <Text style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Day: </Text>
                        <Text style={styles.summaryValue}>{days}</Text>
                    </Text>
                    <Text style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Time: </Text>
                        <Text style={styles.summaryValue}>{time}</Text>
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.bottomContainer}>
                <Button title="Submit" onPress={handleSubmit} />
            </View>
        </BaseScreen>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colorTokens.background_default,
    },
    header: {
        paddingHorizontal: spacing[8],
        paddingTop: spacing[24],
        paddingBottom: spacing[2] + 2,
    },
    scrollView: {
        flex: 1,
    },
    container: {
        paddingHorizontal: spacing[8],
        paddingTop: spacing[4],
        paddingBottom: spacing[5],
    },
    dropdownWrapper: {
        position: 'relative',
    },
    summaryTitle: {
        fontSize: typography.sizes.sm + 1,
        fontWeight: typography.weights.medium,
        color: colorTokens.text_primary_soft,
        marginTop: spacing[2],
        marginBottom: spacing[3],
    },
    summaryCard: {
        backgroundColor: colorTokens.surface_muted,
        borderRadius: radius.lg + 2,
        paddingVertical: spacing[4] + 2,
        paddingHorizontal: spacing[5],
        gap: spacing[2],
    },
    summaryRow: {
        fontSize: typography.sizes.sm,
        color: colorTokens.text_primary_soft,
        lineHeight: typography.lineHeights.lg - 6,
    },
    summaryKey: {
        fontWeight: '700',
        color: colorTokens.text_primary_soft,
    },
    summaryValue: {
        fontWeight: '400',
        color: colorTokens.text_primary_soft,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing[8],
        paddingBottom: spacing[12] + spacing[3],
        paddingTop: spacing[2] + 2,
        backgroundColor: colorTokens.background_default,
    },
});
