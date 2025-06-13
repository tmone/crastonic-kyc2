import { StyleSheet, Switch, View, TouchableOpacity, Dimensions, TextInput, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width: deviceWidth } = Dimensions.get('window');

export default function SettingsScreen() {
  const { actualTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageList, setShowLanguageList] = useState(false);
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const colorScheme = useColorScheme();

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'fil', name: 'Filipino', flag: '🇵🇭' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'my', name: 'မြန်မာ', flag: '🇲🇲' },
  ];

  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      
      <ThemedView style={[styles.section, styles.settingCard]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitle}>
            <ThemedText style={styles.sectionIcon}>{actualTheme === 'dark' ? '🌙' : '☀️'}</ThemedText>
            <ThemedText type="subtitle">{t('theme')}</ThemedText>
          </View>
          <Switch
            value={actualTheme === 'dark'}
            onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={actualTheme === 'dark' ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </ThemedView>

      <ThemedView style={[styles.section, styles.settingCard]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitle}>
            <ThemedText style={styles.sectionIcon}>
              {languages.find(l => l.code === language)?.flag}
            </ThemedText>
            <ThemedText type="subtitle">{t('language')}</ThemedText>
          </View>
          
          <TouchableOpacity
            style={styles.compactLanguageSelector}
            onPress={() => setShowLanguageList(!showLanguageList)}
          >
            <ThemedText style={styles.selectedLanguage} numberOfLines={1}>
              {languages.find(l => l.code === language)?.name}
            </ThemedText>
            <ThemedText style={[styles.chevron, showLanguageList && styles.chevronUp]}>
              ▼
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        {showLanguageList && (
          <ThemedView style={styles.languageDropdown}>
            <TextInput
              style={[styles.searchInput, { 
                color: textColor, 
                borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f8f8f8'
              }]}
              placeholder={t('searchLanguage')}
              placeholderTextColor={textColor + '60'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            
            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {filteredLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={styles.languageOption}
                  onPress={() => {
                    setLanguage(lang.code);
                    setShowLanguageList(false);
                    setSearchQuery('');
                  }}
                >
                  <ThemedView style={styles.settingRow}>
                    <View style={styles.languageInfo}>
                      <ThemedText style={styles.flag}>{lang.flag}</ThemedText>
                      <ThemedText style={styles.languageName}>{lang.name}</ThemedText>
                    </View>
                    {language === lang.code && (
                      <ThemedText style={[styles.checkmark, { color: colorScheme === 'dark' ? '#81b0ff' : '#007AFF' }]}>✓</ThemedText>
                    )}
                  </ThemedView>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ThemedView>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    width: deviceWidth,
    height: 150,
    contentFit: 'cover' as const,
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  section: {
    marginBottom: 20,
  },
  settingCard: {
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionIcon: {
    fontSize: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  compactLanguageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 150,
    justifyContent: 'flex-end',
  },
  selectedLanguage: {
    fontSize: 14,
    opacity: 0.8,
    maxWidth: 130,
  },
  languageDropdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  chevron: {
    fontSize: 12,
    opacity: 0.6,
    transition: 'transform 0.2s',
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  searchInput: {
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
  },
  languageList: {
    maxHeight: 250,
  },
  languageOption: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
  },
  checkmark: {
    fontSize: 20,
  },
});