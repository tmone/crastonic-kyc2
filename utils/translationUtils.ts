import englishTranslations from '../translations/en.json';

// Define the supported languages
export type Language = 
  | 'en'  // English
  | 'ja'  // Japanese
  | 'vi'  // Vietnamese
  | 'zh'  // Chinese
  | 'hi'  // Hindi
  | 'id'  // Indonesian
  | 'ko'  // Korean
  | 'th'  // Thai
  | 'ms'  // Malay
  | 'fil' // Filipino
  | 'bn'  // Bengali
  | 'ur'  // Urdu
  | 'ta'  // Tamil
  | 'te'  // Telugu
  | 'my'; // Burmese

// Export the type for translation keys
export type TranslationKey = keyof typeof englishTranslations;

// Define the translation record type
export type TranslationRecord = Record<TranslationKey, string>;

// Map for available translations
const translationMap: Record<Language, () => Promise<TranslationRecord>> = {
  en: async () => (await import('../translations/en.json')).default,
  ja: async () => (await import('../translations/ja.json')).default,
  vi: async () => (await import('../translations/vi.json')).default,
  zh: async () => (await import('../translations/zh.json')).default,
  hi: async () => (await import('../translations/hi.json')).default,
  id: async () => (await import('../translations/id.json')).default,
  ko: async () => (await import('../translations/ko.json')).default,
  th: async () => (await import('../translations/th.json')).default,
  ms: async () => (await import('../translations/ms.json')).default,
  fil: async () => (await import('../translations/fil.json')).default,
  bn: async () => (await import('../translations/bn.json')).default,
  ur: async () => (await import('../translations/ur.json')).default,
  ta: async () => (await import('../translations/ta.json')).default,
  te: async () => (await import('../translations/te.json')).default,
  my: async () => (await import('../translations/my.json')).default
};

// Fallback to English for languages without translations yet
async function fallbackToEnglish(lang: Language): Promise<TranslationRecord> {
  console.warn(`Translation for ${lang} not available, falling back to English`);
  return (await import('../translations/en.json')).default;
}

// Function to load translations for a given language
export async function loadTranslations(language: Language): Promise<TranslationRecord> {
  try {
    return await translationMap[language]();
  } catch (error) {
    console.error(`Error loading translations for ${language}:`, error);
    // Fallback to English
    return (await import('../translations/en.json')).default;
  }
}

// Function to get a list of available languages with their native names
export const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'ko', name: '한국어' },
  { code: 'th', name: 'ไทย' },
  { code: 'ms', name: 'Bahasa Melayu' },
  { code: 'fil', name: 'Filipino' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'ur', name: 'اردو' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'my', name: 'မြန်မာ' }
];