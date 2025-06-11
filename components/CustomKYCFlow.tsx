import React, { useState, useEffect, useRef, Component, ErrorInfo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Text
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { LoadingIndicator } from './LoadingIndicator';
import { ShuftiProAuthService } from '@/services/shuftiProAuth';

// Create a safe import of ShuftiPro module that won't crash if the module is missing
let ShuftiproReactNativeModule: any = null;
try {
  const NativeModules = require('react-native').NativeModules;
  ShuftiproReactNativeModule = NativeModules.ShuftiproReactNativeModule || null;

  if (ShuftiproReactNativeModule) {
    console.log('ShuftiPro module loaded successfully');
  } else {
    console.warn('ShuftiPro module not found in NativeModules');
  }
} catch (error) {
  console.error('Error loading ShuftiPro module:', error);
}

// Error boundary class to catch and handle errors gracefully
class ErrorBoundary extends Component<
  {
    children: React.ReactNode;
    onError: (error: Error, info: ErrorInfo) => void;
    fallback: React.ReactNode;
  },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info);
    this.props.onError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface CustomKYCFlowProps {
  onComplete: (result: any) => void;
  onCancel: () => void;
  journeyId?: string; // Optional journey ID for reference
}

// Define the verification steps
type Step = 
  | 'intro'
  | 'document_type'
  | 'document_front'
  | 'document_back' 
  | 'selfie'
  | 'review'
  | 'processing'
  | 'result';

// Create a wrapper component that uses the error boundary
export function CustomKYCFlow(props: CustomKYCFlowProps) {
  // Handle errors in the KYC flow
  const handleError = (error: Error, info: ErrorInfo) => {
    console.error('Error in KYC flow:', error, info);
    // Report error to analytics or logging service if available

    // Alert the user that something went wrong
    Alert.alert(
      'Error',
      'An error occurred during the verification process. Please try again.',
      [{ text: 'OK', onPress: props.onCancel }]
    );
  };

  // Fallback UI to show if an error occurs
  const fallbackUI = (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8f8f8' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Verification Error
      </Text>
      <Text style={{ fontSize: 16, marginBottom: 30, textAlign: 'center' }}>
        We encountered a problem with the verification process. Please try again.
      </Text>
      <TouchableOpacity
        style={{
          paddingVertical: 12,
          paddingHorizontal: 30,
          backgroundColor: '#0a7ea4',
          borderRadius: 25,
        }}
        onPress={props.onCancel}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
          Close
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ErrorBoundary onError={handleError} fallback={fallbackUI}>
      <KYCFlowContent {...props} />
    </ErrorBoundary>
  );
}

