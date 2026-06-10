/**
 * canvasPermissionsStore — Zustand store for canvas-level permissions
 *
 * S85-E1: 画布级权限体系
 *
 * Manages:
 * - Current user's role on the active canvas
 * - Collaborator list for the active canvas
 * - Viewer mode flag (derived from role)
 * - Share link state
 */
import { create } from 'zustand';

export type CanvasRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface CanvasCollaborator {
  id: string;
  permissionId: string;
  userId: string;
  email: string | null;
  displayName: string | null;
  role: CanvasRole;
  joinedAt: string;
  lastActiveAt: string | null;
}

export interface ShareLink {
  id: string;
  token: string;
  shareUrl: string;
  role: 'viewer' | 'editor';
  expiresAt: string;
}

interface CanvasPermissionsState {
  /** Current canvas ID being managed */
  canvasId: string | null;
  /** Current user's role on the canvas */
  myRole: CanvasRole | null;
  /** Current user ID (from auth) */
  myUserId: string | null;
  /** Collaborator list */
  collaborators: CanvasCollaborator[];
  /** Share link (if generated) */
  shareLink: ShareLink | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;

  // Actions
  initCanvas: (canvasId: string, userId: string) => Promise<void>;
  fetchCollaborators: () => Promise<void>;
  addCollaborator: (userId: string, role: CanvasRole, email?: string, displayName?: string) => Promise<void>;
  updateCollaborator: (userId: string, role: CanvasRole) => Promise<void>;
  removeCollaborator: (userId: string) => Promise<void>;
  createShareLink: (role?: 'viewer' | 'editor', expiresInHours?: number) => Promise<void>;
  clearShareLink: () => void;
  clearError: () => void;
}

function canManage(role: CanvasRole | null): boolean {
  return role === 'owner' || role === 'admin';
}

function canEdit(role: CanvasRole | null): boolean {
  return role === 'owner' || role === 'admin' || role === 'editor';
}

function isViewerMode(role: CanvasRole | null): boolean {
  return role === 'viewer' || role === null;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const useCanvasPermissionsStore = create<CanvasPermissionsState>((set, get) => ({
  canvasId: null,
  myRole: null,
  myUserId: null,
  collaborators: [],
  shareLink: null,
  loading: false,
  error: null,

  initCanvas: async (canvasId: string, userId: string) => {
    set({ canvasId, myUserId: userId, loading: true, error: null });
    try {
      await get().fetchCollaborators();
    } catch {
      // If fetch fails (no permissions yet), default to viewer
      set({ myRole: null, loading: false });
    }
    set({ loading: false });
  },

  fetchCollaborators: async () => {
    const { canvasId, myUserId } = get();
    if (!canvasId) return;

    set({ loading: true, error: null });
    try {
      const resp = await apiFetch<{ collaborators: Array<{
        id: string; permissionId: string; userId: string;
        email: string | null; display_name: string | null;
        role: CanvasRole; joined_at: string; last_active_at: string | null;
      }> }>(
        `/api/canvas/${canvasId}/permissions`
      );

      const collaborators: CanvasCollaborator[] = (resp.collaborators ?? []).map(c => ({
        id: c.id,
        permissionId: c.permissionId,
        userId: c.userId,
        email: c.email,
        displayName: c.display_name ?? c.email ?? c.userId,
        role: c.role,
        joinedAt: c.joined_at,
        lastActiveAt: c.last_active_at,
      }));

      const myCollaborator = collaborators.find(c => c.userId === myUserId);
      const myRole = myCollaborator?.role ?? null;

      set({ collaborators, myRole, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  addCollaborator: async (userId: string, role: CanvasRole, email?: string, displayName?: string) => {
    const { canvasId, myRole } = get();
    if (!canvasId) return;
    if (!canManage(myRole)) {
      set({ error: 'Permission denied: only owner or admin can add collaborators' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await apiFetch(`/api/canvas/${canvasId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, email, displayName }),
      });
      await get().fetchCollaborators();
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateCollaborator: async (userId: string, role: CanvasRole) => {
    const { canvasId, myRole } = get();
    if (!canvasId) return;
    if (!canManage(myRole)) {
      set({ error: 'Permission denied: only owner or admin can update collaborators' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await apiFetch(`/api/canvas/${canvasId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      await get().fetchCollaborators();
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  removeCollaborator: async (userId: string) => {
    const { canvasId, myRole } = get();
    if (!canvasId) return;
    if (!canManage(myRole)) {
      set({ error: 'Permission denied: only owner or admin can remove collaborators' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await apiFetch(`/api/canvas/${canvasId}/permissions?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      await get().fetchCollaborators();
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createShareLink: async (role: 'viewer' | 'editor' = 'viewer', expiresInHours = 720) => {
    const { canvasId, myRole } = get();
    if (!canvasId) return;
    if (!canManage(myRole)) {
      set({ error: 'Permission denied: only owner or admin can create share links' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const resp = await apiFetch<ShareLink>(`/api/canvas/${canvasId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, expiresInHours }),
      });
      set({ shareLink: resp, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clearShareLink: () => set({ shareLink: null }),
  clearError: () => set({ error: null }),
}));

// Selectors (derived state)
export const selectCanEdit = (s: CanvasPermissionsState) => canEdit(s.myRole);
export const selectCanManage = (s: CanvasPermissionsState) => canManage(s.myRole);
export const selectIsViewerMode = (s: CanvasPermissionsState) => isViewerMode(s.myRole);
export const selectMyRole = (s: CanvasPermissionsState) => s.myRole;
export const selectCollaborators = (s: CanvasPermissionsState) => s.collaborators;
