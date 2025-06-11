import { NativeModules, Platform, PermissionsAndroid, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShuftiProAuthService } from '@/services/shuftiProAuth';

// Access the ShuftiPro module safely with better error handling
const ShuftiproReactNativeModule = NativeModules.ShuftiproReactNativeModule || null;

// Log if the module is found
if (ShuftiproReactNativeModule) {
  console.log('ShuftiPro native module found');
} else {
  console.warn('ShuftiPro native module not found');
}

// Check if the SDK is available based on platform and module existence
const isSDKAvailable = (() => {
  if (Platform.OS === 'web') {
    return false;
  }

  const isModuleAvailable = !!ShuftiproReactNativeModule;

  // For Android, we're using our custom implementation so it should be available
  if (Platform.OS === 'android') {
    console.log('Using custom ShuftiPro implementation for Android');
    return isModuleAvailable;
  }

  // For iOS, check if the module is available
  if (!isModuleAvailable) {
    console.warn('ShuftiPro native module not found. Verification will use WebView fallback.');
  }

  return isModuleAvailable;
})();

interface ShuftiProConfig {
  clientId?: string;
  secretKey?: string;
  accessToken?: string;
  journeyUrl?: string;
}

interface VerificationResult {
  event: string;
  verification_url?: string;
  reference?: string;
  verification_result?: any;
  error?: any;
}

