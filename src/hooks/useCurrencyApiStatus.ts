import { useCallback, useEffect, useState } from 'react';
import { CurrencyApiService } from '@/services/currencyApiService';

export interface CurrencyApiStatus {
  isConfigured: boolean;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  testConnection: () => Promise<{ ok: boolean; error?: string }>;
}

export function useCurrencyApiStatus(autoCheck: boolean = true): CurrencyApiStatus {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const configured = await CurrencyApiService.isConfigured();
      setIsConfigured(!!configured);
    } catch (err) {
      setIsConfigured(false);
    }
  }, []);

  const testConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await CurrencyApiService.testConnectivity();
    setIsConnected(res.ok);
    if (!res.ok) setError(res.error || 'Connection failed');
    setLoading(false);
    return res;
  }, []);

  useEffect(() => {
    if (autoCheck) {
      refresh();
    }
  }, [autoCheck, refresh]);

  return { isConfigured, isConnected, loading, error, refresh, testConnection };
}