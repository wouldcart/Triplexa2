import React from 'react';

// Dynamic import utilities for better code splitting

// Lazy load heavy components
export const lazyLoadComponent = (importFn: () => Promise<any>) => {
  return React.lazy(() => importFn().catch(err => {
    console.error('Dynamic import failed:', err);
    return { default: () => <div>Loading failed</div> };
  }));
};

// Preload critical chunks
export const preloadChunks = async (chunkNames: string[]) => {
  chunkNames.forEach(chunkName => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/assets/${chunkName}`;
    document.head.appendChild(link);
  });
};

// Preload critical vendor chunks on app initialization
export const preloadCriticalChunks = () => {
  const criticalChunks = [
    'vendor-react',
    'vendor-ui',
    'vendor-supabase',
    'auth'
  ];
  
  if (typeof document !== 'undefined') {
    criticalChunks.forEach(chunk => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `/assets/${chunk}`;
      document.head.appendChild(link);
    });
  }
};
