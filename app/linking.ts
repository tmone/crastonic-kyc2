import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<any> = {
  prefixes: ['crastonickyc://', 'com.thinhcrastonic.crastonic-kyc://'],
  config: {
    screens: {
      '(tabs)': {
        screens: {
          index: '',
          kyc: 'kyc',
          settings: 'settings',
        },
      },
      '+not-found': '*',
    },
  },
  async getInitialURL() {
    // In standalone mode, just return null to avoid the deep linking error
    if (!__DEV__) {
      return null;
    }
    
    // In development, try to get the initial URL normally
    try {
      const Linking = await import('expo-linking');
      return await Linking.getInitialURL();
    } catch (error) {
      console.warn('Failed to get initial URL:', error);
      return null;
    }
  },
};