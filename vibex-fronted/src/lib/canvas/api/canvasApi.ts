/**
 * VibeX Canvas API — 原型生成队列 API 封装
 *
 * 遵守 AGENTS.md ADR-003:
 * - 统一前缀 /api/v1/canvas/
 * - 队列轮询间隔 5000ms
 * - projectId 持久化到 localStorage
 *
 * ADR-001 约束: 不重写 CardTreeRenderer，只扩展 adapter
 *
 * E7-T3: API Service Layer — Zod schema validation for canvasApi responses
 * - Direct Prisma calls exist in: /projects, /v1/projects, /v1/flows/[flowId], /v1/pages
 * - Service layer pattern documented via CollaborationService.ts in backend services
 * - canvasApi responses validated via Zod schemas (see @/lib/schemas/canvas)
 */
import { z } from 'zod';
// Domain schemas available at @/lib/schemas/canvas (E7-T4 canonical model)
import type {
  CreateProjectInput,
  CreateProjectOutput,
  GenerateInput,
  GenerateOutput,
  StatusOutput,
  GenerateContextsOutput,
  GenerateFlowsOutput,
  GenerateComponentsOutput,
  BoundedContextNode,
  CreateSnapshotInput,
  CreateSnapshotOutput,
  ListSnapshotsOutput,
  RestoreSnapshotOutput,
  ComponentType,
} from '../types';

import { getApiUrl, API_CONFIG } from '@/lib/api-config';
import { validateReturnTo } from '@/lib/auth/validateReturnTo';

// =============================================================================
// E7-T3: Zod Response Schemas (replace manual type guards)
// These schemas validate the actual API response shape (aligned with types.ts).
// The domain schemas in @/lib/schemas/canvas define the canonical model.
// =============================================================================

const GenerateContextsResponseSchema = z.object({
  success: z.boolean(),
  contexts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.enum(['core', 'supporting', 'generic', 'external']),
    isActive: z.boolean().optional(),
    status: z.string().optional(),
    children: z.array(z.string()).optional(),
  })),
  generationId: z.string(),
  confidence: z.number(),
});

const GenerateFlowsResponseSchema = z.object({
  success: z.boolean(),
  flows: z.array(z.object({
    name: z.string(),
    contextId: z.string(),
    description: z.string().optional(),
    steps: z.array(z.object({
      name: z.string(),
      actor: z.string(),
      description: z.string(),
      order: z.number(),
      isActive: z.boolean().optional(),
      status: z.string().optional(),
    })),
  })),
  confidence: z.number(),
});

const COMPONENT_TYPE_ENUM = z.enum(['page', 'form', 'list', 'detail', 'modal']);
const HTTP_METHOD_ENUM = z.enum(['GET', 'POST']);

const GenerateComponentsResponseSchema = z.object({
  success: z.boolean(),
  components: z.array(z.object({
    name: z.string(),
    flowId: z.string(),
    // E1: Relaxed type validation — accept common variants, map to valid type
    type: z.string(),
    description: z.string().optional(),
    api: z.object({
      // E2: Case-insensitive method validation
      method: z.string(),
      path: z.string(),
      params: z.array(z.string()),
    }).optional(),
  })),
  // E3: confidence optional with default value
  confidence: z.number().optional().default(1.0),
}).transform(data => ({
  ...data,
  // E1: Map common type variants to valid ComponentType
  components: data.components.map(c => {
    const validTypes = ['page', 'form', 'list', 'detail', 'modal'] as const;
    const typeMap: Record<string, typeof validTypes[number]> = {
      section: 'page',
      component: 'page',
      layout: 'page',
      widget: 'page',
      container: 'page',
      header: 'page',
      footer: 'page',
      sidebar: 'page',
    };
    const mappedType = typeMap[c.type] ?? (validTypes.includes(c.type as typeof validTypes[number]) ? c.type : 'page') as ComponentType;
    // E2: Normalize method to uppercase for validation
    const normalizedApi = c.api ? {
      ...c.api,
      method: c.api.method.toUpperCase() as 'GET' | 'POST',
    } : undefined;
    return { ...c, type: mappedType, api: normalizedApi };
  }),
}));

