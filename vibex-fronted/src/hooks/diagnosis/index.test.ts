/**
 * useDiagnosis Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import useDiagnosis from './index'

// Mock the API calls
jest.mock('@/services/api/diagnosis', () => ({
  analyzeRequirement: jest.fn(),
  optimizeRequirement: jest.fn(),
}))

import { analyzeRequirement, optimizeRequirement } from '@/services/api/diagnosis'

const mockAnalyzeRequirement = analyzeRequirement as jest.MockedFunction<typeof analyzeRequirement>
const mockOptimizeRequirement = optimizeRequirement as jest.MockedFunction<typeof optimizeRequirement>

describe('useDiagnosis', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should store original text when diagnosing', async () => {
    const mockDiagnosis = {
      overallScore: 75,
      dimensions: [],
      summary: '基本完整',
      suggestions: [],
      createdAt: Date.now(),
    }
    mockAnalyzeRequirement.mockResolvedValueOnce(mockDiagnosis)

    const { result } = renderHook(() => useDiagnosis())

    await act(async () => {
      await result.current.diagnose('用户管理系统需求')
    })

    expect(result.current.originalText).toBe('用户管理系统需求')
    expect(result.current.diagnosis).toEqual(mockDiagnosis)
  })

  it('should pass original text when optimizing', async () => {
    const mockDiagnosis = {
      overallScore: 75,
      dimensions: [],
      summary: '基本完整',
      suggestions: [],
      createdAt: Date.now(),
    }
    const mockOptimization = {
      optimizedText: '优化后的需求',
      diff: { before: '用户管理', after: '用户管理系统', added: ['系统'] },
    }

    mockAnalyzeRequirement.mockResolvedValueOnce(mockDiagnosis)
    mockOptimizeRequirement.mockResolvedValueOnce(mockOptimization)

    const { result } = renderHook(() => useDiagnosis())

    await act(async () => {
      await result.current.diagnose('用户管理系统需求')
    })

    await act(async () => {
      await result.current.optimize()
    })

    // FIX VERIFIED: Original text is passed to optimizeRequirement
    expect(mockOptimizeRequirement).toHaveBeenCalledWith(
      '用户管理系统需求', // Original text instead of empty string
      mockDiagnosis
    )
    expect(result.current.optimizedText).toBe('优化后的需求')
  })

  it('should apply optimization correctly', async () => {
    const mockDiagnosis = {
      overallScore: 75,
      requirementText: '原始需求', // Original text
      dimensions: [],
      summary: '基本完整',
      suggestions: [],
      createdAt: Date.now(),
    }
    const mockOptimization = {
      optimizedText: '优化后的需求',
      diff: { before: '原始', after: '优化后', added: ['优化'] },
    }

    mockAnalyzeRequirement.mockResolvedValueOnce(mockDiagnosis)
    mockOptimizeRequirement.mockResolvedValueOnce(mockOptimization)

    const { result } = renderHook(() => useDiagnosis())

    await act(async () => {
      await result.current.diagnose('用户管理系统需求')
    })

    await act(async () => {
      await result.current.optimize()
    })

    await act(async () => {
      result.current.applyOptimization()
    })

    // After applying, diagnosis should have optimized text
    expect(result.current.diagnosis?.requirementText).toBe('优化后的需求')
    expect(result.current.optimizedText).toBeNull() // Cleared after apply
  })

  it('should reset state correctly', async () => {
    const mockDiagnosis = {
      overallScore: 75,
      dimensions: [],
      summary: '基本完整',
      suggestions: [],
      createdAt: Date.now(),
    }
    const mockOptimization = {
      optimizedText: '优化后的需求',
      diff: { before: '原始', after: '优化后', added: ['优化'] },
    }

    mockAnalyzeRequirement.mockResolvedValueOnce(mockDiagnosis)
    mockOptimizeRequirement.mockResolvedValueOnce(mockOptimization)

    const { result } = renderHook(() => useDiagnosis())

    await act(async () => {
      await result.current.diagnose('用户管理系统需求')
    })

    await act(async () => {
      await result.current.optimize()
    })

    await act(async () => {
      result.current.reset()
    })

    expect(result.current.originalText).toBe('')
    expect(result.current.diagnosis).toBeNull()
    expect(result.current.optimizedText).toBeNull()
  })
})
