import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, BackHandler, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemedText } from './ThemedText';
import { LoadingIndicator } from './LoadingIndicator';

interface ShuftiProJourneyViewProps {
  journeyUrl: string;
  onComplete: (result: any) => void;
  onCancel: () => void;
}

export function ShuftiProJourneyView({
  journeyUrl,
  onComplete,
  onCancel
}: ShuftiProJourneyViewProps) {
  const { actualTheme } = useTheme();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<WebView>(null);
  
  // Theme colors based on current theme
  const backgroundColor = actualTheme === 'dark' ? '#111115' : '#FFFFFF';
  const primaryColor = '#0a7ea4';
  const textColor = actualTheme === 'dark' ? '#FFFFFF' : '#000000';
  
  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert(
          'Cancel Verification',
          'Are you sure you want to cancel the verification process?',
          [
            { text: 'No', style: 'cancel', onPress: () => {} },
            { text: 'Yes', style: 'destructive', onPress: onCancel }
          ]
        );
        return true;
      });
      
      return () => backHandler.remove();
    }
  }, [onCancel]);
  
  // Verify the verification URL
  useEffect(() => {
    if (!journeyUrl.includes('https://app.shuftipro.com/verification/journey/')) {
      console.error('Invalid ShuftiPro journey URL format:', journeyUrl);
      Alert.alert(
        'Invalid Verification URL',
        'The verification URL provided is not valid.',
        [{ text: 'OK', onPress: onCancel }]
      );
    }
  }, [journeyUrl, onCancel]);
  
  // Handle verification events from the WebView
  const handleMessage = (event: any) => {
    try {
      console.log('WebView message received:', event.nativeEvent.data);
      const data = JSON.parse(event.nativeEvent.data);
      
      // Process ShuftiPro events
      if (data.event === 'verification.accepted' || data.event === 'verification.approved') {
        onComplete({
          event: data.event,
          status: 'verified',
          reference: data.reference || '',
          verification_result: data
        });
      } else if (data.event === 'verification.declined') {
        onComplete({
          event: data.event,
          status: 'declined',
          reference: data.reference || '',
          verification_result: data
        });
      } else if (data.event === 'verification.cancelled' || data.event === 'verification.closed') {
        onCancel();
      } else if (data.event === 'error') {
        onComplete({
          event: 'error',
          status: 'error',
          error: data.error || 'Verification error',
          verification_result: data
        });
      } else if (data.status_code === "SP1000" || data.status_code === 1000) {
        // Success status code
        onComplete({
          event: 'verification.accepted',
          status: 'verified',
          reference: data.reference || '',
          verification_result: data
        });
      } else if (data.status_code === "SP1001" || data.status_code === 1001) {
        // Decline status code
        onComplete({
          event: 'verification.declined',
          status: 'declined',
          reference: data.reference || '',
          verification_result: data
        });
      }
    } catch (error) {
      console.error('Error handling ShuftiPro WebView message:', error);
    }
  };
  
  // Handle navigation state changes
  const handleNavigationStateChange = (navState: any) => {
    console.log('Navigation state changed:', navState.url);
    
    // Check for success/failure URLs
    if (navState.url.includes('verification/status/success') || 
        navState.url.includes('verification/complete') || 
        navState.url.includes('verification/success') ||
        navState.url.includes('verification/accepted') ||
        navState.url.includes('verification/approved')) {
      console.log('Navigation detected success URL:', navState.url);
      onComplete({
        event: 'verification.accepted',
        status: 'verified',
        reference: '',
        verification_result: { url: navState.url }
      });
    } else if (navState.url.includes('verification/status/failure') ||
               navState.url.includes('verification/failed') || 
               navState.url.includes('verification/error') ||
               navState.url.includes('verification/declined') ||
               navState.url.includes('verification/cancelled')) {
      console.log('Navigation detected failure URL:', navState.url);
      onComplete({
        event: 'verification.declined',
        status: 'declined',
        reference: '',
        verification_result: { url: navState.url }
      });
    }
  };
  
  // Inject JavaScript to capture events from ShuftiPro
  const injectedJavaScript = `
    (function() {
      function captureShuftiProEvents() {
        console.log('Setting up ShuftiPro event listeners');
        
        // Listen for ShuftiPro event emitter events
        if (window.ShuftiPro && window.ShuftiPro.eventEmitter) {
          console.log('ShuftiPro event emitter found');
          window.ShuftiPro.eventEmitter.on('*', function(event, data) {
            console.log('ShuftiPro event:', event, data);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: event,
              ...data
            }));
          });
        } else {
          console.log('ShuftiPro event emitter not found, retrying...');
          setTimeout(captureShuftiProEvents, 500);
        }
      }
      
      // Start capturing events
      captureShuftiProEvents();
      
      // Listen for verification completion
      window.addEventListener('message', function(event) {
        console.log('Window message event:', event.data);
        if (event.data && typeof event.data === 'string') {
          try {
            const data = JSON.parse(event.data);
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
          } catch(e) {
            // Not JSON data, ignore
          }
        } else if (event.data && typeof event.data === 'object') {
          window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
        }
      });
      
      // Intercept fetch responses
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        
        // Only intercept ShuftiPro API responses
        if (url && (url.includes('/status') || url.includes('/result'))) {
          // Clone the response to read the body without consuming it
          const clone = response.clone();
          try {
            const responseData = await clone.json();
            if (responseData) {
              console.log('API response intercepted:', responseData);
              window.ReactNativeWebView.postMessage(JSON.stringify(responseData));
            }
          } catch (e) {
            // Ignore non-JSON responses
          }
        }
        
        return response;
      };
      
      // Manually check for end of verification periodically
      setInterval(function() {
        // Check for success elements
        const successElements = document.querySelectorAll('.verification-success, .success-message, .verification-complete, [data-status="success"]');
        if (successElements.length > 0) {
          console.log('Success elements found in DOM');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: 'verification.accepted',
            status_code: 'SP1000'
          }));
        }
        
        // Check for failure elements
        const failureElements = document.querySelectorAll('.verification-failed, .error-message, .verification-declined, [data-status="failed"]');
        if (failureElements.length > 0) {
          console.log('Failure elements found in DOM');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: 'verification.declined',
            status_code: 'SP1001'
          }));
        }
      }, 1000);
      
      // Fix viewport issues on some devices
      const meta = document.querySelector('meta[name="viewport"]');
      if (meta) {
        meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      } else {
        const newMeta = document.createElement('meta');
        newMeta.setAttribute('name', 'viewport');
        newMeta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
        document.head.appendChild(newMeta);
      }
      
      true;
    })();
  `;
  
  // Reset UI if there's an error
  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, Platform.OS === 'ios' ? styles.iosHeader : { backgroundColor: primaryColor }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Alert.alert(
              'Cancel Verification',
              'Are you sure you want to cancel the verification process?',
              [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', onPress: onCancel }
              ]
            );
          }}
        >
          <ThemedText style={[styles.headerButtonText, Platform.OS === 'android' && { color: '#FFFFFF' }]}>
            {Platform.OS === 'ios' ? 'Cancel' : '✕'}
          </ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={[styles.headerTitle, Platform.OS === 'android' && { color: '#FFFFFF' }]}>
          Identity Verification
        </ThemedText>
        
        <View style={styles.headerButton} />
      </View>
      
      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: journeyUrl }}
        style={[styles.webView, isLoading && { opacity: 0 }]}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onHttpError={(error) => {
          if (error.nativeEvent.statusCode >= 400) {
            setHasError(true);
            setIsLoading(false);
          }
        }}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        injectedJavaScript={injectedJavaScript}
        
        // Common WebView props
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        originWhitelist={['*']}
        cacheEnabled={true}
        
        // iOS specific props
        {...(Platform.OS === 'ios' ? {
          allowsBackForwardNavigationGestures: true,
          allowsLinkPreview: false,
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: true,
          useWebKit: true
        } : {})}
        
        // Android specific props
        {...(Platform.OS === 'android' ? {
          mixedContentMode: 'always',
          androidHardwareAccelerationDisabled: false,
          androidLayerType: 'hardware',
          scalesPageToFit: true,
          overScrollMode: 'never',
          thirdPartyCookiesEnabled: true,
          allowFileAccess: true,
          userAgent: 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
        } : {})}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingIndicator 
            size={50} 
            color={actualTheme === 'dark' ? '#FFFFFF' : primaryColor} 
            text="Loading verification..." 
          />
        </View>
      )}
      
      {/* Error view */}
      {hasError && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorTitle}>Connection Error</ThemedText>
          <ThemedText style={styles.errorMessage}>
            Unable to load the verification page. Please check your internet connection and try again.
          </ThemedText>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: primaryColor }]} 
            onPress={handleRetry}
          >
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: textColor }]} 
            onPress={onCancel}
          >
            <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  iosHeader: {
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(200, 200, 200, 0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerButton: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});