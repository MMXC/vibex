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
    if (!state.diagnosis) return

    setState(prev => ({
      ...prev,
      isOptimizing: true,
      optimizeError: null,
    }))

    try {
      // This would need the original requirement text
      // For now, we'll use a placeholder
      const { optimizedText, diff } = await optimizeRequirement(
        '', // Would pass original text
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
  }, [state.diagnosis])

  const applyOptimization = useCallback(() => {
    // This would be handled by the component
    setState(prev => ({
      ...prev,
      diagnosis: prev.diagnosis ? {
        ...prev.diagnosis,
        // Update the requirement text in the diagnosis
      } : null,
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
