/**
 * Diagnosis Service Types
 * 
 * Type definitions for the smart requirement diagnosis feature.
 * @module services/diagnosis/types
 */
// @ts-nocheck


export interface DiagnosisResult {
  // Overall score
  overallScore: number        // 0-100
  grade: 'A' | 'B' | 'C' | 'D'
  
  // Dimension scores
  scores: {
    completeness: number      // Completeness 0-100
    clarity: number           // Clarity 0-100
    consistency: number       // Consistency 0-100
    feasibility: number       // Feasibility 0-100
  }
  
  // Identified domains
  identifiedDomains: IdentifiedDomain[]
  
  // Missing information
  missingInfo: MissingInfo[]
  
  // Improvement suggestions
  suggestions: Suggestion[]
  
  // Similar cases
  similarCases: SimilarCase[]
}

export interface IdentifiedDomain {
  name: string
  confidence: number          // 0-1
  keywords: string[]
  completeness: number        // 0-1
  missingFunctions: string[]
}

export interface MissingInfo {
  domain: string
  item: string
  importance: 'high' | 'medium' | 'low'
  suggestion: string
  example?: string
}

export interface Suggestion {
  type: 'add' | 'modify' | 'clarify'
  target: string
  description: string
  example?: string
}

export interface SimilarCase {
  name: string
  industry: string
  similarity: number          // 0-1
  previewUrl?: string
}

export interface DiagnosisCache {
  key: string
  result: DiagnosisResult
  createdAt: number
  ttl: number
}

export interface ScoreWeights {
  completeness: number        // Default 0.30
  clarity: number             // Default 0.25
  consistency: number         // Default 0.25
  feasibility: number         // Default 0.20
}

export interface DiffResult {
  original: string
  optimized: string
  changes: DiffChange[]
}

export interface DiffChange {
  type: 'added' | 'removed' | 'modified'
  original: string
  optimized: string
  position: { start: number; end: number }
}

// API Types
export interface AnalyzeRequest {
  requirementText: string
  options?: {
    enableCache?: boolean
    detailLevel?: 'brief' | 'full'
  }
}

export interface AnalyzeResponse {
  success: boolean
  result?: DiagnosisResult
  error?: string
  cached: boolean
}

export interface OptimizeRequest {
  requirementText: string
  diagnosis: DiagnosisResult
  options?: {
    preserveOriginal?: boolean
    focusAreas?: string[]
  }
}

export interface OptimizeResponse {
  success: boolean
  optimizedText?: string
  diff?: DiffResult
  error?: string
}

// Grade thresholds
export const GRADE_THRESHOLDS = {
  A: 90,
  B: 70,
  C: 50,
  D: 0,
}

// Default weights
export const DEFAULT_WEIGHTS: ScoreWeights = {
  completeness: 0.30,
  clarity: 0.25,
  consistency: 0.25,
  feasibility: 0.20,
}
