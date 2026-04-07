/**
 * useAutoSave — Tests (Jest)
 * E3: 自动保存 Hook 测试
 * E4: 冲突检测测试
 */

// Mock use-debounce before importing the hook
vi.mock('use-debounce', () => ({
  useDebouncedCallback: vi.fn((fn) => {
    const debouncedFn = (...args: unknown[]) => fn(...args)
    return debouncedFn
  }),
}))

// Mock canvasApi with default implementations
vi.mock('@/lib/canvas/api/canvasApi', () => ({
  canvasApi: {
    createSnapshot: vi.fn(),
    getLatestVersion: vi.fn(),
  },
}))

// Mock all stores — Zustand stores have getState/subscribe as properties on the store function
vi.mock('@/lib/canvas/stores/contextStore', () => {
  const storeFn = () => ({ contextNodes: [], setContextNodes: vi.fn() })
  ;(storeFn as any).getState = () => ({ contextNodes: [] })
  ;(storeFn as any).subscribe = vi.fn(() => vi.fn())
  ;(storeFn as any).setState = vi.fn()
  return { useContextStore: storeFn }
})

vi.mock('@/lib/canvas/stores/flowStore', () => {
  const storeFn = () => ({ flowNodes: [], setFlowNodes: vi.fn() })
  ;(storeFn as any).getState = () => ({ flowNodes: [] })
  ;(storeFn as any).subscribe = vi.fn(() => vi.fn())
  ;(storeFn as any).setState = vi.fn()
  return { useFlowStore: storeFn }
})

vi.mock('@/lib/canvas/stores/componentStore', () => {
  const storeFn = () => ({ componentNodes: [], setComponentNodes: vi.fn() })
  ;(storeFn as any).getState = () => ({ componentNodes: [] })
  ;(storeFn as any).subscribe = vi.fn(() => vi.fn())
  ;(storeFn as any).setState = vi.fn()
  return { useComponentStore: storeFn }
})

import { useAutoSave } from '../useAutoSave'
import { renderHook, act } from '@testing-library/react'

// Get mock references after module mocking is complete
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const canvasApi = require('@/lib/canvas/api/canvasApi') as any
const createSnapshot = canvasApi.canvasApi.createSnapshot as any
const getLatestVersion = canvasApi.canvasApi.getLatestVersion as any

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createSnapshot.mockResolvedValue({
      success: true,
      snapshot: {
        snapshotId: 'snap-123',
        projectId: 'proj-123',
        label: '自动保存',
        trigger: 'auto',
        createdAt: new Date().toISOString(),
        version: 1,
        contextCount: 1,
        flowCount: 1,
        componentCount: 1,
      },
    })
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
    renderHook(() => useAutoSave({ projectId: null }))
    expect(createSnapshot).not.toHaveBeenCalled()
  })

  it('should return lastSavedVersion as null initially', () => {
    const { result } = renderHook(() => useAutoSave({ projectId: 'proj-123' }))
    expect(result.current.lastSavedVersion).toBeNull()
  })
})

