/**
 * lib/templateStore.ts — E04 共享内存模板存储
 *
 * 解决 Next.js App Router 中 route.ts 和 [id]/route.ts 各自有独立 module scope 的问题。
 * 所有模板 CRUD 操作必须通过此模块进行，确保状态一致。
 *
 * 存储：module-level Map（进程内内存存储）
 * 约束（AGENTS.md）：硬删除，DELETE 后 GET 返回 404
 */

import type { Template } from '@/types/template';

// Seed data — 初始内置模板
const SEED_TEMPLATES: Template[] = [
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

// Singleton store
class TemplateStore {
  private templates: Map<string, Template> = new Map();
  private initialized = false;

  constructor() {
    // Initialize with seed data
    for (const t of SEED_TEMPLATES) {
      this.templates.set(t.id, t);
    }
    this.initialized = true;
  }

  private generateId(): string {
    return `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  /** GET /api/v1/templates — list all */
  list(industry?: string): Template[] {
    const all = Array.from(this.templates.values());
    if (!industry) return all;
    return all.filter(t => t.industry === industry);
  }

  /** GET /api/v1/templates/:id — get single */
  get(id: string): Template | null {
    return this.templates.get(id) ?? null;
  }

  /** POST /api/v1/templates — create (returns 201) */
  create(data: {
    name: string;
    description: string;
    industry?: string;
    icon?: string;
    entities?: unknown[];
    boundedContexts?: unknown[];
    sampleRequirement?: string;
    tags?: string[];
  }): Template {
    const template: Template = {
      id: this.generateId(),
      name: data.name,
      description: data.description,
      industry: (data.industry ?? 'saas') as Template['industry'],
      icon: data.icon ?? '📄',
      entities: (data.entities as Template['entities']) ?? [],
      boundedContexts: (data.boundedContexts as Template['boundedContexts']) ?? [],
      sampleRequirement: data.sampleRequirement ?? '',
      tags: data.tags ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.templates.set(template.id, template);
    return template;
  }

  /** PUT /api/v1/templates/:id — update (returns 200) */
  update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      industry: string;
      icon: string;
      entities: unknown[];
      boundedContexts: unknown[];
      sampleRequirement: string;
      tags: string[];
    }>
  ): Template | null {
    const existing = this.templates.get(id);
    if (!existing) return null;
    const updated: Template = {
      ...existing,
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      industry: (data.industry ?? existing.industry) as Template['industry'],
      icon: data.icon ?? existing.icon,
      entities: (data.entities as Template['entities']) ?? existing.entities,
      boundedContexts: (data.boundedContexts as Template['boundedContexts']) ?? existing.boundedContexts,
      sampleRequirement: data.sampleRequirement ?? existing.sampleRequirement,
      tags: data.tags ?? existing.tags,
      updatedAt: new Date().toISOString(),
    };
    this.templates.set(id, updated);
    return updated;
  }

  /** DELETE /api/v1/templates/:id — hard delete (returns 200, subsequent GET → 404) */
  delete(id: string): boolean {
    return this.templates.delete(id);
  }

  /** 导出所有模板 JSON */
  exportAll(): Template[] {
    return Array.from(this.templates.values());
  }
}

// Module-level singleton — shared across all route files in the same Node.js process
export const templateStore = new TemplateStore();
