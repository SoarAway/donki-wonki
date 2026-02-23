import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    SafeAreaView,
} from 'react-native';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Checkbox } from '../components/atoms/Checkbox';
import { AutocompleteInput } from '../components/atoms/AutoCompleteInput.tsx';

const closeIcon = require('../assets/close.png');

interface TimeSlot {
    id: string;
    from: string;
    to: string;
}

const DAYS = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Every Weekdays',
];

export default function AddRoute() {
    const [label, setLabel] = useState('');
    const [startPoint, setStartPoint] = useState('');
    const [destPoint, setDestPoint] = useState('');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [timeSlots, setTimeSlots] = useState<{ [key: string]: TimeSlot[] }>({});

    const toggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter((d) => d !== day));
            // Keep time slots even if unchecked? The prompt says "dropdown box won't appear"
            // Usually we keep them in state but hide them.
        } else {
            setSelectedDays([...selectedDays, day]);
            if (!timeSlots[day]) {
                setTimeSlots({
                    ...timeSlots,
                    [day]: [{ id: Math.random().toString(), from: '', to: '' }],
                });
            }
        }
    };

    const addTimeSlot = (day: string) => {
        const newSlot = { id: Math.random().toString(), from: '', to: '' };
        setTimeSlots({
            ...timeSlots,
            [day]: [...(timeSlots[day] || []), newSlot],
        });
    };

    const removeTimeSlot = (day: string, id: string) => {
        setTimeSlots({
            ...timeSlots,
            [day]: timeSlots[day].filter((slot) => slot.id !== id),
        });
    };

    const updateTimeSlot = (day: string, id: string, field: 'from' | 'to', value: string) => {
        setTimeSlots({
            ...timeSlots,
            [day]: timeSlots[day].map((slot) =>
                slot.id === id ? { ...slot, [field]: value } : slot
            ),
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formSection}>
                    <Input
                        label="Label:"
                        placeholder="Enter a name for the route"
                        value={label}
                        onChangeText={setLabel}
                    />
                    <AutocompleteInput
                        label="Starting Point:"
                        placeholder="Search Location"
                        value={startPoint}
                        onChangeText={setStartPoint}
                        onSelect={setStartPoint}
                        containerStyle={{ zIndex: 2000 }}
                    />
                    <AutocompleteInput
                        label="Destination Point:"
                        placeholder="Search Location"
                        value={destPoint}
                        onChangeText={setDestPoint}
                        onSelect={setDestPoint}
                        containerStyle={{ zIndex: 1000 }}
                    />

                    <Text style={styles.sectionLabel}>Day:</Text>
                    {DAYS.map((day) => (
                        <View key={day} style={styles.dayItem}>
                            <Checkbox
                                label={day}
                                checked={selectedDays.includes(day)}
                                onToggle={() => toggleDay(day)}
                            />
                            {selectedDays.includes(day) && (
                                <View style={styles.timeSlotsCard}>
                                    {(timeSlots[day] || []).map((slot) => (
                                        <View key={slot.id} style={styles.timeRow}>
                                            <Text style={styles.timeLabel}>From</Text>
                                            <TextInput
                                                style={styles.timeInput}
                                                value={slot.from}
                                                onChangeText={(v) => updateTimeSlot(day, slot.id, 'from', v)}
                                            />
                                            <Text style={styles.timeLabel}>To</Text>
                                            <TextInput
                                                style={styles.timeInput}
                                                value={slot.to}
                                                onChangeText={(v) => updateTimeSlot(day, slot.id, 'to', v)}
                                            />
                                            <TouchableOpacity onPress={() => removeTimeSlot(day, slot.id)}>
                                                <Image source={closeIcon} style={styles.closeIcon} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    <TouchableOpacity
                                        style={styles.addMoreBtn}
                                        onPress={() => addTimeSlot(day)}
                                    >
                                        <Text style={styles.addMoreText}>Add More</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
            <View style={styles.bottomContainer}>
                <Button
                    title="Next"
                    onPress={() => console.log('Form Submitted', { label, startPoint, destPoint, selectedDays, timeSlots })}
                    style={styles.nextButton}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F3F2F8',
    },
    scrollView: {
        flex: 1,
    },
    container: {
        padding: 20,
        paddingTop: 120,
        paddingBottom: 100,
    },
    formSection: {
        flex: 1,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 30,
    },

    sectionLabel: {
        fontSize: 18,
        fontWeight: '500',
        color: '#000',
        marginTop: 10,
        marginBottom: 15,
    },
    dayItem: {
        marginBottom: 5,
    },
    timeSlotsCard: {
        backgroundColor: '#E6EEFA',
        borderRadius: 8,
        padding: 12,
        marginTop: -5,
        marginBottom: 15,
        marginLeft: 4,
        borderWidth: 1,
        borderColor: '#B0C4DE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeLabel: {
        fontSize: 12,
        color: '#1256A7',
        marginHorizontal: 5,
    },
    timeInput: {
        backgroundColor: '#F3F2F8',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        width: 80,
        fontSize: 14,
        color: '#000',
        borderWidth: 1,
        borderColor: '#D1D9E6',
    },
    closeIcon: {
        width: 14,
        height: 14,
        marginLeft: 20,
        tintColor: '#1256A7',
    },
    addMoreBtn: {
        backgroundColor: '#D6E4FA',
        borderRadius: 6,
        paddingVertical: 8,
        alignItems: 'center',
        marginTop: 5,
    },
    addMoreText: {
        color: '#1256A7',
        fontSize: 13,
        fontWeight: '600',
    },
    nextButton: {
        marginTop: 10,
        marginBottom: 30,
    },
});
