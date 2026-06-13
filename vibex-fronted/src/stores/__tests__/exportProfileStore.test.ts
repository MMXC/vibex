/**
 * exportProfileStore.test.ts — Vitest Tests
 * S95-E4: Export Profile Templates
 *
 * Tests store state and actions for canvas-scoped export profile CRUD.
 * API: /api/canvas/{canvasId}/export-profiles
 * Schema: { id, canvasId, name, format, scale, includeNodes, includeEdges, createdAt, updatedAt }
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useExportProfileStore } from '../exportProfileStore';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('exportProfileStore — S95-E4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExportProfileStore.setState({
      isPanelOpen: false,
      currentCanvasId: null,
      profiles: [],
      isLoading: false,
      error: null,
      formName: '',
      formFormat: 'react',
      formScale: 100,
      formIncludeNodes: true,
      formIncludeEdges: true,
    });
  });

  // ============================================================
  // 1. Initial State
  // ============================================================
  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useExportProfileStore.getState();
      expect(state.isPanelOpen).toBe(false);
      expect(state.currentCanvasId).toBe(null);
      expect(state.profiles).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.formName).toBe('');
      expect(state.formFormat).toBe('react');
      expect(state.formScale).toBe(100);
      expect(state.formIncludeNodes).toBe(true);
      expect(state.formIncludeEdges).toBe(true);
    });
  });

  // ============================================================
  // 2. openPanel
  // ============================================================
  describe('openPanel', () => {
    it('sets isPanelOpen=true and currentCanvasId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, profiles: [] }),
      });
      const { openPanel } = useExportProfileStore.getState();
      await openPanel('canvas-abc');
      const state = useExportProfileStore.getState();
      expect(state.isPanelOpen).toBe(true);
      expect(state.currentCanvasId).toBe('canvas-abc');
    });

    it('calls /api/canvas/{canvasId}/export-profiles GET', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, profiles: [] }),
      });
      const { openPanel } = useExportProfileStore.getState();
      await openPanel('canvas-abc');
      expect(mockFetch).toHaveBeenCalledWith('/api/canvas/canvas-abc/export-profiles');
    });

    it('resets error on open', async () => {
      useExportProfileStore.setState({ error: 'Previous error' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, profiles: [] }),
      });
      const { openPanel } = useExportProfileStore.getState();
      await openPanel('canvas-abc');
      expect(useExportProfileStore.getState().error).toBe(null);
    });
  });

  // ============================================================
  // 3. closePanel
  // ============================================================
  describe('closePanel', () => {
    it('sets isPanelOpen to false', () => {
      useExportProfileStore.setState({ isPanelOpen: true, currentCanvasId: 'canvas-abc' });
      const { closePanel } = useExportProfileStore.getState();
      closePanel();
      expect(useExportProfileStore.getState().isPanelOpen).toBe(false);
    });

    it('clears currentCanvasId', () => {
      useExportProfileStore.setState({ isPanelOpen: true, currentCanvasId: 'canvas-abc' });
      const { closePanel } = useExportProfileStore.getState();
      closePanel();
      expect(useExportProfileStore.getState().currentCanvasId).toBe(null);
    });

    it('resets form fields', () => {
      useExportProfileStore.setState({
        formName: 'My Profile',
        formFormat: 'svg',
        formScale: 150,
        formIncludeNodes: false,
        formIncludeEdges: false,
      });
      const { closePanel } = useExportProfileStore.getState();
      closePanel();
      const state = useExportProfileStore.getState();
      expect(state.formName).toBe('');
      expect(state.formFormat).toBe('react');
      expect(state.formScale).toBe(100);
      expect(state.formIncludeNodes).toBe(true);
      expect(state.formIncludeEdges).toBe(true);
    });
  });

  // ============================================================
  // 4. loadProfiles — success
  // ============================================================
  describe('loadProfiles', () => {
    it('populates profiles array with backend schema fields', async () => {
      const mockProfiles = [
        {
          id: 'prof-001',
          canvasId: 'canvas-abc',
          name: 'React Standard',
          format: 'react' as const,
          scale: 100,
          includeNodes: true,
          includeEdges: true,
          createdAt: '2026-06-13T10:00:00Z',
          updatedAt: '2026-06-13T10:00:00Z',
        },
        {
          id: 'prof-002',
          canvasId: 'canvas-abc',
          name: 'SVG Light',
          format: 'svg' as const,
          scale: 75,
          includeNodes: false,
          includeEdges: true,
          createdAt: '2026-06-13T11:00:00Z',
          updatedAt: '2026-06-13T11:00:00Z',
        },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, profiles: mockProfiles }),
      });

      const { loadProfiles } = useExportProfileStore.getState();
      await loadProfiles('canvas-abc');

      const state = useExportProfileStore.getState();
      expect(state.profiles).toHaveLength(2);
      expect(state.profiles[0]).toMatchObject({ id: 'prof-001', name: 'React Standard', scale: 100 });
      expect(state.profiles[1]).toMatchObject({ id: 'prof-002', name: 'SVG Light', scale: 75 });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('handles empty profiles array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, profiles: [] }),
      });
      const { loadProfiles } = useExportProfileStore.getState();
      await loadProfiles('canvas-abc');
      expect(useExportProfileStore.getState().profiles).toEqual([]);
    });
  });

  // ============================================================
  // 5. loadProfiles — error
  // ============================================================
  describe('loadProfiles error', () => {
    it('sets error on 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ ok: false, error: 'Unauthorized' }),
      });
      const { loadProfiles } = useExportProfileStore.getState();
      await loadProfiles('canvas-abc');
      const state = useExportProfileStore.getState();
      expect(state.error).toBe('Unauthorized');
      expect(state.isLoading).toBe(false);
      expect(state.profiles).toEqual([]);
    });

    it('sets error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));
      const { loadProfiles } = useExportProfileStore.getState();
      await loadProfiles('canvas-abc');
      const state = useExportProfileStore.getState();
      expect(state.error).toBe('Network failure');
      expect(state.isLoading).toBe(false);
    });
  });

  // ============================================================
  // 6. createProfile — success
  // ============================================================
  describe('createProfile', () => {
    it('POSTs to /api/canvas/{canvasId}/export-profiles', async () => {
      useExportProfileStore.setState({
        currentCanvasId: 'canvas-abc',
        formName: 'New Profile',
        formFormat: 'svg',
        formScale: 150,
        formIncludeNodes: true,
        formIncludeEdges: false,
      });

      const createdProfile = {
        id: 'prof-new',
        canvasId: 'canvas-abc',
        name: 'New Profile',
        format: 'svg' as const,
        scale: 150,
        includeNodes: true,
        includeEdges: false,
        createdAt: '2026-06-13T12:00:00Z',
        updatedAt: '2026-06-13T12:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, profile: createdProfile }),
      });

      const { createProfile } = useExportProfileStore.getState();
      await createProfile('canvas-abc');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/canvas/canvas-abc/export-profiles',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('adds created profile to profiles array', async () => {
      useExportProfileStore.setState({
        currentCanvasId: 'canvas-abc',
        formName: 'New Profile',
        formFormat: 'svg',
        formScale: 150,
        formIncludeNodes: true,
        formIncludeEdges: false,
      });

      const createdProfile = {
        id: 'prof-new',
        canvasId: 'canvas-abc',
        name: 'New Profile',
        format: 'svg' as const,
        scale: 150,
        includeNodes: true,
        includeEdges: false,
        createdAt: '2026-06-13T12:00:00Z',
        updatedAt: '2026-06-13T12:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, profile: createdProfile }),
      });

      const { createProfile } = useExportProfileStore.getState();
      await createProfile('canvas-abc');

      const state = useExportProfileStore.getState();
      expect(state.profiles).toHaveLength(1);
      expect(state.profiles[0].id).toBe('prof-new');
      expect(state.profiles[0].scale).toBe(150);
      expect(state.profiles[0].includeNodes).toBe(true);
      expect(state.profiles[0].includeEdges).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('sets error when name is empty', async () => {
      useExportProfileStore.setState({ formName: '' });
      const { createProfile } = useExportProfileStore.getState();
      await createProfile('canvas-abc');
      expect(useExportProfileStore.getState().error).toBe('Profile name is required');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('sets error on server error during create', async () => {
      useExportProfileStore.setState({ formName: 'Test Profile' });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ ok: false, error: 'Duplicate name' }),
      });
      const { createProfile } = useExportProfileStore.getState();
      await createProfile('canvas-abc');
      expect(useExportProfileStore.getState().error).toBe('Duplicate name');
      expect(useExportProfileStore.getState().isLoading).toBe(false);
    });
  });

  // ============================================================
  // 7. deleteProfile
  // ============================================================
  describe('deleteProfile', () => {
    it('DELETEs to /api/canvas/{canvasId}/export-profiles?profileId=', async () => {
      useExportProfileStore.setState({
        currentCanvasId: 'canvas-abc',
        profiles: [
          {
            id: 'prof-001',
            canvasId: 'canvas-abc',
            name: 'Profile One',
            format: 'react' as const,
            scale: 100,
            includeNodes: true,
            includeEdges: true,
            createdAt: '2026-06-13T10:00:00Z',
            updatedAt: '2026-06-13T10:00:00Z',
          },
        ],
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

      const { deleteProfile } = useExportProfileStore.getState();
      await deleteProfile('canvas-abc', 'prof-001');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/canvas/canvas-abc/export-profiles?profileId=prof-001',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('removes profile from profiles array on success', async () => {
      useExportProfileStore.setState({
        currentCanvasId: 'canvas-abc',
        profiles: [
          {
            id: 'prof-001',
            canvasId: 'canvas-abc',
            name: 'Profile One',
            format: 'react' as const,
            scale: 100,
            includeNodes: true,
            includeEdges: true,
            createdAt: '2026-06-13T10:00:00Z',
            updatedAt: '2026-06-13T10:00:00Z',
          },
          {
            id: 'prof-002',
            canvasId: 'canvas-abc',
            name: 'Profile Two',
            format: 'svg' as const,
            scale: 100,
            includeNodes: false,
            includeEdges: true,
            createdAt: '2026-06-13T11:00:00Z',
            updatedAt: '2026-06-13T11:00:00Z',
          },
        ],
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

      const { deleteProfile } = useExportProfileStore.getState();
      await deleteProfile('canvas-abc', 'prof-001');

      const state = useExportProfileStore.getState();
      expect(state.profiles).toHaveLength(1);
      expect(state.profiles[0].id).toBe('prof-002');
    });

    it('sets error on server error during delete', async () => {
      useExportProfileStore.setState({
        currentCanvasId: 'canvas-abc',
        profiles: [
          {
            id: 'prof-001',
            canvasId: 'canvas-abc',
            name: 'Profile',
            format: 'react' as const,
            scale: 100,
            includeNodes: true,
            includeEdges: true,
            createdAt: '2026-06-13T10:00:00Z',
            updatedAt: '2026-06-13T10:00:00Z',
          },
        ],
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ ok: false, error: 'Not found' }),
      });

      const { deleteProfile } = useExportProfileStore.getState();
      await deleteProfile('canvas-abc', 'prof-001');

      expect(useExportProfileStore.getState().error).toBe('Not found');
    });
  });

  // ============================================================
  // 8. Form field setters
  // ============================================================
  describe('form field setters', () => {
    it('setFormName updates formName', () => {
      const { setFormName } = useExportProfileStore.getState();
      setFormName('Custom Name');
      expect(useExportProfileStore.getState().formName).toBe('Custom Name');
    });

    it('setFormFormat updates formFormat', () => {
      const { setFormFormat } = useExportProfileStore.getState();
      setFormFormat('svg');
      expect(useExportProfileStore.getState().formFormat).toBe('svg');
    });

    it('setFormScale updates formScale', () => {
      const { setFormScale } = useExportProfileStore.getState();
      setFormScale(50);
      expect(useExportProfileStore.getState().formScale).toBe(50);
    });

    it('setFormIncludeNodes updates formIncludeNodes', () => {
      const { setFormIncludeNodes } = useExportProfileStore.getState();
      setFormIncludeNodes(false);
      expect(useExportProfileStore.getState().formIncludeNodes).toBe(false);
    });

    it('setFormIncludeEdges updates formIncludeEdges', () => {
      const { setFormIncludeEdges } = useExportProfileStore.getState();
      setFormIncludeEdges(false);
      expect(useExportProfileStore.getState().formIncludeEdges).toBe(false);
    });
  });
});
