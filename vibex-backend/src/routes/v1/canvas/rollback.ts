/**
 * @deprecated Legacy Cloudflare Workers route. Migrated to App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 * Canvas Rollback API
 * v1/canvas/rollback — rollback canvas to a specific version
 *
 * Endpoints:
 * GET  /v1/canvas/rollback?projectId=xxx&version=N  — get snapshot data for rollback preview
 * POST /v1/canvas/rollback                         — perform rollback
 *
 * E2-S3: Version list + rollback API
 * Based on: docs/canvas-json-persistence/IMPLEMENTATION_PLAN.md E2-S3
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db'

import { safeError } from '@/lib/log-sanitizer';
import { apiError, ERROR_CODES } from '@/lib/api-error';

const rollback = new Hono<{ Bindings: Env }>()

// ============================================================
// Schemas
// ============================================================

const RollbackSchema = z.object({
  projectId: z.string().min(1),
  targetVersion: z.number().int().positive(),
  createBackup: z.boolean().optional().default(true),  // always backup before rollback
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
// GET /v1/canvas/rollback?projectId=xxx&version=N — Preview rollback
// E2-S3: Get version list
// ============================================================

rollback.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId')
    const versionStr = c.req.query('version')

    if (!projectId) {
      return         c.json(apiError('Missing required query param: projectId', ERROR_CODES.BAD_REQUEST), 400)
    }

    if (versionStr) {
      // Get specific version snapshot
      const version = parseInt(versionStr)
      const env = c.env

      const snapshot = await queryOne<CanvasSnapshotRow>(
        env,
        'SELECT * FROM CanvasSnapshot WHERE projectId = ? AND version = ?',
        [projectId, version]
      )

      if (!snapshot) {
        return c.json({ error: `Snapshot version ${version} not found` }, 404)
      }

      return c.json({
        snapshot: {
          ...snapshot,
          data: JSON.parse(snapshot.data),
          isAutoSave: Boolean(snapshot.isAutoSave),
        },
      })
    }

    // List all available versions for project
    const env = c.env

    const snapshots = await queryDB<Pick<CanvasSnapshotRow, 'id' | 'version' | 'name' | 'description' | 'createdAt' | 'isAutoSave'>>(
      env,
      `SELECT id, version, name, description, createdAt, isAutoSave
       FROM CanvasSnapshot
       WHERE projectId = ?
       ORDER BY version DESC`,
      [projectId]
    )

    return c.json({
      versions: snapshots.map((s) => ({
        ...s,
        isAutoSave: Boolean(s.isAutoSave),
      })),
    })
  } catch (err) {
    safeError('[canvas/rollback] GET error:', err)
    return         c.json(apiError('Failed to fetch rollback info', ERROR_CODES.INTERNAL_ERROR), 500)
  }
})

// ============================================================
// POST /v1/canvas/rollback — Perform rollback
// E2-S3: Rollback API — creates a new snapshot with the old data
// ============================================================

rollback.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const parsed = RollbackSchema.safeParse(body)

    if (!parsed.success) {
      return         c.json(apiError('Invalid request body', ERROR_CODES.BAD_REQUEST), 400)
    }

    const { projectId, targetVersion, createBackup } = parsed.data
    const env = c.env

    // Get the target snapshot
    const targetSnapshot = await queryOne<CanvasSnapshotRow>(
      env,
      'SELECT * FROM CanvasSnapshot WHERE projectId = ? AND version = ?',
      [projectId, targetVersion]
    )

    if (!targetSnapshot) {
      return c.json({ error: `Snapshot version ${targetVersion} not found` }, 404)
    }

    // Get current max version
    const currentVersionResult = await queryDB<{ maxVersion: number | null }>(
      env,
      'SELECT MAX(version) as maxVersion FROM CanvasSnapshot WHERE projectId = ?',
      [projectId]
    )
    const currentMaxVersion = currentVersionResult[0]?.maxVersion || 0
    const newVersion = currentMaxVersion + 1

    const now = new Date().toISOString()
    const snapshotId = generateId()

    // If createBackup, save current state as a backup snapshot before rollback
    if (createBackup) {
      // Get latest snapshot data to back up
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
            currentMaxVersion + 0.5,  // fractional version as backup marker
            `Backup before rollback to v${targetVersion}`,
            null,
            latestSnapshot.data,
            now,
            0,
          ]
        )
      }
    }

    // Create new snapshot with the target's data (rollback = new snapshot with old data)
    await executeDB(
      env,
      `INSERT INTO CanvasSnapshot (id, projectId, version, name, description, data, createdAt, isAutoSave)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        snapshotId,
        projectId,
        newVersion,
        `Rollback to v${targetVersion}`,
        `Restored from snapshot v${targetVersion}`,
        targetSnapshot.data,  // restore old data
        now,
        0,
      ]
    )

    const created = await queryOne<CanvasSnapshotRow>(
      env,
      'SELECT * FROM CanvasSnapshot WHERE id = ?',
      [snapshotId]
    )

    return c.json({
      success: true,
      snapshot: created
        ? {
            ...created,
            data: JSON.parse(created.data),
            isAutoSave: Boolean(created.isAutoSave),
          }
        : null,
      version: newVersion,
      restoredFromVersion: targetVersion,
    }, 201)
  } catch (err) {
    safeError('[canvas/rollback] POST error:', err)
    return         c.json(apiError('Failed to perform rollback', ERROR_CODES.INTERNAL_ERROR), 500)
  }
})

export default rollback
