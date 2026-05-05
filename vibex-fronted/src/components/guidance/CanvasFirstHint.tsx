/**
 * CanvasFirstHint — First-time canvas user hint bubble (S1.2/S1.4)
 *
 * Shows a brief tip bubble on first canvas load, auto-dismisses after 3s.
 * Persisted via guidanceStore so it doesn't reappear on refresh.
 *
 * PRD: `[data-testid="canvas-first-hint"]`, 3s auto-dismiss
 */

'use client';

import { useEffect, useState } from 'react';
import { useGuidanceStore } from '@/stores/guidanceStore';
import styles from './CanvasFirstHint.module.css';

export function CanvasFirstHint() {
  const canvasOnboardingDismissed = useGuidanceStore((s) => s.canvasOnboardingDismissed);
  const canvasFirstHintDismissed = useGuidanceStore((s) => s.canvasFirstHintDismissed);
  const dismissCanvasFirstHint = useGuidanceStore((s) => s.dismissCanvasFirstHint);

  const [visible, setVisible] = useState(false);

  // Show only when onboarding wasn't dismissed and hint hasn't been dismissed
  useEffect(() => {
    if (canvasOnboardingDismissed === false && canvasFirstHintDismissed === false) {
      setVisible(true);
      const timer = setTimeout(() => {
        dismissCanvasFirstHint();
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [canvasOnboardingDismissed, canvasFirstHintDismissed, dismissCanvasFirstHint]);

  if (!visible) return null;

  return (
    <div
      className={styles.hint}
      data-testid="canvas-first-hint"
      role="status"
      aria-live="polite"
    >
      <span className={styles.icon} aria-hidden="true">💡</span>
      <p className={styles.text}>
        输入需求，AI 自动生成限界上下文、流程和组件
      </p>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={() => {
          dismissCanvasFirstHint();
          setVisible(false);
        }}
        aria-label="关闭提示"
      >
        ×
      </button>
    </div>
  );
}

export default CanvasFirstHint;