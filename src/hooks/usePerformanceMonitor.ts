import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  tabSwitchDuration: number;
  dataLoadDuration: number;
  lastUpdate: Date;
}

export const usePerformanceMonitor = (componentName: string) => {
  const metricsRef = useRef<PerformanceMetrics>({
    tabSwitchDuration: 0,
    dataLoadDuration: 0,
    lastUpdate: new Date()
  });

  const startTimer = (operation: string) => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      metricsRef.current = {
        ...metricsRef.current,
        [`${operation}Duration`]: duration,
        lastUpdate: new Date()
      };
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`⚠️ Slow ${operation} in ${componentName}: ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    };
  };

  const logMetrics = () => {
    console.log(`📊 ${componentName} Performance:`, metricsRef.current);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Final metrics log
      if (import.meta.env.DEV) {
        logMetrics();
      }
    };
  }, [componentName]);

  return {
    startTimer,
    logMetrics,
    metrics: metricsRef.current
  };
};