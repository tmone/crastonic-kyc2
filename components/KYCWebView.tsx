import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLanguage } from '@/contexts/LanguageContext';

interface KYCWebViewProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  verificationUrl: string;
}

export function KYCWebView({ visible, onClose, onSuccess, onError, verificationUrl }: KYCWebViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [forceShow, setForceShow] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const { t } = useLanguage();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    if (visible) {
      // Force show WebView after 3 seconds on Android as fallback
      const timeout = setTimeout(() => {
        if (loading && Platform.OS === 'android') {
          console.log('Force showing WebView on Android');
          setLoading(false);
          setForceShow(true);
        }
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [visible, loading]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      // Handle ShuftiPro events
      if (data.event === 'verification.accepted' || data.event === 'verification.approved') {
        onSuccess?.(data);
        onClose();
      } else if (data.event === 'verification.declined' || data.event === 'verification.cancelled') {
        onError?.(data);
        onClose();
      }
    } catch (e) {
      console.log('WebView message:', event.nativeEvent.data);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    // Check if verification is complete based on URL changes
    if (navState.url.includes('verification/complete') || 
        navState.url.includes('verification/success')) {
      onSuccess?.({ url: navState.url });
      onClose();
    } else if (navState.url.includes('verification/failed') || 
               navState.url.includes('verification/error')) {
      onError?.({ url: navState.url });
      onClose();
    }
  };

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
          <TouchableOpacity onPress={onClose} style={[
            styles.closeButton,
            Platform.OS === 'ios' ? styles.iosCloseButton : {}
          ]}>
            <ThemedText style={[
              styles.closeButtonText,
              Platform.OS === 'ios' ? styles.iosCloseButtonText : {}
            ]}>
              {Platform.OS === 'ios' ? 'Cancel' : '✕'}
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={[
            styles.headerTitle,
            Platform.OS === 'ios' ? styles.iosHeaderTitle : {}
          ]}>
            {t('kycTitle')}
          </ThemedText>
          <View style={styles.closeButton} />
        </View>

        {loading && !error && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size={Platform.OS === 'ios' ? 'small' : 'large'}
              color={Platform.OS === 'ios' ? '#007AFF' : textColor}
            />
            <ThemedText style={[
              styles.loadingText,
              Platform.OS === 'ios' ? styles.iosLoadingText : {}
            ]}>
              {t('kycLoading')}
            </ThemedText>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <ThemedText style={[
              styles.errorText,
              Platform.OS === 'ios' ? styles.iosErrorText : {}
            ]}>
              Error loading verification page
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: Platform.OS === 'ios' ? '#007AFF' : textColor },
                Platform.OS === 'ios' ? styles.iosRetryButton : {}
              ]}
              onPress={() => {
                setError(false);
                setLoading(true);
                webViewRef.current?.reload();
              }}
            >
              <ThemedText style={[
                styles.retryButtonText,
                { color: backgroundColor },
                Platform.OS === 'ios' ? styles.iosRetryButtonText : {}
              ]}>
                Retry
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ uri: verificationUrl }}
          style={[styles.webView, { opacity: (loading && !forceShow) ? 0 : 1 }]}
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
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator
                size={Platform.OS === 'ios' ? 'small' : 'large'}
                color={Platform.OS === 'ios' ? '#007AFF' : textColor}
              />
            </View>
          )}

          // Common props
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsInlineMediaPlayback={true}
          originWhitelist={['*']}

          // iOS specific props
          allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
          allowsLinkPreview={Platform.OS === 'ios'}

          // Platform specific settings
          mediaPlaybackRequiresUserAction={Platform.OS === 'ios' ? false : undefined}
          allowsFullscreenVideo={Platform.OS === 'ios' ? true : undefined}
          applicationNameForUserAgent={Platform.OS === 'ios' ? 'CrastonicKYC' : undefined}

          // Android specific props
          mixedContentMode={Platform.OS === 'android' ? 'compatibility' : undefined}
          androidHardwareAccelerationDisabled={Platform.OS === 'android' ? false : undefined}
          androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
          scalesPageToFit={Platform.OS === 'android' ? false : undefined}
          setSupportMultipleWindows={Platform.OS === 'android' ? false : undefined}
          overScrollMode={Platform.OS === 'android' ? 'never' : undefined}
          saveFormDataDisabled={Platform.OS === 'android' ? true : undefined}
          thirdPartyCookiesEnabled={Platform.OS === 'android' ? true : undefined}
          allowFileAccess={Platform.OS === 'android' ? true : undefined}
          allowFileAccessFromFileURLs={Platform.OS === 'android' ? true : undefined}
          allowUniversalAccessFromFileURLs={Platform.OS === 'android' ? true : undefined}
          allowsProtectedMedia={Platform.OS === 'android' ? true : undefined}

          // Permission handling for Android
          onPermissionRequest={Platform.OS === 'android' ? (request) => {
            console.log('Permission requested:', request);
            request.grant();
          } : undefined}

          // User agent for platform-specific compatibility
          userAgent={Platform.OS === 'android'
            ? 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
            : 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1 CrastonicKYC'
          }

          onShouldStartLoadWithRequest={(request) => {
            console.log('Should start load:', request.url);
            return true;
          }}

          injectedJavaScript={`
            // Listen for ShuftiPro events
            window.addEventListener('message', function(e) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(e.data));
              }
            });

            // Also capture postMessage from the page
            const originalPostMessage = window.postMessage;
            window.postMessage = function(data) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(data));
              }
              originalPostMessage.apply(window, arguments);
            };

            // Platform-specific adjustments
            ${Platform.OS === 'ios' ? `
              // iOS-specific JS
              document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
              // Fix for iOS input fields
              document.addEventListener('focusin', function(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                  window.ReactNativeWebView.postMessage(JSON.stringify({type: 'inputFocus', focused: true}));
                }
              });
              document.addEventListener('focusout', function(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                  window.ReactNativeWebView.postMessage(JSON.stringify({type: 'inputFocus', focused: false}));
                }
              });
            ` : `
              // Android-specific JS
              // Ensure viewport is set correctly
              const meta = document.createElement('meta');
              meta.setAttribute('name', 'viewport');
              meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
              document.getElementsByTagName('head')[0].appendChild(meta);
            `}
          `}
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    position: 'absolute',
    top: '50%',
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
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    width: 60,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  iosCloseButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#007AFF',
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