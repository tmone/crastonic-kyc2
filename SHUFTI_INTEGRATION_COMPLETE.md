# ShuftiPro Integration Complete Guide

This document provides a comprehensive guide for integrating ShuftiPro KYC verification in a React Native application for both iOS and Android platforms.

## Current Implementation Status

### iOS Platform
- ✅ **Native SDK Integration**: The ShuftiPro SDK is properly integrated into the iOS app
- ✅ **Permissions Configuration**: Camera, Photo Library, Location, Face ID, and other required permissions are configured
- ✅ **CocoaPods Integration**: The SDK is correctly linked via CocoaPods
- ✅ **Theme Support**: Dark and light mode themes are supported with appropriate styling
- ✅ **Crash Prevention**: Fixed Swift optional unwrapping and memory management
- ✅ **Platform-Specific Config**: Using numeric values (1/0) instead of booleans for iOS SDK

### Android Platform
- ✅ **Custom Native Module**: Created a custom implementation to avoid crashes with data binding
- ✅ **Activity Lifecycle Management**: Proper handling of activity results and lifecycle events
- ✅ **Permissions Configuration**: Camera and storage permissions are properly requested at runtime
- ✅ **WebView Fallback**: Automatic fallback to WebView when SDK fails
- ✅ **Robust Error Handling**: Timeouts and safety mechanisms to prevent app crashes

## Integration Strategy

Our integration strategy consists of three layers:

1. **Core SDK Wrapper** (`ShuftiProSDK.tsx`):
   - Platform-agnostic interface for the ShuftiPro SDK
   - Handles configuration, theming, and localization
   - Provides direct access to the native SDK

2. **Safe SDK Wrapper** (`ShuftiProSafeSDK.tsx`):
   - Provides a safe interface that prevents crashes
   - Handles platform-specific differences
   - Automatically falls back to WebView when necessary

3. **WebView Fallback** (`ShuftiProWebView.tsx`):
   - Used when the native SDK is unavailable or fails
   - Works with journey URLs for web-based verification
   - Provides a consistent user experience

## Authentication Options

The application supports three authentication methods:

1. **Client Credentials (Basic Auth)**:
   ```javascript
   const authObject = {
     auth_type: "basic_auth",
     client_id: "YOUR_CLIENT_ID",
     secret_key: "YOUR_SECRET_KEY"
   };
   ```

2. **Access Token**:
   ```javascript
   const authObject = {
     auth_type: "access_token",
     access_token: "YOUR_ACCESS_TOKEN"
   };
   ```

3. **Journey URL** (WebView only):
   - Uses a URL like `https://app.shuftipro.com/verification/process/[TOKEN]`
   - Only works with the WebView approach, not the native SDK

## Platform-Specific Implementation Details

### iOS Implementation

1. **SDK Integration**:
   - The ShuftiPro SDK is integrated via CocoaPods
   - `ShuftiPro-Onsite` pod is used at version 1.3.14
   - The native module is exposed through `NativeModules.ShuftiproReactNativeModule`

2. **Required Permissions**:
   - Camera (`NSCameraUsageDescription`)
   - Photo Library (`NSPhotoLibraryUsageDescription`)
   - Microphone (`NSMicrophoneUsageDescription`)
   - Face ID (`NSFaceIDUsageDescription`)
   - Location (`NSLocationWhenInUseUsageDescription`)
   - NFC (`NFCReaderUsageDescription`)

3. **Theme Integration**:
   - The SDK supports dark/light mode via configuration
   - Custom colors are applied for iOS-specific UI elements

### Android Implementation

1. **Custom Native Module**:
   - Created `ShuftiProModule.java` to handle native SDK integration
   - Uses Intent-based approach instead of direct binding
   - Implements `ActivityEventListener` for proper result handling

2. **Package Registration**:
   - Created `ShuftiProPackage.java` to register the module
   - Added to `MainApplication.kt` for initialization

3. **Runtime Permissions**:
   - Camera and storage permissions are requested at runtime
   - Different permission strategy based on Android version (API 33+)

4. **Crash Prevention**:
   - Avoids data binding issues that caused crashes
   - Has proper error handling for all SDK interactions
   - Automatic WebView fallback when SDK fails

## Usage Flow

1. **Initialize SDK**:
   ```typescript
   const { startVerificationWithAuth, isSDKAvailable } = useSafeShuftiProSDK();
   ```

2. **Start Verification**:
   ```typescript
   startVerificationWithAuth((result) => {
     if (result.event === 'verification.accepted') {
       // Handle success
     } else if (result.event === 'error') {
       // Handle error or fallback to WebView
     }
   });
   ```

3. **WebView Fallback** (automatic or manual):
   ```typescript
   <ShuftiProWebView
     visible={showWebView}
     verificationUrl={journeyUrl}
     onSuccess={handleSuccess}
     onError={handleError}
     onClose={handleClose}
   />
   ```

## Common Issues and Solutions

### 1. Authorization Errors

**Issue**: "Authorization keys are invalid/missing" error when using journey URLs with the SDK.

**Solution**: Journey URLs are designed for web use, not the native SDK. Use client credentials or a valid access token instead.

### 5. App Crashing During Verification

**Issue**: App crashes when the SDK is initializing or during verification.

**Solution**:
- We've implemented multiple safety measures to prevent crashes:
  - Platform-specific configuration with proper types
  - Timeouts to handle SDK freezes (15 seconds for SDK, 2 minutes global)
  - Proper cleanup of resources when components unmount
  - Swift optional unwrapping to prevent runtime errors
  - Memory management with proper reference counting

### 2. Android Crashes

**Issue**: App crashes when launching verification on Android.

**Solution**: Our custom implementation avoids the binding issues that cause crashes. Use the `useSafeShuftiProSDK()` hook which safely falls back to WebView on Android.

### 3. iOS Permissions

**Issue**: Verification fails due to missing permissions.

**Solution**: All required permissions are included in Info.plist. Make sure the user grants permissions when prompted.

### 4. Dark Mode Support

**Issue**: SDK UI doesn't match app theme.

**Solution**: We pass the current theme to the SDK in the configuration object:

```typescript
const configObject = {
  dark_mode: actualTheme === 'dark',
  dark_mode_enabled: actualTheme === 'dark', // iOS variant
  // Theme colors
  theme_background_color: actualTheme === 'dark' ? "#111115" : "#FFFFFF",
  // Other theme settings...
};
```

## Testing Recommendations

1. **iOS Testing**:
   - Test on both physical device and simulator
   - Test both dark and light modes
   - Verify camera access works correctly

2. **Android Testing**:
   - Test on multiple Android versions (especially API 29+ and 33+)
   - Verify permission requests work properly
   - Confirm no crashes occur when starting verification

3. **WebView Fallback**:
   - Test by triggering an error in the native SDK
   - Verify the journey URL works in the WebView
   - Check that results are properly communicated back to the app

## Future Improvements

1. **Offline Support**: Add caching for partial verification when offline
2. **Retry Mechanism**: Implement smart retry logic for failed verifications
3. **Analytics Integration**: Track verification success/failure rates
4. **Enhanced Error Reporting**: More detailed error messages and troubleshooting
5. **Journey History**: Allow users to view past verification attempts

## References

- [ShuftiPro API Documentation](https://api.shuftipro.com/doc)
- [ShuftiPro iOS SDK](https://github.com/shuftipro/iOS-SDK)
- [ShuftiPro Android SDK](https://github.com/shuftipro/Android-SDK)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)