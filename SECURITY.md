# Security Configuration Guide

## 🔐 Protecting Your Secret Keys

This project uses environment variables to securely store sensitive credentials. Follow these steps to ensure your ShuftiPro API credentials remain secure.

### Setup Instructions

1. **Copy the example environment file**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file with your credentials**
   ```bash
   # Open .env and replace with your actual credentials
   SHUFTIPRO_CLIENT_ID=your_actual_client_id
   SHUFTIPRO_SECRET_KEY=your_actual_secret_key
   ```

3. **Verify .env is in .gitignore** ✅
   - The `.env` file is already added to `.gitignore`
   - This prevents your credentials from being committed to version control

### Important Security Notes

⚠️ **NEVER commit the .env file to version control**
- The `.env` file contains sensitive credentials
- It's automatically excluded by `.gitignore`

✅ **Safe to commit:**
- `.env.example` - Template file with placeholder values
- `env.d.ts` - TypeScript type definitions
- Updated source files that import from `@env`

### How It Works

1. **Environment Variables**
   - Credentials are stored in `.env` file
   - Loaded at build time by `react-native-dotenv`
   - Accessed in code via `import { SHUFTIPRO_CLIENT_ID } from '@env'`

2. **TypeScript Support**
   - Type definitions in `env.d.ts`
   - Provides IntelliSense for environment variables

3. **Runtime Security**
   - Credentials are bundled into the app at build time
   - Not exposed in plain text in the final build

### Production Deployment

For production builds, you should:

1. **Use CI/CD Environment Variables**
   - Store credentials in your CI/CD platform (GitHub Actions, Bitrise, etc.)
   - Never hardcode credentials in your build scripts

2. **Android**: Add to your build process
   ```bash
   export SHUFTIPRO_CLIENT_ID=your_production_client_id
   export SHUFTIPRO_SECRET_KEY=your_production_secret_key
   ```

3. **iOS**: Configure in Xcode or build scripts
   - Add to your build configuration
   - Or use environment variables in your build script

### Verification Checklist

- [x] `.env` file created with real credentials
- [x] `.env` added to `.gitignore`
- [x] `babel.config.js` configured for react-native-dotenv
- [x] TypeScript declarations in `env.d.ts`
- [x] `shuftiProAuth.ts` updated to use environment variables
- [x] `.env.example` created for documentation

### Getting Your Credentials

1. Log in to [ShuftiPro Dashboard](https://dashboard.shuftipro.com/)
2. Navigate to API Keys section
3. Copy your Client ID and Secret Key
4. Store them in your `.env` file

### Troubleshooting

**"ShuftiPro credentials not found in environment variables"**
- Ensure `.env` file exists in project root
- Check that credentials are properly set
- Restart Metro bundler after changing `.env`

**Metro bundler not picking up changes**
- Clear cache: `npx expo start --clear`
- Restart the bundler
- Ensure `babel.config.js` is properly configured

### Additional Security Best Practices

1. **Rotate Keys Regularly**
   - Change your API keys periodically
   - Update both development and production environments

2. **Use Different Keys for Development/Production**
   - Create separate API keys for each environment
   - Never use production keys in development

3. **Monitor API Usage**
   - Check ShuftiPro dashboard for unusual activity
   - Set up alerts for suspicious usage patterns

4. **Code Review**
   - Always review changes to ensure no credentials are exposed
   - Check for accidental credential commits