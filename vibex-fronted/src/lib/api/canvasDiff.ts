/**
 * Canvas Diff API client — Frontend
 * S84-E1: Canvas Version Diff
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.vibex.top';

export type DiffMode = 'unidirectional' | 'bidirectional';

export interface DiffNode {
  nodeId: string;
  name: string;
  type: string;
  changeType: 'added' | 'removed' | 'modified';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface CanvasDiffResponse {
  fromSnapshotId: string;
  toSnapshotId: string;
  mode: DiffMode;
  fromName: string | null;
  toName: string | null;
  fromVersion: number;
  toVersion: number;
  diff: {
    added: DiffNode[];
    removed: DiffNode[];
    modified: DiffNode[];
    unchanged: number;
    stats: {
      added: number;
      removed: number;
      modified: number;
      unchanged: number;
    };
  };
}

export interface DiffParams {
  projectId: string;
  from: string;
  to: string;
  mode?: DiffMode;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const canvasDiffApi = {
  /**
   * GET /api/canvas/diff?projectId=...&from=...&to=...&mode=...
   * Returns structured diff between two canvas snapshots
   */
  getDiff: (params: DiffParams): Promise<CanvasDiffResponse> => {
    const qs = new URLSearchParams({
      projectId: params.projectId,
      from: params.from,
      to: params.to,
      ...(params.mode ? { mode: params.mode } : {}),
    });
    return fetchJSON<CanvasDiffResponse>(
      `${API_BASE}/v1/canvas/diff?${qs.toString()}`,
      { method: 'GET' }
    );
  },
};
