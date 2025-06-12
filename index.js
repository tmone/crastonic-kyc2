// Direct entry point for both iOS and Android
import { AppRegistry, Platform } from 'react-native';
import { Platform as ExpoPlatform } from 'expo-modules-core';

// Set expo home directory explicitly to avoid root directory access
if (ExpoPlatform && __DEV__) {
  // Ensure we're using the user's home directory in dev mode only
  if (process.env.HOME) {
    process.env.EXPO_HOME_DIR = `${process.env.HOME}/.expo`;
  }
}

// Development app component
export function App() {
  const { ExpoRoot } = require('expo-router');
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

// Get the right app component based on environment
function getAppComponent() {
  if (__DEV__) {
    return App;
  } else {
    // In standalone mode, use our custom navigation to avoid linking issues
    const StandaloneApp = require('./App.standalone').default;
    return StandaloneApp;
  }
}

// Register the app component as 'main' (matching AppDelegate.swift)
AppRegistry.registerComponent('main', getAppComponent);

// Log the app startup to help with debugging
console.log(`App started on ${Platform.OS} with direct entry point`);