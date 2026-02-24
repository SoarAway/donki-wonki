import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Dropdown } from '../components/atoms/Dropdown';
import { BackButton } from '../components/atoms/BackButton';
import { BaseScreen } from '../models/BaseScreen';

// Mock data as requested - user will update this manually later
const TRANSIT_SYSTEMS = ["LRT", "MRT", "Monorail", "KTM"];

const LINES: Record<string, string[]> = {
    "LRT": ["Kelana Jaya Line", "Ampang Line", "Sri Petaling Line"],
    "MRT": ["Kajang Line", "Putrajaya Line"],
    "Monorail": ["KL Monorail"],
    "KTM": ["Batu Caves - Pulau Sebang", "Tanjung Malim - Pelabuhan Klang", "KL Sentral - Skypark Terminal"]
};

// Example stations for demonstration - user will manually add their own
const STATIONS: Record<string, string[]> = {
    "Kelana Jaya Line": [
        "Gombak", "Taman Melati", "Wangsa Maju", "Sri Rampai", "Setiawangsa", "Jelatek",
        "Dato' Keramat", "Damai", "Ampang Park", "KLCC", "Kampung Baru", "Dang Wangi",
        "Masjid Jamek", "Pasar Seni", "KL Sentral", "Bangsar", "Abdullah Hukum", "Kerinchi",
        "Universiti", "Taman Jaya", "Asia Jaya", "Taman Paramount", "Taman Bahagia",
        "Kelana Jaya", "Lembah Subang", "Ara Damansara", "Glenmarie", "Subang Jaya",
        "SS 15", "SS 18", "USJ 7", "Taipan", "Wawasan", "USJ 21", "Alam Megah",
        "Subang Alam", "Putra Heights"
    ],
    "Ampang Line": [
        "Sentul Timur", "Sentul", "Titiwangsa", "PWTC", "Sultan Ismail", "Bandaraya",
        "Masjid Jamek", "Plaza Rakyat", "Hang Tuah", "Pudu", "Chan Sow Lin", "Miharja",
        "Maluri", "Pandan Jaya", "Pandan Indah", "Cempaka", "Cahaya", "Ampang"
    ],
    "Sri Petaling Line": [
        "Sentul Timur", "Sentul", "Titiwangsa", "PWTC", "Sultan Ismail", "Bandaraya",
        "Masjid Jamek", "Plaza Rakyat", "Hang Tuah", "Pudu", "Chan Sow Lin", "Cheras",
        "Salak Selatan", "Bandar Tun Razak", "Bandar Tasik Selatan", "Sungai Besi",
        "Bukit Jalil", "Sri Petaling", "Awan Besar", "Muhibbah", "Alam Sutera",
        "Kinrara BK5", "IOI Puchong Jaya", "Pusat Bandar Puchong",
        "Taman Perindustrian Puchong (TPP)", "Bandar Puteri", "Puchong Perdana",
        "Puchong Prima", "Putra Heights"
    ],
    "Kajang Line": [
        "Kampung Selamat", "Sungai Buloh", "Kwasa Damansara", "Kwasa Sentral",
        "Kota Damansara", "Surian", "Mutiara Damansara", "Bandar Utama", "TTDI",
        "Phileo Damansara", "Pusat Bandar Damansara", "Manulife Semantan",
        "Muzium Negara", "Pasar Seni", "Merdeka", "Bukit Bintang",
        "Tun Razak Exchange (TRX)", "Cochrane", "Maluri", "Taman Pertama",
        "Taman Midah", "Taman Mutiara", "Taman Connaught", "Taman Suntex",
        "Sri Raya", "Bandar Tun Hussein Onn", "Batu 11 Cheras", "Bukit Dukung",
        "Sungai Jernih", "Stadium Kajang", "Kajang"
    ],
    "Putrajaya Line": [
        "Kwasa Damansara", "Kampung Selamat", "Sungai Buloh", "Damansara Damai",
        "Sri Damansara Barat", "Sri Damansara Sentral", "Sri Damansara Timur",
        "Metro Prima", "Kepong Baru", "Jinjang", "Sri Delima", "Kampung Batu",
        "Kentonmen", "Jalan Ipoh", "Sentul Barat", "Titiwangsa",
        "Hospital Kuala Lumpur", "Raja Uda", "Ampang Park", "Persiaran KLCC",
        "Conlay", "Tun Razak Exchange (TRX)", "Chan Sow Lin", "Kuchai",
        "Taman Naga Emas", "Sungai Besi", "Serdang Raya Utara",
        "Serdang Raya Selatan", "Serdang Jaya", "UPM", "Taman Equine",
        "Putra Permai", "16 Sierra", "Cyberjaya Utara", "Cyberjaya City Centre",
        "Putrajaya Sentral"
    ],
    "KL Monorail": [
        "KL Sentral", "Tun Sambanthan", "Maharajalela", "Hang Tuah", "Imbi",
        "Air Asia Bukit Bintang", "Raja Chulan", "Bukit Nanas", "Medan Tuanku",
        "Chow Kit", "Titiwangsa"
    ],
    "Batu Caves - Pulau Sebang": [
        "Batu Caves", "Taman Wahyu", "Kampung Batu", "Batu Kentomen", "Sentul", "Putra",
        "Bank Negara", "Kuala Lumpur", "KL Sentral", "Mid Valley", "Seputeh", "Salak Selatan",
        "Bandar Tasik Selatan", "Serdang", "Kajang", "UKM", "Bangi",
        "Batang Benar", "Nilai", "Labu", "Tiroi", "Seremban", "Senawang", "Sungai Gadut",
        "Rembau", "Tampin / Pulau Sebang"
    ],
    "Tanjung Malim - Pelabuhan Klang": [
        "Tanjung Malim", "Kuala Kubu Bharu", "Rasa", "Batang Kali", "Serendah", "Rawang",
        "Kuang", "Sungai Buloh", "Kepong Sentral", "Kepong", "Segambut", "Putra",
        "Bank Negara", "Kuala Lumpur", "KL Sentral", "Abdullah Hukum", "Angkasapuri",
        "Pantai Dalam", "Petaling", "Jalan Templer", "Kampung Dato Harun", "Seri Setia",
        "Setia Jaya", "Subang Jaya", "Batu Tiga", "Shah Alam", "Padang Jawa", "Bukit Badak",
        "Klang", "Teluk Pulai", "Teluk Gadong", "Kampung Raja Uda", "Jalan Kastam", "Pelabuhan Klang"
    ],
    "KL Sentral - Skypark Terminal": [
        "KL Sentral", "Subang Jaya", "Terminal Skypark"
    ]
};

