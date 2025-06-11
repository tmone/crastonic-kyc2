// Direct entry point that completely bypasses Expo development client
import { AppRegistry, Platform } from 'react-native';
import { ExpoRoot } from 'expo-router';
import React from 'react';

// Custom Root component that directly loads the app router
function DirectAppRoot() {
  // Load directly from app context
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

// Force register with the module name expected by AppDelegate.swift
AppRegistry.registerComponent('main', () => DirectAppRoot);

// Log startup for debugging
console.log(`Starting direct app entry without Expo client on ${Platform.OS}`);