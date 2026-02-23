import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Checkbox } from '../components/atoms/Checkbox';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);

    const handleRegister = () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        console.log('Register attempt:', email);
        Alert.alert('Register Success', `Welcome, ${name}!`);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.card}>
                    <Text style={styles.title}>Register</Text>

                    <Input
                        label="Name"
                        placeholder="Enter your name"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />

                    <Input
                        label="Email"
                        placeholder="Enter your email address"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Input
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Input
                        label="Confirm Password"
                        placeholder="Please confirm your password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    <View style={styles.checkboxWrapper}>
                        <Checkbox
                            label="Authorize to connect to google calendar"
                            checked={isAuthorized}
                            onToggle={() => setIsAuthorized(!isAuthorized)}
                        />
                    </View>

                    <Button
                        title="Next"
                        onPress={handleRegister}
                        style={styles.registerButton}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#8DBDF1',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#F1F0F6',
        borderRadius: 50,
        paddingHorizontal: 40,
        paddingTop: 40,
        paddingBottom: 40,
        width: '100%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 50,
        textAlign: 'center',
        color: '#000000',
    },
    registerButton: {
        marginTop: 20,
    },
    checkboxWrapper: {
        marginTop: 5,
        transform: [{ scale: 0.85 }],
        alignSelf: 'flex-start',
        marginLeft: -20, // To compensate for left margin after scaling
    },
});
