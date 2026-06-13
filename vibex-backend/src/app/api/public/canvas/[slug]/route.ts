/**
 * /api/public/canvas/:slug — Public Canvas Access API
 *
 * S95-E2: Public Canvas Portal
 *
 * GET — Get public canvas data by slug (no auth required)
 * Response 200: { canvas: { id, name, nodes, edges, owner }, is_public: true }
 * Response 404: { error: 'not found or not public' }
 *
 * Auth: not required (public endpoint)
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryDB, Env } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';

export const runtime = 'edge';

interface PublicCanvasRow {
  canvas_id: string;
  public_slug: string;
  is_public: number;
  canvas_name: string;
  canvas_owner_id: string;
  owner_name: string | null;
  owner_email: string | null;
}

interface CanvasDataRow {
  id: string;
  name: string;
  nodes: string;
  edges: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }>; env: Env }
) {
  try {
    const { slug } = await context.params;
    const env = context.env;

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    // Look up the canvas by public_slug
    const row = await queryOne<PublicCanvasRow>(
      env,
      `SELECT cp.canvas_id, cp.public_slug, cp.is_public,
              c.name AS canvas_name, c.owner_id AS canvas_owner_id,
              u.display_name AS owner_name, u.email AS owner_email
       FROM canvas_permissions cp
       JOIN canvas c ON c.id = cp.canvas_id
       LEFT JOIN users u ON u.id = c.owner_id
       WHERE cp.public_slug = ? AND cp.is_public = 1`,
      [slug]
    );

    if (!row) {
      return NextResponse.json({ error: 'not found or not public' }, { status: 404 });
    }

    // Fetch full canvas data
    const canvas = await queryOne<CanvasDataRow>(
      env,
      'SELECT id, name, nodes, edges, owner_id, created_at, updated_at FROM canvas WHERE id = ?',
      [row.canvas_id]
    );

    if (!canvas) {
      return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    let nodes: unknown[] = [];
    let edges: unknown[] = [];

    try {
      nodes = canvas.nodes ? JSON.parse(canvas.nodes) : [];
    } catch {
      nodes = [];
    }

    try {
      edges = canvas.edges ? JSON.parse(canvas.edges) : [];
    } catch {
      edges = [];
    }

    return NextResponse.json({
      canvas: {
        id: canvas.id,
        name: canvas.name,
        nodes,
        edges,
        owner: {
          userId: canvas.owner_id,
          name: row.owner_name,
          email: row.owner_email,
        },
        createdAt: canvas.created_at,
        updatedAt: canvas.updated_at,
      },
      is_public: true,
    }, { status: 200 });
  } catch (err) {
    safeError('[PublicCanvas GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
