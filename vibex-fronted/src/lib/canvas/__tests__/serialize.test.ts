/**
 * serialize.ts — Tests
 * E4-U2: 三树数据序列化
 */
import { describe, it, expect } from 'vitest';
import {
  serializeThreeTrees,
  deserializeThreeTrees,
  restoreStore,
  serializeToJson,
  type CanvasSnapshotData,
} from '../serialize';

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
