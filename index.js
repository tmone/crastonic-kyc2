// Direct entry point for both iOS and Android
import { AppRegistry, Platform } from 'react-native';
import { ExpoRoot } from 'expo-router';
import { Platform as ExpoPlatform } from 'expo-modules-core';

// Set expo home directory explicitly to avoid root directory access
if (ExpoPlatform) {
  // Ensure we're using the user's home directory
  process.env.EXPO_HOME_DIR = `${process.env.HOME}/.expo`;
}

// Must be exported or Fast Refresh won't update the context
export function App() {
  // Use the appropriate require context to load the app
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

// Register the app component as 'main' (matching AppDelegate.swift)
AppRegistry.registerComponent('main', () => App);

// Log the app startup to help with debugging
console.log(`App started on ${Platform.OS} with direct entry point`);