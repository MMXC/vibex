/**
 * Templates API - Industry Requirement Templates
 *
 * GET  /api/v1/templates        - List templates (supports industry filter)
 * GET  /api/v1/templates/:id    - Get a single template
 * POST /api/v1/templates        - Create a custom template
 * PUT  /api/v1/templates/:id    - Update a custom template
 * DELETE /api/v1/templates/:id  - Delete a custom template
 * GET  /api/v1/templates/export - Export template as JSON file download
 * POST /api/v1/templates/import - Import template from JSON body
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Template, Industry } from '@/types/template';
import { safeError } from '@/lib/log-sanitizer';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

// In-memory custom template store (separate from built-in industry templates)
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

// All templates = built-in + custom
function getAllTemplates(): Template[] {
  return [...(templateCache ?? []), ...customTemplates];
}

function generateId(): string {
  return `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const dynamic = 'force-dynamic';

// GET /api/v1/templates - List templates with optional industry filter
// GET /api/v1/templates/export - Export all templates as JSON file download
// POST /api/v1/templates/import - Import template from JSON body
export async function GET(request: NextRequest) {
  const { success, user } = getAuthUserFromRequest(request);
  if (!success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pathname } = request.nextUrl;

  // Export endpoint
  if (pathname.endsWith('/export')) {
    const allTemplates = getAllTemplates();
    const json = JSON.stringify(allTemplates, null, 2);
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="vibex-templates-${Date.now()}.json"`,
      },
    });
  }

  try {
    const builtIn = await loadTemplates();
    const { searchParams } = request.nextUrl;
    const industry = searchParams.get('industry') as Industry | null;

    // Merge built-in + custom
    const allTemplates: Template[] = [...builtIn, ...customTemplates];
    const filtered = industry
      ? allTemplates.filter(t => t.industry === industry)
      : allTemplates;

    return NextResponse.json({
      success: true,
      data: {
        templates: filtered,
        total: filtered.length,
      },
    });
  } catch (error) {
    safeError('Error listing templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list templates',
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/templates - Create a custom template
// POST /api/v1/templates/import - Import template from JSON body
export async function POST(request: NextRequest) {
  const { success, user } = getAuthUserFromRequest(request);
  if (!success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pathname } = request.nextUrl;

  // Import endpoint
  if (pathname.endsWith('/import')) {
    try {
      const body = await request.json();
      // Validate required fields
      if (!body.name || !body.description) {
        return NextResponse.json(
          { success: false, error: 'name and description are required' },
          { status: 400 }
        );
      }
      const imported: Template = {
        id: generateId(),
        name: body.name,
        description: body.description,
        industry: body.industry ?? 'saas',
        icon: body.icon ?? '📄',
        entities: body.entities ?? [],
        boundedContexts: body.boundedContexts ?? [],
        sampleRequirement: body.sampleRequirement ?? '',
        tags: body.tags ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      customTemplates.push(imported);
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
    const created: Template = {
      id: generateId(),
      name: body.name,
      description: body.description,
      industry: body.industry ?? 'saas',
      icon: body.icon ?? '📄',
      entities: body.entities ?? [],
      boundedContexts: body.boundedContexts ?? [],
      sampleRequirement: body.sampleRequirement ?? '',
      tags: body.tags ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    customTemplates.push(created);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
