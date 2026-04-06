/**
 * POST /api/canvas/snapshots — Canvas Snapshot Sync API
 *
 * E4-SyncProtocol: 三树数据同步 + 冲突检测
 *
 * 逻辑:
 * - 版本匹配 → 200 + 保存，返回新版本号
 * - 版本冲突 → 409 + { serverSnapshot, serverVersion, clientVersion }
 *
 * 基于: vibex-backend/src/routes/v1/canvas/snapshots.ts (Hono) 实现逻辑
 * 使用 D1 raw SQL 接口 (queryDB/queryOne/executeDB)
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

// GET /api/canvas/snapshots — List snapshots for project
export async function GET(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing required query param: projectId' }, { status: 400 });
    }

    // D1 environment binding (Cloudflare Workers)
    const env = context.env;

    const snapshots = await queryDB<CanvasSnapshotRow>(
      env,
      `SELECT id, projectId, version, name, description, data, createdAt, createdBy, isAutoSave
       FROM CanvasSnapshot
       WHERE projectId = ?
       ORDER BY version DESC
       LIMIT ? OFFSET ?`,
      [projectId, limit, offset]
    );

    const countResult = await queryDB<{ cnt: number }>(
      env,
      'SELECT COUNT(*) as cnt FROM CanvasSnapshot WHERE projectId = ?',
      [projectId]
    );
    const total = countResult[0]?.cnt || 0;

    return NextResponse.json({
      snapshots: snapshots.map((s) => ({
        ...s,
        data: JSON.parse(s.data),
        isAutoSave: Boolean(s.isAutoSave),
      })),
      total,
      limit,
      offset,
    });
  } catch (err) {
    safeError('[canvas/snapshots] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
  }
}

// POST /api/canvas/snapshots — Create snapshot with optimistic locking
export async function POST(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const body = await request.json();
    const env = context.env;

    const {
      projectId,
      label,
      trigger,
      contextNodes,
      flowNodes,
      componentNodes,
      data: legacyData,
      isAutoSave,
      version: clientVersion,
    } = body as {
      projectId?: string | null;
      label?: string;
      trigger?: string;
      contextNodes?: unknown[];
      flowNodes?: unknown[];
      componentNodes?: unknown[];
      data?: Record<string, unknown>;
      isAutoSave?: boolean;
      version?: number;
    };

    // Resolve projectId
    const resolvedProjectId = projectId ?? (legacyData as Record<string, unknown> | undefined)?.projectId as string | undefined;
    if (!resolvedProjectId) {
      return NextResponse.json({ error: 'Missing required field: projectId' }, { status: 400 });
    }

    // Build snapshot data
    const snapshotData: Record<string, unknown> = {
      contexts: contextNodes ?? [],
      flows: flowNodes ?? [],
      components: componentNodes ?? [],
      ...(legacyData ?? {}),
      _trigger: trigger ?? 'manual',
      _label: label ?? 'Snapshot',
    };

    // Get current max version for optimistic locking
    const existing = await queryDB<{ maxVersion: number | null }>(
      env,
      'SELECT MAX(version) as maxVersion FROM CanvasSnapshot WHERE projectId = ?',
      [resolvedProjectId]
    );
    const currentMaxVersion = existing[0]?.maxVersion ?? 0;

    // E4: Optimistic locking — check version conflict
    // Conflict if client version is stale: clientVersion <= server max
    // If clientVersion > currentMaxVersion: client proactively saved a newer version (advanced via another client)
    if (clientVersion !== undefined && clientVersion <= currentMaxVersion) {
      // Get server snapshot data for conflict response
      const serverSnapshot = await queryOne<CanvasSnapshotRow>(
        env,
        'SELECT * FROM CanvasSnapshot WHERE projectId = ? ORDER BY version DESC LIMIT 1',
        [resolvedProjectId]
      );

      let serverData: Record<string, unknown> = {};
      if (serverSnapshot) {
        try {
          serverData = JSON.parse(serverSnapshot.data);
        } catch {
          serverData = {};
        }
      }

      const conflictResponse = {
        success: false,
        error: 'VERSION_CONFLICT',
        message: 'Version conflict detected. Another client has saved a newer version.',
        serverVersion: currentMaxVersion,
        clientVersion,
        serverSnapshot: serverSnapshot
          ? {
              snapshotId: serverSnapshot.id,
              version: serverSnapshot.version,
              createdAt: serverSnapshot.createdAt,
              data: serverData,
            }
          : null,
      };

      return NextResponse.json(conflictResponse, { status: 409 });
    }

    // Version matches or no version provided — create new snapshot
    const nextVersion = currentMaxVersion + 1;
    const snapshotId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      `INSERT INTO CanvasSnapshot (id, projectId, version, name, description, data, createdAt, isAutoSave)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        snapshotId,
        resolvedProjectId,
        nextVersion,
        label ?? null,
        trigger ?? null,
        JSON.stringify(snapshotData),
        now,
        isAutoSave ? 1 : 0,
      ]
    );

    const created = await queryOne<CanvasSnapshotRow>(
      env,
      'SELECT * FROM CanvasSnapshot WHERE id = ?',
      [snapshotId]
    );

    if (!created) {
      return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
    }

    let parsedData: Record<string, unknown> = {};
    try {
      parsedData = JSON.parse(created.data);
    } catch {
      parsedData = { contexts: [], flows: [], components: [] };
    }

    return NextResponse.json({
      success: true,
      snapshot: {
        snapshotId: created.id,
        projectId: created.projectId,
        label: created.name || 'Snapshot',
        trigger: (['manual', 'auto', 'ai_complete'].includes(created.description ?? '') ? created.description : 'manual'),
        createdAt: created.createdAt,
        version: created.version,
        contextCount: Array.isArray(parsedData.contexts) ? (parsedData.contexts as unknown[]).length : 0,
        flowCount: Array.isArray(parsedData.flows) ? (parsedData.flows as unknown[]).length : 0,
        componentCount: Array.isArray(parsedData.components) ? (parsedData.components as unknown[]).length : 0,
        contextNodes: parsedData.contexts ?? [],
        flowNodes: parsedData.flows ?? [],
        componentNodes: parsedData.components ?? [],
      },
      version: created.version,
    }, { status: 201 });
  } catch (err) {
    safeError('[canvas/snapshots] POST error:', err);
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
  }
}
