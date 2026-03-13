// services/context/types.ts - 类型定义

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
  importance?: number
  isKeyDecision?: boolean
  structuredData?: Record<string, unknown>
}

export interface SessionContext {
  sessionId: string
  messages: ChatMessage[]
  tokenCount: number
  structuredContext?: StructuredContext
  summary?: string
  createdAt: number
  updatedAt: number
}

export interface SessionStats {
  messageCount: number
  tokenCount: number
  compressionCount: number
  lastCompressedAt?: number
}

export interface StructuredContext {
  requirementText: string
  boundedContexts: BoundedContext[]
  domainModels: DomainModel[]
  businessFlow: BusinessFlow | null
  currentStep?: ConfirmationStep
  decisions?: DecisionRecord[]
}

export interface BoundedContext {
  id: string
  name: string
  description: string
  type: 'core' | 'supporting' | 'generic' | 'external'
}

export interface DomainModel {
  id: string
  name: string
  contextId: string
  type: string
  properties: Property[]
}

export interface Property {
  name: string
  type: string
  required: boolean
}

export interface BusinessFlow {
  id: string
  name: string
  mermaidCode?: string
}

export interface DecisionRecord {
  timestamp: number
  decision: string
  reason?: string
}

export type ConfirmationStep = 
  | 'requirement_confirmed'
  | 'context_defined'
  | 'model_approved'
  | 'flow_defined'

export type CompressionStrategy = 
  | 'sliding_window'
  | 'summarize'
  | 'extract'
  | 'hybrid'

export interface CompressionConfig {
  tokenThreshold: number
  preserveRecentMessages: number
  maxSummaryLength: number
  strategy: CompressionStrategy
}

export interface CompressionResult {
  success: boolean
  originalTokenCount: number
  newTokenCount: number
  compressionRatio: number
  summary?: string
  strategy: CompressionStrategy
}

export interface ConfirmationState {
  sessionId: string
  summary: string
  isConfirmed: boolean
  originalMessagesBackup?: ChatMessage[]
  createdAt: number
}
