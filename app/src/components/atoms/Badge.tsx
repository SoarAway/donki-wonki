import React from 'react';
import { View, StyleSheet } from 'react-native';
import {colorTokens, radius, spacing} from '../config';
import { Text } from './Text';

export interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

/**
 * Compact status label with semantic color variants.
 */
export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', size = 'md' }) => {
  const getColors = () => {
    switch (variant) {
      case 'success': return { bg: colorTokens.background_default, text: colorTokens.primary_accent };
      case 'warning': return { bg: colorTokens.secondary_accent, text: colorTokens.primary_accent };
      case 'error': return { bg: colorTokens.error_background, text: colorTokens.error_main };
      case 'info': return { bg: colorTokens.background_default, text: colorTokens.secondary_accent };
      default: return { bg: colorTokens.background_default, text: colorTokens.primary_accent };
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
