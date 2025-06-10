# iOS Setup Guide for Crastonic KYC

## Prerequisites

1. **macOS** - iOS development requires a Mac
2. **Xcode** - Download from Mac App Store (14.0 or higher recommended)
3. **CocoaPods** - Install with: `sudo gem install cocoapods`
4. **Apple Developer Account** - For device testing and deployment

## Setting Up the iOS Project

### 1. Install CocoaPods Dependencies

```bash
cd ios
pod install
cd ..
```

### 2. Running the iOS App

#### Method 1: Using Expo Run Command (Recommended)

```bash
# Run on iOS simulator
npx expo run:ios

# Run on specific simulator
npx expo run:ios --simulator="iPhone 15"

# Run on connected device
npx expo run:ios --device
```

#### Method 2: Using Xcode

1. Open Xcode
2. Open `ios/crastonickyc.xcworkspace` (NOT the .xcodeproj file)
3. Select your target device/simulator
4. Click the Run button (or press Cmd+R)

## ShuftiPro SDK Configuration

The iOS project is pre-configured with:
- ✅ Camera permissions (`NSCameraUsageDescription`)
- ✅ Microphone permissions (`NSMicrophoneUsageDescription`)
- ✅ ShuftiPro SDK dependencies in Podfile (`pod 'shuftipro-onsite-mobilesdk'`)

## Building for Production

### 1. Configure Signing

1. Open `ios/crastonickyc.xcworkspace` in Xcode
2. Select the project in navigator
3. Go to "Signing & Capabilities" tab
4. Select your team and configure bundle identifier

### 2. Build Archive

```bash
# Using command line
npx expo build:ios

# Or using EAS Build
eas build --platform ios
```

### 3. Using Xcode

1. Select "Any iOS Device" as target
2. Product → Archive
3. Follow the wizard to upload to App Store Connect

## Troubleshooting

### Common Issues

#### 1. "No bundle URL present"
```bash
# Clear Metro cache
npx expo start --clear

# Or manually start Metro
npx react-native start
```

#### 2. Build failures
```bash
cd ios
# Clean build
xcodebuild clean
# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData
# Reinstall pods
pod deintegrate && pod install
cd ..
```

#### 3. Simulator issues
```bash
# Reset simulator
xcrun simctl erase all
```

#### 4. ShuftiPro SDK not found
```bash
cd ios
pod update shuftipro-onsite-mobilesdk
cd ..
```

## iOS Specific Configuration

### 1. App Permissions

Already configured in `Info.plist`:
- Camera access for document scanning
- Microphone access for video verification

### 2. Supported Devices

- iOS 12.0 or higher
- iPhone and iPad support
- Portrait orientation (configured)

### 3. Dark Mode

The app automatically supports iOS dark mode:
- System appearance changes are detected
- ShuftiPro SDK adapts to dark/light mode

### 4. Language Support

The app uses the device's language settings and supports:
- 15 languages including JA, EN, VI, ZH
- ShuftiPro SDK localizes based on app language

## Testing on Physical Device

### 1. Free Apple ID Method

1. Add your Apple ID in Xcode → Preferences → Accounts
2. Select your personal team in Signing
3. Connect iPhone via USB
4. Trust the developer certificate on device:
   Settings → General → Device Management → Developer App → Trust

### 2. Developer Account Method

1. Configure provisioning profile
2. Register device UDID
3. Build and run directly

## Performance Tips

1. **Enable Release Mode for Testing**
   ```bash
   npx expo run:ios --configuration Release
   ```

2. **Optimize Images**
   - Use proper image sizes for different resolutions
   - Enable image caching

3. **Memory Management**
   - ShuftiPro SDK handles camera memory efficiently
   - Monitor memory usage in Xcode

## Deployment Checklist

- [ ] Update version number in `Info.plist`
- [ ] Configure app icons in `Images.xcassets`
- [ ] Set up proper signing certificates
- [ ] Test on multiple iOS versions
- [ ] Submit privacy policy URL
- [ ] Configure App Store metadata
- [ ] Test ShuftiPro SDK on real device

## Important Notes

1. **WebView Fallback**: Works on iOS if SDK fails
2. **Camera Permissions**: Required for KYC verification
3. **Network Security**: HTTPS enforced by default
4. **Bundle Size**: ShuftiPro SDK adds ~15MB to app size

## Support

- Apple Developer Forums: https://developer.apple.com/forums/
- Expo iOS Guide: https://docs.expo.dev/build/ios/
- ShuftiPro Support: support@shuftipro.com