/**
 * Sample ShuftiPro SDK Implementation
 * This file demonstrates different ways to use the ShuftiPro SDK
 */

import { NativeModules } from 'react-native';
const { ShuftiproReactNativeModule } = NativeModules;

// Example 1: Using Journey URL (Your current use case)
export function verifyWithJourneyURL() {
  const journeyUrl = 'https://app.shuftipro.com/verification/process/4mjladGERNsawA4sEMzAF26OlLu94Cm4uXRCDrtMynHhMDTMClD7caaEmoc7fKI6';
  const journeyId = journeyUrl.split('/').pop(); // Extract journey ID
  
  const authObject = {
    auth_type: "access_token",
    access_token: journeyId
  };
  
  const configObject = {
    base_url: "api.shuftipro.com",
    consent_age: 16,
    show_consent_screen: true,
    show_results_screen: true,
    show_header: true,
    dark_mode: false,
    language: "EN",
    open_webview: false, // Important: Use native SDK, not webview
  };
  
  const verificationObject = {
    journey_id: journeyId,
    reference: `REF-${Date.now()}`
  };
  
  ShuftiproReactNativeModule.verify(
    JSON.stringify(verificationObject),
    JSON.stringify(authObject),
    JSON.stringify(configObject),
    (response) => {
      const result = JSON.parse(response);
      console.log('Verification Result:', result);
      
      // Handle different events
      switch (result.event) {
        case 'verification.accepted':
          console.log('✅ Verification successful!');
          break;
        case 'verification.declined':
          console.log('❌ Verification declined');
          break;
        case 'verification.cancelled':
          console.log('🚫 User cancelled verification');
          break;
      }
    }
  );
}

// Example 2: Using Client Credentials (Basic Auth)
export function verifyWithCredentials() {
  const authObject = {
    auth_type: "basic_auth",
    client_id: "21178caf22354d71b7e9f32ca8bfcd07d1d4846298af39366977ef9b595ff890",
    secret_key: "PW2VftETSNAtLrwdjomnWJyfjpzLGvTl"
  };
  
  const configObject = {
    base_url: "api.shuftipro.com",
    consent_age: 16,
    show_consent_screen: true,
    show_results_screen: true,
    show_header: true,
    open_webview: false,
    async: false,
    captureEnabled: true,
    language: "EN",
    verification_mode: "image_only",
  };
  
  const verificationObject = {
    reference: `REF-${Date.now()}`,
    country: "",
    language: "EN",
    email: "user@example.com",
    callback_url: "https://your-server.com/callback",
    
    // Face verification
    face: {
      proof: ""
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
    
    // Address verification
    address: {
      supported_types: ["utility_bill", "bank_statement"],
      name: {
        first_name: "",
        middle_name: "",
        last_name: "",
      },
    }
  };
  
  ShuftiproReactNativeModule.verify(
    JSON.stringify(verificationObject),
    JSON.stringify(authObject),
    JSON.stringify(configObject),
    (response) => {
      const result = JSON.parse(response);
      console.log('Verification Result:', result);
    }
  );
}

// Example 3: Customized UI Configuration
export function verifyWithCustomUI() {
  const authObject = {
    auth_type: "access_token",
    access_token: "YOUR_ACCESS_TOKEN"
  };
  
  const configObject = {
    base_url: "api.shuftipro.com",
    consent_age: 16,
    show_consent_screen: true,
    show_results_screen: true,
    show_header: true,
    header_text_color: "#FFFFFF",
    header_color: "#2B7EFB",
    dark_mode: false,
    language: "EN",
    font_color: "#000000",
    button_background_color: "#2B7EFB",
    button_text_color: "#FFFFFF",
    heading_text_color: "#000000",
    sub_heading_text_color: "#666666",
    theme_color: "#2B7EFB",
    icon_color: "#2B7EFB",
    background_color: "#FFFFFF",
    stroke_color: "#E5E5E5",
    shuftipro_light_icon: false,
    play_capture_sound: false,
    vibrate_on_capture: true,
    countdown_timer: 30,
    auto_capture_enabled: true,
    camera_screen_title_text: "Place your document within the frame",
    thanks_screen_title: "Thank you",
    thanks_screen_subtitle: "Your verification is complete",
    thanks_screen_button_text: "Done",
  };
  
  const verificationObject = {
    reference: `REF-${Date.now()}`,
    face: { proof: "" },
    document: {
      supported_types: ["passport", "id_card"],
      backside_proof_required: true,
    }
  };
  
  ShuftiproReactNativeModule.verify(
    JSON.stringify(verificationObject),
    JSON.stringify(authObject),
    JSON.stringify(configObject),
    (response) => {
      const result = JSON.parse(response);
      console.log('Verification Result:', result);
    }
  );
}

// Example 4: Handle All Events
export function verifyWithFullEventHandling(journeyUrl) {
  const journeyId = journeyUrl.split('/').pop();
  
  const authObject = {
    auth_type: "access_token",
    access_token: journeyId
  };
  
  const configObject = {
    base_url: "api.shuftipro.com",
    show_results_screen: true,
    open_webview: false,
  };
  
  const verificationObject = {
    journey_id: journeyId,
  };
  
  ShuftiproReactNativeModule.verify(
    JSON.stringify(verificationObject),
    JSON.stringify(authObject),
    JSON.stringify(configObject),
    (response) => {
      const result = JSON.parse(response);
      
      switch (result.event) {
        case 'request.pending':
          console.log('⏳ Verification request pending');
          break;
          
        case 'request.invalid':
          console.log('❌ Invalid request:', result.error);
          break;
          
        case 'request.timeout':
          console.log('⏰ Request timeout');
          break;
          
        case 'request.unauthorized':
          console.log('🔒 Unauthorized request');
          break;
          
        case 'verification.accepted':
          console.log('✅ Verification accepted');
          console.log('Reference:', result.reference);
          console.log('Verification URL:', result.verification_url);
          break;
          
        case 'verification.declined':
          console.log('❌ Verification declined');
          console.log('Reason:', result.declined_reason);
          break;
          
        case 'verification.cancelled':
          console.log('🚫 User cancelled');
          break;
          
        case 'permission.denied':
          console.log('📵 Permission denied (camera/storage)');
          break;
          
        default:
          console.log('Unknown event:', result.event);
      }
    }
  );
}