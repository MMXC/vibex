/**
 * Requirement Optimizer Service
 * 
 * Provides one-click optimization for requirements based on diagnosis results.
 * @module services/diagnosis/optimizer
 */
// @ts-nocheck


import {
  DiagnosisResult,
  DiffResult,
  DiffChange,
} from './types'

export class RequirementOptimizer {
  /**
   * Optimize requirement text based on diagnosis
   */
  async optimize(
    requirementText: string,
    diagnosis: DiagnosisResult
  ): Promise<string> {
    const missingInfo = diagnosis.missingInfo.filter(m => m.importance === 'high')
    
    // Build optimization prompt
    let optimizationParts: string[] = []
    
    if (missingInfo.length > 0) {
      optimizationParts.push('需要补充的关键信息：')
      for (const m of missingInfo.slice(0, 3)) {
        optimizationParts.push(`- ${m.item}: ${m.suggestion}`)
      }
    }
    
    // Add clarity suggestions
    const claritySuggestion = diagnosis.suggestions.find(s => s.type === 'clarify')
    if (claritySuggestion) {
      optimizationParts.push(`\n改进建议：${claritySuggestion.description}`)
    }

    // Generate optimized text
    const optimized = this.generateOptimizedText(
      requirementText,
      optimizationParts.join('\n'),
      diagnosis.identifiedDomains.map(d => d.name)
    )
    
    return optimized
  }

  /**
   * Generate diff between original and optimized
   */
  generateDiff(original: string, optimized: string): DiffResult {
    const changes: DiffChange[] = []
    
    const originalLines = original.split('\n')
    const optimizedLines = optimized.split('\n')
    
    // Simple line-by-line diff
    const maxLen = Math.max(originalLines.length, optimizedLines.length)
    
    for (let i = 0; i < maxLen; i++) {
      const origLine = originalLines[i] || ''
      const optLine = optimizedLines[i] || ''
      
      if (origLine !== optLine) {
        if (origLine && !optLine) {
          changes.push({
            type: 'removed',
            original: origLine,
            optimized: '',
            position: { start: i, end: i + 1 },
          })
        } else if (!origLine && optLine) {
          changes.push({
            type: 'added',
            original: '',
            optimized: optLine,
            position: { start: i, end: i + 1 },
          })
        } else {
          changes.push({
            type: 'modified',
            original: origLine,
            optimized: optLine,
            position: { start: i, end: i + 1 },
          })
        }
      }
    }
    
    return {
      original,
      optimized,
      changes,
    }
  }

  /**
   * Generate optimized text (simplified - could be AI-powered)
   */
  private generateOptimizedText(
    original: string,
    improvements: string,
    domains: string[]
  ): string {
    // This is a simplified version - in production, this would call AI
    let optimized = original
    
    // Remove vague words
    const vagueWords = ['等', '之类', '大概', '可能', '一些', '相关', '等等', '若干', '某些']
    for (const word of vagueWords) {
      optimized = optimized.replace(new RegExp(word, 'g'), '')
    }
    
    // Add structure if missing
    if (!/用户|需要|实现|功能|系统/i.test(optimized)) {
      optimized = `需要实现一个${domains[0] || '业务'}系统，${optimized}`
    }
    
    // Clean up extra spaces
    optimized = optimized.replace(/\s+/g, ' ').trim()
    
    // Add improvement notes if significant changes
    if (improvements && improvements.length > 20) {
      optimized = `${optimized}\n\n建议：${improvements.split('\n').slice(0, 2).join('，')}`
    }
    
    return optimized
  }
}

// Export singleton
export const requirementOptimizer = new RequirementOptimizer()
