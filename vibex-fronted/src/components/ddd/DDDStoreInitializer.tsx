/**
 * DDDStoreInitializer — Client-side singleton initializer
 *
 * Calls initDDDStores() once on mount to enable cross-slice
 * state sync and sessionStorage persistence.
 *
 * Place inside a client component that mounts once per session
 * (e.g. a root layout or a provider).
 */
'use client';

import { useEffect } from 'react';
import { initDDDStores } from '@/stores/ddd/init';

export function DDDStoreInitializer(): null {
  useEffect(() => {
    initDDDStores();
  }, []);

  return null;
}
