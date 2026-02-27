import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
    label: string;
}

export const Input: React.FC<InputProps> = ({ label, style, ...props }) => {
    return (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, style]}
                placeholderTextColor="#AAAAAA"
                {...props}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 6,
        color: '#111111',
    },
    input: {
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 12,
        backgroundColor: '#F0F1F6',
        color: '#111111',
        width: '100%',
        height: 44,
        textAlignVertical: 'center',
    },
});