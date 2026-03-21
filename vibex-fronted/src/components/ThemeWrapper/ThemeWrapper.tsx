/**
 * ThemeWrapper Component
 * Epic 3: FOUT (Flash of Unstyled Theme) Prevention + API Integration
 *
 * Fetches homepage API data and integrates it with ThemeProvider.
 */

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import {
  fetchHomepageData,
  clearHomepageCache,
  type HomepageAPIResponse,
} from '../../services/homepageAPI';

// ── Context ─────────────────────────────────────────────────────────────────

interface ThemeWrapperContextValue {
  homepageData: HomepageAPIResponse | null;
  isLoading: boolean;
  clearCache: () => void;
}

const ThemeWrapperContext = createContext<ThemeWrapperContextValue>({
  homepageData: null,
  isLoading: true,
  clearCache: () => {},
});

export function useThemeWrapper(): ThemeWrapperContextValue {
  return useContext(ThemeWrapperContext);
}

// ── Component ───────────────────────────────────────────────────────────────

interface ThemeWrapperProps {
  children: ReactNode;
  /** Callback fired when API data is loaded */
  onApiDataLoaded?: (data: HomepageAPIResponse | null) => void;
}

/**
 * ThemeWrapper fetches homepage API data and integrates it with ThemeProvider.
 * ThemeProvider is rendered with the fetched homepageData for correct merge strategy.
 *
 * Usage:
 * ```tsx
 * <ThemeWrapper>
 *   <App />
 * </ThemeWrapper>
 * ```
 */
export function ThemeWrapper({
  children,
  onApiDataLoaded,
}: ThemeWrapperProps): React.ReactElement {
  // Use null sentinel: null = loading/no data, object = data ready
  const [homepageData, setHomepageData] = useState<HomepageAPIResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await fetchHomepageData();
      if (cancelled) return;

      setHomepageData(data);
      setIsLoading(false);

      if (onApiDataLoaded) {
        onApiDataLoaded(data);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [onApiDataLoaded]);

  const clearCache = useCallback(() => {
    clearHomepageCache();
    setHomepageData(null);
    setIsLoading(true);
  }, []);

  // When homepageData is loading (null), do NOT render ThemeProvider.
  // This prevents the legacy fallback path from running before API data is ready.
  // ThemeProvider's initial state is determined once on mount, so we must
  // defer its creation until homepageData is available.
  if (homepageData === null) {
    return (
      <ThemeWrapperContext.Provider value={{ homepageData, isLoading, clearCache }}>
        {children}
      </ThemeWrapperContext.Provider>
    );
  }

  return (
    <ThemeWrapperContext.Provider value={{ homepageData, isLoading, clearCache }}>
      <ThemeProvider homepageData={homepageData}>
        {children}
      </ThemeProvider>
    </ThemeWrapperContext.Provider>
  );
}

// ── Loading Fallback ────────────────────────────────────────────────────────

/**
 * Theme loading skeleton — renders nothing until theme is resolved.
 * Prevents FOUT by ensuring CSS vars are set before first paint.
 */
export function ThemeLoadingFallback(): React.ReactElement | null {
  return null;
}
