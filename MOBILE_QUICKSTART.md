# Mobile Development Quick Start

## 🚀 Quick Commands

### Android
```bash
# Run on Android
npx expo run:android

# Build APK
cd android && ./gradlew assembleRelease

# Clean build
cd android && ./gradlew clean
```

### iOS (macOS only)
```bash
# Setup iOS (first time)
./scripts/setup-ios.sh

# Run on iOS
npx expo run:ios

# Run on specific simulator
npx expo run:ios --simulator="iPhone 15"

# Build for device
npx expo run:ios --device
```

## 📱 Platform Status

### Android ✅
- **Native project**: Generated and configured
- **ShuftiPro SDK**: Working with credentials
- **Permissions**: Camera, Internet configured
- **Dark mode**: Fully supported
- **Languages**: All 15 languages working

### iOS ✅ 
- **Native project**: Generated and configured
- **ShuftiPro SDK**: Ready (requires pod install on Mac)
- **Permissions**: Camera, Microphone configured
- **Dark mode**: Fully supported
- **Languages**: All 15 languages working

## 🔑 ShuftiPro Configuration

Your credentials are configured in:
`/services/shuftiProAuth.ts`

```typescript
clientId: '21178caf22354d71b7e9f32ca8bfcd07d1d4846298af39366977ef9b595ff890'
secretKey: 'PW2VftETSNAtLrwdjomnWJyfjpzLGvTl'
```

## 🎨 Features Working

- ✅ Native ShuftiPro SDK integration
- ✅ WebView fallback
- ✅ Dark mode synchronization
- ✅ Multi-language support (15 languages)
- ✅ Face + Document verification
- ✅ Custom UI themes

## 🐛 Troubleshooting

### "SDK not available" error
- You're in Expo Go - use `npx expo run:android` or `npx expo run:ios`

### Android build fails
- Check Android SDK path in `android/local.properties`
- Run `cd android && ./gradlew clean`

### iOS build fails (Mac only)
- Run `cd ios && pod install`
- Check Xcode version (14+ required)

## 📞 Testing KYC Flow

1. Open app
2. Go to KYC tab
3. Click "Start Verification"
4. Complete face + document scan
5. View results

## 🌐 Supported Languages

- 🇯🇵 Japanese (JA)
- 🇺🇸 English (EN)
- 🇻🇳 Vietnamese (VI)
- 🇨🇳 Chinese (ZH)
- 🇰🇷 Korean (KO)
- 🇹🇭 Thai (TH)
- 🇮🇩 Indonesian (ID)
- 🇲🇾 Malay (MS)
- 🇵🇭 Filipino (FIL)
- 🇮🇳 Hindi (HI)
- 🇧🇩 Bengali (BN)
- 🇵🇰 Urdu (UR)
- 🇮🇳 Tamil (TA)
- 🇮🇳 Telugu (TE)
- 🇲🇲 Burmese (MY)

## 📦 Build for Production

### Android
```bash
# AAB for Play Store
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/
```

### iOS
```bash
# Using EAS Build
eas build --platform ios

# Or in Xcode:
# 1. Open ios/crastonickyc.xcworkspace
# 2. Product > Archive
```

## 🔗 Important Links

- [Android Setup Guide](./ANDROID_SETUP.md)
- [iOS Setup Guide](./IOS_SETUP.md)
- [ShuftiPro Integration](./SHUFTIPRO_INTEGRATION.md)
- [ShuftiPro Docs](https://developers.shuftipro.com/)