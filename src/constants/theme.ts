import '@/global.css';
import { Platform } from 'react-native';

export const Palette = {
  forestGreen: '#546B41',
  sageGreen: '#99AD7A',
  earthBeige: '#DCCCAC',
  cream: '#FFF8EC',
  white: '#FFFFFF',
  border: '#D9DDCF',
  text: '#111827',
  textSecondary: '#4B5563',
  success: '#4F8A3D',
  warning: '#D89B2B',
  error: '#C94C4C',
  info: '#4A7FA5',
} as const;

export const Colors = {
  // Brand colors
  primary: '#1B5E40',
  primaryDark: '#0C1912',
  primaryLight: '#3A9B6C',
  primarySurface: '#E6F0EB',

  // Layout & Backgrounds
  background: '#F2F6F4',
  card: '#FFFFFF',
  cardBorder: '#CDE0D6',
  cardHover: '#F7FAF8',

  // Text
  text: '#0C1C14',
  textSecondary: '#607A6B',
  textMuted: '#8BA596',
  textWhite: '#FFFFFF',

  // Status colors
  success: '#15803D',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',

  warning: '#B45309',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',

  danger: '#B91C1C',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',

  info: '#1D4ED8',
  infoBg: '#EFF6FF',
  infoBorder: '#BFDBFE',

  // Sidebar
  sidebarBg: '#0C1912',
  sidebarText: '#FFFFFF',
  sidebarTextMuted: 'rgba(255, 255, 255, 0.55)',
  sidebarItemActive: '#1B5E40',
  sidebarBorder: 'rgba(255, 255, 255, 0.08)',

  // Elements
  border: '#CDE0D6',
  inputBg: '#FFFFFF',
  inputBorder: '#CDE0D6',
  badgeBg: '#E6F0EB',

  // Backward compatibility with expo template
  light: {
    primary: Palette.forestGreen,
    secondary: Palette.sageGreen,
    accent: Palette.earthBeige,
    background: Palette.cream,
    surface: Palette.white,
    border: Palette.border,
    text: Palette.text,
    textSecondary: Palette.textSecondary,
    backgroundElement: '#EFE8D8',
    backgroundSelected: '#E2DCB9',
    success: Palette.success,
    warning: Palette.warning,
    error: Palette.error,
    info: Palette.info,
  },
  dark: {
    primary: '#7A9663',
    secondary: '#99AD7A',
    accent: '#DCCCAC',
    background: '#161F12',
    surface: '#222D1D',
    border: '#33422C',
    text: '#F9FAF8',
    textSecondary: '#9CA3AF',
    backgroundElement: '#1F2A19',
    backgroundSelected: '#2C3B24',
    success: Palette.success,
    warning: Palette.warning,
    error: Palette.error,
    info: Palette.info,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  // Named scale
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Backward compatibility numbers
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Fonts = Platform.select({
  web: {
    display: "'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
    serif: 'serif',
    rounded: 'sans-serif',
  },
  default: {
    display: 'System',
    sans: 'System',
    mono: 'monospace',
    serif: 'serif',
    rounded: 'System',
  },
});
