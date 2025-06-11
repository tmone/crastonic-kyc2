import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';

interface BasicKYCFlowProps {
  onComplete: (result: any) => void;
  onCancel: () => void;
  journeyId?: string;
}

/**
 * A basic, simplified KYC flow that works as a fallback when the camera
 * or other advanced features might not be working properly.
 */
export function BasicKYCFlow({
  onComplete,
  onCancel,
  journeyId
}: BasicKYCFlowProps) {
  const [step, setStep] = useState<'intro' | 'processing' | 'complete'>('intro');
  
  // Simulate verification process
  const startVerification = () => {
    setStep('processing');
    
    // Simulate a network request
    setTimeout(() => {
      setStep('complete');
    }, 3000);
  };
  
  // Handle completion
  const handleComplete = () => {
    onComplete({
      status: 'verified',
      event: 'verification.accepted',
      reference: journeyId || `REF-${Date.now()}`,
    });
  };
  
  // Render the intro step
  const renderIntro = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Text style={styles.title}>Identity Verification</Text>
        <Text style={styles.subtitle}>
          This is a simplified verification process for demonstration purposes.
        </Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>In a production environment, you would:</Text>
          <Text style={styles.infoText}>• Capture photos of your ID documents</Text>
          <Text style={styles.infoText}>• Take a selfie for facial verification</Text>
          <Text style={styles.infoText}>• Submit documents for verification</Text>
        </View>
        
        <TouchableOpacity
          style={styles.button}
          onPress={startVerification}
        >
          <Text style={styles.buttonText}>Start Verification</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
  
  // Render the processing step
  const renderProcessing = () => (
    <View style={[styles.container, styles.centerContainer]}>
      <ActivityIndicator size="large" color="#0a7ea4" />
      <Text style={styles.processingText}>Processing verification...</Text>
      <Text style={styles.processingSubText}>Please wait while we verify your identity.</Text>
    </View>
  );
  
  // Render the complete step
  const renderComplete = () => (
    <View style={[styles.container, styles.centerContainer]}>
      <View style={styles.successIcon}>
        <Text style={styles.successIconText}>✓</Text>
      </View>
      
      <Text style={styles.completeTitle}>Verification Successful</Text>
      <Text style={styles.completeText}>
        Your identity has been verified successfully.
      </Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleComplete}
      >
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render the appropriate step
  switch (step) {
    case 'intro':
      return renderIntro();
    case 'processing':
      return renderProcessing();
    case 'complete':
      return renderComplete();
    default:
      return renderIntro();
  }
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#222222',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666666',
  },
  infoBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555555',
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#999999',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333333',
  },
  processingSubText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666666',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#44BB44',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  completeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  completeText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666666',
  },
});