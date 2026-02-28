import React from 'react';
import { ActivityIndicator, ColorValue } from 'react-native';
import {colorTokens} from '../config';

export interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

/**
 * Lightweight activity indicator used in buttons and loading states.
 */
export const Spinner: React.FC<SpinnerProps> = ({size = 'small', color = colorTokens.primary_accent}) => {
  return <ActivityIndicator size={size} color={color as ColorValue} />;
};
