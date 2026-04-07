/**
 * OnboardingModal - 用户引导弹窗组件
 * 
 * 支持 5 步引导，使用 Framer Motion 动画
 */

'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore, ONBOARDING_STEPS } from '@/stores/onboarding';
import { StepIndicator } from './StepIndicator';
import {
  WelcomeStep,
  InputStep,
  ClarifyStep,
  ModelStep,
  PreviewStep,
} from './steps';
import styles from './OnboardingModal.module.css';

// Step component mapping
const STEP_COMPONENTS: Record<string, React.ComponentType<{
  onNext: () => void;
  onPrev?: () => void;
  onSkip: () => void;
  isLastStep?: boolean;
}>> = {
  welcome: WelcomeStep,
  input: InputStep,
  clarify: ClarifyStep,
  model: ModelStep,
  prototype: PreviewStep,
};

export function OnboardingModal() {
  const {
    status,
    currentStep,
    completedSteps,
    nextStep,
    prevStep,
    skip,
    complete,
  } = useOnboardingStore();

  // 只在进行中时显示
  const isOpen = status === 'in-progress';
  const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.id === currentStep);
  const currentStepInfo = ONBOARDING_STEPS[currentIndex];
  const canGoBack = currentIndex > 0;
  const isLastStep = currentIndex === ONBOARDING_STEPS.length - 1;

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        skip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, skip]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      complete();
    } else {
      nextStep();
    }
  }, [isLastStep, nextStep, complete]);

  const handleStepClick = useCallback(
    (stepId: string) => {
      const step = ONBOARDING_STEPS.find((s) => s.id === stepId);
      if (step && ONBOARDING_STEPS.findIndex((s) => s.id === stepId) < currentIndex) {
        // 可以后退到已完成的步骤
        useOnboardingStore.getState().goToStep(step.id);
      }
    },
    [currentIndex]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={skip}
          />

          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.badge}>新手指引</div>
              <button className={styles.closeButton} onClick={skip}>
                ✕
              </button>
            </div>

            {/* Step Indicator */}
            <StepIndicator
              steps={ONBOARDING_STEPS}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={handleStepClick}
            />

            {/* Step Content - render actual step component */}
            <div className={styles.content}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={styles.stepContent}
                >
                  {(() => {
                    const StepComponent = STEP_COMPONENTS[currentStep];
                    if (!StepComponent) return null;
                    return (
                      <StepComponent
                        onNext={handleNext}
                        onPrev={canGoBack ? prevStep : undefined}
                        onSkip={skip}
                        isLastStep={isLastStep}
                      />
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default OnboardingModal;
