import React from 'react';
import { View, StyleSheet } from 'react-native';
import {colorTokens, spacing} from '../config';

export interface DividerProps {
  color?: string;
  vertical?: boolean;
  thickness?: number;
  margin?: keyof typeof spacing;
}

/**
 * Thin horizontal or vertical separator with token-based spacing.
 */
export const Divider: React.FC<DividerProps> = ({
  color = colorTokens.secondary_accent,
  vertical = false,
  thickness = 1,
  margin = 0,
}) => {
  const baseStyle = vertical ? styles.vertical : styles.horizontal;
  const marginVertical = vertical ? 0 : spacing[margin];
  const marginHorizontal = vertical ? spacing[margin] : 0;
  const dimension = vertical ? { width: thickness } : { height: thickness };

  return (
    <View
      style={[
        baseStyle,
        dimension,
        { backgroundColor: color, marginVertical, marginHorizontal },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
  },
});
