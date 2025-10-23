
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  key: string;
  data: any;
  interval?: number;
  onSave?: (data: any) => void;
  onRestore?: (data: any) => void;
}

export const useAutoSave = ({
  key,
  data,
  interval = 30000, // 30 seconds
  onSave,
  onRestore
}: AutoSaveOptions) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save function
  const saveData = useCallback(async () => {
    try {
      setIsSaving(true);
      const saveData = {
        data,
        timestamp: new Date().toISOString(),
        version: Date.now()
      };

      localStorage.setItem(`autosave_${key}`, JSON.stringify(saveData));
      
      if (onSave) {
        await onSave(data);
      }

      setLastSaved(new Date());
      
      if (isOnline) {
        console.log('Auto-saved to localStorage and cloud');
      } else {
        console.log('Auto-saved to localStorage (offline)');
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: "Auto-save failed",
        description: "Your work may not be saved. Please save manually.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [key, data, onSave, isOnline, toast]);

  // Restore saved data
  const restoreData = useCallback(() => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      if (saved) {
        const parsedData = JSON.parse(saved);
        if (onRestore) {
          onRestore(parsedData.data);
        }
        setLastSaved(new Date(parsedData.timestamp));
        return parsedData.data;
      }
    } catch (error) {
      console.error('Failed to restore auto-saved data:', error);
    }
    return null;
  }, [key, onRestore]);

  // Clear auto-save data
  const clearAutoSave = useCallback(() => {
    localStorage.removeItem(`autosave_${key}`);
    setLastSaved(null);
  }, [key]);

  // Set up auto-save interval
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      intervalRef.current = setInterval(saveData, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [saveData, interval, data]);

  // Manual save
  const manualSave = useCallback(() => {
    saveData();
  }, [saveData]);

  return {
    lastSaved,
    isOnline,
    isSaving,
    manualSave,
    restoreData,
    clearAutoSave
  };
};
