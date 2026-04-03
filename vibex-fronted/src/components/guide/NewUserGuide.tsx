/**
 * NewUserGuide — Main controller for the 5-step new user guide
 *
 * Orchestrates:
 * 1. Auto-detection of first-time users (localStorage)
 * 2. GuideOverlay (spotlight backdrop)
 * 3. GuideTooltip (floating card with nav)
 * 4. MilestoneBadge (shown on the final step)
 *
 * Mounted once in CanvasPage. Only activates for users who haven't
 * completed or skipped the guide before.
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { useGuideStore, GUIDE_STEPS } from '@/stores/guideStore';
import { GuideOverlay } from './GuideOverlay';
import { GuideTooltip } from './GuideTooltip';
import { MilestoneBadge } from './MilestoneBadge';
import styles from './NewUserGuide.module.css';

const STORAGE_KEY = 'vibex-guide-seen';

export function NewUserGuide() {
  const isActive = useGuideStore((s) => s.isActive);
  const currentStep = useGuideStore((s) => s.currentStep);
  const earnedBadges = useGuideStore((s) => s.earnedBadges);
  const hasSeenGuide = useGuideStore((s) => s.hasSeenGuide);
  const startGuide = useGuideStore((s) => s.startGuide);
  const nextStep = useGuideStore((s) => s.nextStep);
  const prevStep = useGuideStore((s) => s.prevStep);
  const skipGuide = useGuideStore((s) => s.skipGuide);

  // Auto-trigger for first-time users
  useEffect(() => {
    if (hasSeenGuide) return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Small delay to let the page fully render before showing the overlay
      const timer = setTimeout(() => {
        startGuide();
        localStorage.setItem(STORAGE_KEY, 'true');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [hasSeenGuide, startGuide]);

  // Don't render anything if the guide is not active
  if (!isActive) return null;

  const stepData = GUIDE_STEPS[currentStep];
  if (!stepData) return null;

  const isLastStep = currentStep === GUIDE_STEPS.length - 1;

  const handleNext = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const handlePrev = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    skipGuide();
  }, [skipGuide]);

  return (
    <div className={styles.root} aria-live="polite">
      {/* Spotlight overlay */}
      <GuideOverlay
        targetSelector={stepData.targetSelector}
        padding={8}
      >
        {/* Tooltip card */}
        {isLastStep ? (
          /* Final step: show MilestoneBadge + done button */
          <CompletionTooltip
            step={currentStep + 1}
            totalSteps={GUIDE_STEPS.length}
            targetSelector={stepData.targetSelector}
            placement={stepData.placement}
            earnedBadges={earnedBadges}
            onDone={handleNext}
            onSkip={handleSkip}
          />
        ) : (
          <GuideTooltip
            title={stepData.title}
            description={stepData.description}
            step={currentStep + 1}
            totalSteps={GUIDE_STEPS.length}
            targetSelector={stepData.targetSelector}
            placement={stepData.placement}
            isLastStep={isLastStep}
            onPrev={currentStep > 0 ? handlePrev : undefined}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        )}
      </GuideOverlay>
    </div>
  );
}

// =============================================================================
// Completion Tooltip
// =============================================================================

interface CompletionTooltipProps {
  step: number;
  totalSteps: number;
  targetSelector: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  earnedBadges: string[];
  onDone: () => void;
  onSkip: () => void;
}

function CompletionTooltip({
  step,
  totalSteps,
  targetSelector,
  placement = 'bottom',
  earnedBadges,
  onDone,
  onSkip,
}: CompletionTooltipProps) {
  return (
    <GuideTooltip
      title="引导完成！"
      description="你已解锁所有新手徽章。继续探索 VibeX，按 ? 查看快捷键。"
      step={step}
      totalSteps={totalSteps}
      targetSelector={targetSelector}
      placement={placement}
      isLastStep={true}
      onNext={onDone}
      onSkip={onSkip}
    >
      {/* Override body with badges */}
      <div className={styles.completionBody}>
        <MilestoneBadge earnedBadges={earnedBadges} compact />
        <button
          type="button"
          className={styles.doneBtn}
          onClick={onDone}
          aria-label="开始使用 VibeX"
        >
          <span>开始使用</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </GuideTooltip>
  );
}

export default NewUserGuide;
