import React from 'react';
import {StyleSheet, TouchableOpacity, View, ViewStyle} from 'react-native';
import {colorTokens, spacing} from '../config';
import { Spinner } from './Spinner';
import { Text } from './Text';

export interface ButtonProps {
  label?: string;
  title?: string;
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
  title,
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
  const buttonText = label ?? title ?? '';

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
    if (disabled) return colorTokens.secondary_accent;
    switch (variant) {
      case 'primary':
        return colorTokens.primary_accent;
      case 'secondary':
        return colorTokens.secondary_accent;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return colorTokens.primary_accent;
    }
  };

  const getTextColor = () => {
    if (disabled) return colorTokens.primary_accent;
    switch (variant) {
      case 'primary':
      case 'secondary':
        return colorTokens.background_default;
      case 'outline':
      case 'ghost':
        return colorTokens.primary_accent;
      default:
        return colorTokens.background_default;
    }
  };

  const getBorder = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 1,
        borderColor: disabled ? colorTokens.secondary_accent : colorTokens.primary_accent,
      };
    }
    return {};
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return {paddingVertical: spacing[2], paddingHorizontal: spacing[4]};
      case 'md':
        return {paddingVertical: spacing[3], paddingHorizontal: spacing[6]};
      case 'lg':
        return {paddingVertical: spacing[4], paddingHorizontal: spacing[8]};
      default:
        return {paddingVertical: spacing[3], paddingHorizontal: spacing[6]};
    }
  };

  const bodyStyles: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: disabled ? 0.7 : 1,
    ...getBorder(),
    ...getPadding(),
  };

  if (variant === 'primary') {
    return (
      <View
        style={[
          styles.layeredWrapper,
          fullWidth ? styles.fullWidth : styles.autoWidth,
          disabled ? styles.disabled : null,
          style,
        ]}
      >
        <View style={styles.layeredBase} />
        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled || isLoading}
          style={[bodyStyles, styles.layeredBody]}
          activeOpacity={0.9}
        >
          {isLoading ? (
            <Spinner size="small" color={getTextColor()} />
          ) : (
            <Text
              variant={size === 'lg' ? 'lg' : 'base'}
              weight="semibold"
              style={[styles.centerText, {color: getTextColor()}]}
            >
              {buttonText}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  const containerStyles: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: 999,
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
            style={[styles.centerText, {color: getTextColor()}]}
          >
            {buttonText}
          </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  layeredWrapper: {
    position: 'relative',
    overflow: 'visible',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  layeredBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#5A81FA',
    borderRadius: 999,
    transform: [{translateX: -4}, {translateY: -4}],
  },
  layeredBody: {
    backgroundColor: '#2B308B',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  autoWidth: {
    alignSelf: 'flex-start',
  },
  disabled: {
    opacity: 0.7,
  },
  centerText: {
    textAlign: 'center',
  },
});
