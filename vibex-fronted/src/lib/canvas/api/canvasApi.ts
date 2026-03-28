/**
 * VibeX Canvas API — 原型生成队列 API 封装
 *
 * 遵守 AGENTS.md ADR-003:
 * - 统一前缀 /api/canvas/
 * - 队列轮询间隔 5000ms
 * - projectId 持久化到 localStorage
 *
 * ADR-001 约束: 不重写 CardTreeRenderer，只扩展 adapter
 */
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
} from '../types';

import { getApiUrl, API_CONFIG } from '@/lib/api-config';

export const canvasApi = {
  /**
   * 创建项目 — 将三树数据打包发送到后端
   * POST /api/canvas/project
   */
  createProject: async (data: CreateProjectInput): Promise<CreateProjectOutput> => {
    const res = await fetch(getApiUrl(API_CONFIG.endpoints.canvas.project), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error ?? `创建项目失败: ${res.status}`);
    }

    return res.json() as Promise<CreateProjectOutput>;
  },

  /**
   * 触发生成 — 启动原型页生成队列
   * POST /api/canvas/generate
   */
  generate: async (data: GenerateInput): Promise<GenerateOutput> => {
    const res = await fetch(getApiUrl(API_CONFIG.endpoints.canvas.generate), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error ?? `生成失败: ${res.status}`);
    }

    return res.json() as Promise<GenerateOutput>;
  },

  /**
   * 轮询状态 — 获取队列中所有页面的生成进度
   * GET /api/canvas/status?projectId=xxx
   *
   * 轮询间隔: 5000ms (AGENTS.md ADR-003)
   */
  getStatus: async (projectId: string): Promise<StatusOutput> => {
    const res = await fetch(getApiUrl(`${API_CONFIG.endpoints.canvas.status}?projectId=${encodeURIComponent(projectId)}`));

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error ?? `查询状态失败: ${res.status}`);
    }

    return res.json() as Promise<StatusOutput>;
  },

  /**
   * 导出 Zip — 下载完整 Next.js 项目压缩包
   * GET /api/canvas/export?projectId=xxx
   */
  exportZip: async (projectId: string): Promise<Blob> => {
    const res = await fetch(getApiUrl(`${API_CONFIG.endpoints.canvas.export}?projectId=${encodeURIComponent(projectId)}`));

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error ?? `导出失败: ${res.status}`);
    }

    // Return blob for download
    return res.blob();
  },

  // === Epic 1: Canvas Generate APIs ===

  /**
   * 生成限界上下文树
   * POST /api/canvas/generate-contexts
   */
  generateContexts: async (data: {
    requirementText: string;
    projectId?: string;
  }): Promise<GenerateContextsOutput> => {
    const res = await fetch(getApiUrl(API_CONFIG.endpoints.canvas.generateContexts), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error ?? `生成上下文失败: ${res.status}`);
    }

    return res.json() as Promise<GenerateContextsOutput>;
  },

  /**
   * 生成业务流程树
   * POST /api/canvas/generate-flows
   */
  generateFlows: async (data: {
    contexts: Array<{ id: string; name: string; description: string; type: string }>;
    sessionId: string;
  }): Promise<GenerateFlowsOutput> => {
    const res = await fetch(getApiUrl(API_CONFIG.endpoints.canvas.generateFlows), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error ?? `生成流程失败: ${res.status}`);
    }

    return res.json() as Promise<GenerateFlowsOutput>;
  },

  /**
   * 生成组件树
   * POST /api/canvas/generate-components
   */
  generateComponents: async (data: {
    contexts: Array<{ id: string; name: string; description: string; type: string }>;
    flows: Array<{ name: string; contextId: string; steps: Array<{ name: string; actor: string }> }>;
    sessionId: string;
  }): Promise<GenerateComponentsOutput> => {
    const res = await fetch(getApiUrl(API_CONFIG.endpoints.canvas.generateComponents), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error ?? `生成组件失败: ${res.status}`);
    }

    return res.json() as Promise<GenerateComponentsOutput>;
  },

  /**
   * 获取组件树 — 将流程树数据转换为组件树
   * POST /api/canvas/generate-components (same underlying endpoint)
   *
   * @param contexts - 已确认的限界上下文节点
   * @param flows - 已确认的业务流程节点（flowData）
   * @param sessionId - 会话 ID
   * @returns 组件树节点数组，格式化为可直接存入 canvasStore.componentNodes
   */
  fetchComponentTree: async (data: {
    contexts: Array<{ id: string; name: string; description: string; type: string }>;
    flows: Array<{ name: string; contextId: string; steps: Array<{ name: string; actor: string }> }>;
    sessionId: string;
  }): Promise<import('../types').ComponentNode[]> => {
    const result = await canvasApi.generateComponents(data);

    if (!result.success || !result.components || result.components.length === 0) {
      throw new Error(result.error ?? '生成组件树失败，未返回有效数据');
    }

    return result.components.map((comp) => ({
      flowId: comp.flowId ?? 'mock',
      name: comp.name,
      type: comp.type as import('../types').ComponentType,
      props: {},
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
      console.error('[canvasApi] polling error:', err);
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
