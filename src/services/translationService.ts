import { Language } from '@/contexts/AppContext';

// Translation cache to avoid repeated API calls for the same text
type CacheKey = `${string}|${string}|${string}`;
const translationCache = new Map<CacheKey, string>();

// Supported languages by LibreTranslate
const supportedLanguages = {
  'en': 'English',
  'ar': 'Arabic',
  'zh': 'Chinese',
  'fr': 'French',
  'de': 'German',
  'hi': 'Hindi',
  'it': 'Italian',
  'ja': 'Japanese',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'es': 'Spanish'
};

/**
 * Check if a language is supported by the translation service
 */
export const isLanguageSupported = (lang: string): boolean => {
  return Object.keys(supportedLanguages).includes(lang);
};

/**
 * Get supported languages for translation
 */
export const getSupportedLanguages = (): Record<string, string> => {
  return supportedLanguages;
};

/**
 * Detect the language of a text
 */
export const detectLanguage = async (text: string): Promise<string> => {
  try {
    // Using LibreTranslate API
    const response = await fetch('https://libretranslate.com/detect', {
      method: 'POST',
      body: JSON.stringify({
        q: text
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0].language;
    }
    
    return 'en'; // Default to English if detection fails
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'en';
  }
};

/**
 * Translate text from one language to another
 */
export const translateText = async (
  text: string, 
  targetLang: string, 
  sourceLang: string = 'auto'
): Promise<string> => {
  // Return original text if it's empty
  if (!text.trim()) {
    return text;
  }
  
  // Create cache key
  const cacheKey: CacheKey = `${text}|${sourceLang}|${targetLang}`;
  
  // Check cache first
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey) as string;
  }
  
  try {
    // For demo purposes, using LibreTranslate API
    // In production, you should use an API key or self-host LibreTranslate
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: sourceLang === 'auto' ? 'auto' : sourceLang,
        target: targetLang,
        format: 'text'
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data && data.translatedText) {
      // Store in cache
      translationCache.set(cacheKey, data.translatedText);
      return data.translatedText;
    }
    
    // If translation fails, return original text
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

/**
 * Fallback translation using a simple dictionary for common phrases
 * Used when API calls fail or for demo purposes
 */
export const fallbackTranslate = (
  text: string,
  targetLang: Language
): string => {
  // Very simple fallback dictionary for common phrases
  const simpleDictionary: Record<string, Record<Language, string>> = {
    'Hello': {
      en: 'Hello',
      fr: 'Bonjour',
      es: 'Hola',
      ar: 'مرحبا',
      hi: 'नमस्ते',
      it: 'Ciao',
      ru: 'Привет',
      ja: 'こんにちは',
      de: 'Hallo',
      pt: 'Olá',
      zh: '你好',
      ko: '안녕하세요'
    },
    'Goodbye': {
      en: 'Goodbye',
      fr: 'Au revoir',
      es: 'Adiós',
      ar: 'وداعا',
      hi: 'अलविदा',
      it: 'Arrivederci',
      ru: 'До свидания',
      ja: 'さようなら',
      de: 'Auf Wiedersehen',
      pt: 'Adeus',
      zh: '再见',
      ko: '안녕히 가세요'
    }
    // Add more common phrases as needed
  };
  
  // Check if the text is in our simple dictionary
  const lowerText = text.toLowerCase().trim();
  for (const [key, translations] of Object.entries(simpleDictionary)) {
    if (key.toLowerCase() === lowerText && translations[targetLang]) {
      return translations[targetLang];
    }
  }
  
  // If not found, return original text
  return text;
};
