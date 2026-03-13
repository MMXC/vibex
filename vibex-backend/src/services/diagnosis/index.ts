/**
 * Diagnosis Service Index
 * @module services/diagnosis
 */

export * from './types'
export * from './diagnoser'
export * from './optimizer'

import { RequirementDiagnoser } from './diagnoser'
import { RequirementOptimizer } from './optimizer'

// Re-export for convenience
export const diagnosisService = {
  diagnoser: new RequirementDiagnoser(),
  optimizer: new RequirementOptimizer(),
}
