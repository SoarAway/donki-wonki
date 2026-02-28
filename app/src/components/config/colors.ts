export const colorTokens = {
  primary_accent: '#2B308B',
  secondary_accent: '#5A81FA',
  background_default: '#FAFCFD',
  surface_muted: '#F0F1F6',
  surface_soft: '#F2F4FF',
  error_background: '#FFCECF8A',
  error_background_soft: '#FFF5F5',
  error_main: '#FF0000',
  error_text: '#CC2222',
  text_primary: '#000000',
  text_primary_soft: '#0D0D0D',
  text_dark: '#111111',
  text_secondary: '#333333',
  text_muted: '#555555',
  text_subtle: '#AAAAAA',
  text_strong: '#222222',
  white: '#FFFFFF',
  border_subtle: '#D8DAE8',
  link: '#2B5FC1',
} as const;

export type ColorTokenName = keyof typeof colorTokens;
