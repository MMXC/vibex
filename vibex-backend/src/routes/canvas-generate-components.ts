/**
 * Canvas Generate Components API - Hono Route
 *
 * POST /api/canvas/generate-components
 * 生成组件树 (Epic 1: S1.3)
 *
 * 输入: { contexts: BoundedContext[], flows: BusinessFlow[], sessionId: string }
 * 输出: { success: boolean, components: Component[], confidence: number }
 *
 * Note: This is the Hono/Cloudflare Workers version. The Next.js API route
 * at src/app/api/canvas/generate-components/route.ts is not deployed to
 * Cloudflare Workers, so we provide this Hono equivalent.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, generateId } from '@/lib/db';

const canvasGenerateComponents = new Hono<{ Bindings: Env }>();

// Enable CORS
canvasGenerateComponents.use('/*', cors());

// ==================== Types ====================

interface FlowStep {
  name: string;
  actor: string;
  description?: string;
  order?: number;
}

interface BusinessFlowInput {
  id?: string;
  name: string;
  contextId: string;
  steps?: FlowStep[];
}

interface BoundedContext {
  id: string;
  name: string;
  description: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
}

interface ComponentApi {
  method: 'GET' | 'POST';
  path: string;
  params: string[];
}

interface ComponentResponse {
  id: string;
  name: string;
  flowId: string;
  contextId: string;
  type: 'page' | 'form' | 'list' | 'detail' | 'modal';
  description?: string;
  apis: ComponentApi[];
  confidence: number;
}

interface GenerateComponentsOutput {
  success: boolean;
  components: ComponentResponse[];
  generationId: string;
  totalCount: number;
  confidence: number;
  error?: string;
}

interface GenerateComponentsInput {
  contexts: BoundedContext[];
  flows: BusinessFlowInput[];
  sessionId?: string;
}

// ==================== Mock Data Generator ====================

function generateMockComponents(contexts: BoundedContext[], flows: BusinessFlowInput[]): ComponentResponse[] {
  const components: ComponentResponse[] = [];
  const validTypes = ['page', 'form', 'list', 'detail', 'modal'] as const;

  // Generate components based on flows
  for (const flow of flows) {
    if (!flow.name) continue;

    // Each flow gets at least a page component
    components.push({
      id: generateId(),
      name: `${flow.name}页面`,
      flowId: flow.id || flow.contextId,
      contextId: flow.contextId,
      type: 'page',
      description: `${flow.name}的主页面`,
      apis: [
        { method: 'GET', path: `/api/${flow.name.toLowerCase().replace(/\s+/g, '-')}`, params: [] },
      ],
      confidence: 0.8,
    });

    // Each flow gets a form component
    components.push({
      id: generateId(),
      name: `${flow.name}表单`,
      flowId: flow.id || flow.contextId,
      contextId: flow.contextId,
      type: 'form',
      description: `${flow.name}的数据录入表单`,
      apis: [
        { method: 'POST', path: `/api/${flow.name.toLowerCase().replace(/\s+/g, '-')}`, params: ['data'] },
      ],
      confidence: 0.75,
    });

    // Steps generate list/detail components
    const steps = flow.steps || [];
    for (const step of steps.slice(0, 3)) {
      components.push({
        id: generateId(),
        name: `${step.name}列表`,
        flowId: flow.id || flow.contextId,
        contextId: flow.contextId,
        type: 'list',
        description: `${step.name}的数据列表`,
        apis: [
          { method: 'GET', path: `/api/${step.name.toLowerCase().replace(/\s+/g, '-')}`, params: [] },
        ],
        confidence: 0.7,
      });
    }
  }

  // Generate components for contexts without flows
  for (const ctx of contexts) {
    if (components.filter(c => c.contextId === ctx.id).length === 0) {
      components.push({
        id: generateId(),
        name: `${ctx.name}概览`,
        flowId: ctx.id,
        contextId: ctx.id,
        type: 'page',
        description: `${ctx.name}的概览页面`,
        apis: [
          { method: 'GET', path: `/api/contexts/${ctx.id.toLowerCase()}`, params: [] },
        ],
        confidence: 0.7,
      });
    }
  }

  return components.slice(0, 20); // Cap at 20
}

// ==================== Route Handler ====================

canvasGenerateComponents.post('/', async (c) => {
  try {
    const body = await c.req.json<GenerateComponentsInput>().catch(() => null);

    if (!body) {
      return c.json<GenerateComponentsOutput>({
        success: false,
        components: [],
        generationId: '',
        totalCount: 0,
        confidence: 0,
        error: '无效的请求体',
      }, 400);
    }

    const { contexts = [], flows = [] } = body;

    if (!Array.isArray(contexts) || !Array.isArray(flows)) {
      return c.json<GenerateComponentsOutput>({
        success: false,
        components: [],
        generationId: '',
        totalCount: 0,
        confidence: 0,
        error: 'contexts 和 flows 不能为空',
      }, 400);
    }

    // Generate mock components (no AI call in mock mode)
    const generationId = generateId();
    const components = generateMockComponents(contexts, flows);

    console.log(`[canvas/generate-components] Mock: generated ${components.length} components for ${flows.length} flows`);

    return c.json<GenerateComponentsOutput>({
      success: true,
      components,
      generationId,
      totalCount: components.length,
      confidence: 0.75,
    });
  } catch (err) {
    console.error('[canvas/generate-components] Error:', err);
    return c.json<GenerateComponentsOutput>({
      success: false,
      components: [],
      generationId: '',
      totalCount: 0,
      confidence: 0,
      error: '服务器内部错误，请稍后重试',
    }, 500);
  }
});

export default canvasGenerateComponents;
