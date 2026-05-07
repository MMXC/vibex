/**
 * Template Detail API
 *
 * GET    /api/v1/templates/:id  - Get a single template by ID (200)
 * PUT    /api/v1/templates/:id  - Update a custom template by ID (200)
 * DELETE /api/v1/templates/:id  - Delete a custom template by ID (200, subsequent GET → 404)
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Template } from '@/types/template';
import { safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { templateStore } from '@/lib/templateStore';

// Seed built-in IDs — these cannot be modified or deleted
const BUILT_IN_IDS = new Set(['tmpl-001', 'tmpl-002', 'tmpl-003']);

export const dynamic = 'force-dynamic';

// GET /api/v1/templates/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = templateStore.get(id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    safeError('Error getting template:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get template' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/templates/:id — Update a custom template (200)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = templateStore.get(id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (BUILT_IN_IDS.has(id)) {
      return NextResponse.json(
        { success: false, error: 'Built-in templates cannot be modified', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updated = templateStore.update(id, {
      name: body.name,
      description: body.description,
      industry: body.industry,
      icon: body.icon,
      entities: body.entities,
      boundedContexts: body.boundedContexts,
      sampleRequirement: body.sampleRequirement,
      tags: body.tags,
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    safeError('Error updating template:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/templates/:id — Hard delete (200, subsequent GET → 404)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = templateStore.get(id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (BUILT_IN_IDS.has(id)) {
      return NextResponse.json(
        { success: false, error: 'Built-in templates cannot be deleted', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    templateStore.delete(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    safeError('Error deleting template:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete template' },
      { status: 500 }
    );
  }
}
