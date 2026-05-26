/**
 * useViewportBounds — Hook for tracking canvas viewport bounds
 * P005-E1: react-virtual 安装 + viewportBounds store
 *
 * Usage:
 *   const containerRef = useViewportBounds();
 *   <div ref={containerRef}>...</div>
 *
 * Or with explicit container:
 *   const { updateViewport } = useViewportBounds(containerRef);
 */
import { useEffect, useRef, type RefObject } from 'react';
import { useViewportBoundsStore } from '@/lib/canvas/stores/viewportBoundsStore';
import type { ViewportBounds } from '@/lib/canvas/stores/viewportBoundsStore';

interface UseViewportBoundsOptions {
  /** Debounce delay for scroll/resize updates (ms). Default 50ms */
  debounceMs?: number;
  /** Initial bounds to use before first measurement */
  initialBounds?: Partial<ViewportBounds>;
}

interface UseViewportBoundsReturn {
  /** Ref to attach to the canvas container element */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Manually update bounds (e.g., on zoom change) */
  updateViewport: (bounds: Partial<ViewportBounds>) => void;
  /** Reset viewport to (0, 0) */
  resetViewport: () => void;
}

/**
 * useViewportBounds — tracks viewport bounds of a scrollable container.
 *
 * - On mount: reads persisted bounds from sessionStorage via store, applies to element
 * - On scroll: updates viewportBounds.x and viewportBounds.y
 * - On resize: updates viewportBounds.width and viewportBounds.height
 * - On unmount: nothing (store persists to sessionStorage automatically)
 */
export function useViewportBounds(
  options: UseViewportBoundsOptions = {}
): UseViewportBoundsReturn {
  const { debounceMs = 50, initialBounds } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const { viewportBounds, updateViewportBounds, resetViewportBounds } = useViewportBoundsStore();

  const updateViewport = (bounds: Partial<ViewportBounds>) => {
    updateViewportBounds(bounds);
  };

  const resetViewport = () => {
    resetViewportBounds();
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Apply persisted/initial bounds on mount
    if (initialBounds) {
      updateViewportBounds(initialBounds);
    }

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        updateViewportBounds({
          x: el.scrollLeft,
          y: el.scrollTop,
        });
      }, debounceMs);
    };

    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateViewportBounds({
          width: el.clientWidth,
          height: el.clientHeight,
        });
      }, debounceMs);
    };

    // Initial measurement
    updateViewportBounds({
      x: el.scrollLeft,
      y: el.scrollTop,
      width: el.clientWidth,
      height: el.clientHeight,
    });

    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    // Use ResizeObserver for more accurate size tracking
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(el);

    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [debounceMs]);

  return { containerRef, updateViewport, resetViewport };
}

/**
 * useViewportBoundsForRef — use with an externally-provided ref
 */
export function useViewportBoundsForRef(
  externalRef: RefObject<HTMLDivElement | null>,
  options: UseViewportBoundsOptions = {}
): UseViewportBoundsReturn {
  const { debounceMs = 50 } = options;
  const { updateViewportBounds, resetViewportBounds } = useViewportBoundsStore();

  const updateViewport = (bounds: Partial<ViewportBounds>) => {
    updateViewportBounds(bounds);
  };

  const resetViewport = () => {
    resetViewportBounds();
    if (externalRef.current) {
      externalRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const el = externalRef.current;
    if (!el) return;

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        updateViewportBounds({ x: el.scrollLeft, y: el.scrollTop });
      }, debounceMs);
    };

    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateViewportBounds({ width: el.clientWidth, height: el.clientHeight });
      }, debounceMs);
    };

    // Initial measurement
    updateViewportBounds({
      x: el.scrollLeft,
      y: el.scrollTop,
      width: el.clientWidth,
      height: el.clientHeight,
    });

    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => { handleResize(); });
    resizeObserver.observe(el);

    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [debounceMs]);

  return { containerRef: externalRef, updateViewport, resetViewport };
}
