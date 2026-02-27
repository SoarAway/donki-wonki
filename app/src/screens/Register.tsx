import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    TouchableOpacity,
} from 'react-native';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';

interface RegisterProps {
    onRegisterSuccess: (userId: string) => void;
    onBackToLogin: () => void;
}

export default function Register({ onRegisterSuccess, onBackToLogin }: RegisterProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // ── DOB helpers (no extra useState needed) ────────────────────
    const isValidDate = (dateStr: string): boolean => {
        const parts = dateStr.split('/');
        if (parts.length !== 3) return false;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;
        if (year < 1900 || year > new Date().getFullYear()) return false;
        const date = new Date(year, month - 1, day);
        return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
        );
    };

    const handleDobChange = (text: string) => {
        const digits = text.replace(/\D/g, '');
        let formatted = '';
        if (digits.length <= 2) {
            formatted = digits;
        } else if (digits.length <= 4) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        } else {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
        }
        setDob(formatted);
    };

    // Derived — no useState needed
    const dobError =
        dob.length === 10 && !isValidDate(dob)
            ? 'Invalid date. Please enter a valid DD/MM/YYYY.'
            : '';
    // ──────────────────────────────────────────────────────────────

    // ── Email validation (derived, no useState) ──────────────────
    const emailError =
        email.length > 0 && (!email.includes('@') || !email.includes('.com'))
            ? 'Email must contain @ and .com'
            : '';
    // ──────────────────────────────────────────────────────────────

    const handleRegister = () => {
        if (!name || !email || !dob || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (!email.includes('@') || !email.includes('.com')) {
            Alert.alert('Error', 'Please enter a valid email with @ and .com');
            return;
        }
        if (dob.length < 10 || !isValidDate(dob)) {
            Alert.alert('Error', 'Please enter a valid date of birth (DD/MM/YYYY).');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        console.log('Register attempt:', email);
        onRegisterSuccess(email.trim().toLowerCase());
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Logo */}
                <Image
                    source={require('../assets/Logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* Title */}
                <Text style={styles.title}>Register an{'\n'}Account</Text>

                {/* Form Fields */}
                <Input
                    label="Name:"
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                />

                <Input
                    label="Email:"
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={emailError ? styles.inputError : undefined}
                />
                {emailError ? (
                    <Text style={styles.errorText}>{emailError}</Text>
                ) : null}

                <Input
                    label="Date of Birth:"
                    placeholder="DD/MM/YYYY"
                    value={dob}
                    onChangeText={handleDobChange}
                    keyboardType="numeric"
                    maxLength={10}
                    style={dobError ? styles.inputError : undefined}
                />
                {dobError ? (
                    <Text style={styles.errorText}>{dobError}</Text>
                ) : null}

                <Input
                    label="Password:"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <Input
                    label="Confirm Password:"
                    placeholder="Enter your confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />

                {/* Next Button */}
                <Button
                    title="Next"
                    onPress={handleRegister}
                    style={styles.button}
                />

                {/* Login link */}
                <View style={styles.loginRow}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={onBackToLogin}>
                        <Text style={styles.loginLink}>Login Here</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFCFD',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 32,
        paddingTop: 120,
        paddingBottom: 40,
    },
    logo: {
        width: 90,
        height: 50,
        marginBottom: 20,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#111111',
        marginBottom: 21,
        lineHeight: 42,
    },
    button: {
        marginTop: 32,
        borderRadius: 50,
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
        alignItems: 'center',
    },
    loginText: {
        fontSize: 13,
        color: '#555555',
        fontStyle: 'italic',
    },
    loginLink: {
        fontSize: 13,
        color: '#2B308B',
        fontStyle: 'italic',
        textDecorationLine: 'underline',
        fontWeight: '600',
    },
    inputError: {
        borderWidth: 1,
        borderColor: '#D32F2F',
        backgroundColor: '#FFF5F5',
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 11,
        marginTop: -10,
        marginBottom: 8,
    },
});
