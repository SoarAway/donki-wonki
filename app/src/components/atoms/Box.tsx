import React from 'react';
import { View, ViewStyle, ViewProps } from 'react-native';
import { colors, spacing, radius } from '../config';

export interface BoxProps extends ViewProps {
  padding?: keyof typeof spacing;
  paddingX?: keyof typeof spacing;
  paddingY?: keyof typeof spacing;
  margin?: keyof typeof spacing;
  marginX?: keyof typeof spacing;
  marginY?: keyof typeof spacing;
  backgroundColor?: keyof typeof colors.neutral | string;
  borderRadius?: keyof typeof radius;
  row?: boolean;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: ViewStyle['flexWrap'];
  gap?: number;
  flex?: number;
  width?: number | string;
  height?: number | string;
}

export const Box: React.FC<BoxProps> = ({
  padding,
  paddingX,
  paddingY,
  margin,
  marginX,
  marginY,
  backgroundColor,
  borderRadius,
  row,
  align,
  justify,
  wrap,
  gap,
  flex,
  width,
  height,
  style,
  children,
  ...props
}) => {
  const dynamicStyles: ViewStyle = {
    padding: padding ? spacing[padding] : undefined,
    paddingHorizontal: paddingX ? spacing[paddingX] : undefined,
    paddingVertical: paddingY ? spacing[paddingY] : undefined,
    margin: margin ? spacing[margin] : undefined,
    marginHorizontal: marginX ? spacing[marginX] : undefined,
    marginVertical: marginY ? spacing[marginY] : undefined,
    backgroundColor: backgroundColor
      ? (colors.neutral[backgroundColor as keyof typeof colors.neutral] || backgroundColor)
      : undefined,
    borderRadius: borderRadius ? radius[borderRadius] : undefined,
    flexDirection: row ? 'row' : 'column',
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap,
    gap: gap,
    flex: flex,
    width: width as ViewStyle['width'],
    height: height as ViewStyle['height'],
  };

  return (
    <View style={[dynamicStyles, style]} {...props}>
      {children}
    </View>
  );
};
