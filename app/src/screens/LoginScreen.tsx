import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image, TouchableOpacity } from 'react-native';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';

const logoImg = require('../assets/Logo.png');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        console.log('Login attempt:', email);
        Alert.alert('Login Success', `Welcome back, ${email}!`);
    };

    const handleRegisterPress = () => {
        console.log('Navigate to Register');
        // Navigation logic will go here once set up
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
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
                    />

                    <Input
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Button
                        title="Login"
                        onPress={handleLogin}
                        style={styles.loginButton}
                    />

                    <View style={styles.register}>
                        <Text style={styles.registerText}>don't have an account yet?</Text>
                        <TouchableOpacity onPress={handleRegisterPress}>
                            <Text style={styles.registerLink}> register here</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
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