export function useShuftiProSDK() {
  const { actualTheme } = useTheme();
  const { language } = useLanguage();

  // Check if SDK is available
  const checkSDKAvailability = (): boolean => {
    if (Platform.OS === 'web') {
      console.warn('ShuftiPro SDK is not available on web platform');
      return false;
    }

    // Always try to use SDK if we're on a native platform
    // Native module might fail on runtime but we'll handle that with a try/catch
    if (!ShuftiproReactNativeModule) {
      console.warn('ShuftiPro native module not found, but we will try anyway');
      console.warn('Check that the MainActivity properly extends ReactActivity');
      console.warn('And that ShuftiProSDK is properly linked');
    }

    return true;
  };

  // Extract journey ID from URL
  const extractJourneyId = (url: string): string => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

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

  // Get localized text for ShuftiPro screens
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

  const startVerificationWithJourney = async (
    journeyUrl: string,
    onResult: (result: VerificationResult) => void
  ) => {
    // Check if SDK is available
    if (!checkSDKAvailability()) {
      onResult({
        event: 'error',
        error: 'SDK not available. Please use WebView fallback.',
      });
      return;
    }

    try {
      // Extract journey ID from URL
      const journeyId = extractJourneyId(journeyUrl);
      
      // Configuration object with proper dark mode and language settings
      const configObject = {
        base_url: "api.shuftipro.com",
        consent_age: 16,
        show_consent_screen: true,
        show_results_screen: true,
        show_header: true,
        open_webview: false,
        
        // Dark mode configuration
        dark_mode_enabled: actualTheme === 'dark',
        
        // Language configuration - must be in verification object AND config
        language: getShuftiProLanguage(language),
        
        // Theme colors based on dark/light mode
        theme_color: "#0a7ea4", // Your app's primary color
        theme_background_color: actualTheme === 'dark' ? "#111115" : "#FFFFFF",
        background_color: actualTheme === 'dark' ? "#111115" : "#FFFFFF",
        card_background_color: actualTheme === 'dark' ? "#1D1D21" : "#F5F5F5",
        
        // Text colors
        font_color: actualTheme === 'dark' ? "#FFFFFF" : "#000000",
        heading_text_color: actualTheme === 'dark' ? "#FFFFFF" : "#000000",
        sub_heading_text_color: actualTheme === 'dark' ? "#CCCCCC" : "#666666",
        loader_text_color: actualTheme === 'dark' ? "#FFFFFF" : "#000000",
        
        // UI element colors
        icon_color: actualTheme === 'dark' ? "#0a7ea4" : "#0a7ea4",
        loader_color: "#0a7ea4",
        stroke_color: actualTheme === 'dark' ? "#333333" : "#E5E5E5",
        
        // Button styling
        button_background_color: "#0a7ea4",
        button_text_color: "#FFFFFF",
        
        // Header styling
        header_color: actualTheme === 'dark' ? "#1D1D21" : "#0a7ea4",
        header_text_color: "#FFFFFF",
        shuftipro_light_icon: actualTheme === 'dark',
        
        // Other settings
        play_capture_sound: false,
        vibrate_on_capture: true,
        countdown_timer: 30,
        auto_capture_enabled: true,
        
        // Localized text based on language
        camera_screen_title_text: getLocalizedText('camera_instruction', language),
        thanks_screen_title: getLocalizedText('verification_complete', language),
        thanks_screen_subtitle: getLocalizedText('thank_you_message', language),
        thanks_screen_button_text: getLocalizedText('done', language),
      };

      // Auth object using journey token
      const authObject = {
        auth_type: "access_token",
        access_token: journeyId,
      };

      // Verification object for journey
      const verificationObject = {
        journey_id: journeyId,
        reference: `REF-${Date.now()}`,
      };

      console.log('Starting ShuftiPro verification with journey:', journeyId);

      // Call the native module
      ShuftiproReactNativeModule.verify(
        JSON.stringify(verificationObject),
        JSON.stringify(authObject),
        JSON.stringify(configObject),
        (response: string) => {
          try {
            const parsedResponse = JSON.parse(response);
            console.log('ShuftiPro Response:', parsedResponse);
            onResult(parsedResponse);
          } catch (error) {
            console.error('Error parsing ShuftiPro response:', error);
            onResult({
              event: 'error',
              error: error,
            });
          }
        }
      );
    } catch (error) {
      console.error('Error starting ShuftiPro verification:', error);
      onResult({
        event: 'error',
        error: error,
      });
    }
  };

  const startVerificationWithCredentials = async (
    clientId: string,
    secretKey: string,
    verificationType: {
      face?: boolean;
      document?: boolean;
      address?: boolean;
      consent?: boolean;
    },
    onResult: (result: VerificationResult) => void
  ) => {
    // Check if SDK is available
    if (!checkSDKAvailability()) {
      onResult({
        event: 'error',
        error: 'SDK not available. Please use WebView fallback.',
      });
      return;
    }

    try {
      // Configuration object
      const configObject = {
        base_url: "api.shuftipro.com",
        consent_age: 16,
        show_consent_screen: true,
        show_results_screen: true,
        show_header: true,
        open_webview: false,
        dark_mode: actualTheme === 'dark',
        language: getShuftiProLanguage(language),
        async: false,
        captureEnabled: true,
      };

      // Auth object using basic auth
      const authObject = {
        auth_type: "basic_auth",
        client_id: clientId,
        secret_key: secretKey,
      };

      // Build verification object based on requested types
      const verificationObject: any = {
        reference: `REF-${Date.now()}`,
        country: "",
        language: getShuftiProLanguage(language),
        email: "",
        callback_url: "",
        verification_mode: "image_only",
        show_privacy_policy: true,
      };

      if (verificationType.face) {
        verificationObject.face = {
          proof: "",
        };
      }

      if (verificationType.document) {
        verificationObject.document = {
          supported_types: ["passport", "id_card", "driving_license"],
          name: {
            first_name: "",
            middle_name: "",
            last_name: "",
          },
          dob: "",
          document_number: "",
          expiry_date: "",
          issue_date: "",
          backside_proof_required: true,
        };
      }

      if (verificationType.address) {
        verificationObject.address = {
          supported_types: ["utility_bill", "bank_statement"],
          name: {
            first_name: "",
            middle_name: "",
            last_name: "",
          },
        };
      }

      console.log('Starting ShuftiPro verification with credentials');

      // Call the native module
      ShuftiproReactNativeModule.verify(
        JSON.stringify(verificationObject),
        JSON.stringify(authObject),
        JSON.stringify(configObject),
        (response: string) => {
          try {
            const parsedResponse = JSON.parse(response);
            console.log('ShuftiPro Response:', parsedResponse);
            onResult(parsedResponse);
          } catch (error) {
            console.error('Error parsing ShuftiPro response:', error);
            onResult({
              event: 'error',
              error: error,
            });
          }
        }
      );
    } catch (error) {
      console.error('Error starting ShuftiPro verification:', error);
      onResult({
        event: 'error',
        error: error,
      });
    }
  };

  const startVerificationWithAuth = async (
    onResult: (result: VerificationResult) => void
  ) => {
    console.log('Starting ShuftiPro verification with auth...');

    try {
      // Get credentials
      const credentials = ShuftiProAuthService.getCredentials();
      console.log('Got credentials:', credentials.clientId ? 'ClientID exists' : 'No ClientID');

      // If running on a web platform, show error and return
      if (Platform.OS === 'web') {
        throw new Error('ShuftiPro SDK is not available on web platforms');
      }

      // Platform-specific permission handling
      if (Platform.OS === 'android') {
        // Handle Android permissions (already implemented in kyc.tsx)
        const permissions = [
          'android.permission.CAMERA'
        ];

        // Add storage permissions based on Android version
        if (Platform.Version >= 33) {
          permissions.push('android.permission.READ_MEDIA_IMAGES');
        } else {
          permissions.push(
            'android.permission.READ_EXTERNAL_STORAGE',
            'android.permission.WRITE_EXTERNAL_STORAGE'
          );
        }

        // Request permissions
        for (const permission of permissions) {
          const granted = await PermissionsAndroid.request(
            permission,
            {
              title: "KYC Verification Permission",
              message: "We need access to your camera and storage to complete verification",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
          console.log(`Permission ${permission}: ${granted}`);

          // If camera permission is denied, we can't continue
          if (granted !== 'granted' && permission === 'android.permission.CAMERA') {
            throw new Error('Camera permission is required for verification');
          }
        }
      } else if (Platform.OS === 'ios') {
        // iOS handles permissions automatically when needed via Info.plist
        console.log('iOS will request permissions as needed');
      }

      // Create a more comprehensive configuration object based on platform
      const configObject = {
        async: false,
        captureEnabled: true,
        dark_mode: actualTheme === 'dark',
        dark_mode_enabled: actualTheme === 'dark', // iOS variant
        language: getShuftiProLanguage(language),
        show_consent_screen: true,
        show_privacy_policy: true,
        show_results_screen: true,
        base_url: "api.shuftipro.com",

        // iOS-specific theme properties
        ...(Platform.OS === 'ios' ? {
          theme_color: "#0a7ea4", // Primary app color
          theme_background_color: actualTheme === 'dark' ? "#111115" : "#FFFFFF",
          background_color: actualTheme === 'dark' ? "#111115" : "#FFFFFF",
          card_background_color: actualTheme === 'dark' ? "#1D1D21" : "#F5F5F5",

          // Text colors
          font_color: actualTheme === 'dark' ? "#FFFFFF" : "#000000",
          heading_text_color: actualTheme === 'dark' ? "#FFFFFF" : "#000000",
          sub_heading_text_color: actualTheme === 'dark' ? "#CCCCCC" : "#666666",

          // UI element colors
          icon_color: "#0a7ea4",
          button_background_color: "#0a7ea4",
          button_text_color: "#FFFFFF",

          // Header styling
          header_color: actualTheme === 'dark' ? "#1D1D21" : "#0a7ea4",
          header_text_color: "#FFFFFF",

          // Localized text based on language
          camera_screen_title_text: getLocalizedText('camera_instruction', language),
          thanks_screen_title: getLocalizedText('verification_complete', language),
          thanks_screen_subtitle: getLocalizedText('thank_you_message', language),
          thanks_screen_button_text: getLocalizedText('done', language),
        } : {})
      };

      // Auth object using basic auth
      const authObject = {
        auth_type: "basic_auth",
        client_id: credentials.clientId,
        secret_key: credentials.secretKey,
      };

      // Basic verification object with required fields
      const verificationObject = {
        reference: `REF-${Date.now()}`,
        country: "",
        language: getShuftiProLanguage(language),
        verification_mode: "any",
        face: { proof: "" },
        document: {
          supported_types: ["passport", "id_card", "driving_license"],
          name: { first_name: "", last_name: "" },
          dob: "",
          document_number: "",
          backside_proof_required: true
        }
      };

      // Check if the native module is available
      if (!ShuftiproReactNativeModule) {
        console.error('ShuftiPro native module not found!');
        throw new Error('ShuftiPro SDK not available - module not found');
      }

      console.log(`Calling native SDK on ${Platform.OS} with verification, auth, and config objects`);

      // Call the native module
      ShuftiproReactNativeModule.verify(
        JSON.stringify(verificationObject),
        JSON.stringify(authObject),
        JSON.stringify(configObject),
        (response: string) => {
          console.log('SDK Response received');
          try {
            // Parse the response
            const parsedResponse = JSON.parse(response);
            console.log('SDK Response:', parsedResponse);
            onResult(parsedResponse);
          } catch (error) {
            console.error('Error parsing SDK response:', error);
            onResult({
              event: 'error',
              error: 'Failed to parse SDK response'
            });
          }
        }
      );

      console.log('SDK verification started successfully');
    } catch (error) {
      console.error('Error in ShuftiPro verification:', error);
      onResult({
        event: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  return {
    startVerificationWithJourney,
    startVerificationWithCredentials,
    startVerificationWithAuth,
    isSDKAvailable,
  };
}