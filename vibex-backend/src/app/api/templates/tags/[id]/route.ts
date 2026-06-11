/**
 * /api/templates/tags/[id] — Individual Tag Management API
 *
 * S88-E3: 模板市场增强
 *
 * PATCH /api/templates/tags/:id  — Update tag (name, color, category)
 * DELETE /api/templates/tags/:id — Delete a tag
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { executeDB, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
  env: Env;
}

// PATCH — update tag properties
export async function PATCH(
  request: NextRequest,
  { params, env }: RouteContext
) {
  const { success, user } = getAuthUserFromRequest(request);
  if (!success || !user?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!env.DB) {
      return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 });
    }

    const body = await request.json() as { name?: string; color?: string; category?: string };
    const { id } = params;

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ success: false, error: 'Tag name required' }, { status: 400 });
      if (name.length > 50) return NextResponse.json({ success: false, error: 'Tag name too long' }, { status: 400 });
      updates.push('name = ?');
      values.push(name);
    }
    if (body.color !== undefined) {
      updates.push('color = ?');
      values.push(body.color);
    }
    if (body.category !== undefined) {
      updates.push('category = ?');
      values.push(body.category);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    await executeDB(
      env,
      `UPDATE template_tags SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    safeError('[PATCH /api/templates/tags/:id]', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// DELETE — remove a tag
export async function DELETE(
  request: NextRequest,
  { params, env }: RouteContext
) {
  const { success, user } = getAuthUserFromRequest(request);
  if (!success || !user?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!env.DB) {
      return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 });
    }

    const { id } = params;
    await executeDB(env, `DELETE FROM template_tags WHERE id = ?`, id);

    return NextResponse.json({ success: true });
  } catch (err) {
    safeError('[DELETE /api/templates/tags/:id]', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
