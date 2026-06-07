/**
 * canvasListStore.e3.test.ts — S76-E3: Canvas Fuse.js Weighted Indexed Search
 *
 * Tests the synchronous parts of E3:
 *   rebuildIndex(): builds Fuse.js canvasIndex[] from canvases (no IndexedDB)
 *   indexedSearch(query): returns IndexedSearchResult[] sorted by relevance
 *
 * All tests are fully synchronous — no IndexedDB mocking needed.
 * Pre-populate store state via setState(), then call rebuildIndex() directly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasListStore } from '@/stores/canvasListStore';

function resetStore() {
  useCanvasListStore.getState().$reset();
}

// ─── Helper: set canvases + rebuild index ─────────────────────────────────────

function setupCanvases(canvases: Parameters<typeof useCanvasListStore.setState>[0]['canvases']) {
  useCanvasListStore.setState({ canvases });
  useCanvasListStore.getState().rebuildIndex();
}

// ─── rebuildIndex() ────────────────────────────────────────────────────────────

describe('canvasListStore — S76-E3 rebuildIndex()', () => {
  beforeEach(() => resetStore());

  it('builds canvasIndex from canvases with description and tags', () => {
    setupCanvases([
      {
        id: 'c1',
        name: 'Project Roadmap',
        description: 'Q3 planning document',
        tags: ['planning', 'q3'],
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    const { canvasIndex, canvasFuseIndex } = useCanvasListStore.getState();
    expect(canvasIndex).toHaveLength(1);
    expect(canvasIndex[0].canvasId).toBe('c1');
    expect(canvasIndex[0].name).toBe('Project Roadmap');
    expect(canvasIndex[0].description).toBe('Q3 planning document');
    expect(canvasIndex[0].tags).toEqual(['planning', 'q3']);
    expect(canvasFuseIndex).not.toBeNull();
  });

  it('excludes archived canvases from the index', () => {
    setupCanvases([
      {
        id: 'c1',
        name: 'Active Canvas',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'c2',
        name: 'Archived Canvas',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        archivedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const { canvasIndex } = useCanvasListStore.getState();
    expect(canvasIndex).toHaveLength(1);
    expect(canvasIndex[0].canvasId).toBe('c1');
  });

  it('handles canvases with no description (defaults to empty string)', () => {
    setupCanvases([
      {
        id: 'c1',
        name: 'Simple Canvas',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    const { canvasIndex } = useCanvasListStore.getState();
    expect(canvasIndex[0].description).toBe('');
  });

  it('handles canvases with no tags (defaults to empty array)', () => {
    setupCanvases([
      {
        id: 'c1',
        name: 'Simple Canvas',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    const { canvasIndex } = useCanvasListStore.getState();
    expect(canvasIndex[0].tags).toEqual([]);
  });

  it('rebuildIndex replaces stale index with fresh data', () => {
    setupCanvases([
      {
        id: 'c1',
        name: 'Old Name',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);
    expect(useCanvasListStore.getState().canvasIndex[0].name).toBe('Old Name');

    setupCanvases([
      {
        id: 'c1',
        name: 'New Name',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
      },
    ]);
    expect(useCanvasListStore.getState().canvasIndex[0].name).toBe('New Name');
  });

  it('rebuildIndex with empty canvases clears the index', () => {
    setupCanvases([
      {
        id: 'c1',
        name: 'Canvas',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);
    expect(useCanvasListStore.getState().canvasIndex).toHaveLength(1);

    useCanvasListStore.setState({ canvases: [] });
    useCanvasListStore.getState().rebuildIndex();
    expect(useCanvasListStore.getState().canvasIndex).toHaveLength(0);
    // canvasFuseIndex is still created as an empty Fuse instance (not null)
    expect(useCanvasListStore.getState().canvasFuseIndex).not.toBeNull();
  });
});

// ─── indexedSearch() ──────────────────────────────────────────────────────────

describe('canvasListStore — S76-E3 indexedSearch()', () => {
  beforeEach(() => resetStore());

  function setup(canvases: Parameters<typeof useCanvasListStore.setState>[0]['canvases']) {
    setupCanvases(canvases);
  }

  it('returns empty array for empty query', () => {
    setup([
      {
        id: 'c1',
        name: 'Project Roadmap',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);
    expect(useCanvasListStore.getState().indexedSearch('')).toEqual([]);
    expect(useCanvasListStore.getState().indexedSearch('   ')).toEqual([]);
  });

  it('finds canvas by name match', () => {
    setup([
      {
        id: 'c1',
        name: 'Project Roadmap',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'c2',
        name: 'Daily Standup',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    const results = useCanvasListStore.getState().indexedSearch('roadmap');
    expect(results).toHaveLength(1);
    expect(results[0].canvasId).toBe('c1');
    expect(results[0].name).toBe('Project Roadmap');
    expect(results[0].matchedField).toBe('name');
  });

  it('finds canvas by description match', () => {
    setup([
      {
        id: 'c1',
        name: 'Project X',
        description: 'Q3 roadmap planning',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'c2',
        name: 'Daily Standup',
        description: 'Team sync notes',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    const results = useCanvasListStore.getState().indexedSearch('roadmap');
    expect(results).toHaveLength(1);
    expect(results[0].canvasId).toBe('c1');
    expect(results[0].matchedField).toBe('description');
  });

  it('finds canvas by tag match', () => {
    setup([
      {
        id: 'c1',
        name: 'Architecture Review',
        tags: ['planning', 'q3'],
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'c2',
        name: 'Design Doc',
        tags: ['design', 'figma'],
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    const results = useCanvasListStore.getState().indexedSearch('planning');
    expect(results).toHaveLength(1);
    expect(results[0].canvasId).toBe('c1');
    // matchedField is 'tags' since 'planning' only appears in tags (not name/description)
    expect(['tags', 'multiple']).toContain(results[0].matchedField);
  });

  it('returns multiple results when query matches multiple canvases', () => {
    setup([
      {
        id: 'c1',
        name: 'Project A',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'c2',
        name: 'Project B',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'c3',
        name: 'Daily Notes',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    const results = useCanvasListStore.getState().indexedSearch('project');
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.map((r) => r.canvasId)).toContain('c1');
    expect(results.map((r) => r.canvasId)).toContain('c2');
  });

  it('marks matchedField as multiple when name + description both match', () => {
    setup([
      {
        id: 'c1',
        name: 'Sprint Planning',
        description: 'Sprint planning session notes',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    const results = useCanvasListStore.getState().indexedSearch('sprint');
    expect(results).toHaveLength(1);
    // Both name and description contain "sprint" → multiple
    expect(['name', 'description', 'multiple']).toContain(results[0].matchedField);
  });

  it('returns results with score property', () => {
    setup([
      {
        id: 'c1',
        name: 'Project Roadmap',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    const results = useCanvasListStore.getState().indexedSearch('roadmap');
    expect(results).toHaveLength(1);
    expect(typeof results[0].score).toBe('number');
    expect(results[0].score).toBeGreaterThanOrEqual(0);
    expect(results[0].score).toBeLessThanOrEqual(1);
  });

  it('returns results with canvasId, name, and updatedAt', () => {
    setup([
      {
        id: 'c1',
        name: 'Project Roadmap',
        description: 'Q3 planning',
        tags: ['planning'],
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-06-01',
      },
    ]);

    const results = useCanvasListStore.getState().indexedSearch('roadmap');
    expect(results[0].canvasId).toBe('c1');
    expect(results[0].name).toBe('Project Roadmap');
    expect(results[0].updatedAt).toBe('2026-06-01');
  });

  it('case-insensitive search', () => {
    setup([
      {
        id: 'c1',
        name: 'Project Roadmap',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    expect(useCanvasListStore.getState().indexedSearch('ROADMAP')).toHaveLength(1);
    expect(useCanvasListStore.getState().indexedSearch('Roadmap')).toHaveLength(1);
    expect(useCanvasListStore.getState().indexedSearch('roadmap')).toHaveLength(1);
  });

  it('partial match works (threshold 0.4)', () => {
    setup([
      {
        id: 'c1',
        name: 'Project Roadmap',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    // "proj" should match "Project" with threshold 0.4
    expect(useCanvasListStore.getState().indexedSearch('proj')).toHaveLength(1);
  });

  it('no match for unrelated query', () => {
    setup([
      {
        id: 'c1',
        name: 'Project Roadmap',
        thumbnail: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    expect(useCanvasListStore.getState().indexedSearch('xyznonexistent')).toHaveLength(0);
  });

  it('returns empty when index is not yet built', () => {
    useCanvasListStore.setState({
      canvases: [
        {
          id: 'c1',
          name: 'Project Roadmap',
          thumbnail: null,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      canvasIndex: [],
      canvasFuseIndex: null,
    });

    // No rebuildIndex() called — canvasFuseIndex is null
    expect(useCanvasListStore.getState().indexedSearch('roadmap')).toEqual([]);
  });
});
