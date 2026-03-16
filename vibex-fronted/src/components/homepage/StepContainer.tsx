// Step Container - Handles lazy loading of step components

import { Suspense, lazy, ComponentType, useCallback } from 'react';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { StepLoading } from './steps/StepLoading';
import type { StepComponentProps } from './steps/types';

// Lazy load step components
const StepComponents: Record<number, React.LazyExoticComponent<ComponentType<StepComponentProps>>> = {
  1: lazy(() => import('./steps/StepRequirementInput')),
  2: lazy(() => import('./steps/StepBoundedContext')),
  3: lazy(() => import('./steps/StepDomainModel')),
  4: lazy(() => import('./steps/StepBusinessFlow')),
  5: lazy(() => import('./steps/StepProjectCreate')),
};

const STEP_DEFAULT_MESSAGE: Record<number, string> = {
  1: '正在加载需求输入...',
  2: '正在加载限界上下文...',
  3: '正在加载领域模型...',
  4: '正在加载业务流程...',
  5: '正在加载项目创建...',
};

export function StepContainer() {
  // Get current step from store
  const currentStep = useConfirmationStore((state) => state.currentStep);
  const stepNumber = typeof currentStep === 'number' ? currentStep : 1;

  // Get step component
  const StepComponent = StepComponents[stepNumber];

  // Handle navigation
  const handleNavigate = useCallback((targetStep: number) => {
    const store = useConfirmationStore.getState();
    
    // Map step number to ConfirmationStep
    const stepMap: Record<number, 'input' | 'context' | 'model' | 'flow' | 'success'> = {
      1: 'input',
      2: 'context',
      3: 'model',
      4: 'flow',
      5: 'success',
    };
    
    const confirmationStep = stepMap[targetStep] || 'input';
    store.setCurrentStep(confirmationStep);
  }, []);

  // Invalid step
  if (!StepComponent) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>无效的步骤: {stepNumber}</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<StepLoading step={stepNumber} message={STEP_DEFAULT_MESSAGE[stepNumber]} />}>
      <StepComponent 
        onNavigate={handleNavigate} 
        isActive={true} 
      />
    </Suspense>
  );
}

export default StepContainer;
