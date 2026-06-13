/**
 * /api/canvas/:id/visibility — Canvas Public Visibility API
 *
 * S95-E2: Public Canvas Portal
 *
 * PATCH — Set canvas public visibility + public_slug
 * Body: { is_public: boolean, slug?: string }
 * Response 200: { slug: string, public_url: string }
 *
 * Auth: required (must be canvas owner)
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryDB, executeDB, generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

export const runtime = 'edge';

interface CanvasRow {
  id: string;
  owner_id: string;
  name: string;
}

interface PermissionRow {
  id: string;
  canvas_id: string;
  user_id: string;
  is_public: number | null;
  public_slug: string | null;
}

// Validate slug: lowercase alphanumeric + hyphens, 3-64 chars
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(slug);
}

// Generate a URL-safe slug from a canvas name
function generateSlugFromName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 64);
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${suffix}`.substring(0, 64);
}

// Check if slug is already taken by another canvas
async function isSlugTaken(env: Env, slug: string, canvasId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    env,
    'SELECT id FROM canvas_permissions WHERE public_slug = ? AND canvas_id != ?',
    [slug, canvasId]
  );
  return row !== null;
}

// PATCH /api/canvas/:id/visibility — Set public visibility
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { id: canvasId } = await context.params;
    const env = context.env;

    if (!canvasId) {
      return NextResponse.json({ error: 'Missing canvas ID' }, { status: 400 });
    }

    // Auth: must be authenticated
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    let body: { is_public?: boolean; slug?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const isPublic = body.is_public ?? false;

    // Verify the requester is the canvas owner
    const canvas = await queryOne<CanvasRow>(
      env,
      'SELECT id, owner_id, name FROM canvas WHERE id = ?',
      [canvasId]
    );
    if (!canvas) {
      return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }
    if (canvas.owner_id !== user.userId) {
      return NextResponse.json({ error: 'Forbidden: only the canvas owner can change visibility' }, { status: 403 });
    }

    // Find or create the canvas_permissions row
    let perm = await queryOne<PermissionRow>(
      env,
      'SELECT * FROM canvas_permissions WHERE canvas_id = ?',
      [canvasId]
    );

    if (!perm) {
      // Create a new permission row for this canvas
      const newId = generateId();
      await executeDB(
        env,
        `INSERT INTO canvas_permissions (id, canvas_id, is_public, public_slug)
         VALUES (?, ?, ?, ?)`,
        [newId, canvasId, isPublic ? 1 : 0, null]
      );
      perm = { id: newId, canvas_id: canvasId, user_id: canvas.owner_id, is_public: isPublic ? 1 : 0, public_slug: null };
    }

    let slug: string;

    if (isPublic) {
      // Determine the slug
      if (body.slug) {
        // Validate provided slug
        if (!isValidSlug(body.slug)) {
          return NextResponse.json(
            { error: 'slug must be 3-64 chars, lowercase alphanumeric with hyphens, starting and ending with alphanumeric' },
            { status: 400 }
          );
        }
        // Check for uniqueness
        if (await isSlugTaken(env, body.slug, canvasId)) {
          return NextResponse.json({ error: 'This slug is already taken by another canvas' }, { status: 409 });
        }
        slug = body.slug;
      } else {
        // Auto-generate from canvas name
        slug = generateSlugFromName(canvas.name);
        // Ensure uniqueness
        let attempts = 0;
        while (await isSlugTaken(env, slug, canvasId) && attempts < 5) {
          slug = generateSlugFromName(canvas.name);
          attempts++;
        }
      }

      await executeDB(
        env,
        'UPDATE canvas_permissions SET is_public = 1, public_slug = ? WHERE canvas_id = ?',
        [slug, canvasId]
      );
    } else {
      // Make private
      slug = perm.public_slug ?? '';
      await executeDB(
        env,
        'UPDATE canvas_permissions SET is_public = 0, public_slug = NULL WHERE canvas_id = ?',
        [canvasId]
      );
    }

    const publicUrl = isPublic ? `/public/${slug}` : null;

    return NextResponse.json(
      { slug, public_url: publicUrl },
      { status: 200 }
    );
  } catch (err) {
    safeError('[Visibility PATCH] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/canvas/:id/visibility — Get current visibility settings
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { id: canvasId } = await context.params;
    const env = context.env;

    if (!canvasId) {
      return NextResponse.json({ error: 'Missing canvas ID' }, { status: 400 });
    }

    const perm = await queryOne<PermissionRow>(
      env,
      'SELECT is_public, public_slug FROM canvas_permissions WHERE canvas_id = ?',
      [canvasId]
    );

    const isPublic = perm?.is_public === 1;
    const slug = perm?.public_slug ?? null;

    return NextResponse.json(
      { is_public: isPublic, slug, public_url: isPublic ? `/public/${slug}` : null },
      { status: 200 }
    );
  } catch (err) {
    safeError('[Visibility GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
