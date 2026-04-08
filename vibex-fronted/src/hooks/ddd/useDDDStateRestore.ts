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

    // MEMO: ESLint 豁免 - 2026-04-08
    // Reason: Zustand store hooks 在 Context 外使用时需要类型断言，避免 SSR 水合错误
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    checkDDDStateRestore(
      pathname,
      useContextStore as any,
      useModelStore as any,
      useDesignStore as any
    );
  }, [pathname]);
}
