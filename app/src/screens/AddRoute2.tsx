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
import { Dropdown } from '../components/atoms/Dropdown';
import { Button } from '../components/atoms/Button';

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
        <SafeAreaView style={styles.safeArea}>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FAFCFD',
    },
    header: {
        paddingHorizontal: 32,
        paddingTop: 100,
        paddingBottom: 10,
    },
    scrollView: {
        flex: 1,
    },
    container: {
        paddingHorizontal: 32,
        paddingTop: 16,
        paddingBottom: 20,
    },
    dropdownWrapper: {
        position: 'relative',
    },
    summaryTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#0D0D0D',
        marginTop: 8,
        marginBottom: 12,
    },
    summaryCard: {
        backgroundColor: '#F0F1F6',
        borderRadius: 14,
        paddingVertical: 18,
        paddingHorizontal: 20,
        gap: 8,
        width: 337,
    },
    summaryRow: {
        fontSize: 14,
        color: '#0D0D0D',
        lineHeight: 22,
    },
    summaryKey: {
        fontWeight: '700',
        color: '#0D0D0D',
    },
    summaryValue: {
        fontWeight: '400',
        color: '#0D0D0D',
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
