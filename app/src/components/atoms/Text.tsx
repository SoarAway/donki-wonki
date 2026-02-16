import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { colors, typography } from '../tokens';

export interface TextProps extends RNTextProps {
  variant?: keyof typeof typography.sizes;
  weight?: keyof typeof typography.weights;
  color?: string; // Path to color like 'primary.500' or raw hex
  align?: TextStyle['textAlign'];
  transform?: TextStyle['textTransform'];
  decoration?: TextStyle['textDecorationLine'];
}

// Helper to resolve color path (simplified)
const resolveColor = (path?: string): string => {
  if (!path) return colors.text.primary;
  if (path.startsWith('#')) return path;

  const [group, shade] = path.split('.');
  if (group && shade && (colors as any)[group] && (colors as any)[group][shade]) {
    return (colors as any)[group][shade];
  }
  // Semantic colors
  if ((colors as any)[path] && typeof (colors as any)[path] === 'string') {
    return (colors as any)[path];
  }
  if ((colors as any)[group] && (colors as any)[group].main) {
    return (colors as any)[group].main;
  }

  return colors.text.primary;
};

export const Text: React.FC<TextProps> = ({
  variant = 'base',
  weight = 'regular',
  color,
  align,
  transform,
  decoration,
  style,
  children,
  ...props
}) => {
  const textStyle: TextStyle = {
    fontFamily: typography.families.sans,
    fontSize: typography.sizes[variant],
    lineHeight: typography.lineHeights[variant],
    fontWeight: typography.weights[weight] as TextStyle['fontWeight'],
    color: resolveColor(color),
    textAlign: align,
    textTransform: transform,
    textDecorationLine: decoration,
  };

  return (
    <RNText style={[textStyle, style]} {...props}>
      {children}
    </RNText>
  );
};
