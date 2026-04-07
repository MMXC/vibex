/**
 * useDDDStateRestore — React hook for DDD page state restoration
 *
 * On mount, checks sessionStorage for a persisted DDD snapshot
 * and restores it if the current page's store is empty.
 *
 * Usage:
 *   'use client';
 *   export default function BoundedContextPage() {
 *     useDDDStateRestore();
 *     // ...
 *   }
 */
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  checkDDDStateRestore,
  useContextStore,
  useModelStore,
  useDesignStore,
} from '@/stores/ddd';

export function useDDDStateRestore(): void {
  const pathname = usePathname();

  useEffect(() => {
    // Only restore on DDD routes
    if (
      !pathname.includes('bounded-context') &&
      !pathname.includes('domain-model') &&
      !pathname.includes('business-flow')
    ) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zustand store accessor type mismatch
    checkDDDStateRestore(
      pathname,
      useContextStore as any,
      useModelStore as any,
      useDesignStore as any
    );
  }, [pathname]);
}
