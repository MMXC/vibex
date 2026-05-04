/**
 * Canvas Share API client — Frontend API layer
 * E5: Teams × Canvas 共享权限
 */

import { getAuthToken } from '@/lib/auth-token';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.vibex.top';

export type ShareRole = 'viewer' | 'editor';

export interface CanvasShareRecord {
  canvasId: string;
  teamId: string;
  role: ShareRole;
  sharedBy: string;
  sharedAt: string;
}

export interface ShareCanvasRequest {
  canvasId: string;
  teamId: string;
  role: ShareRole;
}

async function fetchCS<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const canvasShareApi = {
  /** Share a canvas with a team */
  share: (data: ShareCanvasRequest) =>
    fetchCS<{ success: boolean; share: CanvasShareRecord }>(`${API_BASE}/v1/canvas-share`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** List teams shared with a canvas */
  listTeams: (canvasId: string) =>
    fetchCS<{ success: boolean; teams: CanvasShareRecord[] }>(
      `${API_BASE}/v1/canvas-share/teams?canvasId=${encodeURIComponent(canvasId)}`
    ),

  /** List canvases shared with a team */
  listCanvases: (teamId: string) =>
    fetchCS<{ success: boolean; canvases: CanvasShareRecord[] }>(
      `${API_BASE}/v1/canvas-share/canvases?teamId=${encodeURIComponent(teamId)}`
    ),

  /** Revoke a canvas-team share */
  revoke: (canvasId: string, teamId: string) =>
    fetchCS<{ success: boolean }>(`${API_BASE}/v1/canvas-share`, {
      method: 'DELETE',
      body: JSON.stringify({ canvasId, teamId }),
    }),
};