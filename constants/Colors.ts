/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Homepage specific colors
    primary: '#4A90E2',
    secondary: '#7B68EE',
    success: '#27AE60',
    warning: '#F39C12',
    danger: '#E74C3C',
    dark: '#1a1a2e',
    darkSecondary: '#16213e',
    gray1: '#333333',
    gray2: '#666666',
    gray3: '#999999',
    gray4: '#E5E5E5',
    gray5: '#F8F9FA',
    white: '#FFFFFF',
    gradientStart: '#4A90E2',
    gradientEnd: '#7B68EE',
    darkGradientStart: '#1a1a2e',
    darkGradientEnd: '#0f0f1e',
    cardBackground: '#FFFFFF',
    headerBackground: '#FFFFFF',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Homepage specific colors for dark mode
    primary: '#5AA3F0',
    secondary: '#8A76F1',
    success: '#2ECC71',
    warning: '#F39C12',
    danger: '#E74C3C',
    dark: '#121212',
    darkSecondary: '#1E1E1E',
    gray1: '#ECEDEE',
    gray2: '#B0B3B8',
    gray3: '#8A8D90',
    gray4: '#3A3B3C',
    gray5: '#242526',
    white: '#FFFFFF',
    gradientStart: '#5AA3F0',
    gradientEnd: '#8A76F1',
    darkGradientStart: '#121212',
    darkGradientEnd: '#0A0A0A',
    cardBackground: '#242526',
    headerBackground: '#1E1E1E',
  },
};
