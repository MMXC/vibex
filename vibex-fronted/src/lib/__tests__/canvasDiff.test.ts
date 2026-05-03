/**
 * P005 CanvasDiff 核心算法测试
 */

import { compareCanvasProjects, exportDiffReport } from '../canvasDiff';
import type { CanvasProject } from '../canvasDiff';

const makeProject = (id: string, name: string, contexts = [], flows = [], components = []): CanvasProject => ({
  id, name, contextNodes: contexts, flowNodes: flows, componentNodes: components,
});

describe('compareCanvasProjects', () => {
  it('完全相同的两个项目返回 unchanged', () => {
    const ctx = { nodeId: 'ctx1', name: '用户管理', type: 'core' as const, children: [], status: 'confirmed' as const };
    const p = makeProject('p1', 'Test', [ctx as any], [], []);
    const result = compareCanvasProjects(p, p);
    expect(result.unchanged).toHaveLength(1);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.modified).toHaveLength(0);
  });

  it('B 新增节点在 added 中', () => {
    const ctxA = { nodeId: 'ctx1', name: 'Context A', type: 'core' as const, children: [], status: 'confirmed' as const };
    const ctxB = { nodeId: 'ctx1', name: 'Context A', type: 'core' as const, children: [], status: 'confirmed' as const };
    const ctxNew = { nodeId: 'ctx2', name: 'New Context', type: 'supporting' as const, children: [], status: 'pending' as const };
    const a = makeProject('a', 'A', [ctxA as any], [], []);
    const b = makeProject('b', 'B', [ctxB as any, ctxNew as any], [], []);
    const result = compareCanvasProjects(a, b);
    expect(result.added).toHaveLength(1);
    expect(result.removed).toHaveLength(0);
    expect(result.added[0].node.nodeId).toBe('ctx2');
  });

  it('A 移除的节点在 removed 中', () => {
    const ctxA = { nodeId: 'ctx1', name: 'Context A', type: 'core' as const, children: [], status: 'confirmed' as const };
    const ctxB = { nodeId: 'ctx1', name: 'Context A', type: 'core' as const, children: [], status: 'confirmed' as const };
    const ctxOld = { nodeId: 'ctx2', name: 'Old Context', type: 'supporting' as const, children: [], status: 'confirmed' as const };
    const a = makeProject('a', 'A', [ctxA as any, ctxOld as any], [], []);
    const b = makeProject('b', 'B', [ctxB as any], [], []);
    const result = compareCanvasProjects(a, b);
    expect(result.removed).toHaveLength(1);
    expect(result.removed[0].node.nodeId).toBe('ctx2');
  });

  it('修改的节点在 modified 中（deepEqual 检测）', () => {
    const ctxA = { nodeId: 'ctx1', name: 'Context A', type: 'core' as const, children: [], status: 'confirmed' as const };
    const ctxB = { nodeId: 'ctx1', name: 'Context Modified', type: 'core' as const, children: [], status: 'confirmed' as const };
    const a = makeProject('a', 'A', [ctxA as any], [], []);
    const b = makeProject('b', 'B', [ctxB as any], [], []);
    const result = compareCanvasProjects(a, b);
    expect(result.modified).toHaveLength(1);
    expect(result.modified[0].node.nodeId).toBe('ctx1');
  });

  it('summary 计数正确', () => {
    const ctxA = { nodeId: 'ctx1', name: 'A', type: 'core' as const, children: [], status: 'confirmed' as const };
    const ctxB = { nodeId: 'ctx1', name: 'A', type: 'core' as const, children: [], status: 'confirmed' as const };
    const a = makeProject('a', 'A', [ctxA as any], [], []);
    const b = makeProject('b', 'B', [ctxB as any], [], []);
    const result = compareCanvasProjects(a, b);
    expect(result.summary.contextAdded).toBe(0);
    expect(result.summary.contextRemoved).toBe(0);
  });
});

describe('exportDiffReport', () => {
  it('返回格式化的 JSON 字符串', () => {
    const diff = {
      added: [], removed: [], modified: [],
      unchanged: [{ type: 'unchanged' as const, source: 'left' as const, node: { nodeId: 'x' } }],
      summary: { contextAdded: 0, contextRemoved: 0, contextModified: 0, flowAdded: 0, flowRemoved: 0, flowModified: 0, componentAdded: 0, componentRemoved: 0, componentModified: 0 },
    };
    const report = exportDiffReport(diff, 'ProjectA', 'ProjectB');
    const parsed = JSON.parse(report);
    expect(parsed.projectA).toBe('ProjectA');
    expect(parsed.projectB).toBe('ProjectB');
    expect(parsed.exportedAt).toBeTruthy();
    expect(parsed.unchangedCount).toBe(1);
  });
});
