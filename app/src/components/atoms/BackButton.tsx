import React from 'react';
import { TouchableOpacity, Image, StyleSheet, TouchableOpacityProps } from 'react-native';

const backIcon = require('../../assets/left.png');

interface BackButtonProps extends TouchableOpacityProps {
    color?: string;
    size?: number;
}

export const BackButton: React.FC<BackButtonProps> = ({
    style,
    color = '#2B308B',
    size = 21,
    ...props
}) => {
    return (
        <TouchableOpacity style={[styles.backButton, style]} {...props}>
            <Image
                source={backIcon}
                style={[
                    styles.backIcon,
                    { width: size, height: size, tintColor: color }
                ]}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    backButton: {
        marginRight: 10,
    },
    backIcon: {
        resizeMode: 'contain',
    },
});