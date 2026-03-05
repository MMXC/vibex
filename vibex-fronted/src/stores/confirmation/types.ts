// Confirmation Flow Types - Shared types for all stores

export type ConfirmationStep = 'input' | 'context' | 'model' | 'flow' | 'success'

// Snapshot type for undo/redo
export interface ConfirmationSnapshot {
  step: ConfirmationStep
  requirementText: string
  boundedContexts: BoundedContext[]
  selectedContextIds: string[]
  contextMermaidCode: string
  domainModels: DomainModel[]
  modelMermaidCode: string
  businessFlow: BusinessFlow
  flowMermaidCode: string
  timestamp: number
}

export interface BoundedContext {
  id: string
  name: string
  description: string
  type: 'core' | 'supporting' | 'generic' | 'external'
  relationships: ContextRelationship[]
}

export interface ContextRelationship {
  id: string
  fromContextId: string
  toContextId: string
  type: 'upstream' | 'downstream' | 'symmetric'
  description: string
}

export interface DomainModel {
  id: string
  name: string
  contextId: string
  type: 'aggregate_root' | 'entity' | 'value_object'
  properties: DomainProperty[]
  methods: string[]
}

export interface DomainProperty {
  name: string
  type: string
  required: boolean
  description: string
}

export interface BusinessFlow {
  id: string
  name: string
  states: FlowState[]
  transitions: FlowTransition[]
}

export interface FlowState {
  id: string
  name: string
  type: 'initial' | 'intermediate' | 'final'
  description: string
}

export interface FlowTransition {
  id: string
  fromStateId: string
  toStateId: string
  event: string
  condition?: string
}
