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

describe('serializeToJson', () => {
  it('should serialize to JSON string', () => {
    const data: CanvasSnapshotData = {
      version: 1,
      savedAt: '2026-04-16T00:00:00.000Z',
      contextNodes: [],
      flowNodes: [],
      componentNodes: [],
    };
    const json = serializeToJson(data);
    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(1);
  });
});
