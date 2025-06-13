# Troubleshooting Guide

## Deep Linking Issues in Standalone App

### Problem
When running the app on a real device with standalone profile, you may encounter this error:

```
Error: Cannot make a deep link into a standalone app with no custom scheme defined
This error is located at:
    at ContextNavigator (/Users/tmone/Lib..., stack:
resolveScheme@79265:23
createURL@79083:52
getRootURL@80746:34
getInitialURL@80735:16
getInitialURL@80141:66
useStore@79494:47
ContextNavigator@84740:44
```

The app gets stuck at the splash screen and crashes.

### Root Cause
This issue occurs because:
1. **ExpoRoot** (from expo-router) automatically tries to initialize deep linking
2. In standalone apps, it cannot resolve the custom scheme properly
3. The linking system fails before the app can fully load

### Solution Applied

#### 1. Bypassed ExpoRoot in CustomApp.js
**File:** `/CustomApp.js`

Instead of using ExpoRoot which causes linking issues:
```javascript
// OLD - Problematic approach
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}
```

We implemented direct navigation:
```javascript
// NEW - Working approach
export function App() {
  try {
    // Import components directly
    const { ThemeProvider } = require('./contexts/ThemeContext');
    const { LanguageProvider } = require('./contexts/LanguageContext');
    const { DarkModeBackground } = require('./components/DarkModeBackground');
    const { SafeAreaProvider } = require('react-native-safe-area-context');
    
    return React.createElement(SafeAreaProvider, null,
      React.createElement(ThemeProvider, null,
        React.createElement(LanguageProvider, null,
          React.createElement(DarkModeBackground, null,
            React.createElement(CustomTabNavigator)
          )
        )
      )
    );
  } catch (error) {
    console.error('Error loading app:', error);
    // Fallback UI
    const { View, Text } = require('react-native');
    return React.createElement(View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' } }, 
      React.createElement(Text, null, 'App loading...')
    );
  }
}
```

#### 2. Created Custom Tab Navigator
**File:** `/CustomApp.js`

Replaced expo-router tabs with React Navigation:
```javascript
function CustomTabNavigator() {
  const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');
  const { NavigationContainer } = require('@react-navigation/native');
  
  // Load screens directly
  const HomeScreen = require('./app/(tabs)/index.tsx').default;
  const KYCScreen = require('./app/(tabs)/kyc.tsx').default;
  const SettingsScreen = require('./app/(tabs)/settings.tsx').default;
  
  const Tab = createBottomTabNavigator();
  
  return React.createElement(NavigationContainer, null,
    React.createElement(Tab.Navigator, { /* navigation config */ },
      // Tab screens...
    )
  );
}
```

#### 3. Fixed Theme and Layout Issues
**Files:** `/components/ParallaxScrollView.tsx`, `/components/ThemedText.tsx`, `/app/(tabs)/settings.tsx`, `/app/(tabs)/kyc.tsx`

- Removed hardcoded color overrides that caused dark mode visibility issues
- Used ThemedView consistently for proper background handling
- Fixed text colors to use theme configuration

### Configuration Files (Already Correct)

#### app.json
```json
{
  "expo": {
    "scheme": "crastonickyc",
    // ... other config
  }
}
```

#### iOS Info.plist
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>crastonickyc</string>
      <string>com.thinhcrastonic.crastonic-kyc</string>
    </array>
  </dict>
</array>
```

### Prevention Steps

#### When Making Code Changes:
1. **Never use ExpoRoot directly** in standalone builds
2. **Test on real device** after any navigation-related changes
3. **Use React Navigation** instead of expo-router for standalone apps
4. **Avoid hardcoded colors** that break dark mode

#### Before Building:
1. Verify CustomApp.js doesn't import ExpoRoot
2. Check that all theme colors use ThemedView/ThemedText
3. Test app startup on real device with standalone profile

#### If Issue Occurs Again:
1. Check if ExpoRoot was accidentally reintroduced
2. Verify CustomTabNavigator is being used
3. Look for expo-router imports in main app files
4. Check console for linking-related errors

### Key Files to Monitor
- `/CustomApp.js` - Main entry point, should not use ExpoRoot
- `/app/_layout.tsx` - Should not be used in current setup
- `/app/(tabs)/_layout.tsx` - Should not be used in current setup
- Any file importing from `expo-router`

### Build Commands
```bash
# For development testing
npx expo run:ios --device

# For standalone builds
eas build --platform ios --profile standalone
```

### Notes
- This solution trades expo-router's file-based routing for stability in standalone builds
- Deep linking can still be implemented manually if needed
- The app maintains all functionality while avoiding the linking initialization crash
- Dark mode and theming work properly across all screens

### Summary
The core issue was ExpoRoot's automatic deep linking initialization in standalone apps. By bypassing ExpoRoot and using direct React Navigation, we eliminated the crash while maintaining full app functionality.