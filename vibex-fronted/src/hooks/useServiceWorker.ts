/**
 * useServiceWorker — Service Worker 注册（仅在 production output:export 模式下）
 * E05: Canvas 离线模式
 */
'use client';

import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    // 仅 production + standalone 模式注册 SW
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] registered:', registration.scope);
        })
        .catch((err) => {
          console.warn('[SW] registration failed:', err);
        });
    }
  }, []);
}