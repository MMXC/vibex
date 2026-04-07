/**
 * Canvas Snapshot API
 * v1/canvas/snapshot — versioned canvas state storage
 *
 * Endpoints:
 * GET  /v1/canvas/snapshot?projectId=xxx          — list snapshots for project
 * POST /v1/canvas/snapshot                        — create new snapshot
 * GET  /v1/canvas/snapshot/:id                   — get specific snapshot
 *
 * Based on: docs/canvas-json-persistence/IMPLEMENTATION_PLAN.md E2-S2
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db'

import { safeError } from '@/lib/log-sanitizer';

const snapshot = new Hono<{ Bindings: Env }>()

// ============================================================
// Schemas
// ============================================================

const CreateSnapshotSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  data: z.object({
    contexts: z.array(z.any()).optional(),
    flows: z.array(z.any()).optional(),
    components: z.array(z.any()).optional(),
    ui: z.record(z.string(), z.any()).optional(),
    version: z.number().optional(),
  }),
  isAutoSave: z.boolean().optional().default(false),
})

// ============================================================
// Type Definitions
// ============================================================

interface CanvasSnapshotRow {
  id: string
  projectId: string
  version: number
  name: string | null
  description: string | null
  data: string
  createdAt: string
  createdBy: string | null
  isAutoSave: number
}

// ============================================================
// GET /v1/canvas/snapshot?projectId=xxx — List snapshots
// ============================================================

snapshot.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')

    if (!projectId) {
      return c.json({ error: 'Missing required query param: projectId' }, 400)
    }

    const env = c.env

    const snapshots = await queryDB<CanvasSnapshotRow>(
      env,
      `SELECT id, projectId, version, name, description, data, createdAt, createdBy, isAutoSave
       FROM CanvasSnapshot
       WHERE projectId = ?
       ORDER BY version DESC
       LIMIT ? OFFSET ?`,
      [projectId, limit, offset]
    )

    // Get total count
    const countResult = await queryDB<{ cnt: number }>(
      env,
      'SELECT COUNT(*) as cnt FROM CanvasSnapshot WHERE projectId = ?',
      [projectId]
    )
    const total = countResult[0]?.cnt || 0

    return c.json({
      snapshots: snapshots.map((s) => ({
        ...s,
        data: JSON.parse(s.data),
        isAutoSave: Boolean(s.isAutoSave),
      })),
      total,
      limit,
      offset,
    })
  } catch (err) {
    safeError('[canvas/snapshot] GET error:', err)
    return c.json({ error: 'Failed to fetch snapshots' }, 500)
  }
})

// ============================================================
// POST /v1/canvas/snapshot — Create new snapshot
// E2-S2: Snapshot save API
// ============================================================

snapshot.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const parsed = CreateSnapshotSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({ error: 'Invalid request body', details: parsed.error.flatten() }, 400)
    }

    const { projectId, name, description, data, isAutoSave } = parsed.data
    const env = c.env

    // Get the next version number for this project
    const existing = await queryDB<{ maxVersion: number | null }>(
      env,
      'SELECT MAX(version) as maxVersion FROM CanvasSnapshot WHERE projectId = ?',
      [projectId]
    )
    const nextVersion = (existing[0]?.maxVersion ?? 0) + 1

    const snapshotId = generateId()
    const now = new Date().toISOString()

    await executeDB(
      env,
      `INSERT INTO CanvasSnapshot (id, projectId, version, name, description, data, createdAt, isAutoSave)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        snapshotId,
        projectId,
        nextVersion,
        name || null,
        description || null,
        JSON.stringify(data),
        now,
        isAutoSave ? 1 : 0,
      ]
    )

    const created = await queryOne<CanvasSnapshotRow>(
      env,
      'SELECT * FROM CanvasSnapshot WHERE id = ?',
      [snapshotId]
    )

    if (!created) {
      return c.json({ error: 'Failed to create snapshot' }, 500)
    }

    return c.json({
      snapshot: {
        ...created,
        data: JSON.parse(created.data),
        isAutoSave: Boolean(created.isAutoSave),
      },
      version: created.version,
    }, 201)
  } catch (err) {
    safeError('[canvas/snapshot] POST error:', err)
    return c.json({ error: 'Failed to create snapshot' }, 500)
  }
})

export default snapshot
