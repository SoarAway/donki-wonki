import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { colors } from '../config';
import { Text } from './Text';

export interface AvatarProps {
  source?: { uri: string };
  name?: string; // For fallback initials
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ source, name, size = 40 }) => {
  const borderRadius = size / 2;

  if (source) {
    return (
      <Image
        source={source}
        style={[
          styles.image,
          { width: size, height: size, borderRadius },
        ]}
      />
    );
  }

  // Fallback to initials
  const initials = name
    ? name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
    : '?';

  return (
    <View
      style={[
        styles.initialsContainer,
        { width: size, height: size, borderRadius },
      ]}
    >
      <Text weight="bold" color="primary.700" style={{ fontSize: size * 0.4 }}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.neutral[200],
  },
  initialsContainer: {
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
