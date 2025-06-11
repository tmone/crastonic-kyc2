import React, { useEffect, useState } from 'react';
import { Platform, Alert, View } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShuftiProAuthService } from '@/services/shuftiProAuth';
import ShuftiproReactNativeModule from 'shuftipro-onsite-mobilesdk';

interface ShuftiProIntegrationProps {
  onComplete: (result: any) => void;
  onCancel: () => void;
  onError: (error: any) => void;
}

export function ShuftiProSDKIntegration({ 
  onComplete,
  onCancel,
  onError
}: ShuftiProIntegrationProps) {
  const { actualTheme } = useTheme();
  const { language } = useLanguage();
  const [isStarting, setIsStarting] = useState(false);

  // Start verification when component mounts
  useEffect(() => {
    // Set a flag to track if the component is mounted
    let isMounted = true;

    // Start verification after a short delay to ensure the component is fully mounted
    const initTimer = setTimeout(() => {
      if (isMounted) {
        startVerification();
      }
    }, 300);

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
      clearTimeout(initTimer);
    };
  }, []);

  // Map our language codes to ShuftiPro language codes
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

  // Get localized text for UI elements
  const getLocalizedText = (key: string, lang: string): string => {
    const translations: { [key: string]: { [lang: string]: string } } = {
      camera_instruction: {
        en: "Place your document within the frame",
        ja: "枠内に書類を配置してください",
        zh: "请将您的文件放在框架内",
        vi: "Đặt tài liệu của bạn trong khung",
        ko: "프레임 안에 문서를 배치하세요",
      },
      verification_complete: {
        en: "Thank you",
        ja: "ありがとうございます",
        zh: "谢谢",
        vi: "Cảm ơn bạn",
        ko: "감사합니다",
      },
      thank_you_message: {
        en: "Your verification is complete",
        ja: "認証が完了しました",
        zh: "您的验证已完成",
        vi: "Xác minh của bạn đã hoàn tất",
        ko: "인증이 완료되었습니다",
      },
      done: {
        en: "Done",
        ja: "完了",
        zh: "完成",
        vi: "Hoàn thành",
        ko: "완료",
      },
    };
    
    return translations[key]?.[lang] || translations[key]?.['en'] || key;
  };

  // Start verification using the SDK
  const startVerification = async () => {
    if (isStarting) return;
    setIsStarting(true);

    try {
      console.log(`Starting ShuftiPro verification using direct SDK integration`);

      // Pre-request camera permission on iOS to avoid SDK crash
      if (Platform.OS === 'ios') {
        try {
          const { status } = await Camera.requestCameraPermissionsAsync();
          console.log(`Camera permission status: ${status}`);

          // If permission denied, don't proceed with SDK
          if (status !== 'granted') {
            throw new Error('Camera permission is required for verification');
          }
        } catch (permissionError) {
          console.warn('Error requesting camera permission:', permissionError);
          // Continue anyway, the SDK will handle permissions itself
        }
      }

      // Get credentials from auth service
      const credentials = ShuftiProAuthService.getCredentials();

      if (!credentials.clientId || !credentials.secretKey) {
        throw new Error('ShuftiPro credentials not found');
      }

      // Create a reference ID
      const reference = `REF-${Date.now()}`;

      // Simplified verification object with minimal required fields
      // This reduces chance of configuration errors and avoids camera helper popup
      const verificationObject = {
        reference,
        country: "",
        language: getShuftiProLanguage(language),
        verification_mode: "image_only", // Use image_only to avoid video mode which can crash
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
          supported_types: ["passport", "id_card", "driving_license"],
          name: {
            first_name: "",
            last_name: ""
          },
          backside_proof_required: 1,
          allow_offline: 0,    // Don't allow offline mode which can cause issues
          show_3d_motion: 0,   // Disable 3D motion detection which can cause crashes
          show_instruction_screens: 0 // Disable instruction screens that can cause crashes
        }
      };

      // Auth object - This contains the authentication credentials
      const authObject = {
        auth_type: "basic_auth",
        client_id: credentials.clientId,
        secret_key: credentials.secretKey,
      };

      // Simplified config object with minimal required fields
      // Using different formats for different platforms to maximize compatibility
      let configObject;

      // Use simplified config objects for better stability
      if (Platform.OS === 'ios') {
        configObject = {
          async: false,
          captureEnabled: true,
          dark_mode: actualTheme === 'dark' ? 1 : 0,
          language: getShuftiProLanguage(language),
          show_consent: 1,
          show_privacy_policy: 1,
          show_results: 1,
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
        };
      } else {
        // Android config with stability options
        configObject = {
          async: false,
          captureEnabled: true,
          dark_mode: actualTheme === 'dark',
          language: getShuftiProLanguage(language),
          show_consent_screen: true,
          show_privacy_policy: true,
          show_results_screen: true,
          show_header: true,
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
      }

      // Check if the module is available
      if (!ShuftiproReactNativeModule) {
        throw new Error('ShuftiPro SDK module not found');
      }

      // Log objects for debugging (remove in production)
      console.log('Verification Object:', JSON.stringify(verificationObject));
      console.log('Auth Object:', JSON.stringify(authObject));
      console.log('Config Object:', JSON.stringify(configObject));

      // Wrap in a try-catch to prevent app crashes
      try {
        // Call the SDK's verify method with a safety timeout
        console.log('Calling ShuftiPro SDK verify method');

        // Create a promise that resolves if the callback is called
        const verificationPromise = new Promise<void>((resolve) => {
          ShuftiproReactNativeModule.verify(
            JSON.stringify(verificationObject),
            JSON.stringify(authObject),
            JSON.stringify(configObject),
            (response: string) => {
              try {
                console.log('Raw ShuftiPro response:', response);

                // Parse the response
                const parsedResponse = typeof response === 'string'
                  ? JSON.parse(response)
                  : response;

                console.log('ShuftiPro SDK Response:', parsedResponse);

                // Handle different event types
                if (parsedResponse.event === 'verification.accepted' ||
                    parsedResponse.event === 'verification.approved') {
                  onComplete(parsedResponse);
                } else if (parsedResponse.event === 'verification.declined') {
                  onError(parsedResponse);
                } else if (parsedResponse.event === 'verification.cancelled') {
                  onCancel();
                } else if (parsedResponse.event === 'error') {
                  onError(parsedResponse);
                } else {
                  // Unknown event type
                  console.warn('Unknown event type:', parsedResponse.event);
                  onError(parsedResponse);
                }
              } catch (error) {
                console.error('Error parsing ShuftiPro response:', error);
                onError({ event: 'error', error: 'Failed to parse SDK response' });
              } finally {
                setIsStarting(false);
                resolve();
              }
            }
          );
        });

        // Set multiple timeouts to catch different types of freezes
        const shortTimeoutId = setTimeout(() => {
          console.log('ShuftiPro SDK first checkpoint - 5 seconds');
        }, 5000);

        const mediumTimeoutId = setTimeout(() => {
          console.log('ShuftiPro SDK second checkpoint - 10 seconds');
        }, 10000);

        const timeoutId = setTimeout(() => {
          if (isStarting) {
            console.warn('ShuftiPro SDK verification timeout - 15 seconds');
            setIsStarting(false);
            onError({
              event: 'error',
              error: 'Verification timeout - SDK did not respond'
            });
          }
        }, 15000); // 15 second timeout

        // Add a force kill timeout that will always trigger even if promise resolves
        // This handles cases where the SDK appears to complete but remains frozen
        const forceKillTimeoutId = setTimeout(() => {
          console.warn('Force killing SDK session after 25 seconds to prevent hanging');
          if (isStarting) {
            setIsStarting(false);
            onError({
              event: 'error',
              error: 'Verification timeout - forced termination to prevent hanging'
            });
          }
        }, 25000);

        // Cleanup the timeouts if the promise resolves
        verificationPromise.finally(() => {
          clearTimeout(shortTimeoutId);
          clearTimeout(mediumTimeoutId);
          clearTimeout(timeoutId);
          // Note: we don't clear forceKillTimeoutId to ensure it always runs

          // Set a final cleanup timeout to ensure we're not stuck
          setTimeout(() => {
            if (isStarting) {
              console.warn('Final cleanup - forcing termination');
              setIsStarting(false);
              onError({
                event: 'error',
                error: 'Verification never properly completed'
              });
            }
          }, 2000);
        });
      } catch (sdkError) {
        console.error('Exception during SDK verification call:', sdkError);
        setIsStarting(false);
        onError({
          event: 'error',
          error: sdkError instanceof Error ? sdkError.message : String(sdkError)
        });
      }
    } catch (error) {
      console.error('Error starting ShuftiPro verification:', error);
      setIsStarting(false);
      onError({ event: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  };

  // Return a container view to ensure proper view hierarchy for SDK UI
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: actualTheme === 'dark' ? '#111115' : '#FFFFFF'
      }}
    />
  );
}