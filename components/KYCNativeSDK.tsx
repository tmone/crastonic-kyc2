import { NativeModules } from 'react-native';
const { ShuftiproReactNativeModule } = NativeModules;

interface KYCNativeSDKProps {
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
  reference?: string;
}

export function startKYCNativeVerification({ onSuccess, onError, reference }: KYCNativeSDKProps) {
  // Configuration for ShuftiPro
  const configObject = {
    open_webview: false,
    show_header: true,
    dark_mode: false,
    language: "EN",
    verification_mode: "image_only",
    show_privacy_policy: true,
    privacy_policy_url: "https://www.shuftipro.com/privacy-policy",
    show_results_screen: true,
    loading_text: "Processing your verification...",
    user_consent: true,
    user_consent_content: "I agree to verify my identity",
    play_capture_sound: false,
    vibrate_on_capture: true,
  };

  // Auth object - You'll need to provide your credentials
  const authObject = {
    auth_type: "basic_auth",
    client_id: "21178caf22354d71b7e9f32ca8bfcd07d1d4846298af39366977ef9b595ff890", // Replace with your actual client ID
    secret_key: "PW2VftETSNAtLrwdjomnWJyfjpzLGvTl" // Replace with your actual secret key
  };

  // Verification object
  const verificationObject = {
    reference: reference || `REF-${Date.now()}`,
    country: "",
    language: "EN",
    email: "",
    callback_url: "https://your-callback-url.com",
    redirect_url: "",
    show_consent: true,
    show_results: true,
    verification_mode: "image_only",
    show_privacy_policy: true,
    
    // Document verification
    document: {
      supported_types: ["passport", "id_card", "driving_license"],
      name: {
        first_name: "",
        middle_name: "",
        last_name: "",
        full_name: ""
      },
      dob: "",
      document_number: "",
      expiry_date: "",
      issue_date: "",
      gender: "",
      backside_proof_required: true,
      fetch_enhanced_data: ""
    },
    
    // Face verification
    face: {
      proof: ""
    }
  };

  // Start verification
  ShuftiproReactNativeModule.verify(
    JSON.stringify(verificationObject),
    JSON.stringify(authObject),
    JSON.stringify(configObject),
    (response: string) => {
      try {
        const parsedResponse = JSON.parse(response);
        const event = parsedResponse.event;
        
        console.log('ShuftiPro Event:', event, parsedResponse);
        
        // Handle different events
        switch (event) {
          case "verification.accepted":
            onSuccess(parsedResponse);
            break;
          
          case "verification.declined":
          case "verification.cancelled":
            onError(parsedResponse);
            break;
          
          case "verification.status.changed":
            // Handle status update
            console.log('Status changed:', parsedResponse);
            break;
          
          default:
            console.log('Unknown event:', event);
        }
      } catch (error) {
        console.error('Error parsing ShuftiPro response:', error);
        onError(error);
      }
    }
  );
}

// Alternative method using access token from your journey URL
export function startKYCWithJourneyToken(journeyUrl: string, onSuccess: (data: any) => void, onError: (error: any) => void) {
  // Extract the token from the journey URL
  const urlParts = journeyUrl.split('/');
  const journeyToken = urlParts[urlParts.length - 1];
  
  const authObject = {
    auth_type: "access_token",
    access_token: journeyToken
  };
  
  const configObject = {
    open_webview: false,
    show_header: true,
    dark_mode: false,
    show_results_screen: true,
  };
  
  // Minimal verification object when using journey token
  const verificationObject = {
    journey_id: journeyToken,
  };
  
  ShuftiproReactNativeModule.verify(
    JSON.stringify(verificationObject),
    JSON.stringify(authObject),
    JSON.stringify(configObject),
    (response: string) => {
      try {
        const parsedResponse = JSON.parse(response);
        const event = parsedResponse.event;
        
        if (event === "verification.accepted") {
          onSuccess(parsedResponse);
        } else if (event === "verification.declined" || event === "verification.cancelled") {
          onError(parsedResponse);
        }
      } catch (error) {
        onError(error);
      }
    }
  );
}