/**
 * CanvasOnboardingOverlay — First-time user onboarding overlay for the canvas
 *
 * E4-T1: Detects first-time canvas users via localStorage, shows step-by-step
 * guidance highlighting TabBar, TreePanel, and input area.
 *
 * Uses existing OnboardingStore pattern for consistency.
 * Follows AGENTS.md: no any, no canvasLogger.default.debug, WCAG 2.1 AA compliance.
 */
'use client';

import React, { memo, useEffect, useRef, useCallback } from 'react';
import { useGuidanceStore } from '@/stores/guidanceStore';
import { X, ChevronLeft, ChevronRight, MousePointer2, Layers, ArrowRight } from 'lucide-react';
import styles from './CanvasOnboardingOverlay.module.css';

// =============================================================================
// Types
// =============================================================================

interface OnboardingStepData {
  /** Step number (1-indexed) */
  step: number;
  /** Title shown at the top */
  title: string;
  /** Description */
  description: string;
  /** Which area to highlight ('tabbar' | 'treepanel' | 'input' | 'projectbar') */
  targetArea: string;
  /** CSS selector for the target element to highlight */
  targetSelector: string;
  /** Icon component name */
  icon: React.ReactNode;
}

// =============================================================================
// Steps Configuration
// =============================================================================

const ONBOARDING_STEPS: OnboardingStepData[] = [
  {
    step: 1,
    title: '三树结构',
    description: '画布包含限界上下文树、流程树和组件树。切换标签页查看不同视图，使用树面板折叠按钮调整布局。',
    targetArea: 'tabbar',
    targetSelector: '[class*="tabBar"]',
    icon: <Layers size={20} aria-hidden="true" />,
  },
  {
    step: 2,
    title: '节点操作',
    description: '点击节点选中，Shift+点击多选。使用右侧工具栏确认、编辑或删除节点。节点状态：待确认(黄)、已确认(绿)、错误(红)。',
    targetArea: 'treepanel',
    targetSelector: '[class*="treePanel"]',
    icon: <MousePointer2 size={20} aria-hidden="true" />,
  },
  {
    step: 3,
    title: '快捷键加速',
    description: '按 ? 键打开快捷键面板。常用：Ctrl+Z 撤销、Ctrl+K 搜索、Space+拖拽平移、N 新建节点、F11 最大化。',
    targetArea: 'projectbar',
    targetSelector: '[class*="projectBar"]',
    icon: <ArrowRight size={20} aria-hidden="true" />,
  },
];

// =============================================================================
// Component
// =============================================================================

export const CanvasOnboardingOverlay = memo(function CanvasOnboardingOverlay() {
  // === ALL HOOKS: 无条件定义，不允许 early return ===
  const overlayRef = useRef<HTMLDivElement>(null);

  // Onboarding state from store
  const completed = useGuidanceStore((s) => s.canvasOnboardingCompleted);
  const dismissed = useGuidanceStore((s) => s.canvasOnboardingDismissed);
  const currentStep = useGuidanceStore((s) => s.canvasOnboardingStep);
  const nextOnboardingStep = useGuidanceStore((s) => s.nextOnboardingStep);
  const prevOnboardingStep = useGuidanceStore((s) => s.prevOnboardingStep);
  const completeCanvasOnboarding = useGuidanceStore((s) => s.completeCanvasOnboarding);
  const dismissCanvasOnboarding = useGuidanceStore((s) => s.dismissCanvasOnboarding);
  const startCanvasOnboarding = useGuidanceStore((s) => s.startCanvasOnboarding);

  // === useCallback: 在所有 hooks 之后，early return 之前 ===
  const handleDismiss = useCallback(() => {
    dismissCanvasOnboarding();
  }, [dismissCanvasOnboarding]);

  const handleComplete = useCallback(() => {
    completeCanvasOnboarding();
  }, [completeCanvasOnboarding]);

  const handleNext = useCallback(() => {
    nextOnboardingStep();
  }, [nextOnboardingStep]);

  const handlePrev = useCallback(() => {
    prevOnboardingStep();
  }, [prevOnboardingStep]);

  // Auto-start onboarding for first-time canvas users
  useEffect(() => {
    if (currentStep !== 0) return; // already started
    const canvasOnboarded = localStorage.getItem('vibex-canvas-onboarded');
    if (!canvasOnboarded) {
      const timer = setTimeout(() => {
        startCanvasOnboarding();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep, startCanvasOnboarding]);

  // Keyboard navigation: 直接调用 store action，无中间 callback
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        dismissCanvasOnboarding();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextOnboardingStep();
      } else if (e.key === 'ArrowLeft') {
        prevOnboardingStep();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dismissCanvasOnboarding, nextOnboardingStep, prevOnboardingStep]);

  // === EARLY RETURNS: 所有 hooks 之后 ===
  if (completed || dismissed) return null;
  if (currentStep === 0) return null;

  // === JSX RENDER ===
  const stepData = ONBOARDING_STEPS[currentStep - 1];
  if (!stepData) return null;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === ONBOARDING_STEPS.length;

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`画布引导 ${currentStep}/${ONBOARDING_STEPS.length}`}
    >
      {/* Semi-transparent backdrop — avoids covering the target area */}
      <div className={styles.backdrop} aria-hidden="true" />

      {/* Step content card */}
      <div
        className={styles.card}
        style={{
          // Position near the target area
          top: stepData.targetArea === 'tabbar' ? '120px' :
               stepData.targetArea === 'input' ? '200px' :
               stepData.targetArea === 'projectbar' ? '60px' : '180px',
          right: '20px',
        }}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.stepIndicator} aria-label={`步骤 ${currentStep}，共 ${ONBOARDING_STEPS.length} 步`}>
            <span className={styles.stepIcon}>{stepData.icon}</span>
            <span className={styles.stepBadge}>
              {currentStep} / {ONBOARDING_STEPS.length}
            </span>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleDismiss}
            aria-label="跳过引导"
            title="跳过引导"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h2 className={styles.title}>{stepData.title}</h2>
          <p className={styles.description}>{stepData.description}</p>
        </div>

        {/* Progress dots */}
        <div className={styles.progress} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={ONBOARDING_STEPS.length}>
          {ONBOARDING_STEPS.map((s) => (
            <button
              key={s.step}
              type="button"
              className={`${styles.dot} ${s.step === currentStep ? styles.dotActive : ''} ${s.step < currentStep ? styles.dotDone : ''}`}
              onClick={() => useGuidanceStore.getState().startCanvasOnboarding()}
              aria-label={`跳转到步骤 ${s.step}`}
              disabled={s.step !== currentStep}
            />
          ))}
        </div>

        {/* Footer navigation */}
        <div className={styles.footer}>
          {!isFirstStep && (
            <button
              type="button"
              className={styles.prevButton}
              onClick={handlePrev}
              aria-label="上一步"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              <span>上一步</span>
            </button>
          )}

          <div className={styles.footerSpacer} />

          {isLastStep ? (
            <button
              type="button"
              className={styles.doneButton}
              onClick={handleComplete}
              aria-label="完成引导"
            >
              <span>完成</span>
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className={styles.nextButton}
              onClick={handleNext}
              aria-label="下一步"
            >
              <span>下一步</span>
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          )}

          {!isLastStep && (
            <button
              type="button"
              className={styles.skipButton}
              onClick={handleDismiss}
              aria-label="跳过引导"
            >
              跳过
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default CanvasOnboardingOverlay;
