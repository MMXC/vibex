/**
 * versionStore.ts — Sprint93 E1: Canvas Version History
 *
 * Zustand store for managing canvas version history.
 * Handles fetching versions, creating snapshots, and restoring versions.
 *
 * Persistence: localStorage (via persist middleware)
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// Types
// ============================================

export interface CanvasVersion {
  id: string;
  canvasId: string;
  versionNumber: number;
  snapshotData: string;
  description: string | null;
  createdBy: string | null;
  createdAt: number;
}

export interface VersionHistoryState {
  /** Map of canvasId → versions[] */
  versionsByCanvas: Record<string, CanvasVersion[]>;
  /** Currently selected version for preview */
  previewVersionId: string | null;
  /** Whether the panel is open */
  isPanelOpen: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;

  // Actions
  fetchVersions: (canvasId: string) => Promise<void>;
  createVersion: (canvasId: string, snapshotData: string, description?: string) => Promise<CanvasVersion | null>;
  restoreVersion: (versionId: string) => Promise<CanvasVersion | null>;
  setPreviewVersion: (versionId: string | null) => void;
  setPanelOpen: (open: boolean) => void;
  clearError: () => void;
}

// ============================================
// API helpers (inline — no separate module needed)
// ============================================

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getApiUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  // Use relative path for Next.js API routes
  const base = window.location.origin;
  return `${base}${path}`;
}

async function fetchVersionsAPI(canvasId: string): Promise<CanvasVersion[]> {
  const headers = getAuthHeaders();
  const res = await fetch(getApiUrl(`/api/canvas/${canvasId}/versions`), { headers });
  if (!res.ok) throw new Error(`Failed to fetch versions: ${res.status}`);
  const data = (await res.json()) as { ok: boolean; versions: CanvasVersion[] };
  if (!data.ok) throw new Error('API returned failure');
  return data.versions;
}

async function createVersionAPI(
  canvasId: string,
  snapshotData: string,
  description?: string
): Promise<CanvasVersion> {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
  const res = await fetch(getApiUrl(`/api/canvas/${canvasId}/versions`), {
    method: 'POST',
    headers,
    body: JSON.stringify({ snapshotData, description }),
  });
  if (!res.ok) throw new Error(`Failed to create version: ${res.status}`);
  const data = (await res.json()) as { ok: boolean; version: CanvasVersion };
  if (!data.ok) throw new Error('API returned failure');
  return data.version;
}

async function restoreVersionAPI(
  canvasId: string,
  versionId: string
): Promise<CanvasVersion> {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
  const res = await fetch(getApiUrl(`/api/canvas/${canvasId}/versions/${versionId}/restore`), {
    method: 'PATCH',
    headers,
  });
  if (!res.ok) throw new Error(`Failed to restore version: ${res.status}`);
  const data = (await res.json()) as { ok: boolean; version: CanvasVersion };
  if (!data.ok) throw new Error('API returned failure');
  return data.version;
}

// ============================================
// Store
// ============================================

const STORAGE_KEY = 'vibex-version-history';

export const useVersionStore = create<VersionHistoryState>()(
  persist(
    (set, get) => ({
      versionsByCanvas: {},
      previewVersionId: null,
      isPanelOpen: false,
      isLoading: false,
      error: null,

      fetchVersions: async (canvasId: string) => {
        set({ isLoading: true, error: null });
        try {
          const versions = await fetchVersionsAPI(canvasId);
          set((state) => ({
            versionsByCanvas: {
              ...state.versionsByCanvas,
              [canvasId]: versions,
            },
            isLoading: false,
          }));
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          set({ isLoading: false, error: msg });
        }
      },

      createVersion: async (canvasId: string, snapshotData: string, description?: string) => {
        set({ isLoading: true, error: null });
        try {
          const version = await createVersionAPI(canvasId, snapshotData, description);
          set((state) => ({
            versionsByCanvas: {
              ...state.versionsByCanvas,
              [canvasId]: [version, ...(state.versionsByCanvas[canvasId] ?? [])],
            },
            isLoading: false,
          }));
          return version;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          set({ isLoading: false, error: msg });
          return null;
        }
      },

      restoreVersion: async (versionId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Find the canvasId for this version
          const { versionsByCanvas } = get();
          let canvasId: string | null = null;
          let foundVersion: CanvasVersion | null = null;
          for (const [cid, versions] of Object.entries(versionsByCanvas)) {
            const v = versions.find((ver) => ver.id === versionId);
            if (v) {
              canvasId = cid;
              foundVersion = v;
              break;
            }
          }
          if (!canvasId || !foundVersion) throw new Error('Version not found in store');

          const version = await restoreVersionAPI(canvasId, versionId);
          set({ isLoading: false });
          return version;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          set({ isLoading: false, error: msg });
          return null;
        }
      },

      setPreviewVersion: (versionId: string | null) => {
        set({ previewVersionId: versionId });
      },

      setPanelOpen: (open: boolean) => {
        set({ isPanelOpen: open });
        if (!open) {
          set({ previewVersionId: null });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist the panel open state, not the full versions cache
      // (versions are always fetched fresh from the API)
      partialize: (state) => ({
        isPanelOpen: state.isPanelOpen,
      }),
    }
  )
);
