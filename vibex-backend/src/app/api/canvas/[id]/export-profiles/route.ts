/**
 * /api/canvas/[id]/export-profiles — Canvas Export Profiles API
 * Sprint95 E4: Export Profile Templates
 *
 * GET — List export profiles for a canvas
 * POST — Create a new export profile
 * DELETE — Delete an export profile (query param: ?profileId=)
 *
 * GET /api/canvas/[id]/export-profiles
 *   Auth: required
 *   Returns: { ok: true, profiles: ExportProfile[] }
 *
 * POST /api/canvas/[id]/export-profiles
 *   Auth: required
 *   Body: { name, format, scale, includeNodes, includeEdges }
 *   Returns: { ok: true, profile: ExportProfile } — 201
 *
 * DELETE /api/canvas/[id]/export-profiles?profileId={profileId}
 *   Auth: required
 *   Returns: 204 No Content on success
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { queryDB, executeDB, generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';

export const runtime = 'edge';

// ---------------------------------------------------------------------------
// Types — flat (matches frontend store schema)
// ---------------------------------------------------------------------------

export type ExportProfileFormat = 'react' | 'svg' | 'md' | 'json';

export interface ExportProfile {
  id: string;
  canvasId: string;
  name: string;
  format: ExportProfileFormat;
  scale: number;
  includeNodes: boolean;
  includeEdges: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExportProfileRow {
  id: string;
  canvas_id: string;
  user_id: string;
  name: string;
  format: string;
  scale: number;
  include_nodes: number;
  include_edges: number;
  created_at: number;
  updated_at: number;
}

interface ProfileRow {
  id: string;
  canvas_id: string;
  user_id: string;
}

// ---------------------------------------------------------------------------
// GET /api/canvas/[id]/export-profiles — List profiles
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: canvasId } = await params;

    const rows = await queryDB<ExportProfileRow>(
      env,
      `SELECT id, canvas_id, user_id, name, format, scale, include_nodes, include_edges, created_at, updated_at
       FROM canvas_export_profiles
       WHERE canvas_id = ? AND user_id = ?
       ORDER BY created_at DESC`,
      [canvasId, user.userId]
    );

    const profiles: ExportProfile[] = rows.map((row) => ({
      id: row.id,
      canvasId: row.canvas_id,
      name: row.name,
      format: (row.format as ExportProfileFormat) ?? 'react',
      scale: row.scale ?? 100,
      includeNodes: Boolean(row.include_nodes),
      includeEdges: Boolean(row.include_edges),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    }));

    return NextResponse.json({ ok: true, profiles });
  } catch (err) {
    safeError('[ExportProfiles GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/canvas/[id]/export-profiles — Create profile
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: canvasId } = await params;

    let body: {
      name?: string;
      format?: string;
      scale?: number;
      includeNodes?: boolean;
      includeEdges?: boolean;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'name is required and must be a non-empty string' }, { status: 400 });
    }
    if (body.name.trim().length > 100) {
      return NextResponse.json({ ok: false, error: 'name must be at most 100 characters' }, { status: 400 });
    }

    const format = (body.format as ExportProfileFormat) ?? 'react';
    const scale = body.scale ?? 100;
    const includeNodes = body.includeNodes ?? true;
    const includeEdges = body.includeEdges ?? true;

    const profileId = generateId();
    const now = Date.now();

    await executeDB(
      env,
      `INSERT INTO canvas_export_profiles (id, canvas_id, user_id, name, format, scale, include_nodes, include_edges, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [profileId, canvasId, user.userId, body.name.trim(), format, scale, includeNodes ? 1 : 0, includeEdges ? 1 : 0, now, now]
    );

    const profile: ExportProfile = {
      id: profileId,
      canvasId,
      name: body.name.trim(),
      format,
      scale,
      includeNodes,
      includeEdges,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    };

    return NextResponse.json({ ok: true, profile }, { status: 201 });
  } catch (err) {
    safeError('[ExportProfiles POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/canvas/[id]/export-profiles?profileId= — Delete profile
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params, env }: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: canvasId } = await params;
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json({ ok: false, error: 'profileId query param required' }, { status: 400 });
    }

    const rows = await queryDB<ProfileRow>(
      env,
      `SELECT id, canvas_id, user_id FROM canvas_export_profiles WHERE id = ? AND canvas_id = ?`,
      [profileId, canvasId]
    );

    if (rows.length === 0 || rows[0].user_id !== user.userId) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    await executeDB(
      env,
      `DELETE FROM canvas_export_profiles WHERE id = ? AND canvas_id = ? AND user_id = ?`,
      [profileId, canvasId, user.userId]
    );

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    safeError('[ExportProfiles DELETE] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
