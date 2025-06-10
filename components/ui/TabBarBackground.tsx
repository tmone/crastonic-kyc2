import { View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

// This is a shim for web and Android where the tab bar is generally opaque.
export default function TabBarBackground() {
  const colorScheme = useColorScheme();
  
  return (
    <View 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colorScheme === 'dark' ? 'rgba(17, 17, 21, 0.88)' : 'white',
      }}
    />
  );
}

export function useBottomTabOverflow() {
  return 0;
}
