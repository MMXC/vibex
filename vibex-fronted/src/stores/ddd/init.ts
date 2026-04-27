/**
 * DDD Store Initialization
 *
 * Call `initDDDStores()` once at app startup to enable cross-slice
 * state sync and sessionStorage persistence for the three DDD stores:
 *   - contextSlice (bounded contexts)
 *   - modelSlice   (domain models)
 *   - confirmationStore (managed independently)
 *
 * Safe to call multiple times (singleton pattern).
 */

import { useContextStore } from '../contextSlice';
import { useModelStore } from '../modelSlice';
import { initDDDStateSync } from './middleware';

let _initialized = false;

/**
 * Initialize DDD cross-slice state sync.
 * Call this once from a client component (e.g. app/providers.tsx).
 *
 * @example
 * // In your app layout or providers:
 * useEffect(() => { initDDDStores(); }, []);
 */
export function initDDDStores(): void {
  if (_initialized) return;
  _initialized = true;

  initDDDStateSync(
    useContextStore,
    useModelStore,
  );
}

/**
 * React hook to initialize DDD stores.
 * Use inside a client component.
 *
 * @example
 * 'use client';
 * function DDDProvider() {
 *   useDDDStoreInit();
 *   return null;
 * }
 */
import { useEffect } from 'react';

export function useDDDStoreInit(): void {
  useEffect(() => {
    initDDDStores();
  }, []);
}
