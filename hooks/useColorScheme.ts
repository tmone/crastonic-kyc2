import { useTheme } from '@/contexts/ThemeContext';

export function useColorScheme() {
  try {
    const { actualTheme } = useTheme();
    return actualTheme;
  } catch {
    // Fallback for when ThemeContext is not available
    return 'light';
  }
}
