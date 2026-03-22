/**
 * Step State API - Autosave Core
 * 
 * Handles step state persistence with optimistic locking.
 * POST /api/step-state - Save step state
 * GET /api/step-state - Get step state
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { generateId, Env } from '@/lib/db'
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

// ==================== In-Memory Store (for development) ====================
// In production, this would be D1/SQLite with optimistic locking

interface StoredStepState {
  state: StepState
  history: ChangeEntry[]
}

const stateStore = new Map<string, StoredStepState>()

// ==================== POST /api/step-state ====================

stepState.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const data = SaveStepStateSchema.parse(body) as SaveStepStateRequest

    const { projectId, currentStep, step1, step2, step3, updatedAt } = data

    const now = new Date().toISOString()
    const stored = stateStore.get(projectId)

    // Optimistic locking check
    if (stored && updatedAt) {
      const serverTime = new Date(stored.state.lastModified).getTime()
      const clientTime = new Date(updatedAt).getTime()
      if (clientTime < serverTime) {
        // Conflict!
        return c.json({
          success: false,
          error: 'State was modified. Please refresh and try again.',
          code: 'VERSION_CONFLICT',
          serverData: stored.state,
          serverUpdatedAt: stored.state.lastModified,
        }, 409)
      }
    }

    // Compute new version
    const version = stored ? stored.state.version + 1 : 1

    // Build step state
    const newState: StepState = {
      projectId,
      currentStep: currentStep as SimplifiedStep,
      version,
      lastModified: now,
      lastModifiedBy: 'user', // TODO: get from auth
      step1: step1 ?? null,
      step2: step2 ?? null,
      step3: step3 ?? null,
    }

    // Build change history entry
    const changeEntry: ChangeEntry = {
      id: `change-${generateId()}`,
      version,
      timestamp: now,
      source: 'user',
      action: 'update',
      field: `step${currentStep}`,
      before: stored ? { [currentStep === 1 ? 'step1' : currentStep === 2 ? 'step2' : 'step3']: stored.state[currentStep === 1 ? 'step1' : currentStep === 2 ? 'step2' : 'step3'] } : null,
      after: { [currentStep === 1 ? 'step1' : currentStep === 2 ? 'step2' : 'step3']: currentStep === 1 ? step1 : currentStep === 2 ? step2 : step3 },
    }

    // Store
    const history = stored ? [...stored.history, changeEntry] : [changeEntry]
    stateStore.set(projectId, { state: newState, history })

    return c.json({
      success: true,
      data: newState,
      updatedAt: now,
      version,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      }, 400)
    }
    console.error('Error saving step state:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save step state',
    }, 500)
  }
})

// ==================== GET /api/step-state ====================

const GetStepStateSchema = z.object({
  projectId: z.string().min(1),
})

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
      history: stored.history.slice(-50), // Last 50 entries
    })
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

    stateStore.delete(projectId)

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

export default stepState
