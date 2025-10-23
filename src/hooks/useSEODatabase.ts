import { useState, useEffect, useCallback } from 'react';
import { seoService, SEOSettings } from '@/services/seoService';

export function useSEODatabase(pageRoute: string) {
  const [seoSettings, setSeoSettings] = useState<SEOSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load SEO settings for the current page
  const loadSEOSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const settings = await seoService.getSEOSettings(pageRoute);
      setSeoSettings(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SEO settings');
    } finally {
      setLoading(false);
    }
  }, [pageRoute]);

  // Update SEO settings
  const updateSEOSettings = useCallback(async (updates: Partial<SEOSettings>) => {
    try {
      setError(null);
      const updatedSettings = await seoService.upsertSEOSettings({
        ...updates,
        page_route: pageRoute
      });
      
      if (updatedSettings) {
        setSeoSettings(updatedSettings);
        return updatedSettings;
      }
      throw new Error('Failed to update SEO settings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update SEO settings');
      throw err;
    }
  }, [pageRoute]);

  // Load settings on mount and when pageRoute changes
  useEffect(() => {
    loadSEOSettings();
  }, [loadSEOSettings]);

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = seoService.subscribeToSEOSettings((updatedSettings) => {
      if (updatedSettings.page_route === pageRoute) {
        setSeoSettings(updatedSettings);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pageRoute]);

  return {
    seoSettings,
    loading,
    error,
    updateSEOSettings,
    refreshSEOSettings: loadSEOSettings
  };
}

export function useAllSEOSettings() {
  const [allSettings, setAllSettings] = useState<SEOSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const settings = await seoService.getAllSEOSettings();
      setAllSettings(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SEO settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllSettings();
  }, [loadAllSettings]);

  return {
    allSettings,
    loading,
    error,
    refreshAllSettings: loadAllSettings
  };
}