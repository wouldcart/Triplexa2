
import { useCallback, useRef } from 'react';

/**
 * Custom hook for debouncing function calls
 * @param fn The function to debounce
 * @param delay Delay in milliseconds
 * @returns A debounced version of the function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): { debouncedFn: (...args: Parameters<T>) => void; cancel: () => void } {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const debouncedFn = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      fn(...args);
      timeoutRef.current = null;
    }, delay);
  }, [fn, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { debouncedFn, cancel };
}
