import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import {colorTokens, typography} from '../config';

export interface TextProps extends RNTextProps {
  variant?: keyof typeof typography.sizes;
  weight?: keyof typeof typography.weights;
  color?: string;
  align?: TextStyle['textAlign'];
  transform?: TextStyle['textTransform'];
  decoration?: TextStyle['textDecorationLine'];
}

const resolveFontFamily = (weight: keyof typeof typography.weights) => {
  switch (weight) {
    case 'medium':
      return typography.families.sansMedium;
    case 'semibold':
      return typography.families.sansSemibold;
    case 'bold':
      return typography.families.sansBold;
    case 'regular':
    default:
      return typography.families.sans;
  }
};

const colorAliasMap: Record<string, keyof typeof colorTokens> = {
  'primary.500': 'primary_accent',
  'primary.main': 'primary_accent',
  primary: 'primary_accent',
  'secondary.500': 'secondary_accent',
  'secondary.main': 'secondary_accent',
  secondary: 'secondary_accent',
  'background.default': 'background_default',
  'background.paper': 'background_default',
  'neutral.0': 'background_default',
  'error.main': 'error_main',
  error: 'error_main',
  'error.light': 'error_background',
  'text.primary': 'primary_accent',
  'text.secondary': 'secondary_accent',
  'text.disabled': 'secondary_accent',
  'text.inverse': 'background_default',
};

const resolveColor = (path?: string): string => {
  if (!path) return colorTokens.primary_accent;
  if (path.startsWith('#')) return path;

  const directToken = path as keyof typeof colorTokens;
  if (directToken in colorTokens) {
    return colorTokens[directToken];
  }

  const aliasToken = colorAliasMap[path];
  if (aliasToken) {
    return colorTokens[aliasToken];
  }

  return colorTokens.primary_accent;
};

/**
 * Typography primitive that maps semantic variants and token color paths.
 */
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
    fontFamily: resolveFontFamily(weight),
    fontSize: typography.sizes[variant],
    lineHeight: typography.lineHeights[variant],
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
