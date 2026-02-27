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

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRegister = () => {
        if (!name || !email || !dob || !password || !confirmPassword) {
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
                />

                <Input
                    label="Date of Birth:"
                    placeholder="Enter your date of birth"
                    value={dob}
                    onChangeText={setDob}
                />

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
                    <TouchableOpacity>
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
});
