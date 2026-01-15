// app/components/ExamDataPreloader.tsx
'use client';

import { useEffect } from 'react';

/**
 * This component preloads exam and document data when the app starts
 * It runs client-side to trigger the server cache warming
 */
export default function ExamDataPreloader() {
  useEffect(() => {
    // Trigger cache warming by making a request to our API route
    // This will happen in the background without blocking the UI
    const preloadData = async () => {
      try {
        await fetch('/api/warmup-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('[Preloader] Failed to warm up cache:', error);
      }
    };

    // Run after a short delay to not block initial render
    const timeoutId = setTimeout(preloadData, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // This component renders nothing
  return null;
}
