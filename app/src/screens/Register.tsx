import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { registerUser } from '../services/api/apiEndpoints';
import {
    firstValidationError,
    hasValidationErrors,
    matchValue,
    minLength,
    requireValue,
    validateEmail,
} from '../utils/authValidation';
import { BaseScreen } from '../models/BaseScreen';

interface RegisterProps {
    onRegisterSuccess?: (userId: string) => void;
    onBackToLogin?: () => void;
}

export default function Register({ onRegisterSuccess, onBackToLogin }: RegisterProps) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [emailError, setEmailError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const handleRegister = async () => {
        const errors = {
            email: validateEmail(email, 'Enter a valid email address.'),
            username: requireValue(username, 'Username is required.'),
            password: firstValidationError(
                minLength(password, 8, 'Password must be at least 8 characters.'),
            ),
            confirmPassword: matchValue(
                confirmPassword,
                password,
                'Passwords do not match.',
            ),
        };

        setEmailError(errors.email);
        setUsernameError(errors.username);
        setPasswordError(errors.password);
        setConfirmPasswordError(errors.confirmPassword);

        if (hasValidationErrors(errors)) {
            return;
        }

        setSubmitting(true);
        try {
            const response = await registerUser({
                email: email.trim(),
                username: username.trim(),
                password,
            });

            Alert.alert('Registration Success', response.message);
            if (onRegisterSuccess) {
                onRegisterSuccess(response.user.id);
                return;
            }
            if (onBackToLogin) {
                onBackToLogin();
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to register now.';
            Alert.alert('Registration Failed', message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <BaseScreen style={styles.container} keyboardAvoiding keyboardBehavior="padding">
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.card}>
                    <Text style={styles.title}>Register</Text>

                    <Input
                        label="Username"
                        placeholder="Enter your username"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        error={usernameError}
                    />

                    <Input
                        label="Email"
                        placeholder="Enter your email address"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        error={emailError}
                    />

                    <Input
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        error={passwordError}
                    />

                    <Input
                        label="Confirm Password"
                        placeholder="Please confirm your password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        error={confirmPasswordError}
                    />

                    <Button
                        label="Register"
                        onPress={handleRegister}
                        loading={submitting}
                        style={styles.registerButton}
                    />

                    <Button
                        label="Back to Login"
                        onPress={() => onBackToLogin && onBackToLogin()}
                        variant="outline"
                        style={styles.backButton}
                    />
                </View>
            </ScrollView>
        </BaseScreen>
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
    backButton: {
        marginTop: 10,
    },
});
