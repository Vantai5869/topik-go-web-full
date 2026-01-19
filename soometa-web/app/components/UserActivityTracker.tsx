// app/components/UserActivityTracker.tsx
"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

/**
 * UserActivityTracker Component
 * Ghi lại lượt truy cập của người dùng đã đăng nhập vào backend.
 * Component này không có UI, chỉ thực hiện logic theo dõi.
 *
 * Optimized để không ảnh hưởng đến UX:
 * - Sử dụng fire-and-forget fetch (không await)
 * - Debounce để tránh spam requests khi user navigate nhanh
 * - keepalive flag để request hoàn tất ngay cả khi user rời trang
 */
export default function UserActivityTracker() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const token = useAuthStore((state) => state.token);
  const pathname = usePathname();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Chỉ gửi yêu cầu nếu có người dùng đăng nhập và có token
    if (currentUser && currentUser._id && token) {
      // Clear previous timer nếu có
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce 300ms để tránh spam khi user navigate nhanh
      debounceTimerRef.current = setTimeout(() => {
        const NEXT_PUBLIC_API_BASE_URL = '';

        // Fire-and-forget: không await, không block UI
        fetch(`${NEXT_PUBLIC_API_BASE_URL}/analytics/track-visit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            pagePath: pathname,
          }),
          // keepalive: true cho phép request hoàn tất ngay cả khi user rời trang
          keepalive: true,
        }).catch((error) => {
          // Silent fail - không log để tránh spam console
          // Chỉ log ở development mode
          if (process.env.NODE_ENV === 'development') {
            console.debug('Track visit failed:', error.message);
          }
        });
      }, 300);
    }

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentUser, token, pathname]);

  return null;
}