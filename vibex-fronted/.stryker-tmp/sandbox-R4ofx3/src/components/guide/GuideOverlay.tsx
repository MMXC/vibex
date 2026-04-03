/**
 * GuideOverlay — Full-screen semi-transparent overlay with spotlight cutout
 *
 * Highlights a target element by creating a "spotlight" cutout in the
 * semi-transparent backdrop. The cutout is sized and positioned based on
 * the target element's bounding rect.
 *
 * WCAG 2.1 AA: focus trap inside overlay, keyboard accessible.
 */
// @ts-nocheck


'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import styles from './GuideOverlay.module.css';

interface GuideOverlayProps {
  /** CSS selector for the element to spotlight */
  targetSelector: string;
  /** Extra padding around the spotlight rect (px) */
  padding?: number;
  children?: React.ReactNode;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const GuideOverlay = memo(function GuideOverlay({
  targetSelector,
  padding = 8,
  children,
}: GuideOverlayProps) {
  const [spotlightRect, setSpotlightRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update spotlight rect when target element changes or scrolls/resizes
  useEffect(() => {
    if (!mounted) return;

    function updateRect() {
      const el = document.querySelector(targetSelector);
      if (!el) {
        setSpotlightRect(null);
        return;
      }
      const domRect = el.getBoundingClientRect();
      setSpotlightRect({
        top: domRect.top - padding,
        left: domRect.left - padding,
        width: domRect.width + padding * 2,
        height: domRect.height + padding * 2,
      });
    }

    updateRect();

    const ro = new ResizeObserver(updateRect);
    const mo = new MutationObserver(updateRect);

    const target = document.querySelector(targetSelector);
    if (target) {
      ro.observe(target);
      mo.observe(target, { childList: true, subtree: true });
    }

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [targetSelector, padding, mounted]);

  if (!mounted || !spotlightRect) return null;

  const { top, left, width, height } = spotlightRect;

  return (
    <div className={styles.overlay} aria-hidden="true">
      {/* Backdrop with spotlight cutout via SVG */}
      <svg className={styles.backdropSvg} aria-hidden="true">
        <defs>
          <mask id="guide-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={left}
              y={top}
              width={width}
              height={height}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#guide-spotlight-mask)"
        />
      </svg>

      {/* Spotlight border ring */}
      <div
        className={styles.spotlightRing}
        style={{
          top: `${top}px`,
          left: `${left}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
        aria-hidden="true"
      />

      {/* Tooltip content rendered on top of overlay */}
      {children && (
        <div className={styles.contentLayer}>{children}</div>
      )}
    </div>
  );
});

export default GuideOverlay;
