import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
  Image as RNImage,
  PermissionsAndroid
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { LoadingIndicator } from './LoadingIndicator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { 
  ShuftiProDirectApi, 
  VerificationResult, 
  VerificationType 
} from '@/services/shuftiProDirectApi';

const { width: deviceWidth } = Dimensions.get('window');

interface KYCNativeVerificationProps {
  onComplete: (result: VerificationResult) => void;
  onCancel: () => void;
}

export function KYCNativeVerification({ onComplete, onCancel }: KYCNativeVerificationProps) {
  const { t, language } = useLanguage();
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#111115' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const cardColor = useThemeColor({ light: '#F5F5F5', dark: '#1D1D21' }, 'card');
  const primaryColor = '#0a7ea4';
  const errorColor = '#FF4444';
  const successColor = '#44BB44';

  // State
  const [step, setStep] = useState<'intro' | 'document' | 'selfie' | 'processing' | 'result'>('intro');
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [documentBackImage, setDocumentBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verificationReference, setVerificationReference] = useState<string | null>(null);
  const [verificationStartTime, setVerificationStartTime] = useState<number | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Clean up status check interval on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  // Request camera and storage permissions
  const requestPermissions = async () => {
    if (Platform.OS === 'ios') {
      // iOS permissions are handled by the OS
      return;
    }

    try {
      // Request camera permission
      const cameraPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "We need access to your camera for verification",
          buttonPositive: "OK"
        }
      );
      
      // Request storage permission based on Android version
      if (Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: "Media Permission",
            message: "We need access to your photos for verification",
            buttonPositive: "OK"
          }
        );
      } else {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "We need access to your storage for verification",
            buttonPositive: "OK"
          }
        );
      }
    } catch (err) {
      console.warn('Permission request error:', err);
    }
  };

  // Pick document image
  const pickDocumentImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocumentImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking document image:', error);
      Alert.alert('Error', 'Could not capture document image');
    }
  };

  // Pick document back image
  const pickDocumentBackImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocumentBackImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking document back image:', error);
      Alert.alert('Error', 'Could not capture document back image');
    }
  };

  // Pick selfie image
  const pickSelfieImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelfieImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking selfie image:', error);
      Alert.alert('Error', 'Could not capture selfie image');
    }
  };

  // Handle document submission
  const handleDocumentSubmit = () => {
    if (!documentImage) {
      Alert.alert('Error', 'Please take a photo of your ID document');
      return;
    }
    
    if (!documentBackImage) {
      Alert.alert('Error', 'Please take a photo of the back of your ID document');
      return;
    }
    
    setStep('selfie');
  };

  // Handle selfie submission
  const handleSelfieSubmit = async () => {
    if (!selfieImage) {
      Alert.alert('Error', 'Please take a selfie photo');
      return;
    }
    
    setStep('processing');
    setIsLoading(true);

    try {
      // Create verification request
      const verificationTypes: VerificationType[] = ['document', 'face'];
      const result = await ShuftiProDirectApi.createVerification(verificationTypes, language);
      
      if (result.status === 'error') {
        throw new Error(result.error?.message || 'Verification request failed');
      }
      
      setVerificationReference(result.reference || null);
      setVerificationStartTime(Date.now());
      
      // Start polling for status updates
      const interval = setInterval(async () => {
        if (!result.reference) return;
        
        const statusResult = await ShuftiProDirectApi.checkVerificationStatus(result.reference);
        
        if (statusResult.status === 'error') {
          clearInterval(interval);
          setIsLoading(false);
          setVerificationResult(statusResult);
          setStep('result');
          return;
        }
        
        if (statusResult.status === 'verified' || statusResult.status === 'declined') {
          clearInterval(interval);
          setIsLoading(false);
          setVerificationResult(statusResult);
          setStep('result');
          onComplete(statusResult);
        }
        
        // Stop polling after 5 minutes
        if (verificationStartTime && Date.now() - verificationStartTime > 5 * 60 * 1000) {
          clearInterval(interval);
          setIsLoading(false);
          setVerificationResult({
            status: 'error',
            error: 'Verification timed out',
            reference: result.reference
          });
          setStep('result');
        }
      }, 10000);
      
      setStatusCheckInterval(interval);
    } catch (error) {
      console.error('Error starting verification:', error);
      setIsLoading(false);
      setVerificationResult({
        status: 'error',
        error
      });
      setStep('result');
    }
  };

  // Render intro step
  const renderIntroStep = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.cardContainer}>
        <ThemedText style={styles.title}>{t('kycTitle')}</ThemedText>
        <ThemedText style={styles.description}>{t('kycDescription')}</ThemedText>
        
        <ThemedView style={[styles.infoContainer, { backgroundColor: cardColor }]}>
          <ThemedText style={styles.infoTitle}>{t('kycRequirements')}</ThemedText>
          <ThemedText style={styles.infoText}>• {t('kycRequirement1')}</ThemedText>
          <ThemedText style={styles.infoText}>• {t('kycRequirement2')}</ThemedText>
          <ThemedText style={styles.infoText}>• {t('kycRequirement3')}</ThemedText>
        </ThemedView>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={() => setStep('document')}
          >
            <ThemedText style={styles.buttonText}>{t('kycStartButton')}</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: textColor }]}
            onPress={onCancel}
          >
            <ThemedText style={[styles.buttonText, { color: textColor }]}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );

  // Render document step
  const renderDocumentStep = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.cardContainer}>
        <ThemedText style={styles.title}>Document Verification</ThemedText>
        <ThemedText style={styles.description}>Please take clear photos of the front and back of your ID document</ThemedText>
        
        <View style={styles.imagePreviewContainer}>
          <View style={styles.imagePreviewBox}>
            <ThemedText style={styles.imageLabel}>Front</ThemedText>
            {documentImage ? (
              <RNImage source={{ uri: documentImage }} style={styles.previewImage} />
            ) : (
              <TouchableOpacity 
                style={[styles.imagePlaceholder, { backgroundColor: cardColor }]} 
                onPress={pickDocumentImage}
              >
                <ThemedText style={styles.imagePlaceholderText}>Tap to capture</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.smallButton, { backgroundColor: primaryColor }]} 
              onPress={pickDocumentImage}
            >
              <ThemedText style={styles.smallButtonText}>
                {documentImage ? 'Retake' : 'Capture'}
              </ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.imagePreviewBox}>
            <ThemedText style={styles.imageLabel}>Back</ThemedText>
            {documentBackImage ? (
              <RNImage source={{ uri: documentBackImage }} style={styles.previewImage} />
            ) : (
              <TouchableOpacity 
                style={[styles.imagePlaceholder, { backgroundColor: cardColor }]} 
                onPress={pickDocumentBackImage}
              >
                <ThemedText style={styles.imagePlaceholderText}>Tap to capture</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.smallButton, { backgroundColor: primaryColor }]} 
              onPress={pickDocumentBackImage}
            >
              <ThemedText style={styles.smallButtonText}>
                {documentBackImage ? 'Retake' : 'Capture'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.button, 
              { 
                backgroundColor: documentImage && documentBackImage ? primaryColor : cardColor,
                opacity: documentImage && documentBackImage ? 1 : 0.6
              }
            ]}
            onPress={handleDocumentSubmit}
            disabled={!documentImage || !documentBackImage}
          >
            <ThemedText 
              style={[
                styles.buttonText, 
                { color: documentImage && documentBackImage ? '#FFFFFF' : textColor }
              ]}
            >
              Continue
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: textColor }]}
            onPress={() => setStep('intro')}
          >
            <ThemedText style={[styles.buttonText, { color: textColor }]}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );

  // Render selfie step
  const renderSelfieStep = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.cardContainer}>
        <ThemedText style={styles.title}>Selfie Verification</ThemedText>
        <ThemedText style={styles.description}>Please take a clear photo of your face</ThemedText>
        
        <View style={styles.selfieContainer}>
          {selfieImage ? (
            <RNImage source={{ uri: selfieImage }} style={styles.selfieImage} />
          ) : (
            <TouchableOpacity 
              style={[styles.selfiePlaceholder, { backgroundColor: cardColor }]} 
              onPress={pickSelfieImage}
            >
              <ThemedText style={styles.imagePlaceholderText}>Tap to capture selfie</ThemedText>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.smallButton, { backgroundColor: primaryColor, marginTop: 20 }]} 
            onPress={pickSelfieImage}
          >
            <ThemedText style={styles.smallButtonText}>
              {selfieImage ? 'Retake Selfie' : 'Take Selfie'}
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.button, 
              { 
                backgroundColor: selfieImage ? primaryColor : cardColor,
                opacity: selfieImage ? 1 : 0.6
              }
            ]}
            onPress={handleSelfieSubmit}
            disabled={!selfieImage}
          >
            <ThemedText 
              style={[
                styles.buttonText, 
                { color: selfieImage ? '#FFFFFF' : textColor }
              ]}
            >
              Submit
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: textColor }]}
            onPress={() => setStep('document')}
          >
            <ThemedText style={[styles.buttonText, { color: textColor }]}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );

  // Render processing step
  const renderProcessingStep = () => (
    <View style={styles.processingContainer}>
      <LoadingIndicator 
        size={80} 
        color={primaryColor} 
        text="Processing your verification... Please wait" 
      />
    </View>
  );

  // Render result step
  const renderResultStep = () => {
    if (!verificationResult) return null;
    
    const isSuccess = verificationResult.status === 'verified';
    const statusColor = isSuccess ? successColor : errorColor;
    const statusIcon = isSuccess ? '✓' : '✗';
    const statusTitle = isSuccess ? 'Verification Successful' : 'Verification Failed';
    const statusMessage = isSuccess 
      ? 'Your identity has been successfully verified. Thank you for completing the process.'
      : 'There was an issue with your verification. Please try again or contact support.';
    
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.cardContainer}>
          <View style={[styles.statusIcon, { backgroundColor: statusColor }]}>
            <ThemedText style={styles.statusIconText}>{statusIcon}</ThemedText>
          </View>
          
          <ThemedText style={[styles.title, { color: statusColor, marginTop: 20 }]}>
            {statusTitle}
          </ThemedText>
          
          <ThemedText style={styles.description}>
            {statusMessage}
          </ThemedText>
          
          {verificationResult.reference && (
            <ThemedView style={[styles.referenceContainer, { backgroundColor: cardColor }]}>
              <ThemedText style={styles.referenceLabel}>Reference ID:</ThemedText>
              <ThemedText style={styles.referenceValue}>{verificationResult.reference}</ThemedText>
            </ThemedView>
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: primaryColor }]}
              onPress={() => onComplete(verificationResult)}
            >
              <ThemedText style={styles.buttonText}>
                {isSuccess ? 'Continue' : 'Try Again'}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: textColor }]}
              onPress={onCancel}
            >
              <ThemedText style={[styles.buttonText, { color: textColor }]}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
    );
  };

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 'intro':
        return renderIntroStep();
      case 'document':
        return renderDocumentStep();
      case 'selfie':
        return renderSelfieStep();
      case 'processing':
        return renderProcessingStep();
      case 'result':
        return renderResultStep();
      default:
        return renderIntroStep();
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {renderStep()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  infoContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
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
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
    flexWrap: 'wrap',
  },
  imagePreviewBox: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  imageLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePlaceholderText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  selfieContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  selfiePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfieImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
  },
  referenceContainer: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  referenceLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  referenceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});