import { useState, useCallback, useRef } from 'react';

interface UseTabSwitchingOptimizerOptions {
  onTabChange?: (newTab: string) => Promise<void> | void;
  timeout?: number;
  debounceMs?: number;
}

export const useTabSwitchingOptimizer = ({
  onTabChange,
  timeout = 5000,
  debounceMs = 100
}: UseTabSwitchingOptimizerOptions = {}) => {
  const [isSwitching, setIsSwitching] = useState(false);
  const [currentTab, setCurrentTab] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const debounceRef = useRef<NodeJS.Timeout>();

  const optimizedTabChange = useCallback(async (newTab: string) => {
    if (newTab === currentTab || isSwitching) {
      console.log('Tab switch blocked - already switching or same tab');
      return;
    }

    // Clear any existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce rapid tab switches
    debounceRef.current = setTimeout(async () => {
      setIsSwitching(true);
      
      // Set timeout to prevent stuck state
      timeoutRef.current = setTimeout(() => {
        console.warn('Tab switching timeout - resetting state');
        setIsSwitching(false);
      }, timeout);

      try {
        // Call the actual tab change handler
        if (onTabChange) {
          await onTabChange(newTab);
        }
        
        setCurrentTab(newTab);
        console.log(`Successfully switched to tab: ${newTab}`);
        
      } catch (error) {
        console.error('Tab switching failed:', error);
        // Don't prevent tab switch on error - just log it
      } finally {
        // Clear timeout and reset switching state
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Small delay to prevent rapid successive switches
        setTimeout(() => {
          setIsSwitching(false);
        }, 50);
      }
    }, debounceMs);
  }, [currentTab, isSwitching, onTabChange, timeout, debounceMs]);

  const resetSwitchingState = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setIsSwitching(false);
  }, []);

  return {
    isSwitching,
    currentTab,
    optimizedTabChange,
    resetSwitchingState
  };
};