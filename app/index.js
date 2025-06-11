// Direct iOS entry point
import React from 'react';
import { Redirect } from 'expo-router';

// This is needed to ensure the iOS app redirects to the tabs instead of showing Expo Go
export default function DirectEntry() {
  return <Redirect href="/(tabs)" />;
}