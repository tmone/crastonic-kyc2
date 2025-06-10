import { NativeModules, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShuftiProAuthService } from '@/services/shuftiProAuth';

// Check if the native module is available
const ShuftiproReactNativeModule = NativeModules.ShuftiproReactNativeModule;
const isSDKAvailable = ShuftiproReactNativeModule != null;

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
    if (!isSDKAvailable) {
      console.warn('ShuftiPro SDK is not available. This typically happens when:');
      console.warn('1. Running in Expo Go (SDK requires custom native code)');
      console.warn('2. The native module is not properly linked');
      console.warn('3. Running on web platform');
      console.warn('Please use Expo Development Build or eject to use the SDK.');
      return false;
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
    // Check if SDK is available
    if (!checkSDKAvailability()) {
      onResult({
        event: 'error',
        error: 'SDK not available. Please use WebView fallback.',
      });
      return;
    }

    try {
      // Get credentials
      const credentials = ShuftiProAuthService.getCredentials();
      
      // Configuration object with proper dark mode and language settings
      const configObject = {
        base_url: "api.shuftipro.com",
        consent_age: 16,
        show_consent_screen: true,
        show_results_screen: true,
        show_header: true,
        open_webview: false,
        async: false,
        captureEnabled: true,
        
        // Dark mode configuration
        dark_mode_enabled: actualTheme === 'dark',
        
        // Language configuration
        language: getShuftiProLanguage(language),
        
        // Theme colors based on dark/light mode
        theme_color: "#0a7ea4",
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
        
        // Localized text
        camera_screen_title_text: getLocalizedText('camera_instruction', language),
        thanks_screen_title: getLocalizedText('verification_complete', language),
        thanks_screen_subtitle: getLocalizedText('thank_you_message', language),
        thanks_screen_button_text: getLocalizedText('done', language),
      };

      // Auth object using basic auth
      const authObject = {
        auth_type: "basic_auth",
        client_id: credentials.clientId,
        secret_key: credentials.secretKey,
      };

      // Verification object
      const verificationObject = {
        reference: `REF-${Date.now()}`,
        country: "",
        language: getShuftiProLanguage(language),
        email: "",
        callback_url: "",
        verification_mode: "image_only",
        show_privacy_policy: true,
        
        // Face verification
        face: {
          proof: "",
        },
        
        // Document verification
        document: {
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
        },
      };

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

  return {
    startVerificationWithJourney,
    startVerificationWithCredentials,
    startVerificationWithAuth,
    isSDKAvailable,
  };
}