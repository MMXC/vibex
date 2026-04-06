/**
 * Template Detail API
 *
 * GET /api/v1/templates/:id - Get a single template by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Template } from '@/types/template';

export const dynamic = 'force-dynamic';

// In-memory template cache
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

// GET /api/v1/templates/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templates = await loadTemplates();
    const template = templates.find(t => t.id === id);

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error getting template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get template',
      },
      { status: 500 }
    );
  }
}