describe('useAutoSave — Conflict Detection (E4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: successful save
    createSnapshot.mockResolvedValue({
      success: true,
      snapshot: {
        snapshotId: 'snap-123',
        projectId: 'proj-123',
        label: '自动保存',
        trigger: 'auto',
        createdAt: new Date().toISOString(),
        version: 1,
        contextCount: 1,
        flowCount: 1,
        componentCount: 1,
      },
    })
    getLatestVersion.mockResolvedValue({ success: true, latestVersion: 0, updatedAt: null })
  })

  // -------------------------------------------------------------------------
  // E4-1: 409 response → saveStatus becomes 'conflict' + conflictData set
  // -------------------------------------------------------------------------
  it('E4-1: 409 response sets saveStatus to conflict', async () => {
    // The canvasApi.createSnapshot throws an error with err.status=409 and
    // err.data containing the JSON response body { serverSnapshot: {...} }.
    // The hook's doSave() catches this and wraps with isConflict + serverSnapshot.
    const apiError = new Error('Version conflict')
    ;(apiError as any).status = 409
    ;(apiError as any).data = {
      success: false,
      error: 'VERSION_CONFLICT',
      serverVersion: 3,
      serverSnapshot: {
        snapshotId: 'snap-server',
        version: 3,
        createdAt: '2026-04-01T12:00:00Z',
        data: { contexts: [{ id: 'c1' }], flows: [], components: [] },
      },
    }

    createSnapshot.mockRejectedValueOnce(apiError)

    const { result } = renderHook(() => useAutoSave({ projectId: 'proj-123' }))

    await act(async () => {
      await result.current.saveNow()
    })

    expect(result.current.saveStatus).toBe('conflict')
    expect(result.current.conflictData).not.toBeNull()
    expect(result.current.conflictData?.serverSnapshot?.version).toBe(3)
    expect(result.current.conflictData?.serverSnapshot?.snapshotId).toBe('snap-server')
  })

  // -------------------------------------------------------------------------
  // E4-2: conflictData is null when no conflict
  // -------------------------------------------------------------------------
  it('E4-2: conflictData is null when no conflict', async () => {
    const { result } = renderHook(() => useAutoSave({ projectId: 'proj-123' }))

    expect(result.current.conflictData).toBeNull()

    await act(async () => {
      await result.current.saveNow()
    })

    // After successful save, conflictData should still be null
    expect(result.current.conflictData).toBeNull()
  })

  // -------------------------------------------------------------------------
  // E4-3: clearConflict resets status to idle and clears conflictData
  // -------------------------------------------------------------------------
  it('E4-3: clearConflict resets conflict state', async () => {
    const apiError = new Error('Version conflict')
    ;(apiError as any).status = 409
    ;(apiError as any).data = {
      serverSnapshot: {
        snapshotId: 'snap-server',
        version: 3,
        createdAt: '2026-04-01T12:00:00Z',
        data: { contexts: [], flows: [], components: [] },
      },
    }

    createSnapshot.mockRejectedValueOnce(apiError)

    const { result } = renderHook(() => useAutoSave({ projectId: 'proj-123' }))

    await act(async () => {
      await result.current.saveNow()
    })

    expect(result.current.saveStatus).toBe('conflict')
    expect(result.current.conflictData).not.toBeNull()

    act(() => {
      result.current.clearConflict()
    })

    expect(result.current.saveStatus).toBe('idle')
    expect(result.current.conflictData).toBeNull()
  })

  // -------------------------------------------------------------------------
  // E4-4: Version polling calls getLatestVersion
  // -------------------------------------------------------------------------
  it('E4-4: Version polling calls getLatestVersion on mount', async () => {
    const { result } = renderHook(() => useAutoSave({ projectId: 'proj-123' }))

    // The hook starts polling immediately on mount (30s interval).
    // The first poll runs immediately, so getLatestVersion should be called.
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    expect(getLatestVersion).toHaveBeenCalledWith('proj-123')
  })

  // -------------------------------------------------------------------------
  // E4-5: Version polling skips when already in conflict state
  // -------------------------------------------------------------------------
  it('E4-5: Version polling does not interrupt when already in conflict state', async () => {
    const { result } = renderHook(() => useAutoSave({ projectId: 'proj-123' }))

    // Set to conflict via saveNow
    const apiError = new Error('Version conflict')
    ;(apiError as any).status = 409
    ;(apiError as any).data = {
      serverSnapshot: { snapshotId: 's1', version: 2, data: { contexts: [], flows: [], components: [] } },
    }
    createSnapshot.mockRejectedValueOnce(apiError)

    await act(async () => {
      await result.current.saveNow()
    })

    expect(result.current.saveStatus).toBe('conflict')

    // Status should remain conflict (polling is gated by saveStatus check)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
    })
    expect(result.current.saveStatus).toBe('conflict')
  })

  // -------------------------------------------------------------------------
  // E4-6: onSaveError callback is called on non-conflict errors
  // -------------------------------------------------------------------------
  it('E4-6: onSaveError callback is called for non-conflict errors', async () => {
    const onSaveError = vi.fn()
    // Non-conflict error (no status=409)
    createSnapshot.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() =>
      useAutoSave({ projectId: 'proj-123', onSaveError })
    )

    await act(async () => {
      await result.current.saveNow()
    })

    expect(result.current.saveStatus).toBe('error')
    expect(onSaveError).toHaveBeenCalled()
    expect(onSaveError.mock.calls[0][0]).toBeInstanceOf(Error)
  })

  // -------------------------------------------------------------------------
  // E4-7: lastSavedAt is set on successful save
  // -------------------------------------------------------------------------
  it('E4-7: Successful save updates lastSavedAt', async () => {
    createSnapshot.mockResolvedValue({
      success: true,
      snapshot: { snapshotId: 'snap-new', version: 5 },
      version: 5,
    })

    const { result } = renderHook(() => useAutoSave({ projectId: 'proj-123' }))

    expect(result.current.lastSavedAt).toBeNull()

    await act(async () => {
      await result.current.saveNow()
    })

    expect(result.current.saveStatus).toBe('saved')
    expect(result.current.lastSavedAt).toBeInstanceOf(Date)
  })
})
