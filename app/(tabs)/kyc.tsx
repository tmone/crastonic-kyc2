import { Image } from 'expo-image';
import { StyleSheet, Dimensions, View, TouchableOpacity, Platform, Alert, Modal, PermissionsAndroid } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ShuftiProSDKIntegration } from '@/components/ShuftiProSDKIntegration';
import { ShuftiProSafeSDK } from '@/components/ShuftiProSafeSDK';
import { ShuftiProWebView } from '@/components/ShuftiProWebView';
import { VerificationResult } from '@/services/shuftiProDirectApi';

const { width: deviceWidth } = Dimensions.get('window');

export default function KYCScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'in_progress' | 'completed' | 'failed'>('idle');
  const [verificationUrl] = useState('https://app.shuftipro.com/verification/process/4mjladGERNsawA4sEMzAF26OlLu94Cm4uXRCDrtMynHhMDTMClD7caaEmoc7fKI6');
  const [showWebView, setShowWebView] = useState(false);
  const [showNativeVerification, setShowNativeVerification] = useState(false);

  // Initialize with platform detection and set SDK timeout handler
  useEffect(() => {
    console.log(`Platform detected: ${Platform.OS}`);

    // Set a global error handler for unhandled promises
    const errorHandler = (error: any) => {
      console.warn('Unhandled error in KYC screen:', error);
      if (verificationStatus === 'in_progress') {
        setVerificationStatus('failed');
      }
    };

    // Add event listeners for global errors
    if (Platform.OS === 'web') {
      window.addEventListener('error', errorHandler);
      window.addEventListener('unhandledrejection', errorHandler);
    }

    // Set a safety timeout to reset verification if stuck
    const safetyTimeout = setTimeout(() => {
      if (verificationStatus === 'in_progress' || verificationStatus === 'loading') {
        console.warn('KYC verification took too long - resetting status');
        setVerificationStatus('failed');
        setShowNativeVerification(false);
        setShowWebView(false);
      }
    }, 120000); // 2-minute global timeout as a last resort

    // Cleanup function
    return () => {
      if (Platform.OS === 'web') {
        window.removeEventListener('error', errorHandler);
        window.removeEventListener('unhandledrejection', errorHandler);
      }
      clearTimeout(safetyTimeout);
    };
  }, [verificationStatus]);

  const primaryButtonColor = colorScheme === 'dark' ? '#0a7ea4' : '#0a7ea4'; // Use consistent blue color
  const errorColor = '#FF4444';
  const successColor = '#44BB44';

  const handleVerificationComplete = (result: VerificationResult) => {
    console.log('Verification completed:', result);

    if (result.status === 'verified' || result.event === 'verification.accepted' || result.event === 'verification.approved') {
      setVerificationStatus('completed');
      Alert.alert(
        t('kycCompleted'),
        'Your verification has been completed successfully.',
        [{ text: 'OK' }]
      );
    } else if (result.status === 'declined' || result.event === 'verification.declined') {
      setVerificationStatus('failed');
      Alert.alert(
        'Verification Declined',
        'Your verification was declined. Please try again.',
        [{ text: 'OK' }]
      );
    } else if (result.status === 'error' || result.event === 'error') {
      setVerificationStatus('failed');
      Alert.alert(
        'Error',
        'An error occurred during verification. Please try again.',
        [{ text: 'OK' }]
      );
    }

    setShowNativeVerification(false);
  };

  const handleVerificationCancel = () => {
    setShowNativeVerification(false);
    setVerificationStatus('idle');
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions differently
    }

    try {
      // Request camera permission
      const cameraPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "We need camera access for verification",
          buttonPositive: "OK"
        }
      );

      // Request storage permission based on Android version
      let storagePermission;
      if (Platform.Version >= 33) {
        storagePermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: "Media Permission",
            message: "We need access to your photos for verification",
            buttonPositive: "OK"
          }
        );
      } else {
        storagePermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "We need access to your storage for verification",
            buttonPositive: "OK"
          }
        );
      }

      return (
        cameraPermission === PermissionsAndroid.RESULTS.GRANTED &&
        (storagePermission === PermissionsAndroid.RESULTS.GRANTED ||
         storagePermission === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)
      );
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

  const startVerification = async () => {
    setVerificationStatus('loading');

    // Request permissions if needed
    if (Platform.OS === 'android') {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permissions Required',
          'Camera and storage permissions are required for identity verification.',
          [{ text: 'OK' }]
        );
        setVerificationStatus('idle');
        return;
      }
    }

    // Small delay to show loading animation
    setTimeout(() => {
      setVerificationStatus('in_progress');

      // Always use native SDK for verification
      setShowNativeVerification(true);
    }, 1000);
  };

  const handleWebViewClose = () => {
    setShowWebView(false);
    if (verificationStatus === 'in_progress') {
      setVerificationStatus('idle');
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'idle':
        return t('kycStartMessage');
      case 'loading':
        return t('kycLoading');
      case 'in_progress':
        return t('kycInProgress');
      case 'completed':
        return t('kycCompleted');
      case 'failed':
        return t('kycFailed');
      default:
        return '';
    }
  };

  const getButtonText = () => {
    switch (verificationStatus) {
      case 'idle':
      case 'failed':
        return t('kycStartButton');
      case 'loading':
        return t('kycLoading');
      case 'in_progress':
        return t('kycContinue');
      case 'completed':
        return t('kycViewDetails');
      default:
        return t('kycStartButton');
    }
  };

  const getButtonColor = () => {
    switch (verificationStatus) {
      case 'failed':
        return errorColor;
      case 'completed':
        return successColor;
      default:
        return primaryButtonColor;
    }
  };

  // Handle fallback to WebView if needed
  const handleVerificationError = (error: any) => {
    console.error('Verification error:', error);

    // Mark verification as failed
    setVerificationStatus('failed');
    setShowNativeVerification(false);

    // Show error without WebView fallback option
    if (!showWebView) {
      Alert.alert(
        'Verification Error',
        'There was an error with the verification process. Would you like to try again?',
        [
          {
            text: 'No',
            style: 'cancel',
            onPress: () => setVerificationStatus('idle')
          },
          {
            text: 'Try Again',
            onPress: () => {
              // Reset and try again with SDK
              setVerificationStatus('idle');
              setTimeout(() => startVerification(), 500);
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Verification Error',
        'There was an error with the verification process. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
          />
        }>
        <ThemedView style={[
          styles.container,
          colorScheme === 'dark' && { backgroundColor: 'transparent' },
          Platform.OS === 'ios' && { paddingTop: 10 } // iOS-specific padding
        ]}>
          <ThemedText type="title" style={Platform.OS === 'ios' ? styles.iosTitle : {}}>{t('kycTitle')}</ThemedText>

          <ThemedView style={[
            styles.contentContainer,
            colorScheme === 'dark' && { backgroundColor: 'transparent' },
            Platform.OS === 'ios' && styles.iosContentContainer
          ]}>
            <ThemedText style={[styles.description, Platform.OS === 'ios' && styles.iosText]}>
              {t('kycDescription')}
            </ThemedText>

            <ThemedView style={[
              styles.statusContainer,
              colorScheme === 'dark' && { backgroundColor: 'transparent' },
              Platform.OS === 'ios' && styles.iosStatusContainer
            ]}>
              <ThemedText style={[styles.statusText, Platform.OS === 'ios' && styles.iosText]}>
                {getStatusMessage()}
              </ThemedText>
            </ThemedView>

            <TouchableOpacity
              style={[
                styles.verifyButton,
                { backgroundColor: getButtonColor() },
                Platform.OS === 'ios' && styles.iosButton,
                (verificationStatus === 'loading') && { opacity: 0.7 }
              ]}
              onPress={startVerification}
              disabled={verificationStatus === 'loading'}
            >
              {verificationStatus === 'loading' ? (
                <LoadingIndicator color="#FFFFFF" size={24} />
              ) : (
                <ThemedText style={styles.verifyButtonText}>
                  {getButtonText()}
                </ThemedText>
              )}
            </TouchableOpacity>


            <ThemedView style={[
              styles.infoContainer,
              colorScheme === 'dark' && { backgroundColor: 'transparent' },
              Platform.OS === 'ios' && styles.iosInfoContainer
            ]}>
              <ThemedText style={[styles.infoTitle, Platform.OS === 'ios' && styles.iosTitle]}>
                {t('kycRequirements')}
              </ThemedText>
              <ThemedText style={[styles.infoText, Platform.OS === 'ios' && styles.iosText]}>• {t('kycRequirement1')}</ThemedText>
              <ThemedText style={[styles.infoText, Platform.OS === 'ios' && styles.iosText]}>• {t('kycRequirement2')}</ThemedText>
              <ThemedText style={[styles.infoText, Platform.OS === 'ios' && styles.iosText]}>• {t('kycRequirement3')}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ParallaxScrollView>

      {/* Native Verification Modal */}
      <Modal
        visible={showNativeVerification}
        animationType="slide"
        transparent={false}
        onRequestClose={handleVerificationCancel}
      >
        <ShuftiProSafeSDK
          onComplete={handleVerificationComplete}
          onCancel={handleVerificationCancel}
          onError={handleVerificationError}
          verificationUrl={verificationUrl}
        />
      </Modal>

      {/* WebView Fallback (only used if native verification fails) */}
      <ShuftiProWebView
        visible={showWebView}
        onClose={handleWebViewClose}
        onSuccess={(data) => handleVerificationComplete({
          status: 'verified',
          event: 'verification.accepted',
          verification_result: data
        })}
        onError={(error) => handleVerificationComplete({
          status: 'error',
          error,
          event: 'error'
        })}
        verificationUrl={verificationUrl}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  contentContainer: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 16,
    lineHeight: 24,
  },
  statusContainer: {
    marginBottom: 30,
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  statusText: {
    textAlign: 'center',
    fontSize: 14,
  },
  verifyButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 40,
    minWidth: 200,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  reactLogo: {
    width: deviceWidth,
    height: 150,
    contentFit: 'cover' as const,
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  warningContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#ff9500',
  },
  // iOS specific styles
  iosContentContainer: {
    paddingHorizontal: 16, // iOS typically has less padding
  },
  iosStatusContainer: {
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(170, 170, 170, 0.1)', // Subtle background for iOS
  },
  iosButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    marginBottom: 30,
  },
  iosInfoContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(170, 170, 170, 0.1)', // Subtle background for iOS
  },
  iosWarningContainer: {
    borderRadius: 8,
    backgroundColor: 'rgba(255, 165, 0, 0.08)', // More subtle on iOS
  },
  iosTitle: {
    fontWeight: '600', // iOS uses different font weights
    letterSpacing: -0.5, // iOS typography typically has tighter letter spacing
  },
  iosText: {
    letterSpacing: -0.3,
    lineHeight: 22, // iOS typically has slightly different line heights
  },
});