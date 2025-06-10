// ShuftiPro Authentication Service
import { Platform } from 'react-native';

interface ShuftiProCredentials {
  clientId: string;
  secretKey: string;
}

interface AccessTokenResponse {
  access_token: string;
  message: string;
}

// ShuftiPro credentials - use hardcoded values for stable operation
const SHUFTIPRO_CREDENTIALS: ShuftiProCredentials = {
  clientId: '21178caf22354d71b7e9f32ca8bfcd07d1d4846298af39366977ef9b595ff890',
  secretKey: 'PW2VftETSNAtLrwdjomnWJyfjpzLGvTl'
};

export class ShuftiProAuthService {
  private static accessToken: string | null = null;
  private static tokenExpiry: Date | null = null;

  /**
   * Get access token from ShuftiPro API
   */
  static async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      console.log('Using cached access token');
      return this.accessToken;
    }

    console.log('Fetching new access token...');
    
    try {
      // Create Basic Auth header
      const credentials = `${SHUFTIPRO_CREDENTIALS.clientId}:${SHUFTIPRO_CREDENTIALS.secretKey}`;
      const base64Credentials = btoa(credentials);
      
      const response = await fetch('https://api.shuftipro.com/get/access/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${base64Credentials}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
      }

      const data: AccessTokenResponse = await response.json();
      
      if (!data.access_token) {
        throw new Error('No access token in response');
      }

      // Cache the token (valid for 1 hour)
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000); // 55 minutes to be safe
      
      console.log('Access token obtained successfully');
      return data.access_token;
      
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  /**
   * Clear cached token
   */
  static clearToken(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get credentials for SDK
   */
  static getCredentials(): ShuftiProCredentials {
    return SHUFTIPRO_CREDENTIALS;
  }
}

// For React Native, we might need to use base64 polyfill
if (Platform.OS !== 'web' && typeof btoa === 'undefined') {
  global.btoa = (str: string) => {
    return Buffer.from(str, 'binary').toString('base64');
  };
}