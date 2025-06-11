// ShuftiPro Direct API Integration
import { Platform } from 'react-native';
import { ShuftiProAuthService } from './shuftiProAuth';

// Define verification types
export type VerificationType = 'document' | 'face' | 'address' | 'background_checks';

// Define document types
export type DocumentType = 'passport' | 'id_card' | 'driving_license' | 'credit_or_debit_card';

// Define verification mode
export type VerificationMode = 'any' | 'image' | 'video';

// Define verification status
export type VerificationStatus = 
  | 'pending' 
  | 'in_progress'
  | 'declined'
  | 'approved'
  | 'verified'
  | 'error';

// Define verification result
export interface VerificationResult {
  status: VerificationStatus;
  reference?: string;
  verification_result?: any;
  verification_data?: any;
  event?: string;
  error?: any;
}

// Define verification request
export interface VerificationRequest {
  reference: string;
  country?: string;
  language: string;
  email?: string;
  callback_url?: string;
  redirect_url?: string;
  verification_mode: VerificationMode;
  show_privacy_policy?: boolean;
  show_results?: boolean;
  show_consent?: boolean;
  face?: {
    proof: string;
  };
  document?: {
    supported_types: DocumentType[];
    name: {
      first_name: string;
      middle_name?: string;
      last_name: string;
    };
    dob?: string;
    document_number?: string;
    expiry_date?: string;
    issue_date?: string;
    backside_proof_required?: boolean;
  };
  address?: {
    supported_types: string[];
    name: {
      first_name: string;
      middle_name?: string;
      last_name: string;
    };
    full_address?: string;
  };
  background_checks?: {
    name: {
      first_name: string;
      middle_name?: string;
      last_name: string;
    };
    dob?: string;
  };
}

export class ShuftiProDirectApi {
  private static BASE_URL = 'https://api.shuftipro.com';
  private static VERIFICATION_URL = '/api/request/verification';

  /**
   * Create a verification request using the ShuftiPro API
   * @param verificationTypes Array of verification types to include
   * @param language Language code for verification UI
   * @returns Promise with verification result
   */
  static async createVerification(
    verificationTypes: VerificationType[],
    language: string = 'en'
  ): Promise<VerificationResult> {
    try {
      // Get access token
      const accessToken = await ShuftiProAuthService.getAccessToken();

      // Create verification reference
      const reference = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Create verification request
      const request: VerificationRequest = {
        reference,
        language,
        verification_mode: 'any', // Allow both image and video
        show_privacy_policy: true,
        show_results: true,
        show_consent: true,
      };

      // Add verification types
      if (verificationTypes.includes('document')) {
        request.document = {
          supported_types: ['passport', 'id_card', 'driving_license'],
          name: {
            first_name: '',
            last_name: '',
          },
          backside_proof_required: true
        };
      }

      if (verificationTypes.includes('face')) {
        request.face = {
          proof: ''
        };
      }

      if (verificationTypes.includes('address')) {
        request.address = {
          supported_types: ['utility_bill', 'bank_statement'],
          name: {
            first_name: '',
            last_name: '',
          }
        };
      }

      // Make API request
      const response = await fetch(`${this.BASE_URL}${this.VERIFICATION_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(request)
      });

      // Parse response
      const data = await response.json();

      if (response.ok) {
        return {
          status: 'in_progress',
          reference,
          verification_data: data
        };
      } else {
        console.error('ShuftiPro API error:', data);
        return {
          status: 'error',
          error: data,
          reference
        };
      }
    } catch (error) {
      console.error('Error creating verification:', error);
      return {
        status: 'error',
        error
      };
    }
  }

  /**
   * Check the status of a verification request
   * @param reference Verification reference
   * @returns Promise with verification status
   */
  static async checkVerificationStatus(reference: string): Promise<VerificationResult> {
    try {
      // Get access token
      const accessToken = await ShuftiProAuthService.getAccessToken();

      // Make API request
      const response = await fetch(`${this.BASE_URL}/api/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          reference
        })
      });

      // Parse response
      const data = await response.json();

      if (response.ok) {
        // Map the API status to our VerificationStatus type
        let status: VerificationStatus = 'pending';
        
        if (data.event === 'verification.accepted') {
          status = 'verified';
        } else if (data.event === 'verification.declined') {
          status = 'declined';
        } else if (data.event === 'verification.pending') {
          status = 'in_progress';
        }

        return {
          status,
          reference,
          verification_result: data,
          event: data.event
        };
      } else {
        console.error('ShuftiPro API error:', data);
        return {
          status: 'error',
          error: data,
          reference
        };
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      return {
        status: 'error',
        error,
        reference
      };
    }
  }

  /**
   * Get verification URL for web-based verification
   * @param reference Verification reference
   * @returns Web URL for verification
   */
  static async getVerificationUrl(reference: string): Promise<string | null> {
    try {
      // Get access token
      const accessToken = await ShuftiProAuthService.getAccessToken();

      // Make API request
      const response = await fetch(`${this.BASE_URL}/api/verification/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          reference
        })
      });

      // Parse response
      const data = await response.json();

      if (response.ok && data.verification_url) {
        return data.verification_url;
      } else {
        console.error('ShuftiPro API error:', data);
        return null;
      }
    } catch (error) {
      console.error('Error getting verification URL:', error);
      return null;
    }
  }
}