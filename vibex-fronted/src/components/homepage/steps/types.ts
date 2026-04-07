// Step Component Types

import type { ConfirmationStep } from '@/stores/confirmationStore';

/**
 * Step Component Base Props
 */
export interface StepComponentProps {
  /** Step navigation callback */
  onNavigate: (step: number) => void;
  /** Whether this step is currently active */
  isActive: boolean;
}

/**
 * Step 1: Requirement Input
 */
export type StepRequirementInputProps = StepComponentProps & {
  // Data subscribed from store internally
};

/**
 * Step 2: Bounded Context
 */
export type StepBoundedContextProps = StepComponentProps & {
  // Data subscribed from store internally
};

/**
 * Step 3: Domain Model
 */
export type StepDomainModelProps = StepComponentProps & {
  // Data subscribed from store internally
};

/**
 * Step 4: Clarification (AI 需求澄清)
 */
export type StepClarificationProps = StepComponentProps & {
  // Data subscribed from store internally
};

/**
 * Step 5: Business Flow
 */
export type StepBusinessFlowProps = StepComponentProps & {
  // Data subscribed from store internally
};

/**
 * Step 6: Project Create
 */
export type StepProjectCreateProps = StepComponentProps & {
  // Data subscribed from store internally
};

/**
 * Step number mapping (1-6)
 */
export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * ConfirmationStep to StepNumber mapping
 */
export const STEP_TO_NUMBER: Record<ConfirmationStep, StepNumber> = {
  input: 1,
  context: 2,
  model: 3,
  clarification: 4,
  flow: 5,
  success: 6,
};

/**
 * StepNumber to ConfirmationStep mapping
 */
export const NUMBER_TO_STEP: Record<StepNumber, ConfirmationStep> = {
  1: 'input',
  2: 'context',
  3: 'model',
  4: 'clarification',
  5: 'flow',
  6: 'success',
};

/**
 * Step labels for display
 */
export const STEP_LABELS: Record<StepNumber, string> = {
  1: '需求输入',
  2: '限界上下文',
  3: '领域模型',
  4: '需求澄清',
  5: '业务流程',
  6: '项目创建',
};
