import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
    TouchableOpacity,
    TextInput,
    ScrollView,
} from 'react-native';

const logoImg = require('../assets/Logo.png');

export default function LoginScreen({ navigation }: any) {
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
        if (navigation) {
            navigation.navigate('Register');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Logo */}
                <Image source={logoImg} style={styles.logo} />

                {/* Title */}
                <Text style={styles.title}>Login to your{'\n'}Account</Text>

                {/* Email field */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Email:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="#AAAAAA"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Password field */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Password:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#AAAAAA"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                {/* Login button */}
                <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
                    <Text style={styles.loginBtnText}>Login</Text>
                </TouchableOpacity>

                {/* Register row */}
                <View style={styles.registerRow}>
                    <Text style={styles.registerText}>Don't have an account yet? </Text>
                    <TouchableOpacity onPress={handleRegisterPress}>
                        <Text style={styles.registerLink}>Register Now</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F0F6',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 32,
        paddingTop: 125,
        paddingBottom: 40,
    },
    logo: {
        width: 90,
        height: 60,
        resizeMode: 'contain',
        marginBottom: 28,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111111',
        lineHeight: 40,
        marginBottom: 36,
    },
    fieldGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        color: '#111111',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#E8E8EF',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 16,
        fontSize: 14,
        color: '#111111',
        width: '100%',
    },
    loginBtn: {
        backgroundColor: '#2B308B',
        borderRadius: 50,
        paddingVertical: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 35,
        marginBottom: 28,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    loginBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    registerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    registerText: {
        fontSize: 14,
        color: '#000000',
        fontStyle: 'italic',
    },
    registerLink: {
        fontSize: 14,
        color: '#2B308B',
        fontWeight: '700',
        fontStyle: 'italic',
        textDecorationLine: 'underline',
    },
});