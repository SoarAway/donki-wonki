import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ScrollView,
    Image,
    TouchableOpacity,
} from 'react-native';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { BaseScreen } from '../models/BaseScreen';
import { colorTokens, radius, spacing, typography } from '../components/config';

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
        <BaseScreen style={styles.container} keyboardAvoiding>
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
        </BaseScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorTokens.background_default,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: spacing[8],
        paddingTop: spacing[24] + spacing[6],
        paddingBottom: spacing[10],
    },
    logo: {
        width: spacing[20] + spacing[2],
        height: spacing[12] + 2,
        marginBottom: spacing[5],
    },
    title: {
        fontSize: typography.sizes['3xl'],
        fontWeight: typography.weights.bold,
        color: colorTokens.text_dark,
        marginBottom: spacing[5] + 1,
        lineHeight: typography.lineHeights['3xl'] + 6,
    },
    button: {
        marginTop: spacing[8],
        borderRadius: radius.full,
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing[4],
        alignItems: 'center',
    },
    loginText: {
        fontSize: typography.sizes.xs + 1,
        color: colorTokens.text_muted,
        fontStyle: 'italic',
    },
    loginLink: {
        fontSize: typography.sizes.xs + 1,
        color: colorTokens.primary_accent,
        fontStyle: 'italic',
        textDecorationLine: 'underline',
        fontWeight: typography.weights.semibold,
    },
    inputError: {
        borderWidth: 1,
        borderColor: colorTokens.error_main,
        backgroundColor: colorTokens.error_background_soft,
    },
    errorText: {
        color: colorTokens.error_main,
        fontSize: typography.sizes.xs - 1,
        marginTop: -10,
        marginBottom: spacing[2],
    },
});
