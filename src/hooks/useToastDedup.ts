
import { useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ToastMessage {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

export const useToastDedup = () => {
  const { toast } = useToast();
  const recentToasts = useRef<Set<string>>(new Set());
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const createToastKey = (message: ToastMessage): string => {
    return `${message.title || ''}_${message.description || ''}_${message.variant || 'default'}`;
  };

  const showToast = useCallback((message: ToastMessage) => {
    const key = createToastKey(message);
    
    // If this exact toast was shown recently, don't show it again
    if (recentToasts.current.has(key)) {
      return;
    }

    // Add to recent toasts
    recentToasts.current.add(key);
    
    // Clear any existing timeout for this key
    const existingTimeout = timeouts.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Show the toast
    toast(message);

    // Remove from recent after 3 seconds to allow showing again later
    const timeout = setTimeout(() => {
      recentToasts.current.delete(key);
      timeouts.current.delete(key);
    }, 300);
    
    timeouts.current.set(key, timeout);
  }, [toast]);

  const clearRecentToasts = useCallback(() => {
    recentToasts.current.clear();
    timeouts.current.forEach(timeout => clearTimeout(timeout));
    timeouts.current.clear();
  }, []);

  return { showToast, clearRecentToasts };
};
