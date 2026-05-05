/**
 * GET /api/v1/projects/:id/versions/:versionId — Get specific version
 * POST /api/v1/projects/:id/versions/:versionId — Restore to this version
 *
 * E2-S5: Version detail endpoint
 * E2-S4: Restore to version (with confirmation — frontend handles confirmation dialog)
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

interface CanvasSnapshotRow {
  id: string;
  projectId: string;
  version: number;
  name: string | null;
  description: string | null;
  data: string;
  createdAt: string;
  createdBy: string | null;
  isAutoSave: number;
}

// GET /api/v1/projects/:id/versions/:versionId
export async function GET(
  request: NextRequest,
  context: { env: Env; params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id: projectId, versionId } = await context.params;
    const env = context.env;

    const snapshot = await queryOne<CanvasSnapshotRow>(
      env,
      'SELECT * FROM CanvasSnapshot WHERE id = ? AND projectId = ?',
      [versionId, projectId]
    );

    if (!snapshot) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    let parsedData: Record<string, unknown> = {};
    try {
      parsedData = JSON.parse(snapshot.data);
    } catch {
      parsedData = {};
    }

    return NextResponse.json({
      id: snapshot.id,
      project_id: snapshot.projectId,
      version: snapshot.version,
      name: snapshot.name,
      description: snapshot.description,
      snapshot_json: parsedData,
      created_at: snapshot.createdAt,
      created_by: snapshot.createdBy,
      is_auto_save: Boolean(snapshot.isAutoSave),
    });
  } catch (err) {
    safeError('[projects/:id/versions/:versionId] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch version' }, { status: 500 });
  }
}

// POST /api/v1/projects/:id/versions/:versionId — Restore to this version
export async function POST(
  request: NextRequest,
  context: { env: Env; params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id: projectId, versionId } = await context.params;
    const env = context.env;

    // Get the target snapshot
    const targetSnapshot = await queryOne<CanvasSnapshotRow>(
      env,
      'SELECT * FROM CanvasSnapshot WHERE id = ? AND projectId = ?',
      [versionId, projectId]
    );

    if (!targetSnapshot) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Get current max version
    const currentVersionResult = await queryDB<{ maxVersion: number | null }>(
      env,
      'SELECT MAX(version) as maxVersion FROM CanvasSnapshot WHERE projectId = ?',
      [projectId]
    );
    const currentMaxVersion = currentVersionResult[0]?.maxVersion || 0;
    const newVersion = currentMaxVersion + 1;

    const now = new Date().toISOString();
    const newSnapshotId = generateId();

    // Create backup of current state (highest version)
    const latestSnapshot = await queryOne<CanvasSnapshotRow>(
      env,
      'SELECT * FROM CanvasSnapshot WHERE projectId = ? ORDER BY version DESC LIMIT 1',
      [projectId]
    );

    if (latestSnapshot) {
      const backupId = generateId();
      await executeDB(
        env,
        `INSERT INTO CanvasSnapshot (id, projectId, version, name, description, data, createdAt, isAutoSave)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          backupId,
          projectId,
          currentMaxVersion + 0.5,
          `Backup before restore to v${targetSnapshot.version}`,
          null,
          latestSnapshot.data,
          now,
          0,
        ]
      );
    }

    // Create new snapshot with the target's data (restore = new snapshot with old data)
    await executeDB(
      env,
      `INSERT INTO CanvasSnapshot (id, projectId, version, name, description, data, createdAt, isAutoSave)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newSnapshotId,
        projectId,
        newVersion,
        `Restored from v${targetSnapshot.version}`,
        `Restore to snapshot v${targetSnapshot.version}`,
        targetSnapshot.data,
        now,
        0,
      ]
    );

    // Parse restored data to return node arrays
    let parsedData: Record<string, unknown> = {};
    try {
      parsedData = JSON.parse(targetSnapshot.data);
    } catch {
      parsedData = {};
    }

    return NextResponse.json({
      success: true,
      contextNodes: parsedData.contexts ?? [],
      flowNodes: parsedData.flows ?? [],
      componentNodes: parsedData.components ?? [],
      newVersion,
    }, { status: 201 });
  } catch (err) {
    safeError('[projects/:id/versions/:versionId] POST (restore) error:', err);
    return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 });
  }
}