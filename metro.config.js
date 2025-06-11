// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable the new transformer and resolver
config.transformer.unstable_allowRequireContext = true;

// Ensure the entry point is properly set
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};

// Add support for all file extensions supported by Expo
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'expo.ts',
  'expo.tsx',
  'expo.js',
  'expo.jsx',
  'mjs',
  'cjs',
];

// Include the project root as a watch folder
config.watchFolders = [
  ...(config.watchFolders || []),
  __dirname,
];

module.exports = config;