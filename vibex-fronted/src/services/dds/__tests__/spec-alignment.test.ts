/**
 * spec-alignment.test.ts — Sprint4 QA E3-U1: E4 Spec 对齐测试
 *
 * 验收标准: spec-alignment.test.ts 包含 exportDDSCanvasData 和
 * exportToStateMachine 的 Spec 对齐测试
 */

import { describe, it, expect } from 'vitest';
import { exportDDSCanvasData, exportToStateMachine } from '../exporter';

describe('E4 Spec Alignment', () => {
  it('exportDDSCanvasData 返回 string', () => {
    const result = exportDDSCanvasData([]);
    expect(typeof result).toBe('string');
  });

  it('返回 JSON 含 openapi 3.0.x', () => {
    const spec = JSON.parse(exportDDSCanvasData([]));
    expect(spec.openapi).toMatch(/^3\.0\.\d+$/);
  });

  it('exportToStateMachine 返回 string', () => {
    const result = exportToStateMachine([]);
    expect(typeof result).toBe('string');
  });

  it('exportToStateMachine 不含 smVersion', () => {
    const sm = JSON.parse(exportToStateMachine([]));
    expect(sm.smVersion).toBeUndefined();
  });

  it('exportDDSCanvasData 含 info.title 和 paths', () => {
    const spec = JSON.parse(exportDDSCanvasData([]));
    expect(spec.info).toBeDefined();
    expect(spec.paths).toBeDefined();
    expect(typeof spec.paths).toBe('object');
  });
});
