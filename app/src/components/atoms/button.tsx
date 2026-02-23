import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../config';
import { Text } from './Text';
import { Spinner } from './Spinner';

export interface ButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}) => {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const isLoading = loading || internalLoading;

  const handlePress = async () => {
    if (isLoading || disabled) return;

    const result = onPress();
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
      } finally {
        setInternalLoading(false);
      }
    }
  };
  const getBackgroundColor = () => {
    if (disabled) return colors.neutral[300];
    switch (variant) {
      case 'primary': return colors.primary[500];
      case 'secondary': return colors.secondary[500];
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return colors.primary[500];
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.neutral[500];
    switch (variant) {
      case 'primary': return colors.neutral[0];
      case 'secondary': return colors.neutral[0];
      case 'outline': return colors.primary[500];
      case 'ghost': return colors.primary[500];
      default: return colors.neutral[0];
    }
  };

  const getBorder = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 1,
        borderColor: disabled ? colors.neutral[300] : colors.primary[500],
      };
    }
    return {};
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: spacing[2], paddingHorizontal: spacing[3] };
      case 'md': return { paddingVertical: spacing[3], paddingHorizontal: spacing[4] };
      case 'lg': return { paddingVertical: spacing[4], paddingHorizontal: spacing[6] };
      default: return { paddingVertical: spacing[3], paddingHorizontal: spacing[4] };
    }
  };

  const containerStyles: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: disabled ? 0.7 : 1,
    ...getBorder(),
    ...getPadding(),
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || isLoading}
      style={[containerStyles, style]}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <Spinner size="small" color={getTextColor()} />
      ) : (
        <Text
          variant={size === 'lg' ? 'lg' : 'base'}
          weight="semibold"
          style={{ color: getTextColor() }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};
