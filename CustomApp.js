/**
 * Custom entry point for React Native that bypasses Expo Go
 */
import React from 'react';
import { AppRegistry, LogBox, Platform } from 'react-native';
import { Platform as ExpoPlatform } from 'expo-modules-core';

// Set expo home directory explicitly to avoid root directory access (only in development)
if (ExpoPlatform && __DEV__) {
  // Ensure we're using the user's home directory in development only
  if (process.env.HOME) {
    process.env.EXPO_HOME_DIR = `${process.env.HOME}/.expo`;
  }
}

// Ignore specific warnings that might appear during development
LogBox.ignoreLogs([
  'Overwriting fontFamily style attribute preprocessor',
  'ExponentGLView',
  'Failed to get permissions for location',
  'Require cycle'
]);

console.log('Starting custom app entry point on', Platform.OS);

// Custom Tab Navigator without expo-router
function CustomTabNavigator() {
  const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');
  const { NavigationContainer } = require('@react-navigation/native');
  const { useColorScheme } = require('@/hooks/useColorScheme');
  const { useLanguage } = require('@/contexts/LanguageContext');
  const { IconSymbol } = require('@/components/ui/IconSymbol');
  const { Colors } = require('@/constants/Colors');
  
  const HomeScreen = require('./app/(tabs)/index.tsx').default;
  const KYCScreen = require('./app/(tabs)/kyc.tsx').default;
  const SettingsScreen = require('./app/(tabs)/settings.tsx').default;
  
  const Tab = createBottomTabNavigator();
  const colorScheme = useColorScheme();
  const { t } = useLanguage();
  
  return React.createElement(NavigationContainer, null,
    React.createElement(Tab.Navigator, {
      screenOptions: {
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#ffffff',
          height: 88,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }
    },
      React.createElement(Tab.Screen, {
        name: 'Home',
        component: HomeScreen,
        options: {
          title: t('home'),
          tabBarIcon: ({ color }) => React.createElement(IconSymbol, { size: 28, name: 'house.fill', color })
        }
      }),
      React.createElement(Tab.Screen, {
        name: 'KYC',
        component: KYCScreen,
        options: {
          title: t('kyc'),
          tabBarIcon: ({ color }) => React.createElement(IconSymbol, { size: 28, name: 'person.fill.viewfinder', color })
        }
      }),
      React.createElement(Tab.Screen, {
        name: 'Settings',
        component: SettingsScreen,
        options: {
          title: t('settings'),
          tabBarIcon: ({ color }) => React.createElement(IconSymbol, { size: 28, name: 'gearshape.fill', color })
        }
      })
    )
  );
}

// Direct app root component that bypasses Expo client and ExpoRoot
export function App() {
  try {
    const { ThemeProvider } = require('./contexts/ThemeContext');
    const { LanguageProvider } = require('./contexts/LanguageContext');
    const { DarkModeBackground } = require('./components/DarkModeBackground');
    const { SafeAreaProvider } = require('react-native-safe-area-context');
    
    return React.createElement(SafeAreaProvider, null,
      React.createElement(ThemeProvider, null,
        React.createElement(LanguageProvider, null,
          React.createElement(DarkModeBackground, null,
            React.createElement(CustomTabNavigator)
          )
        )
      )
    );
  } catch (error) {
    console.error('Error loading app:', error);
    // Return a simple view to prevent crash
    const { View, Text } = require('react-native');
    return React.createElement(View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' } }, 
      React.createElement(Text, null, 'App loading...')
    );
  }
}

// Register the app with the native module name used in AppDelegate.swift
AppRegistry.registerComponent('main', () => App);

// Log app startup to help with debugging
console.log('App registered with direct entry point');