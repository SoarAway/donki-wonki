import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { BaseScreen } from '../models/BaseScreen';
import { loginUser } from '../services/api/apiEndpoints';
import {
    firstValidationError,
    hasValidationErrors,
    minLength,
    validateEmail,
} from '../utils/authValidation';

const logoImg = require('../assets/Logo.png');

interface LoginScreenProps {
    onLoginSuccess?: (userId: string) => void;
    onGoToRegister?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onGoToRegister }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handleRegisterPress = () => {
        if (onGoToRegister) {
            onGoToRegister();
            return;
        }
        console.log('Navigate to Register');
    };

    const handleLogin = async () => {
        const errors = {
            email: validateEmail(email, 'Enter a valid email address.'),
            password: firstValidationError(
                minLength(password, 8, 'Password must be at least 8 characters.'),
            ),
        };

        setEmailError(errors.email);
        setPasswordError(errors.password);

        if (hasValidationErrors(errors)) {
            return;
        }

        setSubmitting(true);
        try {
            // call loginUser api with user email and password
            const response = await loginUser({
                email: email.trim(),
                password,
            });

            Alert.alert('Login Success', response.message);
            if (onLoginSuccess) {
                onLoginSuccess(response.email.trim().toLowerCase());
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to login now.';
            Alert.alert('Login Failed', message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <BaseScreen style={styles.container} keyboardAvoiding keyboardBehavior="padding">
            <View style={styles.keyboardView}>
                <Image source={logoImg} style={styles.logo} />
                <View style={styles.box}>
                    <Text style={styles.title}>Login</Text>

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

                    <Button
                        label="Login"
                        onPress={handleLogin}
                        loading={submitting}
                        style={styles.loginButton}
                    />

                    <View style={styles.register}>
                        <Text style={styles.registerText}>don't have an account yet?</Text>
                        <TouchableOpacity onPress={handleRegisterPress}>
                            <Text style={styles.registerLink}> register here</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </BaseScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#8DBDF1',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
    },
    logo: {
        width: 150,
        height: 80,
        resizeMode: 'contain',
        marginTop: 120,
        marginBottom: 30,
    },
    box: {
        backgroundColor: '#F1F0F6',
        borderRadius: 50,
        padding: 30,
        width: '100%',
        maxWidth: 400,
        paddingVertical: 50,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 40,
        textAlign: 'center',
        color: '#000000',
    },
    loginButton: {
        marginTop: 30,
    },
    register: {
        flexDirection: 'row',
        marginTop: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    registerLink: {
        fontSize: 14,
        color: '#1256A7',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
