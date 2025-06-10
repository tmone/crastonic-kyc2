import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width, height } = Dimensions.get('window');

export function DarkModeBackground({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  
  if (colorScheme === 'dark') {
    return (
      <View style={styles.container}>
        <View style={styles.darkBackground}>
          <View style={styles.gradientBlur1} />
          <View style={styles.gradientBlur2} />
          <View style={styles.gradientBlur3} />
        </View>
        <View style={styles.content}>
          {children}
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0a0f',
    overflow: 'hidden',
  },
  gradientBlur1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#5383FF',
    opacity: 0.15,
    top: -width * 0.2,
    right: -width * 0.2,
    transform: [{ scale: 1.5 }],
  },
  gradientBlur2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: '#8B5CF6',
    opacity: 0.1,
    bottom: height * 0.1,
    left: -width * 0.1,
    transform: [{ scale: 1.2 }],
  },
  gradientBlur3: {
    position: 'absolute',
    width: width * 1,
    height: width * 1,
    borderRadius: width * 0.5,
    backgroundColor: '#3B82F6',
    opacity: 0.08,
    top: '40%',
    left: '50%',
    transform: [
      { translateX: -width * 0.5 },
      { translateY: -width * 0.5 }
    ],
  },
  content: {
    flex: 1,
  },
});