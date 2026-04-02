/**
 * Canvas Snapshots API
 * v1/canvas/snapshots — versioned canvas state storage
 *
 * Endpoints:
 * GET  /v1/canvas/snapshots?projectId=xxx        — list snapshots for project
 * POST /v1/canvas/snapshots                      — create new snapshot
 * GET  /v1/canvas/snapshots/:id                  — get specific snapshot
 *
 * Based on: docs/canvas-json-persistence/IMPLEMENTATION_PLAN.md E2-S2
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db'

const snapshots = new Hono<{ Bindings: Env }>()

// ============================================================
// Schemas
// ============================================================

const CreateSnapshotSchema = z.object({
  // Frontend format (E4-F11)
  projectId: z.string().optional().nullable(),
  label: z.string().optional().default('Snapshot'),
  trigger: z.enum(['manual', 'auto', 'ai_complete']).optional().default('manual'),
  contextNodes: z.array(z.any()).optional().default([]),
  flowNodes: z.array(z.any()).optional().default([]),
  componentNodes: z.array(z.any()).optional().default([]),
  // Legacy/internal format support
  data: z.object({
    contexts: z.array(z.any()).optional(),
    flows: z.array(z.any()).optional(),
    components: z.array(z.any()).optional(),
    ui: z.record(z.string(), z.any()).optional(),
  }).optional(),
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

snapshots.get('/', async (c) => {
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
    console.error('[canvas/snapshot] GET error:', err)
    return c.json({ error: 'Failed to fetch snapshots' }, 500)
  }
})

// ============================================================
// POST /v1/canvas/snapshot — Create new snapshot
// E2-S2: Snapshot save API
// ============================================================

snapshots.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const parsed = CreateSnapshotSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({ error: 'Invalid request body', details: parsed.error.flatten() }, 400)
    }

    const { projectId, label, trigger, contextNodes, flowNodes, componentNodes, data: legacyData, isAutoSave } = parsed.data
    const env = c.env

    // Use projectId from request, or fall back to one in legacy data
    const resolvedProjectId = projectId || (legacyData as any)?.projectId
    if (!resolvedProjectId) {
      return c.json({ error: 'Missing required field: projectId' }, 400)
    }

    // Build the snapshot data object
    const snapshotData = {
      // Prefer new format fields
      contexts: contextNodes,
      flows: flowNodes,
      components: componentNodes,
      // Fall back to legacy format
      ...(legacyData || {}),
      // Always include metadata
      _trigger: trigger,
      _label: label,
    }

    // Get the next version number for this project
    const existing = await queryDB<{ maxVersion: number | null }>(
      env,
      'SELECT MAX(version) as maxVersion FROM CanvasSnapshot WHERE projectId = ?',
      [resolvedProjectId]
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
        resolvedProjectId,
        nextVersion,
        label || null,
        trigger || null,
        JSON.stringify(snapshotData),
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

    // Parse stored data back to object
    let parsedData: Record<string, any> = {}
    try {
      parsedData = JSON.parse(created.data)
    } catch {
      parsedData = { contexts: [], flows: [], components: [] }
    }

    return c.json({
      success: true,
      snapshot: {
        snapshotId: created.id,
        projectId: created.projectId,
        label: created.name || 'Snapshot',
        trigger: (['manual', 'auto', 'ai_complete'].includes(created.description || '') ? created.description : 'manual') as 'manual' | 'auto' | 'ai_complete',
        createdAt: created.createdAt,
        contextCount: Array.isArray(parsedData.contexts) ? parsedData.contexts.length : 0,
        flowCount: Array.isArray(parsedData.flows) ? parsedData.flows.length : 0,
        componentCount: Array.isArray(parsedData.components) ? parsedData.components.length : 0,
        contextNodes: parsedData.contexts || [],
        flowNodes: parsedData.flows || [],
        componentNodes: parsedData.components || [],
      },
      version: created.version,
    }, 201)
  } catch (err) {
    console.error('[canvas/snapshots] POST error:', err)
    return c.json({ error: 'Failed to create snapshot' }, 500)
  }
})

// ============================================================
// GET /v1/canvas/snapshots/:id — Get specific snapshot by ID
// ============================================================

snapshots.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const env = c.env

    const snapshot = await queryOne<CanvasSnapshotRow>(
      env,
      'SELECT * FROM CanvasSnapshot WHERE id = ?',
      [id]
    )

    if (!snapshot) {
      return c.json({ error: 'Snapshot not found' }, 404)
    }

    let parsedData: Record<string, any> = {}
    try {
      parsedData = JSON.parse(snapshot.data)
    } catch {
      parsedData = {}
    }

    return c.json({
      success: true,
      snapshot: {
        snapshotId: snapshot.id,
        projectId: snapshot.projectId,
        label: snapshot.name || 'Snapshot',
        trigger: (['manual', 'auto', 'ai_complete'].includes(snapshot.description || '') ? snapshot.description : 'manual') as 'manual' | 'auto' | 'ai_complete',
        createdAt: snapshot.createdAt,
        contextCount: Array.isArray(parsedData.contexts) ? parsedData.contexts.length : 0,
        flowCount: Array.isArray(parsedData.flows) ? parsedData.flows.length : 0,
        componentCount: Array.isArray(parsedData.components) ? parsedData.components.length : 0,
        contextNodes: parsedData.contexts || [],
        flowNodes: parsedData.flows || [],
        componentNodes: parsedData.components || [],
      },
    })
  } catch (err) {
    console.error('[canvas/snapshots] GET :id error:', err)
    return c.json({ error: 'Failed to fetch snapshot' }, 500)
  }
})

// ============================================================
// POST /v1/canvas/snapshots/:id/restore — Restore to specific snapshot
// E2-S3: Restore via snapshot ID (REST-style, matches frontend API contract)
// ============================================================

snapshots.post('/:id/restore', async (c) => {
  try {
    const id = c.req.param('id')
    const env = c.env

    // Get the target snapshot by ID
    const targetSnapshot = await queryOne<CanvasSnapshotRow>(
      env,
      'SELECT * FROM CanvasSnapshot WHERE id = ?',
      [id]
    )

    if (!targetSnapshot) {
      return c.json({ error: 'Snapshot not found' }, 404)
    }

    const projectId = targetSnapshot.projectId

    // Get current max version
    const currentVersionResult = await queryDB<{ maxVersion: number | null }>(
      env,
      'SELECT MAX(version) as maxVersion FROM CanvasSnapshot WHERE projectId = ?',
      [projectId]
    )
    const currentMaxVersion = currentVersionResult[0]?.maxVersion || 0
    const newVersion = currentMaxVersion + 1

    const now = new Date().toISOString()
    const newSnapshotId = generateId()

    // Create backup of current state
    const latestSnapshot = await queryOne<CanvasSnapshotRow>(
      env,
      'SELECT * FROM CanvasSnapshot WHERE projectId = ? ORDER BY version DESC LIMIT 1',
      [projectId]
    )

    if (latestSnapshot) {
      const backupId = generateId()
      await executeDB(
        env,
        `INSERT INTO CanvasSnapshot (id, projectId, version, name, description, data, createdAt, isAutoSave)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          backupId,
          projectId,
          currentMaxVersion + 0.5,
          `Backup before restore to snapshot ${id.substring(0, 8)}`,
          null,
          latestSnapshot.data,
          now,
          0,
        ]
      )
    }

    // Create new snapshot with the target's data (rollback = new snapshot with old data)
    await executeDB(
      env,
      `INSERT INTO CanvasSnapshot (id, projectId, version, name, description, data, createdAt, isAutoSave)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newSnapshotId,
        projectId,
        newVersion,
        `Restored from snapshot ${id.substring(0, 8)}`,
        `Restore to snapshot v${targetSnapshot.version}`,
        targetSnapshot.data,
        now,
        0,
      ]
    )

    const created = await queryOne<CanvasSnapshotRow>(
      env,
      'SELECT * FROM CanvasSnapshot WHERE id = ?',
      [newSnapshotId]
    )

    // Parse the restored data to return node arrays
    let parsedData: Record<string, any> = {}
    try {
      parsedData = JSON.parse(targetSnapshot.data)
    } catch {
      parsedData = {}
    }

    return c.json({
      success: true,
      contextNodes: parsedData.contexts || [],
      flowNodes: parsedData.flows || [],
      componentNodes: parsedData.components || [],
    }, 201)
  } catch (err) {
    console.error('[canvas/snapshots] POST :id/restore error:', err)
    return c.json({ error: 'Failed to restore snapshot' }, 500)
  }
})

export default snapshots
