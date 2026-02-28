import React, { useState } from 'react';
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
    const [departurePlaceId, setDeparturePlaceId] = useState('');
    const [destinationPlaceId, setDestinationPlaceId] = useState('');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [time, setTime] = useState<TimeValue>({ hour: '08', minute: '00', period: 'AM' });

    const handleSubmit = () => {
        if (!label || !startPoint || !destPoint || selectedDays.length === 0) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        if (!departurePlaceId || !destinationPlaceId) {
            Alert.alert(
                'Error',
                'Please select both departure and destination from autocomplete suggestions.',
            );
            return;
        }

        if (navigation) {
            navigation.navigate('AddRoute2', {
                label,
                departureLocation: startPoint,
                destinationLocation: destPoint,
                departurePlaceId: departurePlaceId,
                destinationPlaceId: destinationPlaceId,
                selectedDays,
                time,
            });
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
                        onChangeText={text => {
                            setStartPoint(text);
                            setDeparturePlaceId('');
                        }}
                        onSelect={setStartPoint}
                        onSelectSuggestion={suggestion => setDeparturePlaceId(suggestion.place_id)}
                        containerStyle={{ zIndex: 3000 }}
                    />

                    {/* Destination Location */}
                    <AutocompleteInput
                        label="Destination Location:"
                        placeholder="Choose a destination location"
                        value={destPoint}
                        onChangeText={text => {
                            setDestPoint(text);
                            setDestinationPlaceId('');
                        }}
                        onSelect={setDestPoint}
                        onSelectSuggestion={suggestion => setDestinationPlaceId(suggestion.place_id)}
                        containerStyle={{ zIndex: 2000 }}
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

                
                {/* Submit button pinned at bottom */}
                <View style={styles.bottomContainer}>
                    <Button
                        title="Next"
                        onPress={handleSubmit}
                    />
                </View>
            </ScrollView>

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
