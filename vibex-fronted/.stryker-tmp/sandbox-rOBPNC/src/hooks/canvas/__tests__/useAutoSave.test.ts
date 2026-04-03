/**
 * useAutoSave — Tests (Jest)
 * E3: 自动保存 Hook 测试
 *
 * Note: These tests verify the hook interface and basic behavior.
 * Full integration testing is done via Playwright e2e tests.
 */
// @ts-nocheck


// Mock use-debounce before importing the hook
jest.mock('use-debounce', () => ({
  useDebouncedCallback: jest.fn((fn) => {
    const debouncedFn = (...args: unknown[]) => fn(...args)
    return debouncedFn
  }),
}))

// Mock canvasApi
jest.mock('@/lib/canvas/api/canvasApi', () => ({
  canvasApi: {
    createSnapshot: jest.fn().mockResolvedValue({
      success: true,
      snapshot: {
        snapshotId: 'snap-123',
        projectId: 'proj-123',
        label: '自动保存',
        trigger: 'auto',
        createdAt: new Date().toISOString(),
        contextCount: 1,
        flowCount: 1,
        componentCount: 1,
      },
    }),
  },
}))

// Mock all stores — provide a Zustand-compatible mock with subscribe on the store function
jest.mock('@/lib/canvas/stores/contextStore', () => {
  const fn = () => ({ contextNodes: [], setContextNodes: jest.fn(), getState: () => ({ contextNodes: [] }) })
  ;((fn as any).subscribe = jest.fn(() => jest.fn())) // returns unsubscribe fn
  return { useContextStore: fn }
})

jest.mock('@/lib/canvas/stores/flowStore', () => {
  const fn = () => ({ flowNodes: [], setFlowNodes: jest.fn(), getState: () => ({ flowNodes: [] }) })
  ;((fn as any).subscribe = jest.fn(() => jest.fn()))
  return { useFlowStore: fn }
})

jest.mock('@/lib/canvas/stores/componentStore', () => {
  const fn = () => ({ componentNodes: [], setComponentNodes: jest.fn(), getState: () => ({ componentNodes: [] }) })
  ;((fn as any).subscribe = jest.fn(() => jest.fn()))
  return { useComponentStore: fn }
})

import { useAutoSave } from '../useAutoSave'

// Minimal React test helper — renderHook is from @testing-library/react
// We use it to test the hook's initial state
import { renderHook, act } from '@testing-library/react'

describe('useAutoSave', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return idle status when no projectId', () => {
    const { result } = renderHook(() => useAutoSave({ projectId: null }))
    expect(result.current.saveStatus).toBe('idle')
    expect(result.current.lastSavedAt).toBeNull()
  })

  it('should have saveNow function available', () => {
    const { result } = renderHook(() => useAutoSave({ projectId: 'proj-123' }))
    expect(typeof result.current.saveNow).toBe('function')
    expect(typeof result.current.saveBeacon).toBe('function')
  })

  it('should have saveBeacon function available', () => {
    const { result } = renderHook(() => useAutoSave({ projectId: 'proj-123' }))
    expect(typeof result.current.saveBeacon).toBe('function')
  })

  it('should not call canvasApi.createSnapshot without projectId', () => {
    const { canvasApi } = require('@/lib/canvas/api/canvasApi')
    renderHook(() => useAutoSave({ projectId: null }))
    expect(canvasApi.createSnapshot).not.toHaveBeenCalled()
  })

  it('should return lastSavedVersion as null initially', () => {
    const { result } = renderHook(() => useAutoSave({ projectId: 'proj-123' }))
    expect(result.current.lastSavedVersion).toBeNull()
  })
})
