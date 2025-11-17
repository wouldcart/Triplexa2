import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface AutoSaveOptions {
  delay?: number; // Auto-save delay in milliseconds
  textareaDelay?: number; // Special delay for textarea content (default: 10000ms - 10 seconds)
  onSave: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
  trackSelection?: boolean; // Whether to track text selection
}

interface UseAutoSaveReturn {
  isAutoSaving: boolean;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  triggerAutoSave: (fieldType?: 'textarea' | 'input') => void;
  resetAutoSave: () => void;
  textSelection: TextSelection | null;
}

interface TextSelection {
  fieldName: string;
  start: number;
  end: number;
  text: string;
}

export const useAutoSave = (data: any, options: AutoSaveOptions): UseAutoSaveReturn => {
  const { 
    delay = 2000, // Default 2 seconds for regular inputs
    textareaDelay = 10000, // 10 seconds for textarea content
    onSave, 
    onError, 
    trackSelection = true 
  } = options;
  
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef(data);
  const fieldTypeRef = useRef<'textarea' | 'input' | null>(null);

  // Check if data has changed
  const hasDataChanged = useCallback((currentData: any, previousData: any): boolean => {
    try {
      return JSON.stringify(currentData) !== JSON.stringify(previousData);
    } catch {
      return false;
    }
  }, []);

  // Track text selection
  const trackTextSelection = useCallback((fieldName: string) => {
    if (!trackSelection) return;
    
    const activeElement = document.activeElement as HTMLTextAreaElement;
    if (activeElement && activeElement.tagName === 'TEXTAREA') {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const text = activeElement.value.substring(start, end);
      
      setTextSelection({
        fieldName,
        start,
        end,
        text
      });
    }
  }, [trackSelection]);

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (isAutoSaving || !hasUnsavedChanges) return;

    setIsAutoSaving(true);
    try {
      await onSave(data);
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      previousDataRef.current = data;
      
      toast.success('Your changes have been saved automatically.', {
        duration: 2000,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to auto-save';
      toast.error(errorMessage, {
        duration: 3000,
      });
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsAutoSaving(false);
    }
  }, [data, isAutoSaving, hasUnsavedChanges, onSave, onError]);

  // Trigger auto-save with field type detection
  const triggerAutoSave = useCallback((fieldType: 'textarea' | 'input' = 'input') => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    fieldTypeRef.current = fieldType;
    setHasUnsavedChanges(true);
    
    // Use different delays based on field type
    const effectiveDelay = fieldType === 'textarea' ? textareaDelay : delay;
    
    timeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, effectiveDelay);
  }, [delay, textareaDelay, performAutoSave]);

  // Reset auto-save state
  const resetAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setHasUnsavedChanges(false);
    setLastSavedAt(null);
    setTextSelection(null);
  }, []);

  // Watch for data changes with intelligent field type detection
  useEffect(() => {
    if (hasDataChanged(data, previousDataRef.current)) {
      // Try to detect if this was a textarea change by checking the active element
      const activeElement = document.activeElement;
      const isTextarea = activeElement?.tagName.toLowerCase() === 'textarea';
      const fieldType = isTextarea ? 'textarea' : 'input';
      
      triggerAutoSave(fieldType);
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
    textSelection,
  };
};