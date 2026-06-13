/**
 * exportProfileStore.ts — S95-E4: Export Profile Templates
 *
 * Manages named export profile templates that bundle format, scale,
 * node/edge inclusion settings for reuse.
 *
 * Profiles are persisted via the API: GET/POST/DELETE /api/canvas/{canvasId}/export-profiles
 * DELETE uses query param: /api/canvas/{canvasId}/export-profiles?profileId={profileId}
 */

import { create } from 'zustand';

export type ExportProfileFormat = 'react' | 'svg' | 'md' | 'json';

export interface ExportProfile {
  id: string;
  canvasId: string;
  name: string;
  format: ExportProfileFormat;
  scale: number; // percentage: 25, 50, 75, 100, 150, 200
  includeNodes: boolean;
  includeEdges: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExportProfileState {
  /** Canvas ID for current profile context */
  currentCanvasId: string | null;
  /** Whether the ExportProfilePanel is visible */
  isPanelOpen: boolean;
  /** All saved profiles */
  profiles: ExportProfile[];
  /** ID of the currently active/selected profile */
  activeProfileId: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Name field for the create/edit form */
  formName: string;
  /** Format field for the create/edit form */
  formFormat: ExportProfileFormat;
  /** Scale field for the create/edit form (percentage) */
  formScale: number;
  /** Include nodes toggle */
  formIncludeNodes: boolean;
  /** Include edges toggle */
  formIncludeEdges: boolean;
}

export interface ExportProfileActions {
  /** Open the profile panel for a canvas */
  openPanel(canvasId: string): void;
  /** Close the panel and reset forms */
  closePanel(): void;
  /** Fetch all profiles for a canvas */
  loadProfiles(canvasId: string): Promise<void>;
  /** Select an active profile by ID */
  selectProfile(id: string): void;
  /** Create a new profile with current form values */
  createProfile(canvasId: string): Promise<void>;
  /** Delete a profile by ID (uses query param ?profileId=) */
  deleteProfile(canvasId: string, profileId: string): Promise<void>;
  /** Set form field values */
  setFormField<K extends keyof ExportProfileState>(
    field: K,
    value: ExportProfileState[K]
  ): void;
  /** Individual form setters */
  setFormName(formName: string): void;
  setFormFormat(formFormat: ExportProfileFormat): void;
  setFormScale(formScale: number): void;
  setFormIncludeNodes(formIncludeNodes: boolean): void;
  setFormIncludeEdges(formIncludeEdges: boolean): void;
  /** Reset form to defaults */
  resetForm(): void;
}

const DEFAULT_FORM = {
  formName: '',
  formFormat: 'react' as ExportProfileFormat,
  formScale: 100,
  formIncludeNodes: true,
  formIncludeEdges: true,
};

export type ExportProfileStore = ExportProfileState & ExportProfileActions;

export const useExportProfileStore = create<ExportProfileStore>()((set, get) => ({
  currentCanvasId: null,
  isPanelOpen: false,
  profiles: [],
  activeProfileId: null,
  isLoading: false,
  error: null,
  ...DEFAULT_FORM,

  openPanel(canvasId: string) {
    set({ isPanelOpen: true, currentCanvasId: canvasId, error: null });
    get().loadProfiles(canvasId);
  },

  closePanel() {
    set({ isPanelOpen: false, currentCanvasId: null });
    get().resetForm();
  },

  async loadProfiles(canvasId: string) {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/canvas/${canvasId}/export-profiles`);
      const data = (await res.json()) as { ok: boolean; error?: string; profiles?: ExportProfile[] };
      if (!data.ok) {
        throw new Error(data.error || 'Failed to load export profiles');
      }
      set({ profiles: data.profiles ?? [], currentCanvasId: canvasId, isLoading: false, error: null });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load export profiles',
        isLoading: false,
      });
    }
  },

  selectProfile(id: string) {
    const profile = get().profiles.find((p) => p.id === id) ?? null;
    if (profile) {
      set({
        activeProfileId: id,
        formName: profile.name,
        formFormat: profile.format,
        formScale: profile.scale,
        formIncludeNodes: profile.includeNodes,
        formIncludeEdges: profile.includeEdges,
        error: null,
      });
    }
  },

  async createProfile(canvasId: string) {
    const { formName, formFormat, formScale, formIncludeNodes, formIncludeEdges } = get();
    if (!formName.trim()) {
      set({ error: 'Profile name is required' });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/canvas/${canvasId}/export-profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          format: formFormat,
          scale: formScale,
          includeNodes: formIncludeNodes,
          includeEdges: formIncludeEdges,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; profile?: ExportProfile };
      if (!data.ok) {
        throw new Error(data.error || 'Failed to create profile');
      }
      const newProfile = data.profile!;
      set((s) => ({
        profiles: [...s.profiles, newProfile],
        activeProfileId: newProfile.id,
        isLoading: false,
        error: null,
      }));
      get().resetForm();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create profile',
        isLoading: false,
      });
    }
  },

  async deleteProfile(canvasId: string, profileId: string) {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/canvas/${canvasId}/export-profiles?profileId=${profileId}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const data = (await res.json()) as { ok: boolean; error?: string };
        throw new Error(data.error || 'Failed to delete profile');
      }
      set((s) => ({
        profiles: s.profiles.filter((p) => p.id !== profileId),
        activeProfileId: s.activeProfileId === profileId ? null : s.activeProfileId,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete profile',
        isLoading: false,
      });
    }
  },

  setFormField(field, value) {
    set({ [field]: value } as Partial<ExportProfileStore>);
  },

  setFormName(formName: string) {
    set({ formName });
  },

  setFormFormat(formFormat: ExportProfileFormat) {
    set({ formFormat });
  },

  setFormScale(formScale: number) {
    set({ formScale });
  },

  setFormIncludeNodes(formIncludeNodes: boolean) {
    set({ formIncludeNodes });
  },

  setFormIncludeEdges(formIncludeEdges: boolean) {
    set({ formIncludeEdges });
  },

  resetForm() {
    set({ ...DEFAULT_FORM });
  },
}));
