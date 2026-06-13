/**
 * /api/canvas/[id]/insights — GET Canvas AI Insights
 * Sprint94 E1: Canvas AI Insights
 *
 * GET /api/canvas/{id}/insights
 * Returns canvas health score (0-100), layout optimization suggestions, and isolated nodes.
 * Auth-protected: requires valid user session.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryOne, generateId } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';

interface InsightsResult {
  id: string;
  canvas_id: string;
  score: number;
  suggestions: string;
  isolated_nodes: string;
  created_at: number;
}

interface CanvasNode {
  id: string;
  canvas_id: string;
  x: number;
  y: number;
}

interface CanvasEdge {
  id: string;
  canvas_id: string;
  source_id: string;
  target_id: string;
}

/**
 * Calculate canvas health score (0-100) based on:
 * - Node count (more nodes = more complex canvas)
 * - Edge density (more edges relative to nodes = better connectivity)
 * - Isolated node ratio (fewer isolated = healthier)
 */
function calculateHealthScore(
  nodeCount: number,
  edgeCount: number,
  isolatedNodeIds: string[]
): number {
  if (nodeCount === 0) return 0;

  // Base score from node count (up to 30 points)
  const nodeScore = Math.min(30, nodeCount * 3);

  // Edge density score (up to 40 points)
  // Ideal: roughly n-1 edges for a connected graph (tree structure)
  // Too few edges = low connectivity; too many = cluttered
  const maxPossibleEdges = nodeCount * (nodeCount - 1) / 2;
  const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;
  // Sweet spot: density between 0.05 and 0.3
  let edgeScore = 0;
  if (density >= 0.05 && density <= 0.3) {
    edgeScore = 40;
  } else if (density < 0.05) {
    edgeScore = Math.round(density * 800); // scale up to 40
  } else {
    edgeScore = Math.max(0, 40 - Math.round((density - 0.3) * 100));
  }

  // Isolated node penalty (up to 30 points off)
  const isolatedRatio = isolatedNodeIds.length / nodeCount;
  const isolationPenalty = Math.round(isolatedRatio * 30);

  const score = Math.max(0, Math.min(100, nodeScore + edgeScore + (30 - isolationPenalty)));
  return score;
}

/**
 * Generate layout optimization suggestions based on canvas structure.
 */
function generateSuggestions(
  nodeCount: number,
  edgeCount: number,
  isolatedNodeIds: string[]
): string[] {
  const suggestions: string[] = [];

  if (nodeCount === 0) {
    suggestions.push('Add some nodes to get started with your canvas.');
    return suggestions;
  }

  if (isolatedNodeIds.length > 0) {
    suggestions.push(
      `${isolatedNodeIds.length} isolated node${isolatedNodeIds.length > 1 ? 's' : ''} detected — connect them to improve flow.`
    );
  }

  const maxPossibleEdges = nodeCount * (nodeCount - 1) / 2;
  const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;

  if (density < 0.05 && nodeCount > 5) {
    suggestions.push('Low connectivity — consider adding more relationships between nodes.');
  }

  if (nodeCount > 30) {
    suggestions.push('Large canvas — consider grouping nodes into chapters for better organization.');
  }

  if (edgeCount > maxPossibleEdges * 0.5) {
    suggestions.push('Dense connections — hierarchical layout would improve readability.');
  }

  // Always suggest something actionable if we have < 3 suggestions
  if (suggestions.length < 3 && nodeCount > 0) {
    suggestions.push('Run a force-directed layout to automatically distribute nodes evenly.');
  }

  return suggestions.slice(0, 3);
}

export async function GET(
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

    // Fetch all nodes for this canvas
    const nodes = await queryOne<CanvasNode[]>(
      undefined,
      'SELECT id, canvas_id, x, y FROM canvas_nodes WHERE canvas_id = ?',
      [canvasId]
    );

    // Fetch all edges for this canvas
    const edges = await queryOne<CanvasEdge[]>(
      undefined,
      'SELECT id, canvas_id, source_id, target_id FROM canvas_edges WHERE canvas_id = ?',
      [canvasId]
    );

    const nodeList: CanvasNode[] = (nodes as CanvasNode[]) ?? [];
    const edgeList: CanvasEdge[] = (edges as CanvasEdge[]) ?? [];

    // Find isolated nodes (degree = 0)
    const connectedNodeIds = new Set<string>();
    for (const edge of edgeList) {
      connectedNodeIds.add(edge.source_id);
      connectedNodeIds.add(edge.target_id);
    }
    const isolatedNodeIds = nodeList
      .filter((n) => !connectedNodeIds.has(n.id))
      .map((n) => n.id);

    // Calculate health score
    const score = calculateHealthScore(nodeList.length, edgeList.length, isolatedNodeIds);

    // Generate suggestions
    const suggestions = generateSuggestions(nodeList.length, edgeList.length, isolatedNodeIds);

    // Try to get cached insights
    const cached = await queryOne<InsightsResult>(
      undefined,
      'SELECT * FROM ai_insights_cache WHERE canvas_id = ? ORDER BY created_at DESC LIMIT 1',
      [canvasId]
    );

    const now = Date.now();

    // Cache if: no cache exists OR score changed significantly OR cache is older than 5 minutes
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes
    const shouldUpdateCache =
      !cached ||
      Math.abs((cached as unknown as InsightsResult).score - score) > 5 ||
      now - ((cached as unknown as InsightsResult).created_at) > cacheExpiry;

    if (shouldUpdateCache) {
      const insightId = generateId();
      try {
        // Use raw D1 binding for write
        const env = (request as unknown as { env: { DB: D1Database } }).env;
        if (env?.DB) {
          await env.DB
            .prepare(
              'INSERT OR REPLACE INTO ai_insights_cache (id, canvas_id, score, suggestions, isolated_nodes, created_at) VALUES (?, ?, ?, ?, ?, ?)'
            )
            .bind(insightId, canvasId, score, JSON.stringify(suggestions), JSON.stringify(isolatedNodeIds), now)
            .run();
        }
      } catch {
        // Non-fatal: cache write failed, continue with computed result
      }
    }

    return NextResponse.json(
      {
        score,
        suggestions,
        isolatedNodes: isolatedNodeIds,
      },
      { status: 200 }
    );
  } catch (err) {
    safeError('[Insights GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
