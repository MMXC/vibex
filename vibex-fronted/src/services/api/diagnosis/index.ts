/**
 * Diagnosis API Service
 * @module services/api/diagnosis
 */

import axios from 'axios'

// Types
export interface DiagnosisResult {
  overallScore: number
  grade: 'A' | 'B' | 'C' | 'D'
  scores: {
    completeness: number
    clarity: number
    consistency: number
    feasibility: number
  }
  identifiedDomains: IdentifiedDomain[]
  missingInfo: MissingInfo[]
  suggestions: Suggestion[]
  similarCases: SimilarCase[]
  cached?: boolean
}

export interface IdentifiedDomain {
  name: string
  confidence: number
  keywords: string[]
  completeness: number
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
  similarity: number
  previewUrl?: string
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

// API Client
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

/**
 * Analyze requirement quality
 */
export async function analyzeRequirement(
  requirementText: string,
  options?: AnalyzeRequest['options']
): Promise<DiagnosisResult> {
  const response = await api.post<AnalyzeResponse>('/diagnosis/analyze', {
    requirementText,
    options,
  })
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Analysis failed')
  }
  
  return response.data.result!
}

/**
 * One-click optimize requirement
 */
export async function optimizeRequirement(
  requirementText: string,
  diagnosis: DiagnosisResult,
  options?: OptimizeRequest['options']
): Promise<{ optimizedText: string; diff: DiffResult }> {
  const response = await api.post<OptimizeResponse>('/diagnosis/optimize', {
    requirementText,
    diagnosis,
    options,
  })
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Optimization failed')
  }
  
  return {
    optimizedText: response.data.optimizedText!,
    diff: response.data.diff!,
  }
}

export default {
  analyze: analyzeRequirement,
  optimize: optimizeRequirement,
}
