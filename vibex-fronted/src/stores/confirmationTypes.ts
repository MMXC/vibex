/**
 * ConfirmationFlow 类型定义
 * 从 confirmationStore.ts 拆分出的类型文件
 * 
 * Batch 1: 类型拆分 - 保持向后兼容
 */

import { StateStorage } from 'zustand/middleware';

// Confirmation step types
export type ConfirmationStep =
  | 'input'
  | 'context'
  | 'model'
  | 'clarification'
  | 'flow'
  | 'success';

// Snapshot type for undo/redo
export interface ConfirmationSnapshot {
  step: ConfirmationStep;
  requirementText: string;
  boundedContexts: BoundedContext[];
  selectedContextIds: string[];
  contextMermaidCode: string;
  domainModels: DomainModel[];
  modelMermaidCode: string;
  clarificationRounds: ClarificationRound[];
  businessFlow: BusinessFlow;
  flowMermaidCode: string;
  timestamp: number;
  note?: string;
}

// Bounded Context types
export interface BoundedContext {
  id: string;
  name: string;
  description: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  relationships: ContextRelationship[];
}

export interface ContextRelationship {
  id: string;
  fromContextId: string;
  toContextId: string;
  type: 'upstream' | 'downstream' | 'symmetric';
  description: string;
}

// Domain Model types
export interface DomainModel {
  id: string;
  name: string;
  contextId: string;
  type: 'aggregate_root' | 'entity' | 'value_object';
  properties: DomainProperty[];
  methods: string[];
}

export interface DomainProperty {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

// Business Flow types
export interface BusinessFlow {
  steps: FlowStep[];
  currentStepIndex: number;
}

export interface FlowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
}

export interface FlowState {
  steps: FlowStep[];
  currentStepIndex: number;
}

export interface FlowTransition {
  fromStep: number;
  toStep: number;
  timestamp: number;
}

// Clarification types
export interface ClarificationRound {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
}

// Main state interface
export interface ConfirmationFlowState {
  // Current step
  step: ConfirmationStep;
  setStep: (step: ConfirmationStep) => void;
  
  // Requirement text
  requirementText: string;
  setRequirementText: (text: string) => void;
  
  // Bounded Contexts
  boundedContexts: BoundedContext[];
  setBoundedContexts: (contexts: BoundedContext[]) => void;
  addBoundedContext: (context: BoundedContext) => void;
  updateBoundedContext: (id: string, updates: Partial<BoundedContext>) => void;
  removeBoundedContext: (id: string) => void;
  
  // Domain Models
  domainModels: DomainModel[];
  setDomainModels: (models: DomainModel[]) => void;
  addDomainModel: (model: DomainModel) => void;
  updateDomainModel: (id: string, updates: Partial<DomainModel>) => void;
  removeDomainModel: (id: string) => void;
  
  // Business Flow
  businessFlow: BusinessFlow;
  setBusinessFlow: (flow: BusinessFlow) => void;
  
  // Mermaid code
  contextMermaidCode: string;
  setContextMermaidCode: (code: string) => void;
  modelMermaidCode: string;
  setModelMermaidCode: (code: string) => void;
  flowMermaidCode: string;
  setFlowMermaidCode: (code: string) => void;
  
  // Clarification
  clarificationRounds: ClarificationRound[];
  addClarificationRound: (round: ClarificationRound) => void;
  
  // Undo/Redo
  snapshots: ConfirmationSnapshot[];
  currentSnapshotIndex: number;
  createSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Reset
  reset: () => void;
}

// Re-export from confirmationStore for backward compatibility
// These will be updated in subsequent batches
