/**
 * Templates API - Industry Requirement Templates
 *
 * GET  /api/v1/templates        - List templates (supports industry filter)
 * POST /api/v1/templates        - Create a custom template (201)
 * GET  /api/v1/templates/export - Export all templates as JSON file download
 * POST /api/v1/templates/import - Import template from JSON body
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Template, Industry } from '@/types/template';
import { safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { templateStore } from '@/lib/templateStore';

export const dynamic = 'force-dynamic';

// GET /api/v1/templates - List templates with optional industry filter
// GET /api/v1/templates/export - Export all templates as JSON file download
export async function GET(request: NextRequest) {
  const { success } = getAuthUserFromRequest(request);
  if (!success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pathname } = request.nextUrl;

  // Export endpoint
  if (pathname.endsWith('/export')) {
    const allTemplates = templateStore.exportAll();
    const json = JSON.stringify(allTemplates, null, 2);
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="vibex-templates-${Date.now()}.json"`,
      },
    });
  }

  try {
    const { searchParams } = request.nextUrl;
    const industry = searchParams.get('industry') as Industry | null;
    const templates = templateStore.list(industry ?? undefined);

    return NextResponse.json({
      success: true,
      data: {
        templates,
        total: templates.length,
      },
    });
  } catch (error) {
    safeError('Error listing templates:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list templates' },
      { status: 500 }
    );
  }
}

// POST /api/v1/templates - Create a custom template (201)
// POST /api/v1/templates/import - Import template from JSON body
export async function POST(request: NextRequest) {
  const { success } = getAuthUserFromRequest(request);
  if (!success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pathname } = request.nextUrl;

  // Import endpoint
  if (pathname.endsWith('/import')) {
    try {
      const body = await request.json();
      if (!body.name || !body.description) {
        return NextResponse.json(
          { success: false, error: 'name and description are required' },
          { status: 400 }
        );
      }
      const imported = templateStore.create({
        name: body.name,
        description: body.description,
        industry: body.industry,
        icon: body.icon,
        entities: body.entities,
        boundedContexts: body.boundedContexts,
        sampleRequirement: body.sampleRequirement,
        tags: body.tags,
      });
      return NextResponse.json({ success: true, data: imported }, { status: 201 });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }
  }

  // Create endpoint
  try {
    const body = await request.json();
    if (!body.name || !body.description) {
      return NextResponse.json(
        { success: false, error: 'name and description are required' },
        { status: 400 }
      );
    }
    const created = templateStore.create({
      name: body.name,
      description: body.description,
      industry: body.industry,
      icon: body.icon,
      entities: body.entities,
      boundedContexts: body.boundedContexts,
      sampleRequirement: body.sampleRequirement,
      tags: body.tags,
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
