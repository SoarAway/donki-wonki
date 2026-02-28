import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colorTokens, radius, spacing, typography } from '../config';

export interface AvatarProps {
  name?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({ name, size = spacing[10], style }) => {
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius.full,
        },
        style,
      ]}
    >
      <Text style={styles.initials}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorTokens.surface_soft,
  },
  initials: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colorTokens.text_primary,
  },
});
