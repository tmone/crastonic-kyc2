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
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>✕</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t('kycTitle')}</ThemedText>
          <View style={styles.closeButton} />
        </View>
        
        {loading && !error && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={textColor} />
            <ThemedText style={styles.loadingText}>{t('kycLoading')}</ThemedText>
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>Error loading verification page</ThemedText>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: textColor }]}
              onPress={() => {
                setError(false);
                setLoading(true);
                webViewRef.current?.reload();
              }}
            >
              <ThemedText style={[styles.retryButtonText, { color: backgroundColor }]}>Retry</ThemedText>
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
              <ActivityIndicator size="large" color={textColor} />
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // Android specific props
          androidLayerType="hardware"
          originWhitelist={['*']}
          scalesPageToFit={false}
          setSupportMultipleWindows={false}
          overScrollMode="never"
          saveFormDataDisabled={true}
          thirdPartyCookiesEnabled={true}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          // Fix for Android camera/file upload
          // Enable file upload on Android
          allowsProtectedMedia={true}
          // User agent for better compatibility
          userAgent={Platform.OS === 'android' ? 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36' : undefined}
          // Fix for Android SSL issues
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
            
            // Android specific: ensure viewport is set correctly
            const meta = document.createElement('meta');
            meta.setAttribute('name', 'viewport');
            meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
            document.getElementsByTagName('head')[0].appendChild(meta);
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
});