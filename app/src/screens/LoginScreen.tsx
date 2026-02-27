import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    Image,
    TouchableOpacity,
    TextInput,
    ScrollView,
} from 'react-native';
import { BaseScreen } from '../models/BaseScreen';
import { colorTokens, radius, spacing, typography } from '../components/config';

const logoImg = require('../assets/Logo.png');

interface LoginScreenProps {
    onLoginSuccess: (userId: string) => void;
    onGoToRegister: () => void;
}

export default function LoginScreen({ onLoginSuccess, onGoToRegister }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        console.log('Login attempt:', email);
        onLoginSuccess(email.trim().toLowerCase());
    };

    return (
        <BaseScreen style={styles.container} keyboardAvoiding>
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
                    <TouchableOpacity onPress={onGoToRegister}>
                        <Text style={styles.registerLink}>Register Now</Text>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing[8],
        paddingTop: spacing[24] + spacing[6] + 1,
        paddingBottom: spacing[10],
    },
    logo: {
        width: spacing[20] + spacing[2],
        height: spacing[12] + spacing[3],
        resizeMode: 'contain',
        marginBottom: spacing[6] + spacing[1],
    },
    title: {
        fontSize: typography.sizes['4xl'] - 4,
        fontWeight: typography.weights.bold,
        color: colorTokens.text_dark,
        lineHeight: typography.lineHeights['4xl'],
        marginBottom: spacing[8] + spacing[1],
    },
    fieldGroup: {
        marginBottom: spacing[5],
    },
    label: {
        fontSize: typography.sizes.sm + 1,
        fontWeight: typography.weights.medium,
        color: colorTokens.text_dark,
        marginBottom: spacing[2],
    },
    input: {
        backgroundColor: colorTokens.surface_muted,
        borderRadius: radius.lg + 2,
        paddingHorizontal: spacing[4] + 2,
        paddingVertical: spacing[4],
        fontSize: typography.sizes.sm,
        color: colorTokens.text_dark,
        width: '100%',
    },
    loginBtn: {
        backgroundColor: colorTokens.primary_accent,
        borderRadius: radius.full,
        paddingVertical: spacing[4] - 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing[8] + spacing[1],
        marginBottom: spacing[6] + spacing[1],
    },
    loginBtnText: {
        color: colorTokens.white,
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.bold,
    },
    registerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    registerText: {
        fontSize: typography.sizes.sm,
        color: colorTokens.text_primary,
        fontStyle: 'italic',
    },
    registerLink: {
        fontSize: typography.sizes.sm,
        color: colorTokens.primary_accent,
        fontWeight: typography.weights.bold,
        fontStyle: 'italic',
        textDecorationLine: 'underline',
    },
});
