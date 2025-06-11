/**
 * Custom entry point for React Native that bypasses Expo Go
 */
import React from 'react';
import { AppRegistry, LogBox, Platform } from 'react-native';
import { ExpoRoot } from 'expo-router';
import { Platform as ExpoPlatform } from 'expo-modules-core';

// Set expo home directory explicitly to avoid root directory access
if (ExpoPlatform) {
  // Ensure we're using the user's home directory
  process.env.EXPO_HOME_DIR = `${process.env.HOME}/.expo`;
}

// Ignore specific warnings that might appear during development
LogBox.ignoreLogs([
  'Overwriting fontFamily style attribute preprocessor',
  'ExponentGLView',
  'Failed to get permissions for location',
  'Require cycle'
]);

console.log('Starting custom app entry point on', Platform.OS);

// Direct app root component that bypasses Expo client
export function App() {
  // Direct loading of app context
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

// Register the app with the native module name used in AppDelegate.swift
AppRegistry.registerComponent('main', () => App);

// Log app startup to help with debugging
console.log('App registered with direct entry point');