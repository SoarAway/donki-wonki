import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { Dropdown } from '../components/atoms/Dropdown';
import { BackButton } from '../components/atoms/BackButton';

const LINES = ["Kelana Jaya Line", "Ampang Line", "Kajang Line", "KL Monorail"];
const STATIONS = ["KL Sentral", "KLCC", "Bukit Bintang", "Masjid Jamek", "Titiwangsa"];
const INCIDENT_TYPES = ["Breakdown", "Delay", "Overcrowded", "Accident", "Others"];

export default function Community_Report({ navigation }: any) {
    const [line, setLine] = useState('');
    const [station, setStation] = useState('');
    const [incidentType, setIncidentType] = useState('');
    const [otherIncident, setOtherIncident] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!line || !station || !incidentType || !description) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (incidentType === 'Others' && !otherIncident) {
            Alert.alert('Error', 'Please specify the type of incident');
            return;
        }

        const finalIncidentType = incidentType === 'Others' ? otherIncident : incidentType;

        console.log('Report submitted:', { line, station, incidentType: finalIncidentType, description });

        Alert.alert('Success', 'Report submitted successfully. Thank you for your feedback!');
        if (navigation) navigation.navigate('Community');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <BackButton onPress={() => navigation && navigation.navigate('Community')} />
                <Text style={styles.title}>Reporting</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="always"
                >
                    <View style={styles.formContainer}>
                        <Dropdown
                            label="Line:"
                            placeholder="Choose a problem"
                            options={LINES}
                            selectedValue={line}
                            onSelect={setLine}
                        />

                        <Dropdown
                            label="Station:"
                            placeholder="Choose a problem"
                            options={STATIONS}
                            selectedValue={station}
                            onSelect={setStation}
                        />

                        <Dropdown
                            label="Type of Incident:"
                            placeholder="Choose a problem"
                            options={INCIDENT_TYPES}
                            selectedValue={incidentType}
                            onSelect={setIncidentType}
                        />

                        {incidentType === 'Others' && (
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.label}>Please specify incident:</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Type the incident here"
                                    placeholderTextColor="#AAAAAA"
                                    value={otherIncident}
                                    onChangeText={setOtherIncident}
                                />
                            </View>
                        )}

                        <View style={styles.fieldWrapper}>
                            <Text style={styles.label}>Description:</Text>
                            <TextInput
                                style={[styles.textArea, { fontStyle: description ? 'normal' : 'italic' }]}
                                placeholder="Description"
                                placeholderTextColor="#AAAAAA"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.submitWrapper}>
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.85}>
                        <Text style={styles.submitText}>Submit</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFCFD',
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
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 32,
        paddingTop: 10,
        paddingBottom: 20,
    },
    formContainer: {
        width: '100%',
    },
    fieldWrapper: {
        marginBottom: 18,
    },
    label: {
        fontSize: 15,
        fontWeight: '400',
        color: '#0D0D0D',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F0F1F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: '#0D0D0D',
    },
    textArea: {
        backgroundColor: '#F0F1F6',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: '#0D0D0D',
        minHeight: 150,
    },
    submitWrapper: {
        paddingHorizontal: 32,
        paddingTop: 4,
        paddingBottom: 210,
        backgroundColor: '#FAFCFD',
    },
    submitButton: {
        backgroundColor: '#2B308B',
        borderRadius: 50,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
