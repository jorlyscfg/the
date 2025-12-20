'use client';

import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a component (like a Modal or Sidebar) is mounted/opened.
 * @param lock - Whether to lock the scroll
 */
export function useScrollLock(lock: boolean) {
    useEffect(() => {
        if (lock) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [lock]);
}
