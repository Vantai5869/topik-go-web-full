// app/components/EnhancedActivityTracker.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

/**
 * EnhancedActivityTracker Component
 * Track page views với thời gian ở lại trang cho cả logged-in và anonymous users
 *
 * Features:
 * - Track page entry và exit time
 * - Generate session ID cho anonymous users
 * - Send heartbeat mỗi 30s để track active time
 * - Fire-and-forget để không ảnh hưởng UX
 */

// Hàm tạo session ID (client-side only)
function getOrCreateSessionId(): string {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return `session_ssr_${Date.now()}`;
  }

  const SESSION_KEY = 'topikgo_session_id';
  let sessionId = sessionStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    // Tạo session ID mới: timestamp + random string
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

// Hàm lấy screen resolution
function getScreenResolution(): string {
  if (typeof window !== 'undefined') {
    return `${window.screen.width}x${window.screen.height}`;
  }
  return 'unknown';
}

export default function EnhancedActivityTracker() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const token = useAuthStore((state) => state.token);
  const pathname = usePathname();

  const [sessionId, setSessionId] = useState<string>('');
  const [pageViewId, setPageViewId] = useState<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const entryTimeRef = useRef<number>(Date.now());

  // Use empty string to make relative URLs - nginx will proxy to backend
  const API_BASE_URL = '';

  // Initialize session ID on mount (client-side only)
  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  // Track page entry
  useEffect(() => {
    // Don't track until sessionId is initialized
    if (!sessionId) return;
    entryTimeRef.current = Date.now();

    // Đợi một chút để tránh duplicate requests
    const trackTimer = setTimeout(() => {
      const referrer = typeof document !== 'undefined' ? document.referrer : '';
      const screenResolution = getScreenResolution();

      // Track page entry
      fetch(`${API_BASE_URL}/pageviews/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          sessionId,
          pagePath: pathname,
          referrer,
          screenResolution
        }),
        keepalive: true
      })
        .then(res => res.json())
        .then(data => {
          if (data.pageViewId) {
            setPageViewId(data.pageViewId);

            // Bắt đầu heartbeat mỗi 30s
            if (heartbeatIntervalRef.current) {
              clearInterval(heartbeatIntervalRef.current);
            }

            heartbeatIntervalRef.current = setInterval(() => {
              fetch(`${API_BASE_URL}/pageviews/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageViewId: data.pageViewId }),
                keepalive: true
              }).catch(() => {
                // Silent fail
              });
            }, 30000); // 30 seconds
          }
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.debug('Track page entry failed:', error.message);
          }
        });
    }, 300); // 300ms debounce

    // Cleanup: Track page exit
    return () => {
      clearTimeout(trackTimer);

      // Stop heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // Track exit
      if (pageViewId) {
        fetch(`${API_BASE_URL}/pageviews/exit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageViewId }),
          keepalive: true
        }).catch(() => {
          // Silent fail
        });
      }
    };
  }, [pathname, sessionId, token, API_BASE_URL]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  // Also track on old Visit API for backward compatibility
  useEffect(() => {
    if (currentUser && currentUser._id && token) {
      const debounceTimer = setTimeout(() => {
        fetch(`${API_BASE_URL}/analytics/track-visit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            pagePath: pathname,
          }),
          keepalive: true,
        }).catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.debug('Track visit failed:', error.message);
          }
        });
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [currentUser, token, pathname, API_BASE_URL]);

  return null;
}
