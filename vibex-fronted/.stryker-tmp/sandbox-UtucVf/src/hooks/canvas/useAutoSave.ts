/**
 * useAutoSave — Canvas Auto-Save Hook
 * E3: 自动保存 (Debounce + Beacon + Save Indicator)
 * E1: 版本号追踪 (乐观锁支持)
 *
 * 遵守 AGENTS.md E3 约束:
 * - Debounce 2s (不得修改延迟)
 * - Beacon 保存 beforeunload 时必须触发
 * - 状态指示器: 保存中/已保存/保存失败
 * - 禁止同步 API 调用 (阻塞 UI)
 *
 * E1 乐观锁:
 * - 每次保存携带 lastSnapshotVersion
 * - 后端返回新版本号
 * - 409 冲突时设置 conflictStatus
 */
// @ts-nocheck

import { useEffect, useRef, useCallback, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useContextStore } from '@/lib/canvas/stores/contextStore'
import { useFlowStore } from '@/lib/canvas/stores/flowStore'
import { useComponentStore } from '@/lib/canvas/stores/componentStore'
import { canvasApi } from '@/lib/canvas/api/canvasApi'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict'

// E1: Version tracking ref for optimistic locking
const lastSnapshotVersionRef = { current: 0 }

interface UseAutoSaveOptions {
  /** Project ID for saving — if null, auto-save is disabled */
  projectId: string | null
  /** Debounce delay in ms — must be exactly 2000 per AGENTS.md */
  debounceMs?: number
  /** Called when save succeeds */
  onSaveSuccess?: (version: number) => void
  /** Called when save fails */
  onSaveError?: (error: Error) => void
}

interface UseAutoSaveReturn {
  /** Current save status for indicator display */
  saveStatus: SaveStatus
  /** Last successful save timestamp */
  lastSavedAt: Date | null
  /** Last saved version number */
  lastSavedVersion: number | null
  /** Trigger a manual save immediately */
  saveNow: () => Promise<void>
  /** Trigger a manual save using Beacon (for beforeunload) */
  saveBeacon: () => void
  /** E4: Server snapshot data when a conflict is detected */
  conflictData: {
    serverSnapshot: {
      snapshotId: string
      version: number
      createdAt: string
      data: { contexts?: unknown[]; flows?: unknown[]; components?: unknown[]; [key: string]: unknown }
    }
  } | null
  /** E4: Clear conflict state after user resolves it */
  clearConflict: () => void
}

/**
 * Get the current canvas state for snapshotting
 */
function getCanvasState() {
  const contexts = useContextStore.getState().contextNodes
  const flows = useFlowStore.getState().flowNodes
  const components = useComponentStore.getState().componentNodes

  return {
    contextNodes: contexts,
    flowNodes: flows,
    componentNodes: components,
  }
}

/**
 * Core save function — shared between debounced auto-save and beacon
 */
/**
 * Core save function — shared between debounced auto-save and beacon
 * E1: Sends version for optimistic locking, handles 409 conflict
 */
async function doSave(
  projectId: string,
  options?: { isAutoSave?: boolean }
): Promise<{ version: number } | null> {
  try {
    const state = getCanvasState()
    const result = await canvasApi.createSnapshot({
      projectId: projectId || null,
      label: options?.isAutoSave ? '自动保存' : '手动保存',
      trigger: options?.isAutoSave ? 'auto' : 'manual',
      // E1: Send version for optimistic locking
      version: lastSnapshotVersionRef.current || undefined,
      contextNodes: state.contextNodes,
      flowNodes: state.flowNodes,
      componentNodes: state.componentNodes,
    })
    // E1: Update local version on success
    if (result.snapshot?.version) {
      lastSnapshotVersionRef.current = result.snapshot.version
    }
    return { version: result.snapshot?.version ?? 0 }
  } catch (err: any) {
    // E1: Handle 409 conflict — extract server snapshot from response
    if (err?.response?.status === 409 || err?.status === 409) {
      let serverSnapshot: UseAutoSaveReturn['conflictData'] = null
      try {
        const body = err?.response?.data ?? err?.data ?? {}
        if (body?.serverSnapshot) {
          serverSnapshot = { serverSnapshot: body.serverSnapshot }
        }
      } catch {
        // ignore parse error
      }
      console.warn('[useAutoSave] Version conflict detected:', err)
      throw Object.assign(err, { isConflict: true, serverSnapshot })
    }
    console.error('[useAutoSave] Save failed:', err)
    throw err
  }
}

