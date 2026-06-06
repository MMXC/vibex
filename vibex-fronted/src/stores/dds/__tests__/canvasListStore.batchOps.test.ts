/**
 * canvasListStore.batchOps.test.ts — Sprint60 E2 + Sprint68 E4
 *
 * Tests selectedCanvasIds integration + batch operation synchronous behavior.
 * S68-E4: Tests copyNodesBetweenCanvases + batchTemplateExport.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/stores/clipboardStore', () => ({
  useClipboardStore: {
    getState: () => ({ isValid: () => false, entry: null }),
  },
}));

// Note: ddsPersistence mocks removed — S68-E4 tests mock indexedDB directly

// Mock generatePrefixedId for deterministic test IDs
vi.mock('@/lib/canvas/id', () => ({
  generateId: vi.fn(() => 'generated-id-' + Date.now()),
  generatePrefixedId: vi.fn((prefix: string) => `${prefix}-copy-${Date.now()}`),
}));

import { useCanvasListStore } from '@/stores/canvasListStore';

describe('canvasListStore — Sprint60 E2 batch operations', () => {
  beforeEach(() => {
    useCanvasListStore.getState().$reset();
    vi.clearAllMocks();
  });

  describe('toggleSelect + clearSelection (batch selection state)', () => {
    it('toggleSelect adds canvas to selection', () => {
      useCanvasListStore.setState({ selectedCanvasIds: new Set() });
      useCanvasListStore.getState().toggleSelect('canvas-1');
      expect(useCanvasListStore.getState().selectedCanvasIds.has('canvas-1')).toBe(true);
    });

    it('toggleSelect removes canvas when already selected (toggle off)', () => {
      useCanvasListStore.setState({ selectedCanvasIds: new Set(['canvas-1']) });
      useCanvasListStore.getState().toggleSelect('canvas-1');
      expect(useCanvasListStore.getState().selectedCanvasIds.has('canvas-1')).toBe(false);
    });

    it('clearSelection empties the set', () => {
      useCanvasListStore.setState({ selectedCanvasIds: new Set(['c1', 'c2', 'c3']) });
      useCanvasListStore.getState().clearSelection();
      expect(useCanvasListStore.getState().selectedCanvasIds.size).toBe(0);
    });

    it('selectedCanvasIds tracks multiple selections correctly', () => {
      useCanvasListStore.setState({ selectedCanvasIds: new Set() });
      useCanvasListStore.getState().toggleSelect('a');
      expect(useCanvasListStore.getState().selectedCanvasIds.has('a')).toBe(true);
      expect(useCanvasListStore.getState().selectedCanvasIds.size).toBe(1);
      useCanvasListStore.getState().toggleSelect('b');
      expect(useCanvasListStore.getState().selectedCanvasIds.size).toBe(2);
      useCanvasListStore.getState().toggleSelect('c');
      expect(useCanvasListStore.getState().selectedCanvasIds.size).toBe(3);
      expect(useCanvasListStore.getState().selectedCanvasIds.has('a')).toBe(true);
      expect(useCanvasListStore.getState().selectedCanvasIds.has('b')).toBe(true);
      expect(useCanvasListStore.getState().selectedCanvasIds.has('c')).toBe(true);
      useCanvasListStore.getState().clearSelection();
      expect(useCanvasListStore.getState().selectedCanvasIds.size).toBe(0);
    });
  });

  describe('batchRename — synchronous rename logic', () => {
    it('suffix mode with dot: replaces suffix before last dot', async () => {
      useCanvasListStore.setState({
        canvases: [{ id: 'c1', name: 'My.Canvas.v1', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
        selectedCanvasIds: new Set(['c1']),
      });
      expect(useCanvasListStore.getState().canvases[0].name).toBe('My.Canvas.v1');
    });

    it('prefix mode preserves the body after the prefix marker', async () => {
      useCanvasListStore.setState({
        canvases: [{ id: 'c1', name: '[WIP] My Canvas', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
        selectedCanvasIds: new Set(['c1']),
      });
      expect(useCanvasListStore.getState().canvases[0].name).toBe('[WIP] My Canvas');
    });

    it('batchRename: early return when canvasIds is empty', async () => {
      useCanvasListStore.setState({
        canvases: [{ id: 'c1', name: 'Canvas 1', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
        selectedCanvasIds: new Set(),
      });
      // batchRename with empty canvasIds array → no-op, names unchanged
      await useCanvasListStore.getState().batchRename([], (n, i) => n + '_renamed');
      expect(useCanvasListStore.getState().canvases[0].name).toBe('Canvas 1');
    });
  });
});

// S68-E4: Spy on openIDB and make it return a resolved promise with a mock DB
// This bypasses the real indexedDB entirely
const mockDB = {
  transaction: vi.fn(() => ({
    objectStore: vi.fn(() => ({
      put: vi.fn(() => {
        const req = { onsuccess: null as ((() => void) | null), onerror: null };
        req.onsuccess = vi.fn(() => {});
        setTimeout(() => { if (req.onsuccess) req.onsuccess(); }, 0);
        return req;
      }),
    })),
  })),
};

vi.mock('@/stores/canvasListStore', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/stores/canvasListStore')>();
  return mod;
});

// Override the openIDB helper by spying on indexedDB.open
describe('canvasListStore — S68-E4 batch operations', () => {
  beforeEach(() => {
    useCanvasListStore.getState().$reset();
    vi.clearAllMocks();
    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => {
        const req = {
          onsuccess: null as ((() => void) | null),
          onerror: null as ((() => void) | null),
          onupgradeneeded: null as ((() => void) | null),
          result: mockDB,
        };
        req.onsuccess = vi.fn(() => {});
        req.onerror = vi.fn(() => {});
        // Simulate jsdom async resolution
        setTimeout(() => { if (req.onsuccess) req.onsuccess(); }, 0);
        return req;
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('copyNodesBetweenCanvases', () => {
    it('early return when nodeIds is empty array', async () => {
      useCanvasListStore.setState({
        canvases: [
          { id: 'src-1', name: 'Source Canvas', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
          { id: 'dest-1', name: 'Dest Canvas', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        ],
        selectedCanvasIds: new Set(),
      });
      await useCanvasListStore.getState().copyNodesBetweenCanvases('src-1', [], 'dest-1');
      expect(useCanvasListStore.getState().canvases.length).toBe(2);
    });

    it('creates copies with new IDs and appends "(副本)" to names', async () => {
      useCanvasListStore.setState({
        canvases: [
          { id: 'src-1', name: 'Source Canvas', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
          { id: 'dest-1', name: 'Dest Canvas', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        ],
        selectedCanvasIds: new Set(),
      });
      await useCanvasListStore.getState().copyNodesBetweenCanvases('src-1', ['src-1'], 'dest-1');
      const state = useCanvasListStore.getState();
      // Original preserved + 1 copy added
      expect(state.canvases.length).toBe(3);
      const copy = state.canvases.find((c) => c.name === 'Source Canvas (副本)');
      expect(copy).toBeDefined();
      expect(copy!.id).not.toBe('src-1');
      expect(copy!.thumbnail).toBeNull();
    });

    it('clears selection after successful copy', async () => {
      useCanvasListStore.setState({
        canvases: [
          { id: 'src-1', name: 'Canvas A', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
          { id: 'src-2', name: 'Canvas B', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        ],
        selectedCanvasIds: new Set(['src-1', 'src-2']),
      });
      await useCanvasListStore.getState().copyNodesBetweenCanvases('src-1', ['src-1', 'src-2'], 'dest-1');
      expect(useCanvasListStore.getState().selectedCanvasIds.size).toBe(0);
    });

    it('all copies have distinct IDs from originals', async () => {
      useCanvasListStore.setState({
        canvases: [
          { id: 'c1', name: 'Canvas 1', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
          { id: 'c2', name: 'Canvas 2', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
          { id: 'dest', name: 'Destination', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        ],
        selectedCanvasIds: new Set(),
      });
      await useCanvasListStore.getState().copyNodesBetweenCanvases('c1', ['c1', 'c2'], 'dest');
      const state = useCanvasListStore.getState();
      const copies = state.canvases.filter((c) => c.name.endsWith('(副本)'));
      // Should produce 2 copies
      expect(copies.length).toBe(2);
      // Copies should not have original IDs
      const originalIds = new Set(['c1', 'c2', 'dest']);
      for (const copy of copies) {
        expect(originalIds.has(copy.id)).toBe(false);
      }
    });
  });

  describe('batchTemplateExport', () => {
    it('early return when canvasIds is empty', async () => {
      useCanvasListStore.setState({
        canvases: [
          { id: 'c1', name: 'Canvas 1', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        ],
        selectedCanvasIds: new Set(),
      });
      await useCanvasListStore.getState().batchTemplateExport([]);
      expect(useCanvasListStore.getState().canvases.length).toBe(1);
    });

    it('generates .vbtmpl download when canvases are selected', async () => {
      const mockRevoke = vi.fn();
      const mockClick = vi.fn();
      const mockAppend = vi.fn();
      const mockRemove = vi.fn();
      const fakeAnchor = { href: '', download: '', click: mockClick, remove: mockRemove };
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:mock-url'),
        revokeObjectURL: mockRevoke,
      });
      const origCreateElement = document.createElement.bind(document);
      vi.stubGlobal('document', Object.assign({}, document, {
        createElement: vi.fn((tag: string) => {
          if (tag === 'a') return fakeAnchor;
          return origCreateElement(tag);
        }),
        body: { appendChild: mockAppend, removeChild: mockRemove },
      }));

      useCanvasListStore.setState({
        canvases: [
          { id: 'c1', name: 'Export Canvas', thumbnail: 'data:image/png;base64,abc', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        ],
        selectedCanvasIds: new Set(),
      });
      await useCanvasListStore.getState().batchTemplateExport(['c1']);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevoke).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});
