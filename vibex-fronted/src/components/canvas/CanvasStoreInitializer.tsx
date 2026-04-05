/**
 * CanvasStoreInitializer — initializes cross-store subscriptions
 *
 * Calls initCrossStoreSync() once on mount to enable:
 * - centerExpand sync when activeTree changes
 * - recomputeActiveTree when flow nodes change
 *
 * Place inside the canvas page layout (CanvasPage.tsx).
 */
'use client';

import { useEffect } from 'react';
import { initCrossStoreSync } from '@/lib/canvas/crossStoreSync';

export function CanvasStoreInitializer(): null {
  useEffect(() => {
    initCrossStoreSync();
  }, []);

  return null;
}
