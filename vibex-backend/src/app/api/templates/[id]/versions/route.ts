/**
 * /api/templates/[id]/versions — Template Version Management API
 *
 * S93-E2: Template Versioning & Fork
 *
 * POST  /api/templates/[id]/versions      — Create a new version snapshot
 *   Body: { description?: string }
 *   Response: { ok: boolean; version?: VersionRow; error?: string }
 *
 * PATCH /api/templates/[id]/versions/[versionId] — Update version (e.g. pin)
 *   Body: { pinned?: boolean }
 *   Response: { ok: boolean; version?: { id: string; pinned: boolean }; error?: string }
 *
 * GET   /api/templates/[id]/versions      — List all versions for a template
 *   Response: { ok: boolean; versions?: VersionRow[]; error?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { executeDB, queryDB, queryOne, generateId, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface VersionRow {
  id: string;
  template_id: string;
  version_number: number;
  description: string | null;
  snapshot_json: string | null;
  pinned: number;
  created_by: string;
  created_at: number;
}

interface TemplateRow {
  id: string;
  author_id: string;
  name: string;
  description: string;
  tags: string;
  thumbnail: string | null;
  canvas_id: string | null;
  content_json: string | null;
  usage_count: number;
  avg_rating: number;
  rating_count: number;
  created_at: string;
  published_at: string;
}

/** POST — create a new template version */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { env } = context;
    const { id: templateId } = await context.params;

    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the template
    const template = await queryOne<TemplateRow>(
      env,
      `SELECT id, author_id, name, description, tags, thumbnail, canvas_id,
              content_json, usage_count, avg_rating, rating_count, created_at, published_at
       FROM templates WHERE id = ?`,
      [templateId]
    );

    if (!template) {
      return NextResponse.json({ ok: false, error: 'Template not found' }, { status: 404 });
    }

    // Only the author can create versions
    if (template.author_id !== user.userId) {
      return NextResponse.json({ ok: false, error: 'Forbidden: only the author can create versions' }, { status: 403 });
    }

    let body: { description?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { description } = body;

    // Get the next version number
    const latest = await queryOne<{ max_version: number | null }>(
      env,
      'SELECT MAX(version_number) as max_version FROM template_versions WHERE template_id = ?',
      [templateId]
    );
    const nextVersion = (latest?.max_version ?? 0) + 1;

    const versionId = generateId();
    const createdAt = Math.floor(Date.now() / 1000);

    // Snapshot current content_json as the version snapshot
    const snapshotJson = template.content_json ?? '{}';

    await executeDB(
      env,
      `INSERT INTO template_versions (id, template_id, version_number, description, snapshot_json, pinned, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      [versionId, templateId, nextVersion, description ?? null, snapshotJson, user.userId, createdAt]
    );

    const version = await queryOne<VersionRow>(
      env,
      'SELECT * FROM template_versions WHERE id = ?',
      [versionId]
    );

    return NextResponse.json({ ok: true, version }, { status: 201 });
  } catch (err) {
    safeError('[TemplateVersions POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

/** GET — list all versions for a template */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { env } = context;
    const { id: templateId } = await context.params;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    // Verify template exists
    const template = await queryOne<{ id: string }>(
      env,
      'SELECT id FROM templates WHERE id = ?',
      [templateId]
    );
    if (!template) {
      return NextResponse.json({ ok: false, error: 'Template not found' }, { status: 404 });
    }

    const versions = await queryDB<VersionRow>(
      env,
      `SELECT * FROM template_versions
       WHERE template_id = ?
       ORDER BY version_number DESC
       LIMIT ?`,
      [templateId, limit]
    );

    return NextResponse.json({ ok: true, versions });
  } catch (err) {
    safeError('[TemplateVersions GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

/** PATCH — update a version (e.g. mark as pinned) */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; versionId: string }>; env: Env }
) {
  try {
    const { env } = context;
    const params = await context.params;
    const templateId = params.id;
    const versionId = params.versionId;

    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the template
    const template = await queryOne<{ id: string; author_id: string }>(
      env,
      'SELECT id, author_id FROM templates WHERE id = ?',
      [templateId]
    );
    if (!template) {
      return NextResponse.json({ ok: false, error: 'Template not found' }, { status: 404 });
    }

    // Only the author can pin versions
    if (template.author_id !== user.userId) {
      return NextResponse.json({ ok: false, error: 'Forbidden: only the author can update versions' }, { status: 403 });
    }

    // Verify version exists
    const version = await queryOne<VersionRow>(
      env,
      'SELECT id FROM template_versions WHERE id = ? AND template_id = ?',
      [versionId, templateId]
    );
    if (!version) {
      return NextResponse.json({ ok: false, error: 'Version not found' }, { status: 404 });
    }

    let body: { pinned?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { pinned } = body;

    if (typeof pinned !== 'boolean') {
      return NextResponse.json({ ok: false, error: 'pinned must be a boolean' }, { status: 400 });
    }

    // If pinning, unpin all other versions for this template first
    if (pinned) {
      await executeDB(
        env,
        'UPDATE template_versions SET pinned = 0 WHERE template_id = ?',
        [templateId]
      );
    }

    await executeDB(
      env,
      'UPDATE template_versions SET pinned = ? WHERE id = ?',
      [pinned ? 1 : 0, versionId]
    );

    return NextResponse.json({
      ok: true,
      version: { id: versionId, pinned: pinned ? 1 : 0 },
    });
  } catch (err) {
    safeError('[TemplateVersions PATCH] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
