import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';

export interface DividerProps {
  color?: string;
  vertical?: boolean;
  thickness?: number;
  margin?: keyof typeof spacing;
}

export const Divider: React.FC<DividerProps> = ({
  color = colors.neutral[200],
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
