import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../config';
import { Text } from './Text';

export interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', size = 'md' }) => {
  const getColors = () => {
    switch (variant) {
      case 'success': return { bg: colors.success.light, text: colors.success.dark };
      case 'warning': return { bg: colors.warning.light, text: colors.warning.dark };
      case 'error': return { bg: colors.error.light, text: colors.error.dark };
      case 'info': return { bg: colors.info.light, text: colors.info.dark };
      default: return { bg: colors.neutral[100], text: colors.neutral[700] };
    }
  };

  const { bg, text } = getColors();

  const containerStyle = size === 'sm'
    ? [styles.container, styles.containerSm, { backgroundColor: bg }]
    : [styles.container, styles.containerMd, { backgroundColor: bg }];

  return (
    <View style={containerStyle}>
      <Text
        variant="xs"
        weight="medium"
        style={{ color: text }}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  containerSm: {
    paddingVertical: 2,
    paddingHorizontal: spacing[1],
  },
  containerMd: {
    paddingVertical: 4,
    paddingHorizontal: spacing[2],
  },
});
