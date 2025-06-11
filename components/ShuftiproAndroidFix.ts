import { Platform } from 'react-native';

/**
 * Adds Android-specific fixes to the config object for ShuftiPro SDK
 * to ensure proper activity lifecycle handling
 */
export const addAndroidFixes = (configObject: any): any => {
  if (Platform.OS !== 'android') {
    return configObject;
  }
  
  // Create a deep copy of the configObject
  const newConfig = JSON.parse(JSON.stringify(configObject));
  
  // Add Android-specific settings
  return {
    ...newConfig,
    // Ensure consistent values for Android
    async: false,
    captureEnabled: true,
    
    // Fix theme-related issues
    font_size: "16",
    heading_font_size: "20",
    button_corner_radius: "8",
    
    // Ensure proper activity lifecycle management
    auto_capture_enabled: true,  // Helps prevent activity restart issues
    camera_screen_manual_capture_timeout: 60, // 60 seconds timeout
    
    // Set a reasonable countdown timer
    countdown_timer: 15, // 15 seconds is reasonable
    
    // Enable automatic face detection
    face_detection_enabled: true,
    face_detection_time: 5, // 5 second detection time
    
    // Additional safety params
    webview_supported: true, // Support webview fallback
    vibrate_on_capture: true, // Provide feedback on capture
    play_capture_sound: false, // Don't play capture sound (can cause issues on some devices)
  };
};

/**
 * Enhances error handling for ShuftiPro SDK on Android
 */
export const handleAndroidErrors = (error: any): string => {
  // Error types specific to Android
  if (error instanceof Error) {
    const message = error.message || '';
    
    if (message.includes('Activity')) {
      return 'ShuftiPro SDK activity could not be started. Please try again.';
    }
    
    if (message.includes('binding') || message.includes('NullPointerException')) {
      return 'ShuftiPro SDK encountered an internal error. Please try again or use WebView mode.';
    }
    
    if (message.includes('permission')) {
      return 'Required permissions not granted. Please grant camera permissions to continue.';
    }
    
    if (message.includes('Context')) {
      return 'Application context error. Please restart the app and try again.';
    }
    
    return message;
  }
  
  return String(error);
};