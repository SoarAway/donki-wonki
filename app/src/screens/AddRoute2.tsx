import React, { useEffect, useState } from 'react';
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
import { createRoute, nearestStation } from '../services/api/apiEndpoints';
import { getUserId } from '../services/authStorage';
import { matchStationOption, resolveStationCode, stationOptions } from '../utils/stationCatalog';

export default function AddRoute_2({ navigation, route }: any) {
    const params = route?.params ?? {};

    const label = params.label ?? '';
    const departureLocation = params.departureLocation ?? '';
    const destinationLocation = params.destinationLocation ?? '';
    const departurePlaceId = params.departurePlaceId ?? '';
    const destinationPlaceId = params.destinationPlaceId ?? '';
    const selectedDays: string[] = Array.isArray(params.selectedDays)
      ? params.selectedDays
      : [];
    const time = params.time ?? { hour: '08', minute: '00', period: 'AM' };

    const [startStation, setStartStation] = useState('');
    const [destinationStation, setDestinationStation] = useState('');

    useEffect(() => {
        let active = true;

        const preloadStations = async () => {
            if (!departurePlaceId || !destinationPlaceId) {
                return;
            }

            try {
                const response = await nearestStation({
                    departure_place_id: departurePlaceId,
                    destination_place_id: destinationPlaceId,
                });
                if (active) {
                    setStartStation(
                        matchStationOption(response.departure_nearest_station) ??
                          response.departure_nearest_station,
                    );
                    setDestinationStation(
                        matchStationOption(response.destination_nearest_station) ??
                          response.destination_nearest_station,
                    );
                }
            } catch {
            }
        };

        preloadStations();

        return () => {
            active = false;
        };
    }, [departurePlaceId, destinationPlaceId]);

    const to24Hour = (hour: string, period: string): string => {
        const parsedHour = parseInt(hour, 10);
        if (Number.isNaN(parsedHour)) {
            return '00';
        }

        if (period === 'AM') {
            return parsedHour === 12 ? '00' : String(parsedHour).padStart(2, '0');
        }

        return parsedHour === 12 ? '12' : String(parsedHour + 12).padStart(2, '0');
    };

    const handleSubmit = async () => {
        if (!startStation || !destinationStation) {
            Alert.alert('Error', 'Please select both start and destination stations.');
            return;
        }

        const userEmail = await getUserId();
        if (!userEmail) {
            Alert.alert('Error', 'No signed-in user found. Please log in again.');
            return;
        }

        const dayOfWeek = selectedDays[0] ?? 'Monday';
        const hour24 = to24Hour(time.hour, time.period);
        const timeValue = `${hour24}:${String(time.minute).padStart(2, '0')}:00`;
        const departingStationCode = resolveStationCode(startStation);
        const destinationStationCode = resolveStationCode(destinationStation);

        if (!departingStationCode || !destinationStationCode) {
            Alert.alert('Error', 'Please select stations from the station list.');
            return;
        }

        try {
            await createRoute({
                email: userEmail,
                departing_location: departureLocation,
                destination_location: destinationLocation,
                day_of_week: dayOfWeek,
                time: timeValue,
                departing_station: departingStationCode,
                destination_station: destinationStationCode,
                route_desc: label,
            });

            Alert.alert('Success', 'Route submitted successfully!');
            if (navigation) {
                navigation.goBack();
                navigation.goBack();
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to submit route.';
            Alert.alert('Error', message);
        }
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
                        options={stationOptions}
                        selectedValue={startStation}
                        onSelect={setStartStation}
                    />
                </View>

                <View style={[styles.dropdownWrapper, { zIndex: 2000 }]}>
                    <Dropdown
                        label="Destination Station:"
                        placeholder="Enter your destination station"
                        options={stationOptions}
                        selectedValue={destinationStation}
                        onSelect={setDestinationStation}
                    />
                </View>

                <Text style={styles.summaryTitle}>Summary:</Text>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Label: </Text>
                        <Text style={styles.summaryValue}>{label || '-'}</Text>
                    </Text>
                    <Text style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Departure Location: </Text>
                        <Text style={styles.summaryValue}>{departureLocation || '-'}</Text>
                    </Text>
                    <Text style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Destination location: </Text>
                        <Text style={styles.summaryValue}>{destinationLocation || '-'}</Text>
                    </Text>
                    <Text style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Day: </Text>
                        <Text style={styles.summaryValue}>{selectedDays.length > 0 ? selectedDays.join(', ') : '-'}</Text>
                    </Text>
                    <Text style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Time: </Text>
                        <Text style={styles.summaryValue}>{`${time.hour}:${time.minute} ${time.period}`}</Text>
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
