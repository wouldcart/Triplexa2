import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface AutoSaveOptions {
  delay?: number; // Auto-save delay in milliseconds (default: 5000ms)
  onSave: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
}

interface UseAutoSaveReturn {
  isAutoSaving: boolean;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  triggerAutoSave: () => void;
  resetAutoSave: () => void;
}

export const useAutoSave = (data: any, options: AutoSaveOptions): UseAutoSaveReturn => {
  const { delay = 5000, onSave, onError } = options;
  const { toast } = useToast();
  
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef(data);

  // Check if data has changed
  const hasDataChanged = useCallback((currentData: any, previousData: any): boolean => {
    try {
      return JSON.stringify(currentData) !== JSON.stringify(previousData);
    } catch {
      return false;
    }
  }, []);

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (isAutoSaving || !hasUnsavedChanges) return;

    setIsAutoSaving(true);
    try {
      await onSave(data);
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      previousDataRef.current = data;
      
      toast({
        title: 'Auto-saved',
        description: 'Your changes have been saved automatically.',
        duration: 2000,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to auto-save';
      toast({
        title: 'Auto-save failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 3000,
      });
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsAutoSaving(false);
    }
  }, [data, isAutoSaving, hasUnsavedChanges, onSave, onError, toast]);

  // Trigger auto-save
  const triggerAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setHasUnsavedChanges(true);
    
    timeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, delay);
  }, [delay, performAutoSave]);

  // Reset auto-save state
  const resetAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setHasUnsavedChanges(false);
    setLastSavedAt(null);
  }, []);

  // Watch for data changes
  useEffect(() => {
    if (hasDataChanged(data, previousDataRef.current)) {
      triggerAutoSave();
    }
  }, [data, hasDataChanged, triggerAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isAutoSaving,
    lastSavedAt,
    hasUnsavedChanges,
    triggerAutoSave,
    resetAutoSave,
  };
};