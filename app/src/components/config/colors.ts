export const colorTokens = {
  primary_accent: '#2B308B',
  secondary_accent: '#5A81FA',
  background_default: '#FAFCFD',
  error_background: '#FFCECF8A',
  error_main: '#FF0000',
} as const;

export type ColorTokenName = keyof typeof colorTokens;
