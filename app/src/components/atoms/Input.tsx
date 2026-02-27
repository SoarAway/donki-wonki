import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
    label: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, style, ...props }) => {
    const hasValue = typeof props.value === 'string' ? props.value.length > 0 : false;

    return (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    !hasValue ? styles.placeholderLike : null,
                    error ? styles.inputError : null,
                    style,
                ]}
                placeholderTextColor="#B0B3B8"
                {...props}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
        fontWeight: '600',
        marginBottom: 8,
        color: '#000000',
        fontFamily: 'Inter-SemiBold',
    },
    input: {
        minHeight: 52,
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 14,
        fontSize: 15,
        backgroundColor: '#F1F2F6',
        borderWidth: 0,
        color: '#2B308B',
        fontFamily: 'Inter-Regular',
    },
    placeholderLike: {
        fontStyle: 'italic',
    },
    inputError: {
        borderWidth: 1,
        borderColor: '#D32F2F',
        backgroundColor: '#FFCECF8A',
    },
    errorText: {
        marginTop: 6,
        fontSize: 12,
        color: '#D32F2F',
        fontFamily: 'Inter-Regular',
    },
});