// The main component implementation
function KYCFlowContent({
  onComplete,
  onCancel,
  journeyId
}: CustomKYCFlowProps) {
  const { actualTheme } = useTheme();
  const { t, language } = useLanguage();
  const cameraRef = useRef<Camera | null>(null);

  // State
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [documentType, setDocumentType] = useState<'passport' | 'id_card' | 'driving_license'>('id_card');
  const [documentFrontImage, setDocumentFrontImage] = useState<string | null>(null);
  const [documentBackImage, setDocumentBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [cameraType, setCameraType] = useState<CameraType>(CameraType.back);
  
  // Theme colors
  const backgroundColor = actualTheme === 'dark' ? '#111115' : '#FFFFFF';
  const primaryColor = '#0a7ea4';
  const secondaryColor = actualTheme === 'dark' ? '#2A2A30' : '#F0F0F0';
  const textColor = actualTheme === 'dark' ? '#FFFFFF' : '#000000';
  const successColor = '#44BB44';
  const errorColor = '#FF4444';
  
  // Request camera permission on mount
  useEffect(() => {
    let isMounted = true;

    // Request camera permissions with better error handling
    const requestPermissions = async () => {
      try {
        console.log('Requesting camera permissions...');
        const { status } = await Camera.requestCameraPermissionsAsync();
        console.log('Camera permission status:', status);

        // Only update state if component is still mounted
        if (isMounted) {
          setCameraPermission(status === 'granted');

          if (status !== 'granted') {
            Alert.alert(
              'Camera Permission Required',
              'We need camera access to capture your documents and selfie for verification.',
              [{ text: 'OK', onPress: onCancel }]
            );
          }
        }
      } catch (error) {
        console.error('Error requesting camera permission:', error);

        if (isMounted) {
          setCameraPermission(false);
          Alert.alert(
            'Permission Error',
            'There was an error requesting camera permissions. Please try again.',
            [{ text: 'OK', onPress: onCancel }]
          );
        }
      }
    };

    requestPermissions();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [onCancel]);
  
  // Handle back button and navigation
  const goBack = () => {
    switch (currentStep) {
      case 'intro':
        onCancel();
        break;
      case 'document_type':
        setCurrentStep('intro');
        break;
      case 'document_front':
        setCurrentStep('document_type');
        break;
      case 'document_back':
        setCurrentStep('document_front');
        break;
      case 'selfie':
        if (documentType === 'passport') {
          setCurrentStep('document_front');
        } else {
          setCurrentStep('document_back');
        }
        break;
      case 'review':
        setCurrentStep('selfie');
        break;
      default:
        // Processing and result steps can't go back
        break;
    }
  };
  
  // Handle next step navigation
  const goNext = () => {
    switch (currentStep) {
      case 'intro':
        setCurrentStep('document_type');
        break;
      case 'document_type':
        setCurrentStep('document_front');
        break;
      case 'document_front':
        if (documentType === 'passport') {
          setCurrentStep('selfie');
        } else {
          setCurrentStep('document_back');
        }
        break;
      case 'document_back':
        setCurrentStep('selfie');
        break;
      case 'selfie':
        setCurrentStep('review');
        break;
      case 'review':
        setCurrentStep('processing');
        submitVerification();
        break;
      default:
        // Do nothing for other steps
        break;
    }
  };
  
  // Take a picture using the camera with comprehensive error handling
  const takePicture = async () => {
    if (!cameraRef.current) {
      console.warn('Camera ref is not available');

      // Notify user that we need to use gallery instead
      Alert.alert(
        'Camera Not Available',
        'The camera is not available. Please select an image from your gallery instead.',
        [
          {
            text: 'Open Gallery',
            onPress: () => {
              switch (currentStep) {
                case 'document_front':
                  pickDocumentFront();
                  break;
                case 'document_back':
                  pickDocumentBack();
                  break;
                case 'selfie':
                  pickSelfie();
                  break;
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return null;
    }

    try {
      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn('Camera capture timed out after 10 seconds');
          resolve(null);
        }, 10000); // 10 second timeout
      });

      // Create the camera capture promise
      const capturePromise = cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: Platform.OS === 'android', // Only skip processing on Android
      }).then(photo => photo.uri);

      // Race the promises to handle timeout
      const uri = await Promise.race([capturePromise, timeoutPromise]);

      if (!uri) {
        throw new Error('Camera capture timed out or failed');
      }

      return uri;
    } catch (error) {
      console.error('Error taking picture:', error);

      // Show a more helpful error message with options
      Alert.alert(
        'Camera Error',
        'Failed to capture image. Would you like to try again or use your gallery?',
        [
          { text: 'Try Again', onPress: takePicture },
          {
            text: 'Use Gallery',
            onPress: () => {
              switch (currentStep) {
                case 'document_front':
                  pickDocumentFront();
                  break;
                case 'document_back':
                  pickDocumentBack();
                  break;
                case 'selfie':
                  pickSelfie();
                  break;
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return null;
    }
  };
  
  // Take document front picture
  const captureDocumentFront = async () => {
    const uri = await takePicture();
    if (uri) {
      setDocumentFrontImage(uri);
      
      // Navigate to next step automatically
      if (documentType === 'passport') {
        setCurrentStep('selfie');
      } else {
        setCurrentStep('document_back');
      }
    }
  };
  
  // Take document back picture
  const captureDocumentBack = async () => {
    const uri = await takePicture();
    if (uri) {
      setDocumentBackImage(uri);
      setCurrentStep('selfie');
    }
  };
  
  // Take selfie picture
  const captureSelfie = async () => {
    const uri = await takePicture();
    if (uri) {
      setSelfieImage(uri);
      setCurrentStep('review');
    }
  };
  
  // Pick image from gallery
  const pickImage = async () => {
    try {
      console.log('Launching image picker...');

      // First check permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to select images.',
          [{ text: 'OK' }]
        );
        return null;
      }

      // Launch the image picker with platform-specific options
      const pickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        ...Platform.select({
          ios: {
            aspect: [4, 3]
          },
          android: {
            // Android may not handle aspect correctly in some versions
            aspect: undefined
          }
        })
      };

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      console.log('Image picker result:', result.canceled ? 'Canceled' : 'Image selected');

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Gallery Error', 'Failed to select image. Please try again.');
    }

    return null;
  };
  
  // Pick document front from gallery
  const pickDocumentFront = async () => {
    const uri = await pickImage();
    if (uri) {
      setDocumentFrontImage(uri);
    }
  };
  
  // Pick document back from gallery
  const pickDocumentBack = async () => {
    const uri = await pickImage();
    if (uri) {
      setDocumentBackImage(uri);
    }
  };
  
  // Pick selfie from gallery
  const pickSelfie = async () => {
    const uri = await pickImage();
    if (uri) {
      setSelfieImage(uri);
    }
  };
  
  // Reset the verification flow
  const resetVerification = () => {
    setDocumentType('id_card');
    setDocumentFrontImage(null);
    setDocumentBackImage(null);
    setSelfieImage(null);
    setVerificationResult(null);
    setCurrentStep('intro');
  };
  
  // Submit verification to ShuftiPro SDK
  const submitVerification = async () => {
    setIsProcessing(true);

    // Track timeouts and cleanup
    let timeoutId: NodeJS.Timeout;
    let shortTimeoutId: NodeJS.Timeout;
    let mediumTimeoutId: NodeJS.Timeout;
    let forceKillTimeoutId: NodeJS.Timeout;

    try {
      console.log('Starting ShuftiPro verification with custom UI');

      // Get credentials
      const credentials = ShuftiProAuthService.getCredentials();
      if (!credentials.clientId || !credentials.secretKey) {
        throw new Error('ShuftiPro credentials not found');
      }

      // Create a reference ID
      const reference = journeyId || `REF-${Date.now()}`;

      // Create verification object with minimal required fields
      const verificationObject = {
        reference,
        country: "",
        language: getShuftiProLanguage(language),
        verification_mode: "image_only",
        show_privacy_policy: 1,
        show_consent: 1,
        show_results: 1,
        show_feedback_form: 0, // Disable feedback form to reduce complexity
        open_webview: 0,       // Force native experience
        hide_verification_voucher: 1, // Hide verification voucher which can cause black screen
        async_mode: 0,         // Don't use async mode to avoid waiting screens
        show_waiting_screen: 0, // Disable waiting screen that can cause black screen
        face: {
          proof: ""
        },
        document: {
          supported_types: [documentType],
          name: {
            first_name: "",
            last_name: ""
          },
          backside_proof_required: documentType !== 'passport' ? 1 : 0,
          allow_offline: 0,    // Don't allow offline mode which can cause issues
          show_3d_motion: 0,   // Disable 3D motion detection which can cause crashes
          show_instruction_screens: 0 // Disable instruction screens that can cause crashes
        }
      };

      // Auth object
      const authObject = {
        auth_type: "basic_auth",
        client_id: credentials.clientId,
        secret_key: credentials.secretKey,
      };

      // Config object with platform-specific options
      // Using simplified config objects for better stability
      const configObject = Platform.OS === 'ios' ? {
        async: false,
        captureEnabled: false, // Disable capture since we already have images
        dark_mode: actualTheme === 'dark' ? 1 : 0,
        language: getShuftiProLanguage(language),
        show_consent: 1,
        show_privacy_policy: 1,
        show_results: 0, // Don't show results, we'll handle that
        open_webview: 0,
        font_color: actualTheme === 'dark' ? "#FFFFFF" : "#000000",
        background_color: actualTheme === 'dark' ? "#111115" : "#FFFFFF",
        disable_video_mode: 1,         // Force image mode only
        disable_document_instruction: 1, // Disable instruction screens
        disable_face_instruction: 1,    // Disable instruction screens
        disable_helper_text: 1,         // Disable helper text that can cause issues
        disable_frame_corner_animation: 1, // Disable animations that can cause rendering issues
        disable_blinking_detection: 1,  // Disable blinking detection which can cause crashes
        play_capture_sound: 0,          // Disable sound which can cause issues
        vibrate_on_capture: 0,          // Disable vibration which can cause issues
        disable_waiting_screen: 1,      // Disable waiting screen that can cause black screen
        verification_timeout: 15,       // Timeout after 15 seconds to avoid hanging
        disable_async_verification: 1,  // Disable async verification to avoid waiting screens
        auto_close: 0                   // Don't auto-close on completion
      } : {
        async: false,
        captureEnabled: false,
        dark_mode: actualTheme === 'dark',
        language: getShuftiProLanguage(language),
        show_consent_screen: true,
        show_privacy_policy: true,
        show_results_screen: false,
        open_webview: false,
        disable_video_mode: true,        // Force image mode only
        disable_document_instruction: true, // Disable instruction screens
        disable_face_instruction: true,   // Disable instruction screens
        disable_helper_text: true,        // Disable helper text
        disable_frame_corner_animation: true, // Disable animations
        disable_blinking_detection: true, // Disable blinking detection
        play_capture_sound: false,        // Disable sound
        vibrate_on_capture: false,        // Disable vibration
        disable_waiting_screen: true,     // Disable waiting screen that can cause black screen
        verification_timeout: 15,         // Timeout after 15 seconds to avoid hanging
        disable_async_verification: true, // Disable async verification to avoid waiting screens
        auto_close: false                 // Don't auto-close on completion
      };

      // Log objects for debugging
      console.log('Verification Object:', JSON.stringify(verificationObject));
      console.log('Auth Object:', JSON.stringify({...authObject, secret_key: "***"})); // Hide secret key in logs
      console.log('Config Object:', JSON.stringify(configObject));

      // Set up timeout checkpoints to monitor progress
      shortTimeoutId = setTimeout(() => {
        console.log('ShuftiPro SDK first checkpoint - 5 seconds');
      }, 5000);

      mediumTimeoutId = setTimeout(() => {
        console.log('ShuftiPro SDK second checkpoint - 10 seconds');
      }, 10000);

      // Main timeout to prevent hanging
      timeoutId = setTimeout(() => {
        if (isProcessing) {
          console.warn('ShuftiPro SDK verification timeout - 15 seconds');
          handleVerificationTimeout(reference);
        }
      }, 15000);

      // Force kill timeout that will always trigger even if callbacks happen
      forceKillTimeoutId = setTimeout(() => {
        console.warn('Force killing SDK session after 25 seconds to prevent hanging');
        if (isProcessing) {
          handleVerificationTimeout(reference, "Forced termination to prevent hanging");
        }
      }, 25000);

      // Helper function to handle timeouts consistently
      const handleVerificationTimeout = (ref: string, message: string = "Verification timeout") => {
        setIsProcessing(false);
        setCurrentStep('result');

        const timeoutResult = {
          event: 'error',
          error: message
        };

        setVerificationResult(timeoutResult);

        onComplete({
          status: 'error',
          event: 'error',
          error: message,
          reference: ref
        });
      };

      // Call the SDK
      if (!ShuftiproReactNativeModule) {
        throw new Error('ShuftiPro SDK module not found');
      }

      ShuftiproReactNativeModule.verify(
        JSON.stringify(verificationObject),
        JSON.stringify(authObject),
        JSON.stringify(configObject),
        (response: string) => {
          try {
            // Clear the standard timeouts
            clearTimeout(shortTimeoutId);
            clearTimeout(mediumTimeoutId);
            clearTimeout(timeoutId);
            // Note: we don't clear forceKillTimeoutId to ensure it always runs

            console.log('Raw ShuftiPro response received');

            // Parse the response
            const parsedResponse = typeof response === 'string'
              ? JSON.parse(response)
              : response;

            console.log('ShuftiPro SDK Response:', parsedResponse);

            // Set result and update step
            setVerificationResult(parsedResponse);
            setCurrentStep('result');
            setIsProcessing(false);

            // Handle verification result
            if (parsedResponse.event === 'verification.accepted' ||
                parsedResponse.event === 'verification.approved') {
              onComplete({
                status: 'verified',
                event: parsedResponse.event,
                reference: reference,
                verification_result: parsedResponse
              });
            } else if (parsedResponse.event === 'verification.declined') {
              onComplete({
                status: 'declined',
                event: parsedResponse.event,
                reference: reference,
                verification_result: parsedResponse
              });
            } else if (parsedResponse.event === 'verification.cancelled') {
              onComplete({
                status: 'declined',
                event: parsedResponse.event,
                reference: reference,
                verification_result: parsedResponse
              });
            } else if (parsedResponse.event === 'error') {
              onComplete({
                status: 'error',
                event: 'error',
                error: parsedResponse.error || 'Verification error',
                reference: reference,
                verification_result: parsedResponse
              });
            } else {
              // Unknown event type
              console.warn('Unknown event type:', parsedResponse.event);
              onComplete({
                status: 'error',
                event: parsedResponse.event || 'unknown',
                error: 'Unexpected response from verification',
                reference: reference,
                verification_result: parsedResponse
              });
            }
          } catch (error) {
            console.error('Error parsing ShuftiPro response:', error);
            setIsProcessing(false);
            setCurrentStep('result');
            setVerificationResult({
              event: 'error',
              error: 'Failed to parse verification response'
            });

            onComplete({
              status: 'error',
              event: 'error',
              error: 'Failed to parse verification response',
              reference: reference
            });
          }
        }
      );

    } catch (error) {
      // Clear timeouts if they exist
      if (shortTimeoutId) clearTimeout(shortTimeoutId);
      if (mediumTimeoutId) clearTimeout(mediumTimeoutId);
      if (timeoutId) clearTimeout(timeoutId);
      if (forceKillTimeoutId) clearTimeout(forceKillTimeoutId);

      console.error('Error starting verification:', error);
      setIsProcessing(false);
      setCurrentStep('result');
      setVerificationResult({
        event: 'error',
        error: error instanceof Error ? error.message : String(error)
      });

      onComplete({
        status: 'error',
        event: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
  
  // Map language codes
  const getShuftiProLanguage = (lang: string): string => {
    const languageMap: { [key: string]: string } = {
      'en': 'EN',
      'ja': 'JA',
      'zh': 'ZH',
      'ko': 'KO',
      'ar': 'AR',
      'es': 'ES',
      'fr': 'FR',
      'de': 'DE',
      'it': 'IT',
      'pt': 'PT',
      'ru': 'RU',
      'tr': 'TR',
      'vi': 'VI',
      'th': 'TH',
      'id': 'ID',
      'ms': 'MS',
    };
    return languageMap[lang] || 'EN';
  };
  
  // Render camera for document capture with error handling
  const renderCamera = () => {
    // Show permission required message if no permission
    if (!cameraPermission) {
      return (
        <View style={[styles.cameraContainer, { backgroundColor: secondaryColor }]}>
          <ThemedText style={styles.permissionText}>
            Camera permission is required for verification.
          </ThemedText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={onCancel}
          >
            <ThemedText style={styles.buttonText}>Cancel Verification</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    // Safe camera rendering with fallback
    try {
      // Create a safe camera element
      const CameraElement = () => {
        try {
          // Only attempt to render the Camera if we have the right permissions
          if (cameraPermission) {
            return (
              <Camera
                ref={cameraRef}
                style={styles.camera}
                type={currentStep === 'selfie' ? CameraType.front : CameraType.back}
              >
                <View style={styles.cameraOverlay}>
                  <View style={[
                    styles.cameraFrame,
                    currentStep === 'selfie' ? styles.selfieFrame : styles.documentFrame
                  ]} />
                </View>
              </Camera>
            );
          } else {
            // Fallback for no permissions
            return (
              <View style={[styles.camera, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' }]}>
                <ThemedText style={{ textAlign: 'center', margin: 20 }}>
                  Camera permission not granted.
                </ThemedText>
              </View>
            );
          }
        } catch (error) {
          console.error('Error rendering Camera component:', error);
          // Fallback UI when Camera fails to render
          return (
            <View style={[styles.camera, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' }]}>
              <ThemedText style={{ textAlign: 'center', margin: 20 }}>
                Camera could not be initialized. Please use the gallery option.
              </ThemedText>
            </View>
          );
        }
      };

      return (
        <View style={styles.cameraContainer}>
          <CameraElement />

          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => {
                switch (currentStep) {
                  case 'document_front':
                    captureDocumentFront();
                    break;
                  case 'document_back':
                    captureDocumentBack();
                    break;
                  case 'selfie':
                    captureSelfie();
                    break;
                }
              }}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.galleryButton}
              onPress={() => {
                switch (currentStep) {
                  case 'document_front':
                    pickDocumentFront();
                    break;
                  case 'document_back':
                    pickDocumentBack();
                    break;
                  case 'selfie':
                    pickSelfie();
                    break;
                }
              }}
            >
              <ThemedText style={styles.galleryButtonText}>Gallery</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      );
    } catch (error) {
      console.error('Error in renderCamera:', error);
      // Ultimate fallback if everything fails
      return (
        <View style={[styles.cameraContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <ThemedText style={{ textAlign: 'center', margin: 20 }}>
            Camera view could not be displayed. Please use the gallery option.
          </ThemedText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor, marginTop: 20 }]}
            onPress={() => {
              switch (currentStep) {
                case 'document_front':
                  pickDocumentFront();
                  break;
                case 'document_back':
                  pickDocumentBack();
                  break;
                case 'selfie':
                  pickSelfie();
                  break;
              }
            }}
          >
            <ThemedText style={styles.buttonText}>Open Gallery</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }
  };
  
  // Render intro step
  const renderIntro = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.stepContainer}>
        <ThemedText style={styles.title}>Identity Verification</ThemedText>
        <ThemedText style={styles.description}>
          Please prepare the following for verification:
        </ThemedText>
        
        <View style={styles.requirementContainer}>
          <View style={styles.requirementItem}>
            <View style={[styles.requirementIcon, { backgroundColor: primaryColor }]}>
              <ThemedText style={styles.requirementIconText}>📄</ThemedText>
            </View>
            <ThemedText style={styles.requirementText}>Valid ID document (Passport, ID Card, or Driver's License)</ThemedText>
          </View>
          
          <View style={styles.requirementItem}>
            <View style={[styles.requirementIcon, { backgroundColor: primaryColor }]}>
              <ThemedText style={styles.requirementIconText}>📱</ThemedText>
            </View>
            <ThemedText style={styles.requirementText}>This device with a working camera</ThemedText>
          </View>
          
          <View style={styles.requirementItem}>
            <View style={[styles.requirementIcon, { backgroundColor: primaryColor }]}>
              <ThemedText style={styles.requirementIconText}>💡</ThemedText>
            </View>
            <ThemedText style={styles.requirementText}>Good lighting conditions</ThemedText>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={goNext}
          >
            <ThemedText style={styles.buttonText}>Start Verification</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: 'transparent', borderColor: textColor, borderWidth: 1 }]}
            onPress={onCancel}
          >
            <ThemedText style={[styles.buttonText, { color: textColor }]}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );
  
  // Render document type selection step
  const renderDocumentTypeSelection = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.stepContainer}>
        <ThemedText style={styles.title}>Select Document Type</ThemedText>
        <ThemedText style={styles.description}>
          Please select the type of document you will use for verification:
        </ThemedText>
        
        <View style={styles.documentTypeContainer}>
          <TouchableOpacity
            style={[
              styles.documentTypeOption,
              documentType === 'passport' && { borderColor: primaryColor, borderWidth: 2 }
            ]}
            onPress={() => setDocumentType('passport')}
          >
            <ThemedText style={styles.documentTypeIcon}>🛂</ThemedText>
            <ThemedText style={styles.documentTypeText}>Passport</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.documentTypeOption,
              documentType === 'id_card' && { borderColor: primaryColor, borderWidth: 2 }
            ]}
            onPress={() => setDocumentType('id_card')}
          >
            <ThemedText style={styles.documentTypeIcon}>💳</ThemedText>
            <ThemedText style={styles.documentTypeText}>ID Card</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.documentTypeOption,
              documentType === 'driving_license' && { borderColor: primaryColor, borderWidth: 2 }
            ]}
            onPress={() => setDocumentType('driving_license')}
          >
            <ThemedText style={styles.documentTypeIcon}>🚗</ThemedText>
            <ThemedText style={styles.documentTypeText}>Driver's License</ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={goNext}
          >
            <ThemedText style={styles.buttonText}>Continue</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: 'transparent', borderColor: textColor, borderWidth: 1 }]}
            onPress={goBack}
          >
            <ThemedText style={[styles.buttonText, { color: textColor }]}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );
  
  // Render document front capture step with error handling
  const renderDocumentFrontCapture = () => {
    try {
      return (
        <View style={styles.fullScreenContainer}>
          <ThemedView style={styles.captureHeader}>
            <ThemedText style={styles.captureTitle}>
              {documentType === 'passport' ? 'Capture Passport' :
               documentType === 'id_card' ? 'Capture ID Card (Front)' :
               'Capture Driver\'s License (Front)'}
            </ThemedText>
            <ThemedText style={styles.captureDescription}>
              Position the front of your document within the frame and take a picture
            </ThemedText>
          </ThemedView>

          {documentFrontImage ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: documentFrontImage }} style={styles.previewImage} />
              <View style={styles.previewControls}>
                <TouchableOpacity
                  style={[styles.previewButton, { backgroundColor: primaryColor }]}
                  onPress={() => setDocumentFrontImage(null)}
                >
                  <ThemedText style={styles.previewButtonText}>Retake</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.previewButton, { backgroundColor: primaryColor }]}
                  onPress={goNext}
                >
                  <ThemedText style={styles.previewButtonText}>Continue</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            renderCamera()
          )}

          <ThemedView style={styles.captureFooter}>
            <TouchableOpacity
              style={[styles.backButton, { borderColor: textColor }]}
              onPress={goBack}
            >
              <ThemedText style={[styles.backButtonText, { color: textColor }]}>Back</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      );
    } catch (error) {
      console.error('Error rendering document front capture screen:', error);
      // Fallback UI if there's an error
      return (
        <View style={[styles.fullScreenContainer, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <ThemedText style={{ fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
            Camera error detected. Please try again.
          </ThemedText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={goBack}
          >
            <ThemedText style={styles.buttonText}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }
  };
  
  // Render document back capture step with error handling
  const renderDocumentBackCapture = () => {
    try {
      return (
        <View style={styles.fullScreenContainer}>
          <ThemedView style={styles.captureHeader}>
            <ThemedText style={styles.captureTitle}>
              {documentType === 'id_card' ? 'Capture ID Card (Back)' : 'Capture Driver\'s License (Back)'}
            </ThemedText>
            <ThemedText style={styles.captureDescription}>
              Position the back of your document within the frame and take a picture
            </ThemedText>
          </ThemedView>

          {documentBackImage ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: documentBackImage }} style={styles.previewImage} />
              <View style={styles.previewControls}>
                <TouchableOpacity
                  style={[styles.previewButton, { backgroundColor: primaryColor }]}
                  onPress={() => setDocumentBackImage(null)}
                >
                  <ThemedText style={styles.previewButtonText}>Retake</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.previewButton, { backgroundColor: primaryColor }]}
                  onPress={goNext}
                >
                  <ThemedText style={styles.previewButtonText}>Continue</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            renderCamera()
          )}

          <ThemedView style={styles.captureFooter}>
            <TouchableOpacity
              style={[styles.backButton, { borderColor: textColor }]}
              onPress={goBack}
            >
              <ThemedText style={[styles.backButtonText, { color: textColor }]}>Back</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      );
    } catch (error) {
      console.error('Error rendering document back capture screen:', error);
      // Fallback UI if there's an error
      return (
        <View style={[styles.fullScreenContainer, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <ThemedText style={{ fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
            Camera error detected. Please try again.
          </ThemedText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={goBack}
          >
            <ThemedText style={styles.buttonText}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }
  };
  
  // Render selfie capture step with error handling
  const renderSelfieCapture = () => {
    try {
      return (
        <View style={styles.fullScreenContainer}>
          <ThemedView style={styles.captureHeader}>
            <ThemedText style={styles.captureTitle}>Take a Selfie</ThemedText>
            <ThemedText style={styles.captureDescription}>
              Position your face within the frame and take a picture
            </ThemedText>
          </ThemedView>

          {selfieImage ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selfieImage }} style={[styles.previewImage, styles.selfiePreview]} />
              <View style={styles.previewControls}>
                <TouchableOpacity
                  style={[styles.previewButton, { backgroundColor: primaryColor }]}
                  onPress={() => setSelfieImage(null)}
                >
                  <ThemedText style={styles.previewButtonText}>Retake</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.previewButton, { backgroundColor: primaryColor }]}
                  onPress={goNext}
                >
                  <ThemedText style={styles.previewButtonText}>Continue</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            renderCamera()
          )}

          <ThemedView style={styles.captureFooter}>
            <TouchableOpacity
              style={[styles.backButton, { borderColor: textColor }]}
              onPress={goBack}
            >
              <ThemedText style={[styles.backButtonText, { color: textColor }]}>Back</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      );
    } catch (error) {
      console.error('Error rendering selfie capture screen:', error);
      // Fallback UI if there's an error
      return (
        <View style={[styles.fullScreenContainer, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <ThemedText style={{ fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
            Camera error detected. Please try again.
          </ThemedText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={goBack}
          >
            <ThemedText style={styles.buttonText}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }
  };
  
  // Render review step
  const renderReview = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.stepContainer}>
        <ThemedText style={styles.title}>Review and Submit</ThemedText>
        <ThemedText style={styles.description}>
          Please review your documents and selfie before submitting for verification:
        </ThemedText>
        
        <View style={styles.reviewContainer}>
          <View style={styles.reviewItem}>
            <ThemedText style={styles.reviewLabel}>Document Type:</ThemedText>
            <ThemedText style={styles.reviewValue}>
              {documentType === 'passport' ? 'Passport' : 
               documentType === 'id_card' ? 'ID Card' : 
               'Driver\'s License'}
            </ThemedText>
          </View>
          
          <View style={styles.reviewImageContainer}>
            <View style={styles.reviewImageItem}>
              <ThemedText style={styles.reviewImageLabel}>Document Front:</ThemedText>
              <Image source={{ uri: documentFrontImage }} style={styles.reviewImage} />
            </View>
            
            {documentType !== 'passport' && (
              <View style={styles.reviewImageItem}>
                <ThemedText style={styles.reviewImageLabel}>Document Back:</ThemedText>
                <Image source={{ uri: documentBackImage }} style={styles.reviewImage} />
              </View>
            )}
            
            <View style={styles.reviewImageItem}>
              <ThemedText style={styles.reviewImageLabel}>Selfie:</ThemedText>
              <Image source={{ uri: selfieImage }} style={[styles.reviewImage, styles.selfieReview]} />
            </View>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={goNext}
          >
            <ThemedText style={styles.buttonText}>Submit for Verification</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: 'transparent', borderColor: textColor, borderWidth: 1 }]}
            onPress={goBack}
          >
            <ThemedText style={[styles.buttonText, { color: textColor }]}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );
  
  // Render processing step
  const renderProcessing = () => (
    <View style={[styles.processingContainer, { backgroundColor }]}>
      <LoadingIndicator size={60} color={primaryColor} text="Processing verification..." />
      <ThemedText style={styles.processingText}>
        Please wait while we verify your identity. This may take a moment.
      </ThemedText>
    </View>
  );
  
  // Render result step
  const renderResult = () => {
    const isSuccess = verificationResult && 
      (verificationResult.event === 'verification.accepted' || 
       verificationResult.event === 'verification.approved');
    
    const resultColor = isSuccess ? successColor : errorColor;
    const resultIcon = isSuccess ? '✓' : '✗';
    const resultTitle = isSuccess ? 'Verification Successful' : 'Verification Failed';
    const resultMessage = isSuccess ? 
      'Your identity has been successfully verified. Thank you for completing the process.' : 
      'There was an issue with your verification. Please try again or contact support.';
    
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.stepContainer}>
          <View style={[styles.resultIcon, { backgroundColor: resultColor }]}>
            <ThemedText style={styles.resultIconText}>{resultIcon}</ThemedText>
          </View>
          
          <ThemedText style={[styles.title, { color: resultColor }]}>{resultTitle}</ThemedText>
          <ThemedText style={styles.description}>{resultMessage}</ThemedText>
          
          {verificationResult && verificationResult.reference && (
            <View style={styles.referenceContainer}>
              <ThemedText style={styles.referenceLabel}>Reference ID:</ThemedText>
              <ThemedText style={styles.referenceValue}>{verificationResult.reference}</ThemedText>
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: primaryColor }]}
              onPress={isSuccess ? onCancel : resetVerification}
            >
              <ThemedText style={styles.buttonText}>
                {isSuccess ? 'Done' : 'Try Again'}
              </ThemedText>
            </TouchableOpacity>
            
            {!isSuccess && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: 'transparent', borderColor: textColor, borderWidth: 1 }]}
                onPress={onCancel}
              >
                <ThemedText style={[styles.buttonText, { color: textColor }]}>Cancel</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </ThemedView>
      </ScrollView>
    );
  };
  
  // Render current step - wrap in try/catch for extra safety
  try {
    switch (currentStep) {
      case 'intro':
        return renderIntro();
      case 'document_type':
        return renderDocumentTypeSelection();
      case 'document_front':
        return renderDocumentFrontCapture();
      case 'document_back':
        return renderDocumentBackCapture();
      case 'selfie':
        return renderSelfieCapture();
      case 'review':
        return renderReview();
      case 'processing':
        return renderProcessing();
      case 'result':
        return renderResult();
      default:
        return renderIntro();
    }
  } catch (error) {
    console.error('Error rendering KYC flow step:', error);
    return (
      <View style={[styles.fullScreenContainer, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <ThemedText style={{ fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
          An error occurred. Please try again.
        </ThemedText>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: primaryColor }]}
          onPress={onCancel}
        >
          <ThemedText style={styles.buttonText}>Close</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  stepContainer: {
    width: '100%',
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
  requirementContainer: {
    width: '100%',
    marginBottom: 30,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  requirementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  requirementIconText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  requirementText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
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
  documentTypeContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  documentTypeOption: {
    width: '30%',
    aspectRatio: 0.8,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(127, 127, 127, 0.2)',
    marginBottom: 10,
  },
  documentTypeIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  documentTypeText: {
    fontSize: 14,
    textAlign: 'center',
  },
  captureHeader: {
    padding: 15,
    alignItems: 'center',
  },
  captureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  captureDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  captureFooter: {
    padding: 15,
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFrame: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  documentFrame: {
    width: width * 0.8,
    height: width * 0.5,
    borderRadius: 10,
  },
  selfieFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  galleryButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  backButton: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 14,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewImage: {
    width: width * 0.8,
    height: width * 0.5,
    borderRadius: 10,
    marginBottom: 20,
  },
  selfiePreview: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  previewButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewContainer: {
    width: '100%',
    marginBottom: 30,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(127, 127, 127, 0.2)',
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    width: '40%',
  },
  reviewValue: {
    fontSize: 16,
    flex: 1,
  },
  reviewImageContainer: {
    width: '100%',
  },
  reviewImageItem: {
    marginBottom: 20,
  },
  reviewImageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reviewImage: {
    width: '100%',
    height: width * 0.5,
    borderRadius: 10,
  },
  selfieReview: {
    height: width * 0.6,
    width: '60%',
    alignSelf: 'center',
    borderRadius: width * 0.3,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  processingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 24,
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultIconText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  referenceContainer: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(127, 127, 127, 0.2)',
  },
  referenceLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  referenceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
});