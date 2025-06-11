import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  NativeModules,
  TextInput
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { ShuftiProAuthService } from '@/services/shuftiProAuth';

// Access ShuftiPro native module safely
const ShuftiproReactNativeModule = NativeModules.ShuftiproReactNativeModule || null;

// Define simplified steps in the verification flow
type Step =
  | 'email_verification'
  | 'processing'
  | 'result';

interface ShuftiProStepperSDKProps {
  onComplete: (result: any) => void;
  onCancel: () => void;
  onError: (error: any) => void;
  journeyId?: string;
}

export function ShuftiProStepperSDK({
  onComplete,
  onCancel,
  onError,
  journeyId
}: ShuftiProStepperSDKProps) {
  // Simplified state variables - start directly with email verification
  const [currentStep, setCurrentStep] = useState<Step>('email_verification');
  const [isLoading, setIsLoading] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(10);
  const [email, setEmail] = useState<string>('');
  const [emailValid, setEmailValid] = useState<boolean>(false);
  // Keep minimal reference state
  const [reference, setReference] = useState<string>('');
  
  // Get theme and language from context
  const { actualTheme } = useTheme();
  const { t, language } = useLanguage();

  // Log the current language when component mounts
  useEffect(() => {
    console.log('ShuftiProStepperSDK - Current language:', language);
  }, [language]);
  
  // Define theme colors
  const backgroundColor = actualTheme === 'dark' ? '#111115' : '#FFFFFF';
  const primaryColor = '#0a7ea4';
  const textColor = actualTheme === 'dark' ? '#FFFFFF' : '#000000';
  const cardBgColor = actualTheme === 'dark' ? '#1D1D21' : '#F5F5F5';
  
  // Check SDK availability on mount
  useEffect(() => {
    // Check SDK availability
    if (!ShuftiproReactNativeModule) {
      Alert.alert(
        'SDK Not Available',
        'The verification SDK is not available on this device.',
        [{ text: 'OK', onPress: onCancel }]
      );
    }

    // Generate a reference ID for this verification session
    const newReference = `SP_${Math.random().toString(36).substring(2, 15)}`;
    setReference(newReference);

  }, []);
  
  // Update progress based on current step - simplified
  useEffect(() => {
    switch (currentStep) {
      case 'email_verification':
        setProgressPercentage(30);
        break;
      case 'processing':
        setProgressPercentage(60);
        break;
      case 'result':
        setProgressPercentage(100);
        break;
    }
  }, [currentStep]);
  
  // Go to next step based on current step - simplified
  const goToNextStep = () => {
    switch (currentStep) {
      case 'email_verification':
        // Start verification directly with email
        if (emailValid) {
          // Start ShuftiPro verification with the entered email
          setCurrentStep('processing');
          startVerification();
        } else {
          Alert.alert(t('invalidEmailTitle'), t('invalidEmailMessage'));
        }
        break;
      case 'processing':
        // Handled by verification process
        break;
      case 'result':
        onCancel();
        break;
    }
  };

  // Go to previous step based on current step - simplified
  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'email_verification':
        onCancel(); // Go straight to cancel from email verification
        break;
      case 'processing':
        // Can't go back from processing
        break;
      case 'result':
        // Can't go back from result
        break;
    }
  };

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email input change
  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailValid(validateEmail(text));
  };

  /**
   * Maps language code from app format to ShuftiPro format
   *
   * ShuftiPro uses ISO language codes in uppercase format.
   * This function maps from our app's language codes to ShuftiPro's expected format.
   *
   * @param lang - The language code from the app (e.g., 'en', 'vi', 'ja')
   * @returns The mapped language code for ShuftiPro (e.g., 'EN', 'VI', 'JA')
   */
  const getShuftiProLanguage = (lang: string): string => {
    // ShuftiPro supported languages with their codes
    const languageMap: { [key: string]: string } = {
      'en': 'EN', // English
      'ja': 'JA', // Japanese
      'zh': 'ZH', // Chinese
      'ko': 'KO', // Korean
      'ar': 'AR', // Arabic
      'es': 'ES', // Spanish
      'fr': 'FR', // French
      'de': 'DE', // German
      'it': 'IT', // Italian
      'pt': 'PT', // Portuguese
      'ru': 'RU', // Russian
      'tr': 'TR', // Turkish
      'vi': 'VI', // Vietnamese
      'th': 'TH', // Thai
      'id': 'ID', // Indonesian
      'ms': 'MS', // Malay
      // Add more languages as needed
    };

    // Default to English if language not found
    const mappedLang = languageMap[lang.toLowerCase()] || 'EN';
    console.log(`Mapping language: ${lang} → ${mappedLang}`);
    return mappedLang;
  };
  
  // Start verification process with ShuftiPro SDK - simplified to use journey directly
  const startVerification = async () => {
    if (!ShuftiproReactNativeModule) {
      onError({ error: 'SDK not available' });
      return;
    }

    setIsLoading(true);

    try {
      // Get credentials
      const credentials = ShuftiProAuthService.getCredentials();
      if (!credentials.clientId || !credentials.secretKey) {
        throw new Error('ShuftiPro credentials not found');
      }

      // Get the mapped language for ShuftiPro
      const shuftiLang = getShuftiProLanguage(language);

      // Create a verification object with complete language settings
      const verificationObject = {
        reference, // Use the reference generated at component mount
        email: email, // Include the user's email
        journey_id: journeyId, // Include the journey ID
        language: shuftiLang, // Include language preference in ISO format (VI, EN, etc)
        country_code: language.toUpperCase(), // Some versions use country code for language
        locale: language.toLowerCase() // Some versions use locale in lowercase (vi, en, etc)
      };

      // Use basic auth with client ID and secret key
      const authObject = {
        auth_type: "basic_auth",
        client_id: credentials.clientId,
        secret_key: credentials.secretKey
      };

      // SDK configuration with comprehensive language settings
      const configObject = {
        async: false, // Use synchronous mode
        dark_mode: actualTheme === 'dark' ? 1 : 0,
        // Language settings in all possible formats
        language: shuftiLang, // ISO format (VI, EN, etc)
        locale: language.toLowerCase(), // Lowercase (vi, en, etc)
        country: language.toUpperCase(), // Some SDKs use country code
        locale_code: language.toLowerCase(), // Some SDKs use locale_code
        // For iOS and Android, the following ensures UI is displayed correctly
        ...(Platform.OS === 'ios' ? {
          show_consent: 1,
          show_privacy_policy: 1,
          show_results: 1
        } : {
          show_consent_screen: true,
          show_privacy_policy: true,
          show_results_screen: true
        })
      };

      console.log('Starting verification with ShuftiPro SDK');
      console.log('Current app language:', language);
      console.log('Verification payload:', JSON.stringify(verificationObject));
      console.log('Auth object:', JSON.stringify(authObject));
      console.log('Config object:', JSON.stringify(configObject));

      // Log all language information for debugging
      console.log(`Language mapping: ${language} → ${verificationObject.language}`);

      // Create timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('Verification timeout after 120 seconds');
          setIsLoading(false);
          setCurrentStep('result');
          onError({ error: 'Verification timeout' });
        }
      }, 120000); // 2-minute timeout
      
      // Call ShuftiPro SDK with enhanced error handling and lifecycle management
      try {
        ShuftiproReactNativeModule.verify(
          JSON.stringify(verificationObject),
          JSON.stringify(authObject),
          JSON.stringify(configObject),
          (response: string) => {
            clearTimeout(timeoutId);
            console.log('ShuftiPro SDK returned to callback with response');

            try {
              // Ensure we're properly setting state after returning from the SDK
              setIsLoading(false);

              const parsedResponse = typeof response === 'string'
                ? JSON.parse(response)
                : response;

              console.log('ShuftiPro SDK Response:', parsedResponse);

              // Handle result based on event type
              if (parsedResponse.event === 'verification.accepted' ||
                  parsedResponse.event === 'verification.approved') {
                console.log('Verification approved, moving to result step');
                setCurrentStep('result');
                // Use setTimeout to ensure state updates before calling onComplete
                setTimeout(() => {
                  onComplete({
                    status: 'verified',
                    event: parsedResponse.event,
                    reference,
                    verification_result: parsedResponse,
                    email: email // Include the email used for verification
                  });
                }, 100);
              } else if (parsedResponse.event === 'verification.declined') {
                console.log('Verification declined, moving to result step');
                setCurrentStep('result');
                // Use setTimeout to ensure state updates before calling onError
                setTimeout(() => {
                  onError({
                    status: 'declined',
                    event: parsedResponse.event,
                    reference,
                    verification_result: parsedResponse,
                    email: email // Include the email used for verification
                  });
                }, 100);
              } else if (parsedResponse.event === 'verification.cancelled') {
                console.log('Verification cancelled, moving to email verification step');
                setCurrentStep('email_verification');
                // No need to call onComplete or onError for cancellation
              } else if (parsedResponse.event === 'request.received') {
                // This is a positive response indicating the verification is in progress
                console.log('Verification request received, moving to result step');
                setCurrentStep('result');
                // Use setTimeout to ensure state updates before calling onComplete
                setTimeout(() => {
                  onComplete({
                    status: 'pending',
                    event: parsedResponse.event,
                    reference,
                    verification_result: parsedResponse,
                    message: parsedResponse.message || 'Verification in progress',
                    email: email // Include the email used for verification
                  });
                }, 100);
              } else {
                console.log('Verification returned with unknown event, moving to result step');
                setCurrentStep('result');
                // Use setTimeout to ensure state updates before calling onError
                setTimeout(() => {
                  onError({
                    status: 'error',
                    event: parsedResponse.event || 'unknown',
                    error: parsedResponse.error || 'Unknown error',
                    reference,
                    verification_result: parsedResponse,
                    email: email // Include the email used for verification
                  });
                }, 100);
              }
            } catch (error) {
              console.error('Error parsing ShuftiPro response:', error);
              setIsLoading(false);
              setCurrentStep('result');
              setTimeout(() => {
                onError({
                  status: 'error',
                  event: 'error',
                  error: 'Failed to parse response',
                  reference
                });
              }, 100);
            }
          }
        );
      } catch (sdkError) {
        // Handle any errors that occur when trying to call the SDK itself
        console.error('Error launching ShuftiPro SDK:', sdkError);
        clearTimeout(timeoutId);
        setIsLoading(false);
        setCurrentStep('result');
        onError({
          status: 'error',
          event: 'sdk_launch_error',
          error: sdkError instanceof Error ? sdkError.message : String(sdkError),
          reference
        });
      }
    } catch (error) {
      console.error('Error starting verification:', error);
      setIsLoading(false);
      setCurrentStep('result');
      onError({
        status: 'error',
        event: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
  
  // Render the progress bar
  const renderProgressBar = () => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { backgroundColor: actualTheme === 'dark' ? '#333' : '#E0E0E0' }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressPercentage}%`,
              backgroundColor: primaryColor
            }
          ]}
        />
      </View>
      <ThemedText style={styles.progressText}>{progressPercentage}%</ThemedText>
    </View>
  );
  
  // Render welcome step
  const renderWelcomeStep = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.stepContent}>
        <ThemedText style={styles.stepTitle}>Welcome to Identity Verification</ThemedText>
        <ThemedText style={styles.stepDescription}>
          You'll need to complete identity verification to continue. The process is simple and secure.
        </ThemedText>
        
        <View style={[styles.infoCard, { backgroundColor: cardBgColor }]}>
          <View style={styles.infoItem}>
            <View style={[styles.infoNumberCircle, { backgroundColor: primaryColor }]}>
              <ThemedText style={styles.infoNumber}>1</ThemedText>
            </View>
            <View style={styles.infoTextContainer}>
              <ThemedText style={styles.infoTitle}>Email Verification</ThemedText>
              <ThemedText style={styles.infoDescription}>We'll need your email address to start the verification</ThemedText>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={[styles.infoNumberCircle, { backgroundColor: primaryColor }]}>
              <ThemedText style={styles.infoNumber}>2</ThemedText>
            </View>
            <View style={styles.infoTextContainer}>
              <ThemedText style={styles.infoTitle}>Identity Verification</ThemedText>
              <ThemedText style={styles.infoDescription}>ShuftiPro will guide you through the verification process</ThemedText>
            </View>
          </View>
        </View>
        
        <ThemedText style={styles.stepDescription}>
          Please ensure you have:
        </ThemedText>
        
        <View style={styles.checklistContainer}>
          <ThemedText style={styles.checklistItem}>• A valid government-issued ID document</ThemedText>
          <ThemedText style={styles.checklistItem}>• Good lighting conditions</ThemedText>
          <ThemedText style={styles.checklistItem}>• Your face clearly visible</ThemedText>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: primaryColor }]}
          onPress={goToNextStep}
        >
          <ThemedText style={styles.buttonText}>Get Started</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.secondaryButton, { borderColor: textColor }]}
          onPress={onCancel}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: textColor }]}>Cancel</ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
  
  // Render email verification step
  const renderEmailVerificationStep = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.stepContent}>
        <ThemedText style={styles.stepTitle}>{t('kycTitle')}</ThemedText>
        <ThemedText style={styles.stepDescription}>
          {t('kycDescription')}
        </ThemedText>

        <View style={[styles.inputContainer, { backgroundColor: cardBgColor }]}>
          <ThemedText style={styles.inputLabel}>{t('emailLabel')}</ThemedText>
          <View style={[
            styles.textInputContainer,
            { borderColor: emailValid ? '#4CAF50' : email.length > 0 ? '#FF5252' : actualTheme === 'dark' ? '#555' : '#DDD' }
          ]}>
            <TextInput
              style={[styles.textInput, { color: textColor }]}
              placeholder={t('emailPlaceholder')}
              placeholderTextColor={actualTheme === 'dark' ? '#888' : '#AAA'}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {email.length > 0 && (
              <View style={styles.validationIcon}>
                {emailValid ? (
                  <ThemedText style={[styles.validIcon, { color: '#4CAF50' }]}>✓</ThemedText>
                ) : (
                  <ThemedText style={[styles.invalidIcon, { color: '#FF5252' }]}>✗</ThemedText>
                )}
              </View>
            )}
          </View>
          {email.length > 0 && !emailValid && (
            <ThemedText style={styles.errorText}>
              {t('emailInvalid')}
            </ThemedText>
          )}
          <ThemedText style={styles.inputHelp}>
            {t('emailHelp')}
          </ThemedText>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: emailValid ? primaryColor : '#CCCCCC',
              opacity: emailValid ? 1 : 0.7
            }
          ]}
          onPress={goToNextStep}
          disabled={!emailValid}
        >
          <ThemedText style={styles.buttonText}>{t('continueButton')}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: textColor }]}
          onPress={goToPreviousStep}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: textColor }]}>{t('backButton')}</ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
  
  // Render processing step
  const renderProcessingStep = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color={primaryColor} />
      <ThemedText style={styles.processingTitle}>{t('processingTitle')}</ThemedText>
      <ThemedText style={styles.processingDescription}>
        {t('processingDescription')}
      </ThemedText>
    </View>
  );
  
  // Render result step
  const renderResultStep = () => (
    <View style={styles.resultContainer}>
      <View style={[styles.resultIconContainer, { backgroundColor: primaryColor }]}>
        <ThemedText style={styles.resultIcon}>✓</ThemedText>
      </View>
      <ThemedText style={styles.resultTitle}>{t('resultTitle')}</ThemedText>
      <ThemedText style={styles.resultDescription}>
        {t('resultDescription')}
      </ThemedText>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: primaryColor, marginTop: 30 }]}
        onPress={onCancel}
      >
        <ThemedText style={styles.buttonText}>{t('doneButton')}</ThemedText>
      </TouchableOpacity>
    </View>
  );

  // Render the appropriate step based on currentStep
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'email_verification':
        return renderEmailVerificationStep();
      case 'processing':
        return renderProcessingStep();
      case 'result':
        return renderResultStep();
      default:
        return renderEmailVerificationStep();
    }
  };
  
  // Main render method
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            Alert.alert(
              t('cancelVerificationTitle'),
              t('cancelVerificationMessage'),
              [
                { text: t('noButton'), style: 'cancel' },
                { text: t('yesButton'), onPress: onCancel }
              ]
            );
          }}
        >
          <ThemedText style={styles.closeButtonText}>{t('cancelButton')}</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.headerTitle}>{t('kycTitle')}</ThemedText>

        <View style={styles.closeButton} />
      </View>

      {/* Progress bar */}
      {renderProgressBar()}

      {/* Current step content */}
      {renderCurrentStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 60,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#0a7ea4',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'right',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  stepContent: {
    flex: 1,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoNumberCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  checklistContainer: {
    paddingLeft: 10,
    marginBottom: 20,
  },
  checklistItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  // Email verification styles
  inputContainer: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  validationIcon: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  invalidIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    color: '#FF5252',
    marginBottom: 8,
  },
  inputHelp: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  processingDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  resultIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resultIcon: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  }
});