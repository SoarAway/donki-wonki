import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    textStyle?: object;
}

export const Button: React.FC<ButtonProps> = ({ title, style, textStyle, ...props }) => {
    return (
        <TouchableOpacity style={[styles.button, style]} {...props}>
            <Text style={[styles.text, textStyle]}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#2B308B',
        paddingVertical: 13,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
});