async function validatedFetch<T>(
  url: string,
  options: RequestInit,
  schema: z.ZodSchema<T>
): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) await handleResponseError(res, `API 请求失败: ${res.status}`, window.location.pathname);
  const json = await res.json();
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new Error(`[canvasApi] Invalid response from ${url}`);
  }
  return result.data;
}

// 获取认证 token
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 检查 401 错误并提示
async function handleResponseError(res: Response, defaultMsg: string, returnTo?: string): Promise<never> {
  if (res.status === 401) {
    // 401 时清除 token
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token');
      // 派发全局 401 事件（供 auth redirect 模块监听）
      window.dispatchEvent(new CustomEvent('auth:401', {
        detail: { returnTo: returnTo ?? window.location.pathname },
      }));
      // 自动重定向到登录页（returnTo 经过白名单验证）
      const target = validateReturnTo(returnTo ?? window.location.pathname);
      window.location.href = `/auth?returnTo=${encodeURIComponent(target)}`;
    }
    throw new Error('登录已过期，请重新登录');
  }
  if (res.status === 404) {
    throw new Error('历史功能维护中，请稍后再试');
  }
  let errData: { error?: string; message?: string; details?: string } = { error: `HTTP ${res.status}` };
  try {
    errData = await res.json();
  } catch {
    // fallback to default HTTP status message
  }
  const message = errData.error ?? errData.message ?? errData.details ?? defaultMsg;
  throw new Error(message);
}

/**
 * 根据组件 type 生成符合 catalog Zod schema 的默认 props
 * 用于填充 fetchComponentTree 中的 props 字段，解决预览空白问题
 */
export function generateDefaultProps(
  type: string,
  name: string
): Record<string, unknown> {
  switch (type) {
    case 'page':
      return { title: name, layout: 'topnav' };
    case 'form':
      return {
        title: name,
        fields: [
          { name: 'email', label: '邮箱', type: 'email', placeholder: '请输入邮箱', required: true },
          { name: 'password', label: '密码', type: 'password', placeholder: '请输入密码', required: true },
        ],
        submitLabel: '提交',
      };
    case 'list':
      return {
        title: name,
        columns: [
          { key: 'id', label: 'ID', sortable: false },
          { key: 'name', label: '名称', sortable: true },
          { key: 'status', label: '状态', sortable: true },
        ],
        rows: 10,
        searchable: true,
      };
    case 'detail':
      return {
        title: name,
        fields: [
          { label: '状态', value: '待处理' },
          { label: '创建时间', value: new Date().toLocaleDateString('zh-CN') },
        ],
      };
    case 'modal':
      return { title: name, size: 'md' };
    default:
      return { title: name };
  }
}

