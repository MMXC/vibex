/**
 * @deprecated This router uses the legacy Page Router API.
 * All routes have been migrated to Next.js App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 * This file will be removed after E1 security fixes are complete.
 */
/**
 * Step State API - Autosave Core
 *
 * Handles step state persistence with optimistic locking using D1/SQLite.
 * POST /api/step-state - Save step state
 * GET /api/step-state - Get step state
 * DELETE /api/step-state - Clear step state
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { generateId, Env, queryOne, executeDB } from '@/lib/db'
import { safeError } from '@/lib/log-sanitizer';
import { apiError, ERROR_CODES } from '@/lib/api-error';

import type {
  SaveStepStateRequest,
  StepState,
  SimplifiedStep,
  Step1Data,
  Step2Data,
  Step3Data,
  ChangeEntry,
} from '@/types/simplified-flow'

const stepState = new Hono<{ Bindings: Env }>()

// Enable CORS
stepState.use('/*', cors())

// ==================== D1 Types ====================

interface StepStateRow {
  id: string
  projectId: string
  currentStep: number
  version: number
  lastModified: string
  lastModifiedBy: string
  step1: string | null
  step2: string | null
  step3: string | null
  createdAt: string
  updatedAt: string
}

interface ChangeLogRow {
  id: string
  projectId: string
  entityType: string
  entityId: string
  version: number
  timestamp: string
  source: string
  action: string
  field: string
  before: string | null
  after: string | null
}

// ==================== Schemas ====================

const SaveStepStateSchema = z.object({
  projectId: z.string().min(1),
  currentStep: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  step1: z.object({
    domainIds: z.array(z.string()),
    flowId: z.string().optional(),
    uiNodeIds: z.array(z.string()).optional(),
    checkedDomainIds: z.array(z.string()),
    checkedFeatureIds: z.record(z.string(), z.array(z.string())),
    generationTime: z.number(),
    interruptedAt: z.string().optional(),
    interruptedDomainId: z.string().optional(),
    flowType: z.enum(['core_only', 'core_with_supporting', 'full']),
  }).nullable().optional(),
  step2: z.object({
    uiNodeIds: z.array(z.string()),
    annotations: z.record(z.string(), z.array(z.object({
      id: z.string(),
      text: z.string(),
      source: z.enum(['user_input', 'ai_suggestion']),
      timestamp: z.string(),
      applied: z.boolean(),
    }))),
    naturalLanguageInputs: z.array(z.string()),
  }).nullable().optional(),
  step3: z.object({
    status: z.enum(['pending', 'queued', 'generating', 'done', 'failed']),
    queueId: z.string().optional(),
    progress: z.number().optional(),
    currentPage: z.string().optional(),
    generatedPages: z.array(z.string()),
    failedPages: z.array(z.string()),
  }).nullable().optional(),
  updatedAt: z.string().optional(),
})

// ==================== In-Memory Fallback (D1 unavailable) ====================

interface StoredStepState {
  state: StepState
  history: ChangeEntry[]
}

const stateStore = new Map<string, StoredStepState>()

// ==================== Helper: Is D1 available ====================

function isD1Available(env: Env | undefined): boolean {
  return !!env?.DB
}

// ==================== POST /api/step-state ====================

stepState.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const data = SaveStepStateSchema.parse(body) as SaveStepStateRequest
    const env = c.env

    const { projectId, currentStep, step1, step2, step3, updatedAt } = data
    const now = new Date().toISOString()

    if (isD1Available(env)) {
      // ==================== D1 Path ====================
      const existing = await queryOne<StepStateRow>(
        env,
        'SELECT * FROM StepState WHERE projectId = ?',
        [projectId]
      )

      // Optimistic locking: conflict if stored.version >= client version
      if (existing && updatedAt) {
        const serverTime = new Date(existing.lastModified).getTime()
        const clientTime = new Date(updatedAt).getTime()
        if (clientTime < serverTime) {
          const parsedState = parseStepStateRow(existing)
          return c.json({
            success: false,
            error: 'State was modified. Please refresh and try again.',
            code: 'VERSION_CONFLICT',
            serverData: parsedState,
            serverUpdatedAt: existing.lastModified,
          }, 409)
        }
      }

      const version = existing ? existing.version + 1 : 1
      const step1Json = step1 !== undefined ? JSON.stringify(step1) : null
      const step2Json = step2 !== undefined ? JSON.stringify(step2) : null
      const step3Json = step3 !== undefined ? JSON.stringify(step3) : null

      const step1Field: 'step1' | 'step2' | 'step3' = currentStep === 1 ? 'step1' : currentStep === 2 ? 'step2' : 'step3'
      const beforeJson = existing ? (existing as unknown as Record<string, unknown>)[step1Field] as string | null : null
      const afterJson = currentStep === 1 ? step1Json : currentStep === 2 ? step2Json : step3Json

      if (existing) {
        // UPDATE
        await executeDB(
          env,
          `UPDATE StepState SET
            currentStep = ?,
            version = ?,
            lastModified = ?,
            lastModifiedBy = ?,
            step1 = ?,
            step2 = ?,
            step3 = ?,
            updatedAt = ?
          WHERE projectId = ?`,
          [
            currentStep,
            version,
            now,
            'user',
            existing.step1,
            existing.step2,
            existing.step3,
            now,
            projectId,
          ]
        )
      } else {
        // INSERT
        const id = `ss-${generateId()}`
        await executeDB(
          env,
          `INSERT INTO StepState (id, projectId, currentStep, version, lastModified, lastModifiedBy, step1, step2, step3, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            projectId,
            currentStep,
            version,
            now,
            'user',
            step1Json,
            step2Json,
            step3Json,
            now,
            now,
          ]
        )
      }

      // Insert changelog entry
      const changeId = `cl-${generateId()}`
      await executeDB(
        env,
        `INSERT INTO ChangeLog (id, projectId, entityType, entityId, version, timestamp, source, action, field, before, after)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          changeId,
          projectId,
          'StepState',
          projectId,
          version,
          now,
          'user',
          existing ? 'update' : 'create',
          `step${currentStep}`,
          beforeJson,
          afterJson,
        ]
      )

      // Return updated state
      const row = await queryOne<StepStateRow>(env, 'SELECT * FROM StepState WHERE projectId = ?', [projectId])
      const newState = parseStepStateRow(row!)

      return c.json({
        success: true,
        data: newState,
        updatedAt: now,
        version,
      })
    } else {
      // ==================== In-Memory Fallback (dev) ====================
      const stored = stateStore.get(projectId)

      if (stored && updatedAt) {
        const serverTime = new Date(stored.state.lastModified).getTime()
        const clientTime = new Date(updatedAt).getTime()
        if (clientTime < serverTime) {
          return c.json({
            success: false,
            error: 'State was modified. Please refresh and try again.',
            code: 'VERSION_CONFLICT',
            serverData: stored.state,
            serverUpdatedAt: stored.state.lastModified,
          }, 409)
        }
      }

      const version = stored ? stored.state.version + 1 : 1

      const newState: StepState = {
        projectId,
        currentStep: currentStep as SimplifiedStep,
        version,
        lastModified: now,
        lastModifiedBy: 'user',
        step1: step1 ?? null,
        step2: step2 ?? null,
        step3: step3 ?? null,
      }

      const fieldKey = currentStep === 1 ? 'step1' : currentStep === 2 ? 'step2' : 'step3'
      const changeEntry: ChangeEntry = {
        id: `change-${generateId()}`,
        version,
        timestamp: now,
        source: 'user',
        action: 'update',
        field: fieldKey,
        before: stored ? { [fieldKey]: stored.state[fieldKey as keyof StepState] } : null,
        after: { [fieldKey]: currentStep === 1 ? step1 : currentStep === 2 ? step2 : step3 },
      }

      const history = stored ? [...stored.history, changeEntry] : [changeEntry]
      stateStore.set(projectId, { state: newState, history })

      return c.json({
        success: true,
        data: newState,
        updatedAt: now,
        version,
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.issues,
      }, 400)
    }
    safeError('Error saving step state:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save step state',
    }, 500)
  }
})

// ==================== GET /api/step-state ====================

stepState.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId')
    if (!projectId) {
      return c.json({
        success: false,
        error: 'projectId is required',
        code: 'VALIDATION_ERROR',
      }, 400)
    }

    const env = c.env

    if (isD1Available(env)) {
      // ==================== D1 Path ====================
      const row = await queryOne<StepStateRow>(
        env,
        'SELECT * FROM StepState WHERE projectId = ?',
        [projectId]
      )

      if (!row) {
        return c.json({
          success: false,
          error: 'Step state not found',
          code: 'NOT_FOUND',
        }, 404)
      }

      const state = parseStepStateRow(row)

      // Get last 50 changelog entries
      const changes = await queryOne<{ cnt: number }>(
        env,
        'SELECT COUNT(*) as cnt FROM ChangeLog WHERE projectId = ? AND entityType = ?',
        [projectId, 'StepState']
      )
      void changes

      const logs = await queryOne<ChangeLogRow[]>(
        env,
        `SELECT * FROM ChangeLog
         WHERE projectId = ? AND entityType = ?
         ORDER BY timestamp DESC
         LIMIT 50`,
        [projectId, 'StepState']
      )

      const history: ChangeEntry[] = (logs || []).map((log) => ({
        id: log.id,
        version: log.version,
        timestamp: log.timestamp,
        source: log.source as ChangeEntry['source'],
        action: log.action as ChangeEntry['action'],
        field: log.field,
        before: log.before ? JSON.parse(log.before) : null,
        after: log.after ? JSON.parse(log.after) : null,
      }))

      return c.json({
        success: true,
        data: state,
        history,
      })
    } else {
      // ==================== In-Memory Fallback ====================
      const stored = stateStore.get(projectId)
      if (!stored) {
        return c.json({
          success: false,
          error: 'Step state not found',
          code: 'NOT_FOUND',
        }, 404)
      }

      return c.json({
        success: true,
        data: stored.state,
        history: stored.history.slice(-50),
      })
    }
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get step state',
    }, 500)
  }
})

// ==================== DELETE /api/step-state ====================

stepState.delete('/', async (c) => {
  try {
    const projectId = c.req.query('projectId')
    if (!projectId) {
      return c.json({
        success: false,
        error: 'projectId is required',
        code: 'VALIDATION_ERROR',
      }, 400)
    }

    const env = c.env

    if (isD1Available(env)) {
      // ==================== D1 Path ====================
      await executeDB(env, 'DELETE FROM StepState WHERE projectId = ?', [projectId])
      await executeDB(
        env,
        'DELETE FROM ChangeLog WHERE projectId = ? AND entityType = ?',
        [projectId, 'StepState']
      )
    } else {
      // ==================== In-Memory Fallback ====================
      stateStore.delete(projectId)
    }

    return c.json({
      success: true,
      message: `Step state for project ${projectId} deleted`,
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete step state',
    }, 500)
  }
})

// ==================== Helper: Parse StepState row ====================

function parseStepStateRow(row: StepStateRow): StepState {
  return {
    projectId: row.projectId,
    currentStep: row.currentStep as SimplifiedStep,
    version: row.version,
    lastModified: row.lastModified,
    lastModifiedBy: row.lastModifiedBy,
    step1: row.step1 ? JSON.parse(row.step1) : null,
    step2: row.step2 ? JSON.parse(row.step2) : null,
    step3: row.step3 ? JSON.parse(row.step3) : null,
  }
}

export default stepState
