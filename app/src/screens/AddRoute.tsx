import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Alert,
} from 'react-native';
import { BackButton } from '../components/atoms/BackButton';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { AutocompleteInput } from '../components/atoms/AutoCompleteInput';
import { TagDropdown } from '../components/atoms/Tag';
import { Time } from '../components/atoms/Time';

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

    return (
        <SafeAreaView style={styles.safeArea}>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FAFCFD',
    },
    scrollView: {
        flex: 1,
    },
    container: {
        paddingHorizontal: 32,
        paddingTop: 10,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 90,
        paddingBottom: 25,
    },
    title: {
        fontSize: 27,
        fontWeight: 'bold',
        color: '#0D0D0D',
        marginLeft: 8,
    },
    formSection: {
        width: '100%',
    },
    timeSectionWrapper: {
        marginTop: 10,
        zIndex: 0,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 32,
        paddingBottom: 60,
        paddingTop: 10,
        backgroundColor: '#FAFCFD',
    },
});
