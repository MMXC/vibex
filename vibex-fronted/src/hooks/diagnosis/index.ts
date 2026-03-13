/**
 * useDiagnosis Hook
 * React hook for requirement diagnosis functionality
 * @module hooks/useDiagnosis
 */

import { useState, useCallback } from 'react'
import {
  analyzeRequirement,
  optimizeRequirement,
  DiagnosisResult,
  DiffResult,
} from '@/services/api/diagnosis'

export interface UseDiagnosisState {
  // Original requirement text
  originalText: string
  // Diagnosis state
  diagnosis: DiagnosisResult | null
  isAnalyzing: boolean
  analysisError: string | null
  
  // Optimization state
  optimizedText: string | null
  diff: DiffResult | null
  isOptimizing: boolean
  optimizeError: string | null
}

export interface UseDiagnosisActions {
  diagnose: (text: string, enableCache?: boolean) => Promise<void>
  optimize: () => Promise<void>
  applyOptimization: () => void
  cancelOptimization: () => void
  reset: () => void
}

export function useDiagnosis(): UseDiagnosisState & UseDiagnosisActions {
  const [state, setState] = useState<UseDiagnosisState>({
    originalText: '',
    diagnosis: null,
    isAnalyzing: false,
    analysisError: null,
    optimizedText: null,
    diff: null,
    isOptimizing: false,
    optimizeError: null,
  })

  const diagnose = useCallback(async (text: string, enableCache = true) => {
    setState(prev => ({
      ...prev,
      originalText: text, // Store original text
      isAnalyzing: true,
      analysisError: null,
      diagnosis: null,
      optimizedText: null,
      diff: null,
    }))

    try {
      const result = await analyzeRequirement(text, { enableCache })
      setState(prev => ({
        ...prev,
        diagnosis: result,
        isAnalyzing: false,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        analysisError: error instanceof Error ? error.message : 'Analysis failed',
      }))
    }
  }, [])

  const optimize = useCallback(async () => {
    if (!state.diagnosis || !state.originalText) return

    setState(prev => ({
      ...prev,
      isOptimizing: true,
      optimizeError: null,
    }))

    try {
      // FIX: Pass original text instead of empty string
      const { optimizedText, diff } = await optimizeRequirement(
        state.originalText,
        state.diagnosis
      )
      setState(prev => ({
        ...prev,
        optimizedText,
        diff,
        isOptimizing: false,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        optimizeError: error instanceof Error ? error.message : 'Optimization failed',
      }))
    }
  }, [state.diagnosis, state.originalText])

  const applyOptimization = useCallback(() => {
    // Apply optimization by updating the diagnosis with optimized text
    setState(prev => ({
      ...prev,
      diagnosis: prev.diagnosis && prev.optimizedText ? {
        ...prev.diagnosis,
        requirementText: prev.optimizedText, // Update to optimized text
      } : prev.diagnosis,
      optimizedText: null,
      diff: null,
    }))
  }, [])

  const cancelOptimization = useCallback(() => {
    setState(prev => ({
      ...prev,
      optimizedText: null,
      diff: null,
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      originalText: '',
      diagnosis: null,
      isAnalyzing: false,
      analysisError: null,
      optimizedText: null,
      diff: null,
      isOptimizing: false,
      optimizeError: null,
    })
  }, [])

  return {
    ...state,
    diagnose,
    optimize,
    applyOptimization,
    cancelOptimization,
    reset,
  }
}

export default useDiagnosis
