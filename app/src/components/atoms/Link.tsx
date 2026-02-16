import React from 'react';
import { TouchableOpacity, TextStyle } from 'react-native';
import { Text } from './Text';

export interface LinkProps {
  text: string;
  onPress: () => void;
  color?: string;
  style?: TextStyle;
}

export const Link: React.FC<LinkProps> = ({ text, onPress, color = 'primary.500', style }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Text color={color} weight="medium" decoration="underline" style={style}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};
