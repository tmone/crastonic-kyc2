import { Image } from 'expo-image';
import { StyleSheet, Dimensions, View, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useShuftiProSDK } from '@/components/ShuftiProSDK';
import { KYCWebView } from '@/components/KYCWebView';

const { width: deviceWidth } = Dimensions.get('window');

export default function KYCScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'in_progress' | 'completed' | 'failed'>('idle');
  const [verificationUrl] = useState('https://app.shuftipro.com/verification/process/4mjladGERNsawA4sEMzAF26OlLu94Cm4uXRCDrtMynHhMDTMClD7caaEmoc7fKI6');
  const [showWebView, setShowWebView] = useState(false);
  const { startVerificationWithJourney, startVerificationWithAuth, isSDKAvailable } = useShuftiProSDK();
  const [useSDK, setUseSDK] = useState(isSDKAvailable); // Use SDK only if available
  
  const primaryButtonColor = colorScheme === 'dark' ? '#0a7ea4' : '#0a7ea4'; // Use consistent blue color
  const errorColor = '#FF4444';
  const successColor = '#44BB44';

  const handleSDKResult = (result: any) => {
    console.log('SDK Result:', result);
    
    switch (result.event) {
      case 'verification.accepted':
      case 'verification.approved':
        setVerificationStatus('completed');
        Alert.alert(
          t('kycCompleted'),
          'Your verification has been completed successfully.',
          [{ text: 'OK' }]
        );
        break;
        
      case 'verification.declined':
        setVerificationStatus('failed');
        Alert.alert(
          'Verification Declined',
          'Your verification was declined. Please try again.',
          [{ text: 'OK' }]
        );
        break;
        
      case 'verification.cancelled':
        setVerificationStatus('idle');
        break;
        
      case 'error':
        setVerificationStatus('failed');
        Alert.alert(
          'Error',
          'An error occurred during verification. Please try again.',
          [{ text: 'OK' }]
        );
        break;
        
      case 'request.unauthorized':
        setVerificationStatus('failed');
        Alert.alert(
          'Authorization Error',
          'The verification link may have expired or is invalid. Please use WebView mode instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Use WebView', 
              onPress: () => {
                setUseSDK(false);
                setVerificationStatus('in_progress');
                setShowWebView(true);
              }
            }
          ]
        );
        break;
        
      default:
        console.log('Unknown event:', result.event);
    }
  };

  const startVerification = async () => {
    setVerificationStatus('loading');
    
    // Try SDK first
    if (useSDK && Platform.OS !== 'web') {
      try {
        // Use credentials-based authentication instead of journey URL
        await startVerificationWithAuth(handleSDKResult);
      } catch (error) {
        console.error('SDK Error:', error);
        // Fallback to WebView
        Alert.alert(
          'SDK Error',
          'Failed to start SDK verification. Would you like to try WebView instead?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setVerificationStatus('idle') },
            { 
              text: 'Use WebView', 
              onPress: () => {
                setUseSDK(false);
                setVerificationStatus('in_progress');
                setShowWebView(true);
              }
            },
          ]
        );
      }
    } else {
      // Use WebView for web platform or as fallback
      setVerificationStatus('in_progress');
      setShowWebView(true);
    }
  };

  const handleVerificationSuccess = (data: any) => {
    console.log('Verification successful:', data);
    setVerificationStatus('completed');
    setShowWebView(false);
  };

  const handleVerificationError = (error: any) => {
    console.log('Verification error:', error);
    setVerificationStatus('failed');
    setShowWebView(false);
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
                Platform.OS === 'ios' && styles.iosButton
              ]}
              onPress={startVerification}
              disabled={verificationStatus === 'loading'}
            >
              {verificationStatus === 'loading' ? (
                <ActivityIndicator color="white" />
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

            {!isSDKAvailable && Platform.OS !== 'web' && (
              <ThemedView style={[
                styles.warningContainer,
                colorScheme === 'dark' && { backgroundColor: 'rgba(255, 165, 0, 0.1)' },
                Platform.OS === 'ios' && styles.iosWarningContainer
              ]}>
                <ThemedText style={[styles.warningText, Platform.OS === 'ios' && styles.iosText]}>
                  ⚠️ ShuftiPro SDK requires a custom development build. Using WebView mode.
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>
      </ParallaxScrollView>

      <KYCWebView
        visible={showWebView}
        onClose={handleWebViewClose}
        onSuccess={handleVerificationSuccess}
        onError={handleVerificationError}
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