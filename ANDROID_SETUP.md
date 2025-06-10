# Android Setup Guide for Crastonic KYC

## Prerequisites

1. **Android Studio** - Download from [https://developer.android.com/studio](https://developer.android.com/studio)
2. **Java 17 or higher** - Required for React Native
3. **Android SDK** - Will be installed with Android Studio

## Running the Android App

### Method 1: Using Expo Run Command (Recommended)

```bash
# Run on Android device/emulator
npx expo run:android

# Run in release mode
npx expo run:android --variant release
```

### Method 2: Using Android Studio

1. Open Android Studio
2. Click "Open an Existing Project"
3. Navigate to `/android` folder in your project
4. Wait for Gradle sync to complete
5. Click the "Run" button or press Shift+F10

### Method 3: Using Gradle directly

```bash
cd android

# Debug build
./gradlew assembleDebug

# Release build
./gradlew assembleRelease

# Install on connected device
./gradlew installDebug
```

## ShuftiPro SDK Configuration

The ShuftiPro SDK has been configured with:
- Camera permissions in AndroidManifest.xml
- Data binding enabled in build.gradle
- JitPack repository for SDK dependencies

## Troubleshooting

### 1. Metro bundler issues
```bash
# Clear cache
npx expo start --clear

# Reset Metro bundler
npx react-native start --reset-cache
```

### 2. Build failures
```bash
# Clean build
cd android
./gradlew clean
cd ..

# Rebuild
npx expo run:android
```

### 3. Permission issues on device
Make sure to grant camera permissions when prompted. You can also manually enable them in:
Settings > Apps > Crastonic KYC > Permissions > Camera

### 4. ShuftiPro SDK not working
The ShuftiPro SDK requires a custom development build. It won't work in Expo Go. Make sure you're running:
```bash
npx expo run:android
```

## Building for Production

### 1. Generate a signed APK
```bash
cd android
./gradlew bundleRelease
```

The AAB file will be in: `android/app/build/outputs/bundle/release/`

### 2. Using EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure your project
eas build:configure

# Build for Android
eas build --platform android
```

## Device Requirements

- Android 6.0 (API level 23) or higher
- Camera access
- Internet connection

## Testing on Physical Device

1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run `adb devices` to verify connection
5. Run `npx expo run:android`

## Additional Notes

- The app is configured for portrait orientation only
- WebView is used as fallback when SDK is not available
- The app supports both light and dark themes
- Multi-language support is included