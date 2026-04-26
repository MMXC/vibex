/**
 * serialize.ts — Tests
 * E4-U2: 三树数据序列化
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  serializeThreeTrees,
  deserializeThreeTrees,
  restoreStore,
  serializeToJson,
  CURRENT_SCHEMA_VERSION,
  serializeCanvasToJSON,
  deserializeCanvasFromJSON,
  serializeCanvasDocumentToJSON,
  type CanvasSnapshotData,
} from '../serialize';

// Mock stores for serializeThreeTrees
const mockContextNodes = [];
const mockFlowNodes = [];
const mockComponentNodes = [];

const mockSetContextNodes = vi.fn();
const mockSetFlowNodes = vi.fn();
const mockSetComponentNodes = vi.fn();

vi.mock('@/lib/canvas/stores/contextStore', () => ({
  useContextStore: Object.assign(
    () => ({}),
    {
      getState: () => ({
        contextNodes: mockContextNodes,
        setContextNodes: mockSetContextNodes,
      }),
    }
  ),
}));

vi.mock('@/lib/canvas/stores/flowStore', () => ({
  useFlowStore: Object.assign(
    () => ({}),
    {
      getState: () => ({
        flowNodes: mockFlowNodes,
        setFlowNodes: mockSetFlowNodes,
      }),
    }
  ),
}));

vi.mock('@/lib/canvas/stores/componentStore', () => ({
  useComponentStore: Object.assign(
    () => ({}),
    {
      getState: () => ({
        componentNodes: mockComponentNodes,
        setComponentNodes: mockSetComponentNodes,
      }),
    }
  ),
}));

describe('serializeThreeTrees', () => {
  it('should serialize empty trees', () => {
    const data = serializeThreeTrees();
    expect(data.version).toBe(1);
    expect(data.savedAt).toBeTruthy();
    expect(Array.isArray(data.contextNodes)).toBe(true);
    expect(Array.isArray(data.flowNodes)).toBe(true);
    expect(Array.isArray(data.componentNodes)).toBe(true);
  });
});

describe('deserializeThreeTrees', () => {
  it('should deserialize valid JSON', () => {
    const validData: CanvasSnapshotData = {
      version: 1,
      savedAt: '2026-04-16T00:00:00.000Z',
      contextNodes: [],
      flowNodes: [],
      componentNodes: [],
    };
    const json = JSON.stringify(validData);
    const result = deserializeThreeTrees(json);
    expect(result.version).toBe(1);
    expect(result.contextNodes).toHaveLength(0);
  });

  it('should throw for unsupported version', () => {
    const badData = JSON.stringify({ version: 99, savedAt: '', contextNodes: [], flowNodes: [], componentNodes: [] });
    expect(() => deserializeThreeTrees(badData)).toThrow(/不支持的数据版本/);
  });

  it('should throw for invalid JSON', () => {
    expect(() => deserializeThreeTrees('not json')).toThrow();
  });

  // E4-U2: 覆盖 line 45 - savedAt fallback
  it('should use fallback savedAt when missing', () => {
    const dataNoSavedAt = JSON.stringify({ version: 1, contextNodes: [], flowNodes: [], componentNodes: [] });
    const result = deserializeThreeTrees(dataNoSavedAt);
    expect(result.savedAt).toBeTruthy();
  });

  // E4-U2: 覆盖 version 0 error path
  it('should throw for string version', () => {
    const data = JSON.stringify({ version: '1', savedAt: '', contextNodes: [], flowNodes: [], componentNodes: [] });
    expect(() => deserializeThreeTrees(data)).toThrow();
  });
  it('should throw for version 0', () => {
    const data = JSON.stringify({ version: 0, savedAt: '', contextNodes: [], flowNodes: [], componentNodes: [] });
    expect(() => deserializeThreeTrees(data)).toThrow(/不支持的数据版本/);
  });
});

describe('restoreStore', () => {
  beforeEach(() => {
    mockSetContextNodes.mockClear();
    mockSetFlowNodes.mockClear();
    mockSetComponentNodes.mockClear();
  });

  // E4-U2: 覆盖 line 66-72 - Zustand state setters
  it('should restore all three trees', () => {
    const data: CanvasSnapshotData = {
      version: 1,
      savedAt: '2026-04-16T00:00:00.000Z',
      contextNodes: [{ nodeId: 'c1', name: 'Ctx', description: '', type: 'core' }],
      flowNodes: [{ nodeId: 'f1', name: 'Flow', description: '' }],
      componentNodes: [{ nodeId: 'co1', name: 'Comp', description: '', type: 'atomic' }],
    };

    restoreStore(data);
    expect(mockSetContextNodes).toHaveBeenCalledWith(data.contextNodes);
    expect(mockSetFlowNodes).toHaveBeenCalledWith(data.flowNodes);
    expect(mockSetComponentNodes).toHaveBeenCalledWith(data.componentNodes);
  });

  it('should handle empty arrays', () => {
    const data: CanvasSnapshotData = {
      version: 1,
      savedAt: '2026-04-16T00:00:00.000Z',
      contextNodes: [],
      flowNodes: [],
      componentNodes: [],
    };
    restoreStore(data);
    expect(mockSetContextNodes).toHaveBeenCalledWith([]);
    expect(mockSetFlowNodes).toHaveBeenCalledWith([]);
    expect(mockSetComponentNodes).toHaveBeenCalledWith([]);
  });
});

describe('serializeCanvasToJSON', () => {
  it('should serialize chapters to CanvasDocument with correct schemaVersion', () => {
    const chapters = [
      {
        type: 'requirement' as const,
        cards: [{ id: 'card1', type: 'user-story' as const, role: 'dev', action: 'code', benefit: 'ship', position: { x: 0, y: 0 }, createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z', priority: 'high' }],
        edges: [],
        loading: false,
        error: null,
      },
    ];
    const crossChapterEdges: import('@/types/dds').DDSEdge[] = [];
    const doc = serializeCanvasToJSON(chapters, crossChapterEdges);

    expect(doc.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(doc.metadata.name).toBe('VibeX Canvas');
    expect(doc.metadata.createdAt).toBeTruthy();
    expect(doc.metadata.exportedAt).toBeTruthy();
    expect(doc.chapters).toHaveLength(1);
    expect(doc.chapters[0].type).toBe('requirement');
    expect(doc.crossChapterEdges).toHaveLength(0);
  });

  it('should include crossChapterEdges in serialized output', () => {
    const chapters = [{ type: 'requirement' as const, cards: [], edges: [], loading: false, error: null }];
    const crossChapterEdges: import('@/types/dds').DDSEdge[] = [
      { id: 'e1', source: 'card1', target: 'card2', type: 'smoothstep', label: 'uses' },
    ];
    const doc = serializeCanvasToJSON(chapters, crossChapterEdges);

    expect(doc.crossChapterEdges).toHaveLength(1);
    expect(doc.crossChapterEdges[0].id).toBe('e1');
    expect(doc.crossChapterEdges[0].sourceChapterId).toBe('card1');
  });

  it('should roundtrip serialize -> deserialize correctly', () => {
    const chapters = [
      { type: 'flow' as const, cards: [], edges: [], loading: false, error: null },
      { type: 'api' as const, cards: [], edges: [], loading: false, error: null },
    ];
    const crossChapterEdges: import('@/types/dds').DDSEdge[] = [];
    const doc = serializeCanvasToJSON(chapters, crossChapterEdges);
    const json = serializeCanvasDocumentToJSON(doc);
    const parsed = JSON.parse(json);
    const { chapters: deserialized } = deserializeCanvasFromJSON(parsed as import('@/types/canvas-document').CanvasDocument);

    expect(deserialized).toHaveLength(2);
    expect(deserialized[0].type).toBe('flow');
    expect(deserialized[1].type).toBe('api');
  });

  it('should include correct schemaVersion in output', () => {
    const doc = serializeCanvasToJSON([], []);
    expect(doc.schemaVersion).toMatch(/^1\./);
  });
});

describe('deserializeCanvasFromJSON', () => {
  it('should deserialize valid CanvasDocument', () => {
    const doc: import('@/types/canvas-document').CanvasDocument = {
      schemaVersion: '1.2.0',
      metadata: {
        name: 'Test',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
      chapters: [
        { type: 'context', cards: [], edges: [], loading: false, error: null },
      ],
      crossChapterEdges: [],
    };

    const { chapters, warnings } = deserializeCanvasFromJSON(doc);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].type).toBe('context');
    expect(warnings).toHaveLength(0);
  });

  it('should warn on unknown schema version but still succeed (forward compat)', () => {
    const doc: import('@/types/canvas-document').CanvasDocument = {
      schemaVersion: '99.0.0',
      metadata: { name: 'Test', createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' },
      chapters: [{ type: 'requirement', cards: [], edges: [], loading: false, error: null }],
      crossChapterEdges: [],
    };

    const { chapters, warnings } = deserializeCanvasFromJSON(doc);
    expect(chapters).toHaveLength(1);
    expect(warnings.some((w) => w.includes('99.0.0'))).toBe(true);
  });

  it('should warn on unknown metadata fields but not throw', () => {
    const doc: import('@/types/canvas-document').CanvasDocument = {
      schemaVersion: '1.2.0',
      metadata: {
        name: 'Test',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
        unknownField: 'ignored',
      } as import('@/types/canvas-document').CanvasDocument['metadata'],
      chapters: [{ type: 'requirement', cards: [], edges: [], loading: false, error: null }],
      crossChapterEdges: [],
    };

    const { warnings } = deserializeCanvasFromJSON(doc);
    expect(warnings.some((w) => w.includes('unknownField'))).toBe(true);
  });

  it('should skip unknown chapter types with warning', () => {
    const doc: import('@/types/canvas-document').CanvasDocument = {
      schemaVersion: '1.2.0',
      metadata: { name: 'Test', createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' },
      chapters: [
        { type: 'requirement', cards: [], edges: [], loading: false, error: null },
        { type: 'unknown-chapter-type' as any, cards: [], edges: [], loading: false, error: null },
      ],
      crossChapterEdges: [],
    };

    const { chapters, warnings } = deserializeCanvasFromJSON(doc);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].type).toBe('requirement');
    expect(warnings.some((w) => w.includes('unknown-chapter-type'))).toBe(true);
  });

  it('should forward-compat: strip unknown fields from chapters', () => {
    const doc = {
      schemaVersion: '1.2.0',
      metadata: { name: 'Test', createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' },
      chapters: [
        { type: 'requirement', cards: [], edges: [], loading: false, error: null, unknownField: 'should be stripped' },
      ],
      crossChapterEdges: [],
    };

    const { chapters } = deserializeCanvasFromJSON(doc as import('@/types/canvas-document').CanvasDocument);
    expect((chapters[0] as Record<string, unknown>).unknownField).toBeUndefined();
  });
});

describe('serializeCanvasDocumentToJSON', () => {
  it('should produce valid JSON string', () => {
    const doc: import('@/types/canvas-document').CanvasDocument = {
      schemaVersion: '1.2.0',
      metadata: { name: 'Test', createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' },
      chapters: [],
      crossChapterEdges: [],
    };
    const json = serializeCanvasDocumentToJSON(doc);
    const parsed = JSON.parse(json);
    expect(parsed.schemaVersion).toBe('1.2.0');
    expect(parsed.chapters).toEqual([]);
  });

  it('should produce pretty-printed (indented) JSON', () => {
    const doc: import('@/types/canvas-document').CanvasDocument = {
      schemaVersion: '1.2.0',
      metadata: { name: 'Test', createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' },
      chapters: [{ type: 'api', cards: [], edges: [], loading: false, error: null }],
      crossChapterEdges: [],
    };
    const json = serializeCanvasDocumentToJSON(doc);
    // Indented JSON should have newlines
    expect(json).toContain('\n');
  });
});


