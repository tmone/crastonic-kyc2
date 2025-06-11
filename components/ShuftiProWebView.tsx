import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  SafeAreaView, 
  Platform,
  BackHandler,
  Dimensions,
  Linking
} from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShuftiProWebViewProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  verificationUrl: string;
}

export function ShuftiProWebView({ 
  visible, 
  onClose, 
  onSuccess, 
  onError, 
  verificationUrl 
}: ShuftiProWebViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const { t } = useLanguage();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = Platform.OS === 'ios' ? '#007AFF' : '#0a7ea4';
  const screenHeight = Dimensions.get('window').height;
  
  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        } else {
          onClose();
          return true;
        }
      });
      
      return () => backHandler.remove();
    }
  }, [visible, canGoBack]);
  
  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      setLoading(true);
      setError(false);
    }
  }, [visible]);

  const handleMessage = (event: any) => {
    try {
      console.log('Received message from WebView:', event.nativeEvent.data);
      const data = JSON.parse(event.nativeEvent.data);
      
      // Handle ShuftiPro events
      if (data.event === 'verification.accepted' || 
          data.event === 'verification.approved' || 
          data.status_code === 1000 ||
          data.status_code === "SP1000") {
        console.log('Verification successful:', data);
        onSuccess?.(data);
        setTimeout(() => onClose(), 500);
      } else if (data.event === 'verification.declined' || 
                data.event === 'verification.cancelled' ||
                data.status_code === 1001 ||
                data.status_code === "SP1001") {
        console.log('Verification failed:', data);
        onError?.(data);
        setTimeout(() => onClose(), 500);
      }
    } catch (e) {
      console.log('WebView message parsing error:', e);
      console.log('Raw message:', event.nativeEvent.data);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    // Save back navigation state
    setCanGoBack(navState.canGoBack);
    
    // Check for success/failure URLs
    if (navState.url.includes('verification/status/success') || 
        navState.url.includes('verification/complete') || 
        navState.url.includes('verification/success') ||
        navState.url.includes('verification/accepted') ||
        navState.url.includes('verification/approved')) {
      console.log('Navigation detected success URL:', navState.url);
      onSuccess?.({ url: navState.url, event: 'verification.accepted' });
      setTimeout(() => onClose(), 500);
    } else if (navState.url.includes('verification/status/failure') ||
               navState.url.includes('verification/failed') || 
               navState.url.includes('verification/error') ||
               navState.url.includes('verification/declined') ||
               navState.url.includes('verification/cancelled')) {
      console.log('Navigation detected failure URL:', navState.url);
      onError?.({ url: navState.url, event: 'verification.declined' });
      setTimeout(() => onClose(), 500);
    }
    
    // Handle external URLs (like terms of service)
    if (navState.url.startsWith('http') && 
        !navState.url.includes('shuftipro.com') && 
        !navState.url.includes('shufti.com')) {
      Linking.openURL(navState.url);
      return false;
    }
  };
  
  // Custom JavaScript to inject into the WebView to capture ShuftiPro events
  const injectedJavaScript = `
    (function() {
      // Set up message listeners for ShuftiPro events
      window.addEventListener('message', function(event) {
        try {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
          }
        } catch(e) {
          console.error('Error posting message to React Native:', e);
        }
      });

      // Override window.postMessage to capture all messages
      const originalPostMessage = window.postMessage;
      window.postMessage = function(message) {
        try {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              typeof message === 'string' ? message : JSON.stringify(message)
            );
          }
        } catch(e) {
          console.error('Error in postMessage override:', e);
        }
        originalPostMessage.apply(window, arguments);
      };
      
      // Monitor DOM for verification status elements
      const observer = new MutationObserver(function(mutations) {
        // Check for success elements
        const successElements = document.querySelectorAll('.verification-success, .success-message, .verification-complete');
        if (successElements.length > 0) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: 'verification.accepted', 
            status_code: 1000,
            message: 'Verification successful'
          }));
        }
        
        // Check for failure elements
        const failureElements = document.querySelectorAll('.verification-failed, .error-message, .verification-declined');
        if (failureElements.length > 0) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: 'verification.declined', 
            status_code: 1001,
            message: 'Verification failed'
          }));
        }
      });
      
      // Start observing the document with the configured parameters
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Android-specific adjustments
      ${Platform.OS === 'android' ? `
        // Fix viewport and scaling issues on Android
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'viewport');
        meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
        document.head.appendChild(meta);
        
        // Improve form element usability on Android
        document.addEventListener('click', function(e) {
          if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) {
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, true);
      ` : ''}
      
      // Intercept network requests to detect verification status
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        
        // Clone the response so we can read the body
        const clone = response.clone();
        try {
          if (args[0] && args[0].toString().includes('verification/status')) {
            const responseData = await clone.json();
            if (responseData && responseData.status_code) {
              window.ReactNativeWebView.postMessage(JSON.stringify(responseData));
            }
          }
        } catch(e) {
          console.error('Error intercepting fetch:', e);
        }
        
        return response;
      };
      
      // Signal that our script has loaded successfully
      window.ReactNativeWebView.postMessage(JSON.stringify({
        event: 'webview.ready',
        timestamp: Date.now()
      }));
      
      true; // Return true to indicate script injection success
    })();
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={[
          styles.header,
          Platform.OS === 'ios' ? styles.iosHeader : {}
        ]}>
          <TouchableOpacity 
            onPress={onClose} 
            style={[
              styles.closeButton,
              Platform.OS === 'ios' ? styles.iosCloseButton : {}
            ]}
          >
            <ThemedText 
              style={[
                styles.closeButtonText,
                Platform.OS === 'ios' ? { ...styles.iosCloseButtonText, color: primaryColor } : {}
              ]}
            >
              {Platform.OS === 'ios' ? 'Cancel' : '✕'}
            </ThemedText>
          </TouchableOpacity>
          
          <ThemedText 
            style={[
              styles.headerTitle,
              Platform.OS === 'ios' ? styles.iosHeaderTitle : {}
            ]}
          >
            {t('kycTitle')}
          </ThemedText>
          
          {canGoBack ? (
            <TouchableOpacity
              onPress={() => webViewRef.current?.goBack()}
              style={[
                styles.closeButton,
                Platform.OS === 'ios' ? styles.iosCloseButton : {}
              ]}
            >
              <ThemedText
                style={[
                  styles.backButtonText,
                  Platform.OS === 'ios' ? { ...styles.iosCloseButtonText, color: primaryColor } : {}
                ]}
              >
                Back
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.closeButton} />
          )}
        </View>

        {loading && !error && (
          <View style={[styles.loadingContainer, { marginTop: screenHeight * 0.3 }]}>
            <ActivityIndicator
              size={Platform.OS === 'ios' ? 'large' : 'large'}
              color={primaryColor}
            />
            <ThemedText 
              style={[
                styles.loadingText,
                Platform.OS === 'ios' ? styles.iosLoadingText : {}
              ]}
            >
              {t('kycLoading')}
            </ThemedText>
          </View>
        )}

        {error && (
          <View style={[styles.errorContainer, { marginTop: screenHeight * 0.3 }]}>
            <ThemedText 
              style={[
                styles.errorText,
                Platform.OS === 'ios' ? styles.iosErrorText : {}
              ]}
            >
              Error loading verification page. Please check your internet connection.
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: primaryColor },
                Platform.OS === 'ios' ? styles.iosRetryButton : {}
              ]}
              onPress={() => {
                setError(false);
                setLoading(true);
                webViewRef.current?.reload();
              }}
            >
              <ThemedText 
                style={[
                  styles.retryButtonText,
                  { color: backgroundColor },
                  Platform.OS === 'ios' ? styles.iosRetryButtonText : {}
                ]}
              >
                Try Again
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ uri: verificationUrl }}
          style={[styles.webView, { opacity: loading ? 0 : 1 }]}
          onLoadStart={() => {
            console.log('WebView Load Start');
            setLoading(true);
            setError(false);
          }}
          onLoadEnd={() => {
            console.log('WebView Load End');
            setLoading(false);
          }}
          onLoad={() => {
            console.log('WebView Loaded');
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            setError(true);
            setLoading(false);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('HTTP error:', nativeEvent);
            if (nativeEvent.statusCode >= 400) {
              setError(true);
            }
          }}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationStateChange}

          // Common props
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsInlineMediaPlayback={true}
          originWhitelist={['*']}
          decelerationRate={0.5}
          incognito={false} // Don't use incognito mode as verification may need cookies
          cacheEnabled={true}
          
          // iOS specific props
          {...(Platform.OS === 'ios' ? {
            allowsBackForwardNavigationGestures: true,
            allowsLinkPreview: true,
            mediaPlaybackRequiresUserAction: true,
            useWebKit: true
          } : {})}

          // Common props for both platforms
          allowsFullscreenVideo={true}
          
          // Android specific props
          {...(Platform.OS === 'android' ? {
            mixedContentMode: 'always',
            androidHardwareAccelerationDisabled: false,
            androidLayerType: 'hardware',
            scalesPageToFit: true,
            setSupportMultipleWindows: false,
            overScrollMode: 'never',
            saveFormDataDisabled: true,
            thirdPartyCookiesEnabled: true,
            allowFileAccess: true,
            allowFileAccessFromFileURLs: true,
            allowUniversalAccessFromFileURLs: true
          } : {})}
          
          // User agent for platform-specific compatibility
          userAgent={Platform.OS === 'android'
            ? 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
            : 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
          }
          
          injectedJavaScript={injectedJavaScript}
          
          // Permission handling for Android only
          {...(Platform.OS === 'android' ? {
            onPermissionRequest: (request) => {
              console.log('WebView permission requested:', request);
              if (request && request.grant) {
                request.grant();
              }
            }
          } : {})}
          
          onShouldStartLoadWithRequest={(request) => {
            if (request && request.url) {
              console.log('Should start load:', request.url);
            }
            // Allow loading all URLs within the WebView
            return true;
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    backgroundColor: Platform.OS === 'android' ? '#0a7ea4' : undefined,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Platform.OS === 'android' ? 'white' : undefined,
  },
  closeButton: {
    width: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Platform.OS === 'android' ? 'white' : undefined,
  },
  backButtonText: {
    fontSize: 16,
    color: Platform.OS === 'android' ? 'white' : undefined,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // iOS specific styles
  iosHeader: {
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(60, 60, 67, 0.29)',
  },
  iosHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
  },
  iosCloseButton: {
    width: 70,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  iosCloseButtonText: {
    fontSize: 17,
    fontWeight: '400',
  },
  iosLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#8E8E93',
    letterSpacing: -0.24,
  },
  iosErrorText: {
    fontSize: 15,
    letterSpacing: -0.24,
    color: '#3A3A3C',
  },
  iosRetryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  iosRetryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});