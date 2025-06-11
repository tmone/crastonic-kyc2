# ShuftiPro Integration for iOS

This document outlines the steps to install, run, and test the ShuftiPro SDK integration on iOS.

## Installation Steps

1. Install CocoaPods dependencies:
   ```bash
   cd ios
   pod install --repo-update
   ```

2. Build and run the iOS app:
   ```bash
   cd ..
   npx expo run:ios
   ```

## Testing the Integration

### Prerequisites
- Make sure you have valid ShuftiPro credentials configured in your app
- iOS device or simulator with camera support (simulator will have limited functionality)

### Test Procedure

1. **Launch the App**: Start the app on your iOS device or simulator.

2. **Navigate to KYC Screen**: Go to the KYC verification screen.

3. **Start Verification**:
   - Tap the "Start Verification" button
   - The app should request camera access if not already granted
   - The ShuftiPro SDK should launch

4. **Complete Verification Flow**:
   - Follow the on-screen instructions to complete the verification
   - Present documents when prompted
   - Take a selfie when requested

5. **Check Results**:
   - Upon completion, the app should show a success or failure message
   - The verification status should be updated

### Troubleshooting

If you encounter issues with the native SDK integration, the app will automatically offer to switch to WebView mode as a fallback. Common issues include:

#### Camera Permissions Issues
- Make sure your app has the proper permission entries in Info.plist
- Verify that you're granting camera permissions when prompted

#### SDK Initialization Failures
- Check the logs for specific error messages
- Verify that your ShuftiPro credentials are valid
- Ensure the SDK is properly linked

#### WebView Fallback
If the native SDK fails, the WebView fallback should still work to complete the verification process. This provides a seamless experience for users even if there are issues with the native SDK.

## Integration Details

The integration uses the ShuftiPro SDK version 1.3.14 and includes the following components:

1. **Native Module Bridge**: A React Native bridge that communicates with the ShuftiPro SDK

2. **Configuration Parameters**: Platform-specific configurations for iOS theme and UI customization

3. **Permission Handling**: Automatic permission requests through Info.plist declarations

4. **Fallback Mechanism**: WebView fallback for handling failures or unsupported devices

## Logging

To see detailed logs during testing:
1. Connect your iOS device to Xcode
2. Open the Console app
3. Filter logs by your app's process name
4. Look for logs with "ShuftiPro" in the message

## Important Notes

- If testing on a simulator, camera functionality will be limited
- For production use, always test on a physical device
- The integration supports dark mode and light mode theming
- Multiple languages are supported through the ShuftiPro SDK configuration