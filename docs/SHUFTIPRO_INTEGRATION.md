# ShuftiPro Integration Guide

## Current Implementation Status

### ✅ What's Working
1. **Android native project** is properly configured
2. **ShuftiPro SDK** is successfully integrated and running
3. **WebView fallback** works as an alternative
4. **Permissions** are properly configured

### ⚠️ Current Issue
The journey URL token (`4mjladGERNsawA4sEMzAF26OlLu94Cm4uXRCDrtMynHhMDTMClD7caaEmoc7fKI6`) is not working with the SDK, resulting in "Authorization keys are invalid/missing" error.

## Integration Options

### Option 1: Use Client Credentials (Recommended)
To use the SDK with proper authentication, you need:

1. **Client ID** and **Secret Key** from ShuftiPro Dashboard
2. Update the code to use basic authentication:

```javascript
// In components/ShuftiProSDK.tsx
const authObject = {
  auth_type: "basic_auth",
  client_id: "YOUR_CLIENT_ID",    // Get from ShuftiPro Dashboard
  secret_key: "YOUR_SECRET_KEY"   // Get from ShuftiPro Dashboard
};
```

### Option 2: Use Valid Access Token
If you have a valid access token (not a journey URL):

```javascript
const authObject = {
  auth_type: "access_token",
  access_token: "YOUR_VALID_ACCESS_TOKEN"
};
```

### Option 3: Continue with WebView (Current Fallback)
The app automatically falls back to WebView when SDK authentication fails. This works with your journey URL.

## How Journey URLs Work

Journey URLs like `https://app.shuftipro.com/verification/process/[TOKEN]` are meant for:
- Web-based verification
- WebView integration
- Not directly compatible with native SDK

## To Fix the SDK Integration

1. **Get Credentials from ShuftiPro**:
   - Log in to [ShuftiPro Dashboard](https://dashboard.shuftipro.com)
   - Navigate to API Keys section
   - Copy your Client ID and Secret Key

2. **Update Environment Variables**:
   Create `.env` file:
   ```
   SHUFTIPRO_CLIENT_ID=your_client_id
   SHUFTIPRO_SECRET_KEY=your_secret_key
   ```

3. **Update the Code**:
   We can modify the SDK to use credentials instead of journey token

## Current Flow

1. User clicks "Start Verification"
2. SDK attempts to use journey token (fails with auth error)
3. Alert shows option to use WebView
4. WebView opens with journey URL (works)

## Recommendations

1. **For Testing**: Continue using WebView (it works with your journey URL)
2. **For Production**: Get proper API credentials from ShuftiPro
3. **For Better UX**: Implement both SDK (with credentials) and WebView (with journey URLs)

## Need Help?

- ShuftiPro Documentation: https://developers.shuftipro.com/
- API Credentials: https://dashboard.shuftipro.com/api-keys
- Support: support@shuftipro.com