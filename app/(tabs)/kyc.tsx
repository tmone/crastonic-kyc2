import { Image } from 'expo-image';
import { StyleSheet, Dimensions, View, TouchableOpacity, Platform, Alert, Modal, PermissionsAndroid } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ShuftiProStepperSDK } from '@/components/ShuftiProStepperSDK';
import { VerificationResult } from '@/services/shuftiProDirectApi';

const { width: deviceWidth } = Dimensions.get('window');

// Storage keys and version
const STORAGE_KEYS = {
  VERIFIED_EMAIL: 'kycVerifiedEmail',
  VERIFICATION_REFERENCE: 'kycVerificationReference',
  VERIFICATION_STATUS: 'kycVerificationStatus',
  STORAGE_VERSION: 'kycStorageVersion',
};

// Current storage version - increment this if the storage format changes
const CURRENT_STORAGE_VERSION = '1.0';

export default function KYCScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'in_progress' | 'completed' | 'failed'>('idle');
  const [journeyUrl] = useState('fgecdahM1749419683'); // The journey ID for ShuftiPro verification
  const [showVerification, setShowVerification] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [verificationReference, setVerificationReference] = useState<string | null>(null);

  // Load saved verification data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Check storage version first
        const storageVersion = await AsyncStorage.getItem(STORAGE_KEYS.STORAGE_VERSION);

        // If version doesn't match or is missing, we'll clear existing data
        if (storageVersion !== CURRENT_STORAGE_VERSION) {
          console.log(`Storage version mismatch (found: ${storageVersion}, current: ${CURRENT_STORAGE_VERSION}) - resetting data`);
          // We can't call resetVerification here because it's not defined yet,
          // so we'll clear the items directly
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.VERIFIED_EMAIL,
            STORAGE_KEYS.VERIFICATION_REFERENCE,
            STORAGE_KEYS.VERIFICATION_STATUS
          ]);
          await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_VERSION, CURRENT_STORAGE_VERSION);
          return;
        }

        // Load verification data
        const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.VERIFIED_EMAIL);
        const savedReference = await AsyncStorage.getItem(STORAGE_KEYS.VERIFICATION_REFERENCE);
        const savedStatus = await AsyncStorage.getItem(STORAGE_KEYS.VERIFICATION_STATUS);

        console.log('Loading saved verification data...');

        if (savedEmail) {
          console.log(`Found saved email: ${savedEmail}`);
          setVerifiedEmail(savedEmail);
        } else {
          console.log('No saved email found');
        }

        if (savedReference) {
          console.log(`Found saved reference: ${savedReference}`);
          setVerificationReference(savedReference);
        }

        if (savedStatus && (savedStatus === 'completed' || savedStatus === 'failed')) {
          console.log(`Found saved status: ${savedStatus}`);
          setVerificationStatus(savedStatus as 'completed' | 'failed');
        }

        console.log('Loaded saved verification data:', { savedEmail, savedStatus, savedReference });
      } catch (error) {
        console.error('Error loading saved verification data:', error);
      }
    };

    loadSavedData();
  }, []);

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
        setShowVerification(false);
      }
    }, 300000); // 5-minute global timeout to allow more time for verification

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

    // Ensure we're on the main thread when updating UI
    setTimeout(async () => {
      // Extract email from result if available
      const email = result.email;
      const reference = result.reference;
      let status = '';

      // First set the verification status
      if (result.status === 'verified' || result.event === 'verification.accepted' || result.event === 'verification.approved') {
        setVerificationStatus('completed');
        status = 'completed';
      } else if (result.status === 'pending' || result.event === 'request.received') {
        setVerificationStatus('completed'); // Mark as completed even if pending approval
        status = 'completed';

        // Save the email and reference if verification is pending
        if (email) {
          setVerifiedEmail(email);
          await AsyncStorage.setItem(STORAGE_KEYS.VERIFIED_EMAIL, email);
        }

        if (reference) {
          setVerificationReference(reference);
          await AsyncStorage.setItem(STORAGE_KEYS.VERIFICATION_REFERENCE, reference);
        }

        // Save the verification status
        await AsyncStorage.setItem(STORAGE_KEYS.VERIFICATION_STATUS, status);

        // Ensure storage version is set
        await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_VERSION, CURRENT_STORAGE_VERSION);

        console.log(`Email ${email} saved to storage as pending verification`);
      } else if (result.status === 'declined' || result.event === 'verification.declined') {
        setVerificationStatus('failed');
        status = 'failed';
      } else if (result.status === 'error' || result.event === 'error') {
        setVerificationStatus('failed');
        status = 'failed';
      }

      // Close the verification modal with a delay to ensure proper UI transition
      setTimeout(() => {
        setShowVerification(false);

        // Show the appropriate alert based on verification result
        setTimeout(() => {
          if (result.status === 'verified' || result.event === 'verification.accepted' || result.event === 'verification.approved') {
            Alert.alert(
              t('kycCompleted'),
              t('kycCompleted'),
              [{ text: t('okButton') }]
            );
          } else if (result.status === 'pending' || result.event === 'request.received') {
            Alert.alert(
              t('kycPendingTitle'),
              result.message || t('kycPendingMessage'),
              [{ text: t('okButton') }]
            );
          } else if (result.status === 'declined' || result.event === 'verification.declined') {
            Alert.alert(
              t('kycFailed'),
              t('kycFailed'),
              [{ text: t('okButton') }]
            );
          } else if (result.status === 'error' || result.event === 'error') {
            Alert.alert(
              t('verificationErrorTitle'),
              t('kycFailed'),
              [{ text: t('okButton') }]
            );
          }
        }, 300);
      }, 300);
    }, 0);
  };

  const handleVerificationCancel = () => {
    // Ensure we're on the main thread when updating UI
    setTimeout(() => {
      setVerificationStatus('idle');

      // Close the verification modal with a delay to ensure proper UI transition
      setTimeout(() => {
        setShowVerification(false);
      }, 300);
    }, 0);
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
          title: t('cameraPermissionTitle'),
          message: t('cameraPermissionMessage'),
          buttonPositive: t('okButton')
        }
      );

      // Request storage permission based on Android version
      let storagePermission;
      if (Platform.Version >= 33) {
        storagePermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: t('mediaPermissionTitle'),
            message: t('mediaPermissionMessage'),
            buttonPositive: t('okButton')
          }
        );
      } else {
        storagePermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: t('storagePermissionTitle'),
            message: t('storagePermissionMessage'),
            buttonPositive: t('okButton')
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

  // Function to reset verification state
  const resetVerification = async () => {
    try {
      console.log('Resetting verification state...');

      // Clear verification data from storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.VERIFIED_EMAIL,
        STORAGE_KEYS.VERIFICATION_REFERENCE,
        STORAGE_KEYS.VERIFICATION_STATUS
      ]);

      // Set the storage version
      await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_VERSION, CURRENT_STORAGE_VERSION);

      // Reset state
      setVerifiedEmail(null);
      setVerificationReference(null);
      setVerificationStatus('idle');

      console.log('Verification state reset complete');
    } catch (error) {
      console.error('Error resetting verification state:', error);
    }
  };

  const startVerification = async () => {
    // If verification is already completed and we have a verified email,
    // ask if the user wants to start a new verification
    if (verificationStatus === 'completed' && verifiedEmail) {
      Alert.alert(
        t('kycPendingTitle'),
        t('kycPendingVerification').replace('{email}', verifiedEmail || ''),
        [
          {
            text: t('cancelButton'),
            style: 'cancel'
          },
          {
            text: t('kycStartNewVerification'),
            onPress: async () => {
              // Reset verification state
              await resetVerification();
              // Start a new verification
              initiateVerification();
            }
          }
        ]
      );
      return;
    }

    // Otherwise, start verification normally
    initiateVerification();
  };

  // Helper function to actually start the verification process
  const initiateVerification = async () => {
    setVerificationStatus('loading');

    // Request permissions if needed
    if (Platform.OS === 'android') {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        Alert.alert(
          t('permissionsRequiredTitle'),
          t('permissionsRequiredMessage'),
          [{ text: t('okButton') }]
        );
        setVerificationStatus('idle');
        return;
      }
    }

    // Small delay to show loading animation
    setTimeout(() => {
      setVerificationStatus('in_progress');

      // Show the journey-based verification
      setShowVerification(true);
    }, 1000);
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
        // If we have a verified email, show it in the status message with translation
        if (verifiedEmail) {
          // Pass email as a parameter to the translation function
          return t('kycPendingVerification', { email: verifiedEmail });
        }
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
        // If we have a verified email, show different button text with translation
        if (verifiedEmail) {
          return t('kycStartNewVerification');
        }
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
        // If we have a verified email (pending approval), show primary color
        if (verifiedEmail) {
          return primaryButtonColor;
        }
        return successColor;
      default:
        return primaryButtonColor;
    }
  };

  // Handle verification errors with enhanced error handling
  const handleVerificationError = (error: any) => {
    console.error('Verification error:', error);

    // Ensure we're on the main thread when updating UI
    setTimeout(() => {
      // Mark verification as failed
      setVerificationStatus('failed');

      // Close the verification modal with a delay to ensure proper UI transition
      setTimeout(() => {
        setShowVerification(false);

        // Determine the error message based on the error type
        let errorMessage = 'There was an error with the verification process.';

        if (error && error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          }
        } else if (error && error.verification_result && error.verification_result.error) {
          errorMessage = error.verification_result.error.message ||
                        'Verification was not successful. Please check your information and try again.';
        }

        // Show error with retry option
        Alert.alert(
          t('verificationErrorTitle'),
          `${errorMessage} ${t('kycFailed')}`,
          [
            {
              text: t('noButton'),
              style: 'cancel',
              onPress: () => setVerificationStatus('idle')
            },
            {
              text: t('tryAgainButton'),
              onPress: () => {
                // Reset and try again with sufficient delay to ensure UI is ready
                setVerificationStatus('idle');
                setTimeout(() => startVerification(), 1000);
              }
            }
          ]
        );
      }, 300);
    }, 0);
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

      {/* KYC Verification Modal */}
      <Modal
        visible={showVerification}
        animationType="slide"
        transparent={false}
        onRequestClose={handleVerificationCancel}
      >
        <ShuftiProStepperSDK
          onComplete={handleVerificationComplete}
          onCancel={handleVerificationCancel}
          onError={handleVerificationError}
          journeyId={journeyUrl}
        />
      </Modal>
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