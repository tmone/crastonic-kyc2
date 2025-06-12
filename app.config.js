// Custom Expo config that takes precedence over app.json
module.exports = {
  name: "crastonic-kyc",
  slug: "crastonic-kyc",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "crastonickyc",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  // Force production build mode to disable Expo Go
  jsEngine: "hermes",
  developmentClient: false,
  runtimeVersion: "1.0.0",

  // Disable expo client
  updates: {
    enabled: false,
    checkAutomatically: "ON_ERROR_RECOVERY",
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.thinhcrastonic.crastonic-kyc",
    buildConfiguration: {
      developmentClient: false,
      distribution: "internal"
    },
    infoPlist: {
      // Disable Expo client/development menu
      EXDisableDevMenu: true,
      EXNoDevClient: true,

      // Allow network access
      NSAllowsArbitraryLoads: true,

      // Add required permissions
      NSCameraUsageDescription: "This app needs access to camera for identity verification",
      NSMicrophoneUsageDescription: "This app needs access to microphone for video verification",
      NSPhotoLibraryUsageDescription: "This app needs access to your photo library for identity verification",
      NSPhotoLibraryAddUsageDescription: "This app needs access to save photos to your library for identity verification",
      NSLocationWhenInUseUsageDescription: "This app needs access to your location for verification purposes",
      NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs access to your location for verification purposes",
      NSLocationAlwaysUsageDescription: "This app needs access to your location in the background for verification purposes",

      // Background modes for location
      UIBackgroundModes: ["location", "fetch"],
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    permissions: [
      "CAMERA",
      "RECORD_AUDIO",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION"
    ],
    edgeToEdgeEnabled: true,
    package: "com.crastonic.kyc"
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      }
    ],
    "./plugins/withShuftiPro"
  ],
  prebuildCommand: "./scripts/setup-ios.sh",
  experiments: {
    typedRoutes: true
  },
  expo:{
    extra:{
      eas:{
        projectId:"dce18393-27da-409e-b2ff-feecacf3ea39"
      }
    }
  }
};