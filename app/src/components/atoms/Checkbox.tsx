import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

interface CheckboxProps {
    label: string;
    checked: boolean;
    onToggle: () => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onToggle }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onToggle} activeOpacity={0.7}>
            <View style={[styles.checkbox, checked && styles.checked]}>
                {checked && <View style={styles.checkmark} />}
            </View>
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#1256A7',
        borderRadius: 4,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    checked: {
        backgroundColor: '#FFFFFF', // Keep it white, use blue checkmark
    },
    checkmark: {
        width: 10,
        height: 10,
        backgroundColor: '#1256A7',
        borderRadius: 2,
    },
    label: {
        fontSize: 15,
        color: '#000000',
    },
});
