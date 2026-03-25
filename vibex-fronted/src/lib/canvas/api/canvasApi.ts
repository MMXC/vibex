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
} from '../types';

const API_BASE = '/api/canvas';

export const canvasApi = {
  /**
   * 创建项目 — 将三树数据打包发送到后端
   * POST /api/canvas/project
   */
  createProject: async (data: CreateProjectInput): Promise<CreateProjectOutput> => {
    const res = await fetch(`${API_BASE}/project`, {
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
    const res = await fetch(`${API_BASE}/generate`, {
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
    const res = await fetch(`${API_BASE}/status?projectId=${encodeURIComponent(projectId)}`);

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
    const res = await fetch(`${API_BASE}/export?projectId=${encodeURIComponent(projectId)}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error ?? `导出失败: ${res.status}`);
    }

    // Return blob for download
    return res.blob();
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
