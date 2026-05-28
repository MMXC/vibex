'use client';

/**
 * SWRegistration — S39-P005-E1: Service Worker Registration
 * 
 * Registers the Service Worker from public/sw.js on mount.
 * Workbox handles caching strategies (cache-first for static, network-first for API).
 * 
 * DevTools → Application → Service Workers to inspect registration status.
 */

import { useEffect } from 'react';

export function SWRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Registered:', registration.scope);
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] New content available, refresh to update');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error);
        });
    }
  }, []);

  return null;
}