export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const {
    projectId,
    debounceMs = 2000, // MUST be exactly 2000 per AGENTS.md
    onSaveSuccess,
    onSaveError,
  } = options

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [lastSavedVersion, setLastSavedVersion] = useState<number | null>(null)
  // E4: Conflict data from 409 response
  const [conflictData, setConflictData] = useState<UseAutoSaveReturn['conflictData']>(null)
  // E4: Clear conflict state after user resolves it
  const clearConflict = useCallback(() => {
    setConflictData(null)
    setSaveStatus('idle')
  }, [])

  // Track whether component is mounted
  const mountedRef = useRef(true)
  // Track if a save is currently in-flight
  const savingRef = useRef(false)
  // Debounced save function
  const debouncedSaveRef = useRef<ReturnType<typeof useDebouncedCallback>>(null as unknown as ReturnType<typeof useDebouncedCallback>)

  // Debounced save callback — triggers 2s after last change
  const debouncedSave = useDebouncedCallback(
    async () => {
      if (!mountedRef.current || !projectId || savingRef.current) return
      savingRef.current = true
      setSaveStatus('saving')
      try {
        const result = await doSave(projectId, { isAutoSave: true })
        if (!mountedRef.current) return
        setLastSavedAt(new Date())
        setLastSavedVersion(null)
        setSaveStatus('saved')
      } catch (err: any) {
        if (!mountedRef.current) return
        if (err?.isConflict) {
          setConflictData(err?.serverSnapshot ?? null)
          setSaveStatus('conflict')
          return
        }
        setSaveStatus('error')
        onSaveError?.(err as Error)
      } finally {
        savingRef.current = false
      }
    },
    debounceMs
  )

  // Store ref to debounced function for manual triggers
  debouncedSaveRef.current = debouncedSave

  // Watch for state changes in all three tree stores
  useEffect(() => {
    if (!projectId) return

    // Subscribe to context changes
    const unsubContext = useContextStore.subscribe(
      (state, prev) => {
        if (state.contextNodes !== prev.contextNodes) {
          debouncedSaveRef.current()
        }
      }
    )

    // Subscribe to flow changes
    const unsubFlow = useFlowStore.subscribe(
      (state, prev) => {
        if (state.flowNodes !== prev.flowNodes) {
          debouncedSaveRef.current()
        }
      }
    )

    // Subscribe to component changes
    const unsubComponent = useComponentStore.subscribe(
      (state, prev) => {
        if (state.componentNodes !== prev.componentNodes) {
          debouncedSaveRef.current()
        }
      }
    )

    return () => {
      unsubContext()
      unsubFlow()
      unsubComponent()
    }
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset status after "saved" after a few seconds
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => {
        if (mountedRef.current) setSaveStatus('idle')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  // beforeunload beacon — saves immediately without debounce
  useEffect(() => {
    if (!projectId) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Trigger beacon save
      const state = getCanvasState()
      const payload = JSON.stringify({
        projectId,
        data: state,
        trigger: 'auto',
        label: '自动保存',
      })

      // Use sendBeacon for reliable save on page unload
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/v1/canvas/snapshots', blob)

      // Also trigger synchronous save for the current debounced state
      // (This won't block the unload due to sendBeacon)
      e.preventDefault()
      // Some browsers require a returnValue to be set
      e.returnValue = '有未保存的更改，确定要离开吗？'
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [projectId])

  // Manual save (triggered by user action, e.g., Ctrl+S)
  const saveNow = useCallback(async () => {
    if (!projectId || savingRef.current) return
    savingRef.current = true
    setSaveStatus('saving')
    try {
      await doSave(projectId, { isAutoSave: false })
      if (!mountedRef.current) return
      setLastSavedAt(new Date())
      setLastSavedVersion(null)
      setSaveStatus('saved')
    } catch (err: any) {
      if (!mountedRef.current) return
      if (err?.isConflict) {
        setSaveStatus('conflict')
        return
      }
      setSaveStatus('error')
      onSaveError?.(err as Error)
    } finally {
      savingRef.current = false
    }
  }, [projectId, onSaveError])

  // Beacon save (for beforeunload — fire and forget)
  const saveBeacon = useCallback(() => {
    if (!projectId) return
    try {
      const state = getCanvasState()
      const payload = JSON.stringify({
        projectId,
        data: state,
        trigger: 'auto',
        label: '自动保存',
      })
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/v1/canvas/snapshots', blob)
    } catch (err) {
      console.error('[useAutoSave] Beacon save failed:', err)
    }
  }, [projectId])

  // Track mount state
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    saveStatus,
    lastSavedAt,
    lastSavedVersion,
    saveNow,
    saveBeacon,
  }
}
