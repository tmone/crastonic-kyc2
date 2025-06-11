// This file is a direct entrypoint to bypass Expo development client
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import { Platform } from 'expo-modules-core';

// Set expo home directory explicitly to avoid root directory access
if (Platform) {
  // Ensure we're using the user's home directory
  process.env.EXPO_HOME_DIR = `${process.env.HOME}/.expo`;
}

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

// Register the main component
registerRootComponent(App);