/**
 * /api/canvas/public — Public Canvas Discovery API
 *
 * S95-E2: Public Canvas Portal
 *
 * GET — List public canvases (paginated, optional sort)
 * Query params:
 *   page — page number (default: 1)
 *   limit — items per page (default: 20, max: 100)
 *   sort — "newest" | "popular" (default: "newest")
 * Response 200: { canvases: [...], total, page, limit }
 *
 * Auth: not required
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryDB, Env } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';

export const runtime = 'edge';

interface PublicCanvasRow {
  canvas_id: string;
  public_slug: string;
  canvas_name: string;
  canvas_updated_at: string;
  canvas_created_at: string;
  owner_name: string | null;
  owner_email: string | null;
  node_count: number;
  edge_count: number;
}

interface CountRow {
  total: number;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; env: Env }
) {
  try {
    const env = context.env;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const sort = searchParams.get('sort') === 'popular' ? 'popular' : 'newest';
    const offset = (page - 1) * limit;

    // Get total count
    const countRow = await queryOne<CountRow>(
      env,
      `SELECT COUNT(*) AS total FROM canvas_permissions cp
       WHERE cp.is_public = 1 AND cp.public_slug IS NOT NULL`,
      []
    );
    const total = countRow?.total ?? 0;

    // Build order clause
    const orderBy = sort === 'popular' ? 'c.updated_at DESC' : 'c.created_at DESC';

    // Query public canvases with owner + node/edge count
    const canvases = await queryDB<PublicCanvasRow & { node_count: number; edge_count: number }>(
      env,
      `SELECT cp.canvas_id, cp.public_slug,
              c.name AS canvas_name, c.updated_at AS canvas_updated_at,
              c.created_at AS canvas_created_at, c.nodes, c.edges,
              u.display_name AS owner_name, u.email AS owner_email
       FROM canvas_permissions cp
       JOIN canvas c ON c.id = cp.canvas_id
       LEFT JOIN users u ON u.id = c.owner_id
       WHERE cp.is_public = 1 AND cp.public_slug IS NOT NULL
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const result = canvases.map((row) => {
      let nodeCount = 0;
      let edgeCount = 0;
      try {
        if (row.nodes) {
          const nodes = JSON.parse(row.nodes as unknown as string);
          nodeCount = Array.isArray(nodes) ? nodes.length : 0;
        }
      } catch { nodeCount = 0; }
      try {
        if (row.edges) {
          const edges = JSON.parse(row.edges as unknown as string);
          edgeCount = Array.isArray(edges) ? edges.length : 0;
        }
      } catch { edgeCount = 0; }

      return {
        canvasId: row.canvas_id,
        slug: row.public_slug,
        name: row.canvas_name,
        owner: {
          name: row.owner_name,
          email: row.owner_email,
        },
        publicUrl: `/public/${row.public_slug}`,
        nodeCount,
        edgeCount,
        createdAt: row.canvas_created_at,
        updatedAt: row.canvas_updated_at,
      };
    });

    return NextResponse.json({ canvases: result, total, page, limit }, { status: 200 });
  } catch (err) {
    safeError('[PublicCanvasList GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