const INCIDENT_TYPES = ["Breakdown", "Delay", "Overcrowded", "Accident", "Others"];

export default function Reporting({ navigation }: any) {
    const [transitSystem, setTransitSystem] = useState('');
    const [line, setLine] = useState('');
    const [station, setStation] = useState('');
    const [incidentType, setIncidentType] = useState('');
    const [otherIncident, setOtherIncident] = useState('');
    const [description, setDescription] = useState('');

    const [availableLines, setAvailableLines] = useState<string[]>([]);
    const [availableStations, setAvailableStations] = useState<string[]>([]);

    // Update lines when transit system changes
    useEffect(() => {
        if (transitSystem) {
            setAvailableLines(LINES[transitSystem] || []);
            setLine(''); // Reset line when transit system changes
            setStation(''); // Reset station when transit system changes
        } else {
            setAvailableLines([]);
        }
    }, [transitSystem]);

    // Update stations when line changes
    useEffect(() => {
        if (line) {
            setAvailableStations(STATIONS[line] || []);
            setStation(''); // Reset station when line changes
        } else {
            setAvailableStations([]);
        }
    }, [line]);

    const handleSubmit = () => {
        if (!transitSystem || !line || !station || !incidentType || !description) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (incidentType === 'Others' && !otherIncident) {
            Alert.alert('Error', 'Please specify the type of incident');
            return;
        }

        const finalIncidentType = incidentType === 'Others' ? otherIncident : incidentType;

        console.log('Report submitted:', {
            transitSystem,
            line,
            station,
            incidentType: finalIncidentType,
            description
        });

        Alert.alert('Success', 'Report submitted successfully. Thank you for your feedback!');
        if (navigation) navigation.navigate('Community');
    };

    return (
        <BaseScreen style={styles.container} keyboardAvoiding>
            <View style={styles.header}>
                <BackButton onPress={() => navigation && navigation.navigate('Community')} />
                <Text style={styles.title}>Reporting</Text>
            </View>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="always"
            >
                <View style={styles.formContainer}>
                    <Dropdown
                        label="Transit System:"
                        placeholder="Choose a transit system"
                        options={TRANSIT_SYSTEMS}
                        selectedValue={transitSystem}
                        onSelect={setTransitSystem}
                    />

                    <Dropdown
                        label="Line:"
                        placeholder="Choose a line"
                        options={availableLines}
                        selectedValue={line}
                        onSelect={setLine}
                    />

                    <Dropdown
                        label="Station:"
                        placeholder="Choose a station"
                        options={availableStations}
                        selectedValue={station}
                        onSelect={setStation}
                    />

                    <Dropdown
                        label="Type of Incident:"
                        placeholder="Choose type of incident"
                        options={INCIDENT_TYPES}
                        selectedValue={incidentType}
                        onSelect={setIncidentType}
                    />

                    {incidentType === 'Others' && (
                        <Input
                            label="Please specify incident:"
                            placeholder="Type the incident here"
                            value={otherIncident}
                            onChangeText={setOtherIncident}
                        />
                    )}

                    <Input
                        label="Description:"
                        placeholder="Add more details about the incident"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        style={styles.textArea}
                    />

                    <Button
                        label="Submit"
                        onPress={handleSubmit}
                        style={styles.submitButton}
                    />
                </View>
            </ScrollView>
        </BaseScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    flexContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 100, // Matching Feedback.tsx paddingTop for consistent header placement
        paddingBottom: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000000',
        marginLeft: 5,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 40,
    },
    formContainer: {
        width: '100%',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
        paddingHorizontal: 15,
        paddingTop: 15,
    },
    submitButton: {
        marginTop: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
