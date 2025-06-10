import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLanguage } from '@/contexts/LanguageContext';

interface KYCWebViewSimpleProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  verificationUrl: string;
}

export function KYCWebViewSimple({ visible, onClose, onSuccess, onError, verificationUrl }: KYCWebViewSimpleProps) {
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const backgroundColor = useThemeColor({}, 'background');

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
        
        <View style={styles.webViewContainer}>
          <WebView
            source={{ uri: verificationUrl }}
            style={styles.webView}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
              </View>
            )}
          />
        </View>
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
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});