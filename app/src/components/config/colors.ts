export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3', // Main
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  // Secondary / Accent
  secondary: {
    50: '#F3E5F5',
    100: '#E1BEE7',
    200: '#CE93D8',
    300: '#BA68C8',
    400: '#AB47BC',
    500: '#9C27B0', // Main
    600: '#8E24AA',
    700: '#7B1FA2',
    800: '#6A1B9A',
    900: '#4A148C',
  },
  // Neutrals (Text, Backgrounds, Borders)
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  // Semantic States
  success: {
    main: '#4CAF50',
    light: '#E8F5E9',
    dark: '#2E7D32',
    contrast: '#FFFFFF',
  },
  warning: {
    main: '#FF9800',
    light: '#FFF3E0',
    dark: '#EF6C00',
    contrast: '#212121',
  },
  error: {
    main: '#F44336',
    light: '#FFEBEE',
    dark: '#C62828',
    contrast: '#FFFFFF',
  },
  info: {
    main: '#03A9F4',
    light: '#E1F5FE',
    dark: '#0277BD',
    contrast: '#FFFFFF',
  },
  // Global
  background: {
    default: '#F5F5F5',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
    inverse: '#FFFFFF',
  },
} as const;

export type Colors = typeof colors;
export type ColorPath = string; // Simplified for usage, usually requires recursive keyof