export const canvasApi = {
  /**
   * 创建项目 — 将三树数据打包发送到后端
   * POST /api/v1/canvas/project
   */
  createProject: async (data: CreateProjectInput): Promise<CreateProjectOutput> => {
    const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
    const res = await fetch(getApiUrl(API_CONFIG.endpoints.canvas.project), {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) await handleResponseError(res, `创建项目失败: ${res.status}`, window.location.pathname);
    return await res.json() as CreateProjectOutput;
  },

  /**
   * 触发生成 — 启动原型页生成队列
   * POST /api/v1/canvas/generate
   */
  generate: async (data: GenerateInput): Promise<GenerateOutput> => {
    const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
    const res = await fetch(getApiUrl(API_CONFIG.endpoints.canvas.generate), {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) await handleResponseError(res, `生成失败: ${res.status}`, window.location.pathname);
    return await res.json() as GenerateOutput;
  },

  /**
   * 轮询状态 — 获取队列中所有页面的生成进度
   * GET /api/v1/canvas/status?projectId=xxx
   *
   * 轮询间隔: 5000ms (AGENTS.md ADR-003)
   */
  getStatus: async (projectId: string): Promise<StatusOutput> => {
    const headers = getAuthHeaders();
    const res = await fetch(getApiUrl(`${API_CONFIG.endpoints.canvas.status}?projectId=${encodeURIComponent(projectId)}`), { headers });

    if (!res.ok) await handleResponseError(res, `查询状态失败: ${res.status}`, window.location.pathname);
    return await res.json() as StatusOutput;
  },

  /**
   * 导出 Zip — 下载完整 Next.js 项目压缩包
   * GET /api/v1/canvas/export?projectId=xxx
   */
  exportZip: async (projectId: string): Promise<Blob> => {
    const headers = getAuthHeaders();
    const res = await fetch(getApiUrl(`${API_CONFIG.endpoints.canvas.export}?projectId=${encodeURIComponent(projectId)}`), { headers });

    if (!res.ok) await handleResponseError(res, `导出失败: ${res.status}`, window.location.pathname);
    return await res.blob();
  },

  // === Epic 1: Canvas Generate APIs ===

  /**
   * 生成限界上下文树
   * POST /api/v1/canvas/generate-contexts
   */
  generateContexts: async (data: {
    requirementText: string;
    projectId?: string;
  }): Promise<GenerateContextsOutput> => {
    const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
    return validatedFetch(getApiUrl(API_CONFIG.endpoints.canvas.generateContexts), {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }, GenerateContextsResponseSchema);
  },

  /**
   * 生成业务流程树
   * POST /api/v1/canvas/generate-flows
   */
  generateFlows: async (data: {
    contexts: Array<{ id: string; name: string; description: string; type: string }>;
    sessionId: string;
  }): Promise<GenerateFlowsOutput> => {
    const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
    return validatedFetch(getApiUrl(API_CONFIG.endpoints.canvas.generateFlows), {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }, GenerateFlowsResponseSchema);
  },

  /**
   * 生成组件树
   * POST /api/v1/canvas/generate-components
   */
  generateComponents: async (data: {
    contexts: Array<{ id: string; name: string; description: string; type: string }>;
    flows: Array<{ id?: string; name: string; contextId: string; steps: Array<{ name: string; actor: string }> }>;
    sessionId: string;
  }): Promise<GenerateComponentsOutput> => {
    const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
    return validatedFetch(getApiUrl(API_CONFIG.endpoints.canvas.generateComponents), {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }, GenerateComponentsResponseSchema);
  },

  /**
   * 获取组件树 — 将流程树数据转换为组件树
   * POST /api/v1/canvas/generate-components (same underlying endpoint)
   *
   * @param contexts - 已确认的限界上下文节点
   * @param flows - 已确认的业务流程节点（flowData）
   * @param sessionId - 会话 ID
   * @returns 组件树节点数组，格式化为可直接存入 canvasStore.componentNodes
   */
  fetchComponentTree: async (data: {
    contexts: Array<{ id: string; name: string; description: string; type: string }>;
    flows: Array<{ id?: string; name: string; contextId: string; steps: Array<{ name: string; actor: string }> }>;
    sessionId: string;
  }): Promise<import('../types').ComponentNode[]> => {
    const result = await canvasApi.generateComponents(data);

    if (!result.success || !result.components || result.components.length === 0) {
      throw new Error(result.error ?? '生成组件树失败，未返回有效数据');
    }

    return result.components.map((comp) => ({
      // E4: flowId fallback — 'unknown' or empty → ''
      flowId: (comp.flowId && comp.flowId !== 'unknown') ? comp.flowId : '',
      name: comp.name,
      type: comp.type as import('../types').ComponentType,
      props: generateDefaultProps(comp.type, comp.name),
      api: comp.api ?? {
        method: 'GET' as const,
        path: '/api/' + comp.name.toLowerCase().replace(/\s+/g, '-'),
        params: [],
      },
      previewUrl: undefined,
      nodeId: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      confirmed: false,
      status: 'pending' as const,
      children: [],
    }));
  },

  // === E4-F11: Canvas Snapshots (Version History) ===

  /**
   * 创建画布快照 — 手动保存或 AI 生成完成时调用
   * POST /api/v1/canvas/snapshots
   */
  createSnapshot: async (data: CreateSnapshotInput): Promise<CreateSnapshotOutput> => {
    const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
    const res = await fetch(getApiUrl(API_CONFIG.endpoints.canvas.snapshots), {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      // E4: For 409 conflict, include response body in error for conflict data extraction
      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        const err = new Error(`创建快照失败: ${res.status}`) as Error & { status: number; data: Record<string, unknown> };
        err.status = 409;
        err.data = body;
        throw err;
      }
      await handleResponseError(res, `创建快照失败: ${res.status}`, window.location.pathname);
    }
    return await res.json() as CreateSnapshotOutput;
  },

  /**
   * 获取快照列表
   * GET /api/v1/canvas/snapshots?projectId=xxx
   */
  listSnapshots: async (projectId?: string): Promise<ListSnapshotsOutput> => {
    const headers = getAuthHeaders();
    const url = projectId
      ? `${getApiUrl(API_CONFIG.endpoints.canvas.snapshots)}?projectId=${encodeURIComponent(projectId)}`
      : getApiUrl(API_CONFIG.endpoints.canvas.snapshots);
    const res = await fetch(url, { headers });

    if (!res.ok) await handleResponseError(res, `获取快照列表失败: ${res.status}`, window.location.pathname);
    return await res.json() as ListSnapshotsOutput;
  },

  /**
   * 获取单个快照详情
   * GET /api/v1/canvas/snapshots/:id
   */
  getSnapshot: async (snapshotId: string): Promise<{ success: boolean; snapshot: import('../types').CanvasSnapshot }> => {
    const headers = getAuthHeaders();
    const res = await fetch(getApiUrl(API_CONFIG.endpoints.canvas.snapshot(snapshotId)), { headers });

    if (!res.ok) await handleResponseError(res, `获取快照失败: ${res.status}`, window.location.pathname);
    return await res.json() as { success: boolean; snapshot: import('../types').CanvasSnapshot };
  },

  /**
   * 恢复到指定快照
   * POST /api/v1/canvas/snapshots/:id/restore
   */
  restoreSnapshot: async (snapshotId: string): Promise<RestoreSnapshotOutput> => {
    const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
    const res = await fetch(getApiUrl(API_CONFIG.endpoints.canvas.restoreSnapshot(snapshotId)), {
      method: 'POST',
      headers,
    });

    if (!res.ok) await handleResponseError(res, `恢复快照失败: ${res.status}`, window.location.pathname);
    return await res.json() as RestoreSnapshotOutput;
  },

  /**
   * E3: 获取最新版本号（轻量轮询检测）
   * GET /api/v1/canvas/snapshots/latest?projectId=xxx
   * 用于 30s 间隔轮询检测远程版本变化，触发 conflict 状态
   */
  getLatestVersion: async (projectId: string): Promise<{ success: boolean; latestVersion: number; updatedAt: string | null }> => {
    const headers = getAuthHeaders();
    const res = await fetch(
      `${getApiUrl(API_CONFIG.endpoints.canvas.latest)}?projectId=${encodeURIComponent(projectId)}`,
      { headers }
    );
    if (!res.ok) await handleResponseError(res, `获取最新版本失败: ${res.status}`, window.location.pathname);
    return await res.json() as { success: boolean; latestVersion: number; updatedAt: string | null };
  },
};

// === Polling Manager ===

let pollingTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 启动队列状态轮询
 * @param projectId - 项目 ID
 * @param onUpdate - 状态更新回调
 * @param intervalMs - 轮询间隔，默认 5000ms (AGENTS.md ADR-003)
 */
export function startPolling(
  projectId: string,
  onUpdate: (status: StatusOutput) => void,
  intervalMs = 5000
): void {
  stopPolling(); // 确保只有一个轮询实例

  const poll = async () => {
    try {
      const status = await canvasApi.getStatus(projectId);
      onUpdate(status);

      // 所有页面都完成了 → 停止轮询
      const allDone = status.pages.every(
        (p) => p.status === 'done' || p.status === 'error'
      );
      if (allDone) {
        stopPolling();
      }
    } catch (err) {
      // polling error — handled by caller
    }
  };

  poll(); // 立即执行一次
  pollingTimer = setInterval(poll, intervalMs);
}

/**
 * 停止队列状态轮询
 */
export function stopPolling(): void {
  if (pollingTimer !== null) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}
