/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

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

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
