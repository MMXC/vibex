/**
 * FlowContainer - Multi-step flow process container
 * 
 * Provides the layout wrapper with step indicator and navigation
 */
// @ts-nocheck


'use client';

import { ReactNode } from 'react';
import { useMachine } from '@xstate/react';
import { flowMachine, STEP_ORDER, STEP_LABELS, STEP_ICONS, FlowStep, FlowEvent, FlowContext } from './flowMachine';
import { FlowNavigator } from './FlowNavigator';
import styles from './FlowContainer.module.css';

export interface FlowContainerProps {
  onComplete?: (context: FlowContext) => void;
  onStepChange?: (step: FlowStep) => void;
  children: (state: ReturnType<typeof useMachine<typeof flowMachine>>[0]) => ReactNode;
}

export function FlowContainer({ onComplete, onStepChange, children }: FlowContainerProps) {
  const [state, send] = useMachine(flowMachine);

  const currentStep = state.value as FlowStep;
  const isCompleted = state.status === 'done';
  const completedSteps = STEP_ORDER.slice(0, STEP_ORDER.indexOf(currentStep));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.stepIndicator}>
          {STEP_ORDER.map((step, index) => {
            const isCurrent = step === currentStep;
            const isPast = STEP_ORDER.indexOf(step) < STEP_ORDER.indexOf(currentStep);
            
            return (
              <div
                key={step}
                className={`${styles.step} ${isCurrent ? styles.current : ''} ${isPast ? styles.completed : ''}`}
              >
                <div className={styles.stepIcon}>
                  {isPast ? '✓' : STEP_ICONS[step]}
                </div>
                <div className={styles.stepLabel}>{STEP_LABELS[step]}</div>
                {index < STEP_ORDER.length - 1 && (
                  <div className={`${styles.connector} ${isPast ? styles.connectorCompleted : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.content}>
        {children(state)}
      </div>

      <FlowNavigator
        currentStep={currentStep}
        onPrev={() => send({ type: 'GO_PREV' } satisfies FlowEvent)}
        onNext={() => send({ type: 'GO_NEXT' } satisfies FlowEvent)}
        onSave={() => send({ type: 'SAVE' } satisfies FlowEvent)}
        isFirst={currentStep === STEP_ORDER[0]}
        isLast={currentStep === STEP_ORDER[STEP_ORDER.length - 1]}
        isCompleted={isCompleted}
      />
    </div>
  );
}

export type { FlowStep } from './flowMachine';
export { flowMachine } from './flowMachine';
