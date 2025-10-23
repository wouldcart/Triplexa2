
import { useState, useEffect } from 'react';
import { translateText, detectLanguage, fallbackTranslate } from '@/services/translationService';
import { Language } from '@/contexts/AppContext';

type TranslationState = {
  translatedText: string;
  detectedSourceLanguage: string;
  isLoading: boolean;
  error: string | null;
};

/**
 * Custom hook for text translation
 */
export const useTranslation = () => {
  const [state, setState] = useState<TranslationState>({
    translatedText: '',
    detectedSourceLanguage: 'en',
    isLoading: false,
    error: null
  });
  
  // Function to translate text
  const translate = async (
    text: string,
    targetLanguage: Language,
    sourceLanguage: string = 'auto'
  ) => {
    if (!text.trim()) {
      setState(prev => ({
        ...prev,
        translatedText: '',
        isLoading: false,
        error: null
      }));
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Detect language if source is 'auto'
      let sourceLang = sourceLanguage;
      if (sourceLang === 'auto') {
        sourceLang = await detectLanguage(text);
        setState(prev => ({ ...prev, detectedSourceLanguage: sourceLang }));
      }
      
      // Don't translate if source and target are the same
      if (sourceLang === targetLanguage) {
        setState(prev => ({
          ...prev,
          translatedText: text,
          isLoading: false
        }));
        return;
      }
      
      // Try API translation
      try {
        const result = await translateText(text, targetLanguage, sourceLang);
        setState(prev => ({
          ...prev,
          translatedText: result,
          isLoading: false
        }));
      } catch (apiError) {
        // Fallback to dictionary translation if API fails
        console.warn('API translation failed, using fallback:', apiError);
        const fallbackResult = fallbackTranslate(text, targetLanguage);
        setState(prev => ({
          ...prev,
          translatedText: fallbackResult,
          isLoading: false,
          error: 'API translation failed, using basic translation dictionary.'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown translation error'
      }));
    }
  };
  
  // Clear translation data
  const clearTranslation = () => {
    setState({
      translatedText: '',
      detectedSourceLanguage: 'en',
      isLoading: false,
      error: null
    });
  };
  
  return {
    ...state,
    translate,
    clearTranslation
  };
};
