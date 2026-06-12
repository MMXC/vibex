/**
 * versionStore.test.ts — Sprint93 E1: Canvas Version History
 *
 * Tests:
 * 1. fetchVersions — calls API and stores result
 * 2. createVersion — calls API, prepends new version to list
 * 3. restoreVersion — calls restore API
 * 4. setPreviewVersion / setPanelOpen / clearError
 * 5. persist — only isPanelOpen is persisted
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVersionStore } from '../versionStore';

// ============================================
// Mock fetch + localStorage
// ============================================

const mockFetch = vi.fn();
const mockLocalStorage = vi.hoisted(() => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach((k) => { delete store[k]; }); }),
    store,
  };
});

vi.stubGlobal('fetch', mockFetch);
vi.stubGlobal('localStorage', mockLocalStorage);

describe('useVersionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    // Reset store state
    useVersionStore.setState({
      versionsByCanvas: {},
      previewVersionId: null,
      isPanelOpen: false,
      isLoading: false,
      error: null,
    });
  });

  // ---- fetchVersions ----

  it('fetchVersions calls API and stores result', async () => {
    const mockVersions = [
      {
        id: 'v1',
        canvasId: 'c1',
        versionNumber: 2,
        snapshotData: '{}',
        description: 'Test',
        createdBy: 'user-001',
        createdAt: 1718300000,
      },
      {
        id: 'v2',
        canvasId: 'c1',
        versionNumber: 1,
        snapshotData: '{}',
        description: null,
        createdBy: 'user-001',
        createdAt: 1718200000,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, versions: mockVersions }),
    });

    await useVersionStore.getState().fetchVersions('c1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/canvas/c1/versions'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(useVersionStore.getState().versionsByCanvas['c1']).toEqual(mockVersions);
    expect(useVersionStore.getState().isLoading).toBe(false);
  });

  it('fetchVersions sets error on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ ok: false, error: 'Server error' }),
    });

    await useVersionStore.getState().fetchVersions('c1');
    expect(useVersionStore.getState().error).toContain('Failed to fetch');
    expect(useVersionStore.getState().isLoading).toBe(false);
  });

  // ---- createVersion ----

  it('createVersion calls POST API and prepends version to list', async () => {
    const newVersion = {
      id: 'v-new',
      canvasId: 'c1',
      versionNumber: 3,
      snapshotData: '{}',
      description: 'New snapshot',
      createdBy: 'user-001',
      createdAt: 1718400000,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, version: newVersion }),
    });

    // Seed with existing versions
    useVersionStore.setState({
      versionsByCanvas: {
        c1: [
          {
            id: 'v1',
            canvasId: 'c1',
            versionNumber: 1,
            snapshotData: '{}',
            description: null,
            createdBy: 'user-001',
            createdAt: 1718200000,
          },
        ],
      },
    });

    const result = await useVersionStore.getState().createVersion('c1', '{}', 'New snapshot');

    expect(result).toEqual(newVersion);
    expect(useVersionStore.getState().versionsByCanvas['c1']![0]).toEqual(newVersion);
    expect(useVersionStore.getState().versionsByCanvas['c1']).toHaveLength(2);
  });

  it('createVersion returns null on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ ok: false }),
    });

    const result = await useVersionStore.getState().createVersion('c1', '{}');
    expect(result).toBeNull();
    expect(useVersionStore.getState().error).toContain('Failed to create');
  });

  // ---- restoreVersion ----

  it('restoreVersion calls PATCH API and returns version', async () => {
    useVersionStore.setState({
      versionsByCanvas: {
        c1: [
          {
            id: 'v2',
            canvasId: 'c1',
            versionNumber: 2,
            snapshotData: '{}',
            description: null,
            createdBy: 'user-001',
            createdAt: 1718300000,
          },
          {
            id: 'v1',
            canvasId: 'c1',
            versionNumber: 1,
            snapshotData: '{}',
            description: null,
            createdBy: 'user-001',
            createdAt: 1718200000,
          },
        ],
      },
    });

    const restoredVersion = {
      id: 'v1',
      canvasId: 'c1',
      versionNumber: 1,
      snapshotData: '{}',
      description: null,
      createdBy: 'user-001',
      createdAt: 1718200000,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, version: restoredVersion }),
    });

    const result = await useVersionStore.getState().restoreVersion('v1');
    expect(result).toEqual(restoredVersion);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/canvas/c1/versions/v1/restore'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('restoreVersion returns null when version not in store', async () => {
    useVersionStore.setState({ versionsByCanvas: {} });
    const result = await useVersionStore.getState().restoreVersion('v1');
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ---- setPreviewVersion ----

  it('setPreviewVersion updates previewVersionId', () => {
    useVersionStore.getState().setPreviewVersion('v1');
    expect(useVersionStore.getState().previewVersionId).toBe('v1');
    useVersionStore.getState().setPreviewVersion(null);
    expect(useVersionStore.getState().previewVersionId).toBeNull();
  });

  // ---- setPanelOpen ----

  it('setPanelOpen updates isPanelOpen and clears preview on close', () => {
    useVersionStore.setState({ previewVersionId: 'v1' });
    useVersionStore.getState().setPanelOpen(true);
    expect(useVersionStore.getState().isPanelOpen).toBe(true);

    useVersionStore.getState().setPanelOpen(false);
    expect(useVersionStore.getState().isPanelOpen).toBe(false);
    expect(useVersionStore.getState().previewVersionId).toBeNull();
  });

  // ---- clearError ----

  it('clearError sets error to null', () => {
    useVersionStore.setState({ error: 'Some error' });
    useVersionStore.getState().clearError();
    expect(useVersionStore.getState().error).toBeNull();
  });
});
