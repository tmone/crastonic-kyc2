import React, { useState, useEffect } from 'react';
import { Platform, Alert, View, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { ShuftiProSDKIntegration } from './ShuftiProSDKIntegration';
import { ShuftiProWebView } from './ShuftiProWebView';
import { LoadingIndicator } from './LoadingIndicator';

interface ShuftiProSafeSDKProps {
  onComplete: (result: any) => void;
  onCancel: () => void;
  onError: (error: any) => void;
  verificationUrl?: string;
}

/**
 * A safe wrapper for ShuftiPro SDK with permission pre-checking and WebView fallback
 * This component is designed for real device testing to avoid crashes
 */
export function ShuftiProSafeSDK({
  onComplete,
  onCancel,
  onError,
  verificationUrl = 'https://app.shuftipro.com/verification/process/4mjladGERNsawA4sEMzAF26OlLu94Cm4uXRCDrtMynHhMDTMClD7caaEmoc7fKI6'
}: ShuftiProSafeSDKProps) {
  const [status, setStatus] = useState<'initial' | 'checking_permissions' | 'ready' | 'using_sdk' | 'using_webview'>('initial');
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [storagePermission, setStoragePermission] = useState<boolean | null>(null);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Check required permissions
  const checkPermissions = async () => {
    try {
      setStatus('checking_permissions');

      try {
        // Camera permission - handle case where Camera might not be available
        if (Camera && Camera.requestCameraPermissionsAsync) {
          const cameraResult = await Camera.requestCameraPermissionsAsync();
          setCameraPermission(cameraResult.status === 'granted');
        } else {
          console.warn('Camera API not available');
          setCameraPermission(false);
        }
      } catch (cameraError) {
        console.warn('Camera permission error:', cameraError);
        setCameraPermission(false);
      }

      try {
        // Storage permission (for saving verification photos)
        if (Platform.OS === 'ios' && ImagePicker && ImagePicker.requestMediaLibraryPermissionsAsync) {
          const mediaLibraryResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
          setStoragePermission(mediaLibraryResult.status === 'granted');
        } else {
          // Android permissions are handled differently or ImagePicker not available
          setStoragePermission(true);
        }
      } catch (storageError) {
        console.warn('Storage permission error:', storageError);
        setStoragePermission(false);
      }

      setStatus('ready');
    } catch (error) {
      console.warn('Error checking permissions:', error);
      // Default to WebView if permission checking fails
      setCameraPermission(false);
      setStoragePermission(false);
      setStatus('ready');
    }
  };

  // Start verification when permissions are ready
  useEffect(() => {
    if (status === 'ready') {
      // Decide whether to use SDK or WebView based on permissions and platform
      const canUseSDK = (cameraPermission === true && storagePermission === true);

      // Always use native SDK for store compliance
      if (canUseSDK) {
        console.log('Using ShuftiPro native SDK for verification');
        setStatus('using_sdk');
      } else {
        console.log('Falling back to WebView due to missing permissions');
        setStatus('using_webview');
      }
    }
  }, [status, cameraPermission, storagePermission]);

  // Handle SDK errors
  const handleSDKError = (error: any) => {
    console.error('SDK Error:', error);

    // Retry the native SDK or notify user of error
    Alert.alert(
      'Verification Error',
      'There was an issue with the verification process. Would you like to try again?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => onError(error)
        },
        {
          text: 'Try Again',
          onPress: () => {
            // Reset status to ready to trigger SDK again
            setStatus('ready');
          }
        }
      ]
    );
  };

  // Render based on current status
  switch (status) {
    case 'initial':
    case 'checking_permissions':
      return (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size={40} color="#0a7ea4" text="Preparing verification..." />
        </View>
      );

    case 'using_sdk':
      return (
        <ShuftiProSDKIntegration
          onComplete={onComplete}
          onCancel={onCancel}
          onError={handleSDKError}
        />
      );

    // We'll use the native SDK instead of WebView for store compliance
    case 'using_webview':
      console.log('Forcing native SDK instead of WebView for store compliance');
      // Use useEffect to change state safely after render
      React.useEffect(() => {
        // Short timeout to prevent immediate state change
        const timer = setTimeout(() => {
          setStatus('using_sdk');
        }, 100);
        return () => clearTimeout(timer);
      }, []);
      // Show loading while transitioning to SDK
      return (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size={40} color="#0a7ea4" text="Preparing verification..." />
        </View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

/**
 * Legacy hook interface for backward compatibility
 */
export function useSafeShuftiProSDK() {
  const safeStartVerificationWithAuth = async (onResult: any) => {
    console.log('Using direct SDK integration for store compliance');

    try {
      // Import the SDK directly
      const ShuftiproReactNativeModule = require('shuftipro-onsite-mobilesdk').default;

      if (ShuftiproReactNativeModule) {
        // Create a basic SDK configuration
        const reference = `REF-${Date.now()}`;

        // Simplified verification object for stability
        const verificationObject = {
          reference,
          country: "",
          verification_mode: "image_only", // Force image mode only, no video
          show_privacy_policy: 1,
          show_consent: 1,
          show_results: 1,
          show_feedback_form: 0,
          open_webview: 0,
          face: { proof: "" },
          document: {
            supported_types: ["passport", "id_card", "driving_license"],
            name: { first_name: "", last_name: "" },
            backside_proof_required: 1,
            allow_offline: 0,
            show_3d_motion: 0,
            show_instruction_screens: 0
          }
        };

        // Auth object with hardcoded credentials
        const authObject = {
          auth_type: "basic_auth",
          client_id: "21178caf22354d71b7e9f32ca8bfcd07d1d4846298af39366977ef9b595ff890",
          secret_key: "PW2VftETSNAtLrwdjomnWJyfjpzLGvTl"
        };

        // Stability-focused configuration
        const configObject = Platform.OS === 'ios' ? {
          async: false,
          captureEnabled: true,
          dark_mode: 0,
          show_consent: 1,
          show_privacy_policy: 1,
          show_results: 1,
          open_webview: 0,
          disable_video_mode: 1,
          disable_document_instruction: 1,
          disable_face_instruction: 1,
          disable_helper_text: 1,
          disable_frame_corner_animation: 1,
          disable_blinking_detection: 1,
          play_capture_sound: 0,
          vibrate_on_capture: 0
        } : {
          async: false,
          captureEnabled: true,
          dark_mode: false,
          show_consent_screen: true,
          show_privacy_policy: true,
          show_results_screen: true,
          show_header: true,
          open_webview: false,
          disable_video_mode: true,
          disable_document_instruction: true,
          disable_face_instruction: true,
          disable_helper_text: true,
          disable_frame_corner_animation: true,
          disable_blinking_detection: true,
          play_capture_sound: false,
          vibrate_on_capture: false
        };

        // Call the SDK directly
        ShuftiproReactNativeModule.verify(
          JSON.stringify(verificationObject),
          JSON.stringify(authObject),
          JSON.stringify(configObject),
          onResult
        );
      } else {
        throw new Error('SDK not found');
      }
    } catch (error) {
      console.error('Error in SDK direct call:', error);
      onResult({
        event: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  return {
    startVerificationWithAuth: safeStartVerificationWithAuth,
    isSDKAvailable: true
  };
}