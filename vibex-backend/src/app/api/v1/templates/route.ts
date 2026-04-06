/**
 * Templates API - Industry Requirement Templates
 *
 * GET /api/v1/templates         - List templates (supports industry filter)
 * GET /api/v1/templates/:id     - Get a single template
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Template, Industry } from '@/types/template';

// In-memory template cache loaded from JSON files
let templateCache: Template[] | null = null;

async function loadTemplates(): Promise<Template[]> {
  if (templateCache) return templateCache;

  const templates: Template[] = [];
  const templateFiles = [
    'ecommerce-template.json',
    'social-template.json',
    'saas-template.json',
  ];

  for (const file of templateFiles) {
    try {
      const mod = await import(`@/data/templates/${file}`);
      templates.push(mod.default as Template);
    } catch (err) {
      console.error(`Failed to load template ${file}:`, err);
    }
  }

  templateCache = templates;
  return templates;
}

export const dynamic = 'force-dynamic';

// GET /api/v1/templates - List templates with optional industry filter
export async function GET(request: NextRequest) {
  try {
    const templates = await loadTemplates();
    const { searchParams } = request.nextUrl;
    const industry = searchParams.get('industry') as Industry | null;

    const filtered = industry
      ? templates.filter(t => t.industry === industry)
      : templates;

    return NextResponse.json({
      success: true,
      data: {
        templates: filtered,
        total: filtered.length,
      },
    });
  } catch (error) {
    console.error('Error listing templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list templates',
      },
      { status: 500 }
    );
  }
}
