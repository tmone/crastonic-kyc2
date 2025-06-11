import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

interface LoadingIndicatorProps {
  size?: number;
  color?: string;
  text?: string;
  textColor?: string;
}

export function LoadingIndicator({ 
  size = 50, 
  color, 
  text,
  textColor
}: LoadingIndicatorProps) {
  const colorScheme = useColorScheme();
  const defaultColor = useThemeColor({ light: '#0a7ea4', dark: '#0a7ea4' }, 'text');
  const indicatorColor = color || defaultColor;
  const textColorValue = textColor || defaultColor;

  // Animation values
  const rotation = new Animated.Value(0);
  const pulsate = new Animated.Value(0.8);

  // Start animations
  useEffect(() => {
    // Rotation animation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulsate animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulsate, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulsate, {
          toValue: 0.8,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Interpolate rotation
  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderColor: indicatorColor,
            borderWidth: size / 10,
            borderRadius: size / 2,
            transform: [
              { rotate: spin },
              { scale: pulsate }
            ],
          },
        ]}
      />
      {text && (
        <Text style={[
          styles.text,
          { color: textColorValue, marginTop: size / 2 }
        ]}>
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderStyle: 'solid',
    borderRightColor: 'transparent',
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
  },
});