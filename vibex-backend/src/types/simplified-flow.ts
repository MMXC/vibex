/**
 * Simplified Flow - Shared Types
 * 
 * Type definitions for the simplified 3-step flow:
 * Step 1: Business Domain + Flow
 * Step 2: Requirement Clarification
 * Step 3: UI Generation
 * 
 * Based on: docs/vibex-simplified-flow/specs/
 */

// ==================== Domain Types ====================

export type DomainType = 'core' | 'supporting' | 'generic' | 'external';

export interface Feature {
  id: string;
  name: string;
  description: string;
  isSelected: boolean;
  isCore: boolean;
}

export interface DomainRelationship {
  id: string;
  targetDomainId: string;
  type: 'upstream' | 'downstream' | 'symmetric' | 'conformist' | 'anticorruption';
  description: string;
}

export interface BusinessDomain {
  id: string;
  name: string;
  description: string;
  type: DomainType;
  features: Feature[];
  relationships: DomainRelationship[];
  createdAt: number;
  updatedAt: number;
}

// ==================== Flow Types ====================

export type FlowNodeType = 'start' | 'end' | 'task' | 'decision' | 'subprocess';

export interface FlowNode {
  id: string;
  domainId: string;
  name: string;
  type: FlowNodeType;
  position: { x: number; y: number };
  description?: string;
}

export type FlowEdgeType = 'default' | 'success' | 'error';

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: FlowEdgeType;
  label?: string;
}

export interface FlowData {
  id: string;
  projectId?: string;
  domainIds: string[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  mermaidCode?: string;
  createdAt: number;
  updatedAt: number;
}

// ==================== UI Node Types ====================

export type UINodeType = 'page' | 'form' | 'list' | 'detail' | 'header' | 'footer' | 'modal' | 'navigation' | 'card';

export interface UINodeAnnotation {
  id: string;
  text: string;
  source: 'user_input' | 'ai_suggestion';
  timestamp: string;
  applied: boolean;
}

export type UINodePriority = 'low' | 'medium' | 'high';
export type UINodeStatus = 'pending' | 'generated' | 'failed';

export interface UINode {
  id: string;
  name: string;
  nodeType: UINodeType;
  description?: string;
  linkedFlowNodeId?: string;
  children: UINode[];
  annotations: UINodeAnnotation[];
  positionX?: number;
  positionY?: number;
  checked: boolean;
  priority: UINodePriority;
  status: UINodeStatus;
}

// ==================== Step State Types ====================

export type SimplifiedStep = 1 | 2 | 3;
export type FlowType = 'core_only' | 'core_with_supporting' | 'full';
export type Step3Status = 'pending' | 'queued' | 'generating' | 'done' | 'failed';

export interface Step1Data {
  domainIds: string[];
  flowId?: string;
  uiNodeIds?: string[];
  checkedDomainIds: string[];
  checkedFeatureIds: Record<string, string[]>;
  generationTime: number;
  interruptedAt?: string;
  interruptedDomainId?: string;
  flowType: FlowType;
}

export interface Step2Data {
  uiNodeIds: string[];
  annotations: Record<string, UINodeAnnotation[]>;
  naturalLanguageInputs: string[];
}

export interface Step3Data {
  status: Step3Status;
  queueId?: string;
  progress?: number;
  currentPage?: string;
  generatedPages: string[];
  failedPages: string[];
}

export interface StepState {
  projectId: string;
  currentStep: SimplifiedStep;
  version: number;
  lastModified: string;
  lastModifiedBy: string;
  step1?: Step1Data | null;
  step2?: Step2Data | null;
  step3?: Step3Data | null;
}

// ==================== Change History Types ====================

export type ChangeSource = 'user' | 'ai' | 'system' | 'rollback';
export type ChangeAction = 'create' | 'update' | 'delete' | 'rollback' | 'merge';

export interface ChangeEntry {
  id: string;
  version: number;
  timestamp: string;
  source: ChangeSource;
  action: ChangeAction;
  field: string;
  before: unknown;
  after: unknown;
  userId?: string;
}

// ==================== Project Snapshot Types ====================

export type ProjectStatus = 'draft' | 'active' | 'converted' | 'archived';

export interface ProjectSnapshot {
  project: {
    id: string;
    name: string;
    description?: string;
    status: ProjectStatus;
    userId: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    isTemplate: boolean;
    parentDraftId?: string;
  };
  stepState: StepState;
  domains: (BusinessDomain & { features: Feature[] })[];
  flow?: FlowData;
  uiNodes: UINode[];
  history: ChangeEntry[];
  snapshotMeta: SnapshotMeta;
}

export interface SnapshotMeta {
  totalDomains: number;
  totalFeatures: number;
  totalNodes: number;
  totalUINodes: number;
  checkedFeaturesCount: number;
  lastModified: string;
  historyCount: number;
}

// ==================== API Request/Response Types ====================

export interface SaveStepStateRequest {
  projectId: string;
  currentStep: SimplifiedStep;
  step1?: Step1Data | null;
  step2?: Step2Data | null;
  step3?: Step3Data | null;
  updatedAt?: string; // Optimistic locking
}

export interface SaveStepStateResponse {
  success: true;
  data: StepState;
  updatedAt: string;
  version: number;
}

export interface ConflictResponse {
  success: false;
  error: 'State was modified. Please refresh and try again.';
  code: 'VERSION_CONFLICT';
  serverData: StepState;
  serverUpdatedAt: string;
}

export interface GetProjectSnapshotResponse {
  success: true;
  data: ProjectSnapshot;
}
