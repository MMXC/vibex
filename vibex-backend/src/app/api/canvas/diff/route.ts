/**
 * GET /api/canvas/diff — Canvas Version Diff API
 *
 * S84-E1: Compare two canvas snapshots and return structured diff
 *
 * Query params:
 *   projectId  — Canvas project ID
 *   from       — Source snapshot ID
 *   to         — Target snapshot ID
 *   mode       — 'unidirectional' (default) or 'bidirectional'
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, Env } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';

const V0_DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 31 May 2026 23:59:59 GMT',
  'X-API-Deprecation-Info': 'https://docs.vibex.ai/api-v0-sunset',
};

interface SnapshotRow {
  id: string;
  projectId: string;
  version: number;
  name: string | null;
  data: string;
  createdAt: string;
}

export async function GET(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const fromId = searchParams.get('from');
    const toId = searchParams.get('to');
    const mode = (searchParams.get('mode') || 'unidirectional') as 'unidirectional' | 'bidirectional';

    if (!projectId || !fromId || !toId) {
      return NextResponse.json(
        { error: 'Missing required params: projectId, from, to' },
        { status: 400 }
      );
    }

    const env = context.env;

    // Fetch both snapshots
    const [fromSnap, toSnap] = await Promise.all([
      queryOne<SnapshotRow>(env,
        'SELECT id, projectId, version, name, data, createdAt FROM CanvasSnapshot WHERE id = ? AND projectId = ?',
        [fromId, projectId]
      ),
      queryOne<SnapshotRow>(env,
        'SELECT id, projectId, version, name, data, createdAt FROM CanvasSnapshot WHERE id = ? AND projectId = ?',
        [toId, projectId]
      ),
    ]);

    if (!fromSnap || !toSnap) {
      return NextResponse.json(
        { error: 'Snapshot not found' },
        { status: 404 }
      );
    }

    // Parse canvas data
    let fromData: { nodes?: Record<string, unknown>[]; edges?: Record<string, unknown>[] } = {};
    let toData: { nodes?: Record<string, unknown>[]; edges?: Record<string, unknown>[] } = {};
    try {
      fromData = JSON.parse(fromSnap.data || '{}');
      toData = JSON.parse(toSnap.data || '{}');
    } catch {
      // If data is not valid JSON, treat as empty
    }

    const fromNodes = (fromData.nodes || []) as Array<{ id?: string; nodeId?: string; name?: string; type?: string }>;
    const toNodes = (toData.nodes || []) as Array<{ id?: string; nodeId?: string; name?: string; type?: string }>;

    // Build node maps — support both `id` and `nodeId` fields
    const fromMap = new Map<string, typeof fromNodes[0]>();
    const toMap = new Map<string, typeof toNodes[0]>();
    for (const node of fromNodes) {
      fromMap.set(node.nodeId || node.id || '', node);
    }
    for (const node of toNodes) {
      toMap.set(node.nodeId || node.id || '', node);
    }

    type DiffNode = {
      nodeId: string;
      name: string;
      type: string;
      changeType: 'added' | 'removed' | 'modified';
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
    };

    const added: DiffNode[] = [];
    const removed: DiffNode[] = [];
    const modified: DiffNode[] = [];

    // Unidirectional: from → to (what changed from A to B)
    for (const [key, fromNode] of fromMap) {
      const toNode = toMap.get(key);
      if (!toNode) {
        removed.push({
          nodeId: key,
          name: (fromNode.name || fromNode.nodeId || fromNode.id || key) as string,
          type: (fromNode.type || 'node') as string,
          changeType: 'removed',
          before: fromNode as unknown as Record<string, unknown>,
        });
      } else {
        // Compare key fields
        const fieldsToCompare = ['name', 'type'];
        const before: Record<string, unknown> = {};
        const after: Record<string, unknown> = {};
        let isModified = false;
        for (const field of fieldsToCompare) {
          const fv = fromNode[field as keyof typeof fromNode];
          const tv = toNode[field as keyof typeof toNode];
          before[field] = fv;
          after[field] = tv;
          if (fv !== tv) isModified = true;
        }
        if (isModified) {
          modified.push({
            nodeId: key,
            name: (toNode.name || toNode.nodeId || toNode.id || key) as string,
            type: (toNode.type || 'node') as string,
            changeType: 'modified',
            before,
            after,
          });
        }
      }
    }

    // Nodes only in `to` (added)
    for (const [key, toNode] of toMap) {
      if (!fromMap.has(key)) {
        added.push({
          nodeId: key,
          name: (toNode.name || toNode.nodeId || toNode.id || key) as string,
          type: (toNode.type || 'node') as string,
          changeType: 'added',
          after: toNode as unknown as Record<string, unknown>,
        });
      }
    }

    // Bidirectional: merge both directions
    let bidirectionalAdded: DiffNode[] = [];
    let bidirectionalRemoved: DiffNode[] = [];
    if (mode === 'bidirectional') {
      // from → to is removed (from B's perspective), to → from is added
      bidirectionalRemoved = removed;
      // from → to added nodes = to exclusive
      const toExclusive = [...toMap.entries()]
        .filter(([k]) => !fromMap.has(k))
        .map(([_, n]) => ({
          nodeId: n.nodeId || n.id || '',
          name: (n.name || n.nodeId || n.id || '') as string,
          type: (n.type || 'node') as string,
          changeType: 'added' as const,
          after: n as unknown as Record<string, unknown>,
        }));
      bidirectionalAdded = toExclusive;
    }

    return NextResponse.json({
      fromSnapshotId: fromId,
      toSnapshotId: toId,
      mode,
      fromName: fromSnap.name,
      toName: toSnap.name,
      fromVersion: fromSnap.version,
      toVersion: toSnap.version,
      diff: {
        added: mode === 'bidirectional' ? bidirectionalAdded : added,
        removed: mode === 'bidirectional' ? bidirectionalRemoved : removed,
        modified,
        unchanged: Math.max(0, Math.min(fromNodes.length, toNodes.length) - modified.length),
        stats: {
          added: (mode === 'bidirectional' ? bidirectionalAdded : added).length,
          removed: (mode === 'bidirectional' ? bidirectionalRemoved : removed).length,
          modified: modified.length,
          unchanged: Math.max(0, Math.min(fromNodes.length, toNodes.length) - modified.length),
        },
      },
    });
  } catch (err) {
    safeError('[canvas/diff] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
