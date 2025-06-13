# Crastonic KYC with ShuftiPro Integration

This is a React Native app with Expo that integrates the ShuftiPro SDK for KYC (Know Your Customer) identity verification.

## Features

- **Cross-platform**: Runs on iOS, Android, and Web
- **ShuftiPro Integration**: Native SDK integration for iOS and Android
- **WebView Fallback**: Graceful fallback to WebView if native SDK fails
- **Multi-language Support**: Multiple languages supported for verification UI
- **Dark Mode Support**: Full dark mode support for the verification flow

## Setup Instructions

### Prerequisites

- Node.js 14+
- Yarn or npm
- Xcode (for iOS)
- Android Studio (for Android)

### iOS Setup

1. Install iOS dependencies:
   ```bash
   ./scripts/setup-ios-shufti.sh
   ```

2. Run the iOS app:
   ```bash
   npx expo run:ios
   ```

3. Follow the testing instructions in [IOS_SHUFTI_INTEGRATION.md](./IOS_SHUFTI_INTEGRATION.md)

### Android Setup

1. Install Android dependencies:
   ```bash
   ./scripts/setup-android-sdk.js
   ```

2. Run the Android app:
   ```bash
   npx expo run:android
   ```

### Web Setup

Web previews will be started and managed automatically. Use the toolbar to manually refresh.

## ShuftiPro Integration

This app integrates with ShuftiPro's KYC service for identity verification:

- **Native SDK**: Uses the ShuftiPro native SDK for iOS and Android
- **Multiple Document Types**: Supports passport, ID card, and driver's license verification
- **Face Verification**: Includes facial recognition matching
- **Document Capture**: Camera-based document capture and verification

For details on the ShuftiPro integration, see:
- [SHUFTIPRO_INTEGRATION.md](./SHUFTIPRO_INTEGRATION.md)
- [IOS_SHUFTI_INTEGRATION.md](./IOS_SHUFTI_INTEGRATION.md)

## Project Structure

- **app/**: Main application code with file-based routing
- **components/**: Reusable UI components
- **services/**: API services and business logic
- **contexts/**: React context providers
- **hooks/**: Custom React hooks
- **assets/**: Images, fonts, and other static assets

## Development

You can start developing by editing the files inside the **app** directory. 

**Important:** This project uses a custom navigation setup (not expo-router) to avoid deep linking issues in standalone builds. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for details.

## Troubleshooting

If you encounter app startup issues on real devices, especially with standalone builds, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common problems and solutions.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
- [ShuftiPro documentation](https://shuftipro.com/documentation/): ShuftiPro API and SDK documentation
