import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, radius, spacing, typography } from '../config';
import { Box } from './Box';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

/**
 * Form input with optional label and validation error presentation.
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = true,
  style,
  ...props
}) => {
  const borderColor = error ? colors.error.main : colors.neutral[300];

  return (
    <Box width={fullWidth ? '100%' : undefined} marginY={2}>
      {label && (
        <Text variant="sm" weight="medium" color="neutral.700" style={{ marginBottom: spacing[1] }}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          { borderColor },
          style,
        ]}
        placeholderTextColor={colors.neutral[400]}
        {...props}
      />
      {error && (
        <Text variant="xs" color="error.main" style={{ marginTop: spacing[1] }}>
          {error}
        </Text>
      )}
    </Box>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    backgroundColor: colors.neutral[0],
  },
});
