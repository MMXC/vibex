/**
 * DDD Store Initialization
 *
 * Call `initDDDStores()` once at app startup to enable cross-slice
 * state sync and sessionStorage persistence for the three DDD stores:
 *   - contextSlice (bounded contexts)
 *   - modelSlice   (domain models)
 *   - designStore  (business flows)
 *
 * Safe to call multiple times (singleton pattern).
 */
// @ts-nocheck


import { useContextStore } from '../contextSlice';
import { useModelStore } from '../modelSlice';
import { useDesignStore } from '../designStore';
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
    useDesignStore
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
export function useDDDStoreInit(): void {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { useEffect } = require('react');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    initDDDStores();
  }, []);
}
