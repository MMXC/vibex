/**
 * /api/canvas/[id]/optimize — POST Canvas Layout Optimization
 * Sprint94 E1: Canvas AI Insights
 *
 * POST /api/canvas/{id}/optimize
 * Applies automatic layout optimization to canvas nodes.
 * Supports: 'hierarchical' (top-down tree) and 'force-directed' (force simulation)
 * Auth-protected: requires valid user session.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryOne, executeDB } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';

interface CanvasNode {
  id: string;
  canvas_id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface CanvasEdge {
  id: string;
  source_id: string;
  target_id: string;
}

type LayoutType = 'hierarchical' | 'force-directed';

/**
 * Generate hierarchical (top-down tree) layout positions.
 * Root nodes (no incoming edges) are placed at top, children below.
 */
function hierarchicalLayout(
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return positions;

  // Build adjacency list
  const children = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    children.set(node.id, []);
    inDegree.set(node.id, 0);
  }
  for (const edge of edges) {
    const kids = children.get(edge.source_id);
    if (kids) kids.push(edge.target_id);
    const deg = inDegree.get(edge.target_id) ?? 0;
    inDegree.set(edge.target_id, deg + 1);
  }

  // Find roots (nodes with inDegree = 0)
  const roots = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0);

  // BFS level assignment
  const levels = new Map<string, number>();
  const queue: string[] = roots.map((r) => r.id);
  for (const r of roots) levels.set(r.id, 0);

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const level = levels.get(nodeId) ?? 0;
    const nodeChildren = children.get(nodeId) ?? [];
    for (const child of nodeChildren) {
      if (!levels.has(child)) {
        levels.set(child, level + 1);
        queue.push(child);
      }
    }
  }

  // Assign nodes with no path from root to level 0
  for (const node of nodes) {
    if (!levels.has(node.id)) levels.set(node.id, 0);
  }

  // Group by level
  const levelGroups = new Map<number, string[]>();
  for (const [nodeId, level] of levels) {
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(nodeId);
  }

  // Spacing constants
  const nodeWidth = 200;
  const nodeHeight = 100;
  const horizontalGap = 60;
  const verticalGap = 80;

  const maxLevel = Math.max(...Array.from(levels.values()), 0);
  for (let level = 0; level <= maxLevel; level++) {
    const nodesAtLevel = levelGroups.get(level) ?? [];
    const totalWidth = nodesAtLevel.length * nodeWidth + (nodesAtLevel.length - 1) * horizontalGap;
    const startX = -totalWidth / 2;
    nodesAtLevel.forEach((nodeId, idx) => {
      positions.set(nodeId, {
        x: startX + idx * (nodeWidth + horizontalGap),
        y: level * (nodeHeight + verticalGap),
      });
    });
  }

  return positions;
}

/**
 * Generate force-directed layout positions using a simple spring-electric model.
 */
function forceDirectedLayout(
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return positions;

  const nodeWidth = 200;
  const nodeHeight = 100;

  // Initialize random positions in a circle
  const centerX = 0;
  const centerY = 0;
  const radius = Math.max(200, nodes.length * 40);

  nodes.forEach((node, idx) => {
    const angle = (2 * Math.PI * idx) / nodes.length;
    positions.set(node.id, {
      x: centerX + radius * Math.cos(angle) - nodeWidth / 2,
      y: centerY + radius * Math.sin(angle) - nodeHeight / 2,
    });
  });

  // Simple iteration-based relaxation (3 passes)
  const iterations = 3;
  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>();
    for (const node of nodes) {
      forces.set(node.id, { fx: 0, fy: 0 });
    }

    // Repulsion between all node pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = positions.get(nodes[i].id)!;
        const b = positions.get(nodes[j].id)!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const repulsion = 8000 / (dist * dist);
        const fx = (dx / dist) * repulsion;
        const fy = (dy / dist) * repulsion;

        const fa = forces.get(nodes[i].id)!;
        const fb = forces.get(nodes[j].id)!;
        fa.fx -= fx;
        fa.fy -= fy;
        fb.fx += fx;
        fb.fy += fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const a = positions.get(edge.source_id);
      const b = positions.get(edge.target_id);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const attraction = dist * 0.01;
      const fx = (dx / dist) * attraction;
      const fy = (dy / dist) * attraction;

      const fa = forces.get(edge.source_id)!;
      const fb = forces.get(edge.target_id)!;
      fa.fx += fx;
      fa.fy += fy;
      fb.fx -= fx;
      fb.fy -= fy;
    }

    // Apply forces with damping
    const damping = 0.5;
    for (const node of nodes) {
      const pos = positions.get(node.id)!;
      const force = forces.get(node.id)!;
      pos.x += force.fx * damping;
      pos.y += force.fy * damping;
      positions.set(node.id, pos);
    }
  }

  return positions;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: canvasId } = await context.params;

    if (!canvasId) {
      return NextResponse.json({ error: 'Missing canvas ID' }, { status: 400 });
    }

    const auth = getAuthUserFromRequest(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { layout?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const layout = (body.layout ?? 'hierarchical') as LayoutType;
    const validLayouts: LayoutType[] = ['hierarchical', 'force-directed'];
    if (!validLayouts.includes(layout)) {
      return NextResponse.json(
        { error: `layout must be one of: ${validLayouts.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch all nodes and edges
    const nodes = await queryOne<CanvasNode[]>(
      undefined,
      'SELECT id, canvas_id, x, y FROM canvas_nodes WHERE canvas_id = ?',
      [canvasId]
    );
    const edges = await queryOne<CanvasEdge[]>(
      undefined,
      'SELECT id, source_id, target_id FROM canvas_edges WHERE canvas_id = ?',
      [canvasId]
    );

    const nodeList: CanvasNode[] = (nodes as CanvasNode[]) ?? [];
    const edgeList: CanvasEdge[] = (edges as CanvasEdge[]) ?? [];

    // Compute new positions
    const positions =
      layout === 'force-directed'
        ? forceDirectedLayout(nodeList, edgeList)
        : hierarchicalLayout(nodeList, edgeList);

    // Update node positions in DB
    const updatedNodes: Array<{ id: string; x: number; y: number }> = [];
    for (const node of nodeList) {
      const pos = positions.get(node.id);
      if (pos) {
        await executeDB(
          undefined,
          'UPDATE canvas_nodes SET x = ?, y = ? WHERE id = ?',
          [pos.x, pos.y, node.id]
        );
        updatedNodes.push({ id: node.id, x: pos.x, y: pos.y });
      }
    }

    return NextResponse.json(
      {
        ok: true,
        layout,
        updatedCount: updatedNodes.length,
        nodePositions: updatedNodes,
      },
      { status: 200 }
    );
  } catch (err) {
    safeError('[Optimize POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
