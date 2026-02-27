import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { BackButton } from '../components/atoms/BackButton';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { AutocompleteInput } from '../components/atoms/AutoCompleteInput';
import { TagDropdown } from '../components/atoms/Tag';
import { Time } from '../components/atoms/Time';
import { BaseScreen } from '../models/BaseScreen';
import { colorTokens, radius, spacing, typography } from '../components/config';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface TimeValue {
    hour: string;
    minute: string;
    period: string;
}

export default function AddRoute({ navigation }: any) {
    const [label, setLabel] = useState('');
    const [startPoint, setStartPoint] = useState('');
    const [destPoint, setDestPoint] = useState('');
    const [departingStation, setDepartingStation] = useState('');
    const [destinationStation, setDestinationStation] = useState('');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [time, setTime] = useState<TimeValue>({ hour: '08', minute: '00', period: 'AM' });

    const handleSubmit = () => {
        if (!label || !startPoint || !destPoint || selectedDays.length === 0) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }
        console.log('Route submitted:', {
            label,
            startPoint,
            destPoint,
            days: selectedDays,
            time: `${time.hour}:${time.minute} ${time.period}`,
        });
        Alert.alert('Success', 'Route added successfully!');
        if (navigation) navigation.goBack();
    };

    const handleSubmit = async () => {
        const email = await getUserId();
        if (!email) {
            Alert.alert('Error', 'Please login again.');
            return;
        }

        const days = expandDays(selectedDays);
        if (!label || !startPoint || !destPoint || !departingStation || !destinationStation) {
            Alert.alert('Error', 'Please fill in all route fields.');
            return;
        }
        if (days.length === 0) {
            Alert.alert('Error', 'Please select at least one day.');
            return;
        }

        const firstDay = days[0];
        const firstSlot = (timeSlots[firstDay] || [])[0];
        if (!firstSlot?.from) {
            Alert.alert('Error', 'Please provide at least one "From" time.');
            return;
        }

        try {
            setSubmitting(true);
            const routeResponse = routeId || editRouteId
                ? await editRoute({
                    email,
                    route_id: routeId || editRouteId,
                    departing_location: startPoint,
                    destination_location: destPoint,
                    day_of_week: days.join(','),
                    time: firstSlot.from,
                    departing_station: departingStation,
                    destination_station: destinationStation,
                    route_desc: label,
                })
                : await createRoute({
                    email,
                    departing_location: startPoint,
                    destination_location: destPoint,
                    day_of_week: firstDay,
                    time: firstSlot.from,
                    departing_station: departingStation,
                    destination_station: destinationStation,
                    route_desc: label,
                });

            const savedRouteId = String(routeResponse.route_id);
            if (!savedRouteId) {
                throw new Error('Route ID missing in response.');
            }
            setRouteId(savedRouteId);

            const user = await getUserByEmail(email);
            const userId = user.user.id;

            for (const day of days) {
                const slots = timeSlots[day] || [];
                for (let i = 0; i < slots.length; i += 1) {
                    const slot = slots[i];
                    if (!slot.from || !slot.to) {
                        continue;
                    }
                    if (day === firstDay && i === 0) {
                        continue;
                    }
                    await addRouteSchedule({
                        user_id: userId,
                        route_id: savedRouteId,
                        day_of_week: day,
                        time_from: slot.from,
                        time_to: slot.to,
                    });
                }
            }

            Alert.alert('Success', routeId || editRouteId ? 'Route updated.' : 'Route created.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save route.';
            Alert.alert('Error', message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <BaseScreen style={styles.safeArea}>
            <View style={styles.header}>
                <BackButton onPress={() => navigation && navigation.goBack()} />
                <Text style={styles.title}>Create Route</Text>
            </View>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
            >
                <View style={styles.formSection}>
                    {/* Label */}
                    <Input
                        label="Label:"
                        placeholder="Enter a route name"
                        value={label}
                        onChangeText={setLabel}
                    />

                    {/* Departure Location */}
                    <AutocompleteInput
                        label="Departure Location:"
                        placeholder="Choose a departure location"
                        value={startPoint}
                        onChangeText={setStartPoint}
                        onSelect={setStartPoint}
                        containerStyle={{ zIndex: 3000 }}
                    />

                    {/* Destination Location */}
                    <AutocompleteInput
                        label="Destination Location:"
                        placeholder="Choose a destination location"
                        value={destPoint}
                        onChangeText={setDestPoint}
                        onSelect={setDestPoint}
                        containerStyle={{ zIndex: 2000 }}
                    />
                    <Input
                        label="Departing Station Code:"
                        placeholder="Example: KJ1"
                        value={departingStation}
                        onChangeText={setDepartingStation}
                    />
                    <Input
                        label="Destination Station Code:"
                        placeholder="Example: KJ5"
                        value={destinationStation}
                        onChangeText={setDestinationStation}
                    />

                    {/* Day — multi-select tag dropdown */}
                    <View style={{ zIndex: 1000 }}>
                        <TagDropdown
                            label="Day:"
                            placeholder="Select day(s)"
                            options={DAYS}
                            selectedValues={selectedDays}
                            onSelect={setSelectedDays}
                        />
                    </View>

                    {/* Time — scrollable drum picker */}
                    <View style={styles.timeSectionWrapper}>
                        <Time value={time} onChange={setTime} />
                    </View>
                </View>

                {/* Spacer so content clears the fixed button */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Submit button pinned at bottom */}
            <View style={styles.bottomContainer}>
                <Button
                    title="Save"
                    onPress={handleSubmit}
                />
            </View>
        </BaseScreen>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colorTokens.background_default,
    },
    scrollView: {
        flex: 1,
    },
    container: {
        paddingHorizontal: spacing[8],
        paddingTop: spacing[2] + 2,
        paddingBottom: spacing[5],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[8],
        paddingTop: spacing[24] - spacing[2],
        paddingBottom: spacing[6] + 1,
    },
    title: {
        fontSize: typography.sizes['3xl'] - 3,
        fontWeight: typography.weights.bold,
        color: colorTokens.text_primary_soft,
        marginLeft: spacing[2],
    },
    formSection: {
        width: '100%',
    },
    timeSectionWrapper: {
        marginTop: spacing[2] + 2,
        zIndex: 0,
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
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
    },
});
