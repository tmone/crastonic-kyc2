import { Image } from 'expo-image';
import { Platform, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={[styles.titleContainer, colorScheme === 'dark' && { backgroundColor: 'transparent' }]}>
        <ThemedText type="title">{t('welcome')}</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={[styles.stepContainer, colorScheme === 'dark' && { backgroundColor: 'transparent' }]}>
        <ThemedText type="subtitle">{t('step1Title')}</ThemedText>
        <ThemedText>
          {t('step1Text')}
          {' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={[styles.stepContainer, colorScheme === 'dark' && { backgroundColor: 'transparent' }]}>
        <ThemedText type="subtitle">{t('step2Title')}</ThemedText>
        <ThemedText>
          {t('step2Text')}
        </ThemedText>
      </ThemedView>
      <ThemedView style={[styles.stepContainer, colorScheme === 'dark' && { backgroundColor: 'transparent' }]}>
        <ThemedText type="subtitle">{t('step3Title')}</ThemedText>
        <ThemedText>
          {t('step3Text')}
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const { width: deviceWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    width: deviceWidth,
    height: 150,
    contentFit: 'cover' as const,
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
});
