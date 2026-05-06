/**
 * Template Detail API
 *
 * GET    /api/v1/templates/:id - Get a single template by ID
 * PUT    /api/v1/templates/:id - Update a custom template by ID
 * DELETE /api/v1/templates/:id - Delete a custom template by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Template } from '@/types/template';

import { safeError } from '@/lib/log-sanitizer';

export const dynamic = 'force-dynamic';

// In-memory built-in template cache loaded from JSON files
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
      safeError(`Failed to load template ${file}:`, err);
    }
  }

  templateCache = templates;
  return templates;
}

// In-memory custom template store (same reference as route.ts)
// NOTE: We do NOT re-declare here — custom templates are managed in the parent route.ts.
// PUT/DELETE only targets custom templates (built-in are read-only).
// For true shared state across route files in Next.js App Router, we'd need a separate store module.
// Here we re-create the same data so PUT/DELETE work for the mock custom templates in this process.

const customTemplates: Template[] = [
  {
    id: 'tmpl-001',
    name: 'SaaS 产品开发模板',
    description: '适用于新功能开发项目，包含用户管理、支付、通知等模块',
    industry: 'saas',
    icon: '☁️',
    entities: [],
    boundedContexts: [],
    sampleRequirement: '请描述您的产品需求...',
    tags: ['feature', 'saas', 'new'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-002',
    name: '重构项目模板',
    description: '适用于代码重构场景，结构化记录重构目标和技术债务',
    industry: 'saas',
    icon: '🔧',
    entities: [],
    boundedContexts: [],
    sampleRequirement: '描述需要重构的模块和原因...',
    tags: ['refactor', 'technical'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-003',
    name: 'Bug 修复模板',
    description: '用于记录和跟踪 bug 修复过程',
    industry: 'saas',
    icon: '🐛',
    entities: [],
    boundedContexts: [],
    sampleRequirement: '描述 bug 的表现和复现步骤...',
    tags: ['bugfix', 'hotfix'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Store reference for external access (module-level singleton pattern)
export const customTemplateStore = customTemplates;

function findTemplate(id: string): { source: 'built-in' | 'custom'; template: Template; idx: number } | null {
  // Check custom first
  const idx = customTemplates.findIndex(t => t.id === id);
  if (idx !== -1) return { source: 'custom', template: customTemplates[idx], idx };
  // Check built-in
  const builtIn = templateCache ?? [];
  const bi = builtIn.find(t => t.id === id);
  if (bi) return { source: 'built-in', template: bi, idx: -1 };
  return null;
}

// GET /api/v1/templates/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Ensure cache is loaded
    await loadTemplates();
    const found = findTemplate(id);

    if (!found) {
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
      data: found.template,
    });
  } catch (error) {
    safeError('Error getting template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get template',
      },
      { status: 500 }
    );
  }
}

// PUT /api/v1/templates/:id - Update a custom template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const found = findTemplate(id);

    if (!found) {
      return NextResponse.json(
        { success: false, error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (found.source === 'built-in') {
      return NextResponse.json(
        { success: false, error: 'Built-in templates cannot be modified', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updated: Template = {
      ...found.template,
      name: body.name ?? found.template.name,
      description: body.description ?? found.template.description,
      industry: body.industry ?? found.template.industry,
      icon: body.icon ?? found.template.icon,
      entities: body.entities ?? found.template.entities,
      boundedContexts: body.boundedContexts ?? found.template.boundedContexts,
      sampleRequirement: body.sampleRequirement ?? found.template.sampleRequirement,
      tags: body.tags ?? found.template.tags,
      updatedAt: new Date().toISOString(),
    };

    customTemplates[found.idx] = updated;

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    safeError('Error updating template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update template',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/templates/:id - Delete a custom template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const found = findTemplate(id);

    if (!found) {
      return NextResponse.json(
        { success: false, error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (found.source === 'built-in') {
      return NextResponse.json(
        { success: false, error: 'Built-in templates cannot be deleted', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    customTemplates.splice(found.idx, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    safeError('Error deleting template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete template',
      },
      { status: 500 }
    );
  }
}
