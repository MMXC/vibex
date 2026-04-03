/**
 * GuideTooltip — Floating tooltip card for the new user guide
 *
 * Features:
 * - Arrow pointing toward the spotlighted element
 * - Step title + description body
 * - Progress indicator (dots + step counter)
 * - Prev / Next / Skip navigation buttons
 * - Fully keyboard accessible (Tab, Enter, Escape)
 *
 * Placement is computed from the target element's bounding rect.
 */

'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import styles from './GuideTooltip.module.css';

interface GuideTooltipProps {
  /** Current step title */
  title: string;
  /** Current step description */
  description: string;
  /** 1-based step number */
  step: number;
  /** Total number of steps */
  totalSteps: number;
  /** CSS selector of the target element */
  targetSelector: string;
  /** Preferred placement ('top' | 'bottom' | 'left' | 'right') */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Whether this is the last step */
  isLastStep: boolean;
  onPrev?: () => void;
  onNext: () => void;
  onSkip: () => void;
  children?: React.ReactNode;
}

interface Position {
  top: number;
  left: number;
  arrow: 'top' | 'bottom' | 'left' | 'right';
}

const ARROW_SIZE = 12;
const OFFSET = 16; // gap between spotlight and tooltip

function computePosition(targetSelector: string, preferred: string): Position | null {
  const el = document.querySelector(targetSelector);
  if (!el) return null;

  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const tooltipWidth = 360;
  const tooltipHeight = 220; // approximate

  function tryPlace(placement: string): Position | null {
    let top = 0;
    let left = 0;
    let arrow: Position['arrow'] = 'top';

    switch (placement) {
      case 'bottom':
        top = rect.bottom + OFFSET;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrow = 'top';
        break;
      case 'top':
        top = rect.top - tooltipHeight - OFFSET;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrow = 'bottom';
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + OFFSET;
        arrow = 'left';
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - OFFSET;
        arrow = 'right';
        break;
    }

    // Clamp to viewport
    left = Math.max(12, Math.min(left, vw - tooltipWidth - 12));
    top = Math.max(12, Math.min(top, vh - tooltipHeight - 12));

    // Check if actually visible
    if (
      (placement === 'bottom' && rect.bottom + OFFSET + tooltipHeight > vh + 40) ||
      (placement === 'top' && rect.top - tooltipHeight - OFFSET < -40)
    ) {
      return null;
    }

    return { top, left, arrow };
  }

  // Try preferred placement first, then fallbacks
  const order = [preferred, 'bottom', 'top', 'right', 'left'];
  for (const p of order) {
    const pos = tryPlace(p);
    if (pos) return pos;
  }

  // Ultimate fallback: center
  return {
    top: vh / 2 - tooltipHeight / 2,
    left: vw / 2 - tooltipWidth / 2,
    arrow: 'top',
  };
}

export const GuideTooltip = memo(function GuideTooltip({
  title,
  description,
  step,
  totalSteps,
  targetSelector,
  placement = 'bottom',
  isLastStep,
  onPrev,
  onNext,
  onSkip,
}: GuideTooltipProps) {
  const [pos, setPos] = useState<Position | null>(null);
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Recompute position on scroll/resize
  useEffect(() => {
    if (!mounted) return;

    function update() {
      setPos(computePosition(targetSelector, placement));
    }

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [targetSelector, placement, mounted]);

  // Keyboard: Escape → skip
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onSkip();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') onNext();
      else if (e.key === 'ArrowLeft' && onPrev) onPrev();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onNext, onPrev, onSkip]);

  if (!mounted || !pos) return null;

  const arrowClass = styles[`arrow_${pos.arrow}`];

  return (
    <div
      ref={tooltipRef}
      className={styles.tooltip}
      style={{ top: pos.top, left: pos.left }}
      role="dialog"
      aria-modal="true"
      aria-label={`引导步骤 ${step}，共 ${totalSteps} 步：${title}`}
    >
      {/* Arrow */}
      <div className={`${styles.arrow} ${arrowClass}`} aria-hidden="true" />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.stepBadge}>
          <Sparkles size={12} aria-hidden="true" />
          <span>
            {step} / {totalSteps}
          </span>
        </div>
        <button
          type="button"
          className={styles.skipBtn}
          onClick={onSkip}
          aria-label="跳过引导"
          title="跳过引导 (Esc)"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        {children && <div className={styles.extraBody}>{children}</div>}
      </div>

      {/* Progress dots */}
      <div className={styles.progress} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={totalSteps}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={`${styles.dot} ${i + 1 === step ? styles.dotActive : ''} ${i + 1 < step ? styles.dotDone : ''}`}
            aria-label={`步骤 ${i + 1}`}
          />
        ))}
      </div>

      {/* Footer navigation */}
      <div className={styles.footer}>
        {onPrev ? (
          <button
            type="button"
            className={styles.prevBtn}
            onClick={onPrev}
            aria-label="上一步"
          >
            <ChevronLeft size={14} aria-hidden="true" />
            <span>上一步</span>
          </button>
        ) : (
          <span />
        )}

        {isLastStep ? (
          <button
            type="button"
            className={styles.doneBtn}
            onClick={onNext}
            aria-label="完成引导"
          >
            <span>完成</span>
            <Sparkles size={14} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className={styles.nextBtn}
            onClick={onNext}
            aria-label="下一步"
          >
            <span>下一步</span>
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
});

export default GuideTooltip;
