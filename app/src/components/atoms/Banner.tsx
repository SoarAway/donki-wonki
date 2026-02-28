import React from 'react';
import {Animated, StyleSheet, TouchableOpacity, View} from 'react-native';
import {colorTokens, radius, spacing} from '../config';
import {Text} from './Text';

export interface BannerProps {
  visible: boolean;
  title?: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  onDismiss?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

/**
 * Top-of-screen notification banner with slide animation and optional auto-dismiss.
 */
export const Banner: React.FC<BannerProps> = ({
  visible,
  title,
  message,
  variant = 'info',
  onDismiss,
  autoDismiss = true,
  autoDismissDelay = 5000,
}) => {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoDismiss && onDismiss) {
        const timer = setTimeout(() => {
          if (onDismiss) {
            onDismiss();
          }
        }, autoDismissDelay);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, autoDismiss, autoDismissDelay, onDismiss, slideAnim, opacityAnim]);

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return colorTokens.background_default;
      case 'warning':
        return colorTokens.secondary_accent;
      case 'error':
        return colorTokens.error_background;
      case 'info':
      default:
        return colorTokens.background_default;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'success':
        return colorTokens.primary_accent;
      case 'warning':
        return colorTokens.secondary_accent;
      case 'error':
        return colorTokens.error_main;
      case 'info':
      default:
        return colorTokens.secondary_accent;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
        return colorTokens.primary_accent;
      case 'warning':
        return colorTokens.primary_accent;
      case 'error':
        return colorTokens.error_main;
      case 'info':
      default:
        return colorTokens.primary_accent;
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderLeftColor: getBorderColor(),
          transform: [{translateY: slideAnim}],
          opacity: opacityAnim,
        },
      ]}>
      <TouchableOpacity
        style={styles.content}
        onPress={handleDismiss}
        activeOpacity={0.9}>
        <View style={styles.textContainer}>
          {title && (
            <Text
              variant="base"
              weight="semibold"
              style={{color: getTextColor(), marginBottom: spacing[1]}}>
              {title}
            </Text>
          )}
          <Text variant="sm" style={{color: getTextColor()}}>
            {message}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    borderLeftWidth: 4,
    borderRadius: radius.md,
    marginHorizontal: spacing[4],
    marginTop: spacing[12],
    shadowColor: colorTokens.primary_accent,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  textContainer: {
    flex: 1,
  },
});
