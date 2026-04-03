/**
 * Step Validation Rules
 * Following the architecture spec from docs/vibex-proposal-five-step-flow/architecture.md
 * 
 * Validates that each step has sufficient data before allowing navigation.
 */
// @ts-nocheck


import type { BoundedContext, DomainModel, BusinessFlow } from '@/types/homepage';

/**
 * Step Data types matching the five-step flow architecture
 */
export interface RequirementData {
  text: string;
  template?: string;
  keywords?: string[];
}

export interface BoundedContextData {
  contexts: BoundedContext[];
  relationships: ContextRelationship[];
  selectedContextIds?: string[];
}

export interface ContextRelationship {
  id: string;
  fromContextId: string;
  toContextId: string;
  type: 'upstream' | 'downstream' | 'symmetric';
  description: string;
}

export interface FlowchartData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  metadata?: Record<string, unknown>;
}

export interface FlowNode {
  id: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'subprocess';
  label: string;
  position: { x: number; y: number };
  connections: string[];
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface UIComponentData {
  components: UIComponent[];
  layout?: Record<string, unknown>;
}

export interface UIComponent {
  id: string;
  name: string;
  category: string;
  selected: boolean;
}

export interface ProjectData {
  name: string;
  description: string;
  settings?: Record<string, unknown>;
}

export interface StepData {
  requirement?: RequirementData;
  boundedContext?: BoundedContextData;
  flowchart?: FlowchartData;
  uiComponents?: UIComponentData;
  project?: ProjectData;
}

/**
 * Validation rule for Step 1: Requirement Input
 * - Requires at least 10 characters of requirement text
 */
export function validateStep1(data?: StepData): { valid: boolean; message?: string } {
  const requirement = data?.requirement;
  if (!requirement?.text?.trim()) {
    return { valid: false, message: '请输入需求描述' };
  }
  if (requirement.text.trim().length < 10) {
    return { valid: false, message: '需求描述至少需要10个字符' };
  }
  return { valid: true };
}

/**
 * Validation rule for Step 2: Bounded Context
 * - Requires at least one bounded context selected
 */
export function validateStep2(data?: StepData): { valid: boolean; message?: string } {
  const context = data?.boundedContext;
  if (!context?.contexts?.length) {
    return { valid: false, message: '请至少选择一个限界上下文' };
  }
  // Selection is tracked via selectedContextIds array
  const selectedCount = context.selectedContextIds?.length ?? 0;
  if (selectedCount === 0) {
    return { valid: false, message: '请至少选择一个限界上下文' };
  }
  return { valid: true };
}

/**
 * Validation rule for Step 3: Business Flow
 * - Requires at least 2 flow nodes
 */
export function validateStep3(data?: StepData): { valid: boolean; message?: string } {
  const flow = data?.flowchart;
  if (!flow?.nodes?.length) {
    return { valid: false, message: '请添加至少2个流程节点' };
  }
  if (flow.nodes.length < 2) {
    return { valid: false, message: '请添加至少2个流程节点' };
  }
  return { valid: true };
}

/**
 * Validation rule for Step 4: UI Components
 * - Requires at least 1 component selected
 */
export function validateStep4(data?: StepData): { valid: boolean; message?: string } {
  const ui = data?.uiComponents;
  if (!ui?.components?.length) {
    return { valid: false, message: '请至少选择一个UI组件' };
  }
  const selectedCount = ui.components.filter((c) => c.selected).length;
  if (selectedCount === 0) {
    return { valid: false, message: '请至少选择一个UI组件' };
  }
  return { valid: true };
}

/**
 * Validation rule for Step 5: Project Create
 * - Requires a non-empty project name
 */
export function validateStep5(data?: StepData): { valid: boolean; message?: string } {
  const project = data?.project;
  if (!project?.name?.trim()) {
    return { valid: false, message: '请输入项目名称' };
  }
  if (project.name.trim().length < 2) {
    return { valid: false, message: '项目名称至少需要2个字符' };
  }
  return { valid: true };
}

/**
 * Validation rule map by step number
 */
export const stepValidationRules: Record<number, (data?: StepData) => { valid: boolean; message?: string }> = {
  1: validateStep1,
  2: validateStep2,
  3: validateStep3,
  4: validateStep4,
  5: validateStep5,
};

/**
 * Validate a specific step
 */
export function validateStep(step: number, data?: StepData): { valid: boolean; message?: string } {
  const validator = stepValidationRules[step];
  if (!validator) {
    return { valid: false, message: `未知的步骤: ${step}` };
  }
  return validator(data);
}

/**
 * Check if a step can proceed to the next step
 */
export function canProceedToStep(
  currentStep: number,
  data?: StepData
): boolean {
  const result = validateStep(currentStep, data);
  return result.valid;
}

/**
 * Validate all completed steps
 * Returns an array of step numbers that failed validation
 */
export function validateAllSteps(data?: StepData): number[] {
  const failedSteps: number[] = [];
  for (let step = 1; step <= 5; step++) {
    if (!validateStep(step, data).valid) {
      failedSteps.push(step);
    }
  }
  return failedSteps;
}
