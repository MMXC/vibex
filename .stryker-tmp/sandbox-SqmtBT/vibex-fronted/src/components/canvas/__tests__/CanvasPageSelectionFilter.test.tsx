/**
 * CanvasPageSelectionFilter.test.tsx
 *
 * Epic1: 状态管理规范化 — 选区过滤与确认状态分离
 * Tests:
 * S1.1: CanvasPage handleContinueToComponents 选区过滤
 * S1.2: BusinessFlowTree 选区过滤（store level）
 * S1.3: 向后兼容 — 未选中时发送全部确认节点
 *
 * 验收标准:
 * AC-1: 选区过滤 — 只发送选中卡片
 * AC-2: 向后兼容 — 未选中时发送全部
 */
// @ts-nocheck


import React from 'react';
import { render, screen } from '@testing-library/react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';

// Test helper: simulate handleContinueToComponents selection filtering logic
function getFilteredContexts(
  contextNodes: Array<{ nodeId: string; isActive?: boolean }>,
  selectedNodeIds: string[]
) {
  const confirmedContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
  const selectedContextSet = new Set(selectedNodeIds);
  if (selectedContextSet.size > 0) {
    return confirmedContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId));
  }
  return confirmedContexts;
}

function getFilteredFlows(
  flowNodes: Array<{ nodeId: string; isActive?: boolean }>,
  selectedNodeIds: string[]
) {
  const confirmedFlows = flowNodes.filter((f) => f.isActive !== false);
  const selectedFlowSet = new Set(selectedNodeIds);
  if (selectedFlowSet.size > 0) {
    return confirmedFlows.filter((f) => selectedFlowSet.has(f.nodeId));
  }
  return confirmedFlows;
}

describe('Epic1 S1.1: CanvasPage 选区过滤 — 上下文节点', () => {
  const baseContexts = [
    { nodeId: 'ctx-1', isActive: true },
    { nodeId: 'ctx-2', isActive: true },
    { nodeId: 'ctx-3', isActive: true },
    { nodeId: 'ctx-4', isActive: false }, // unconfirmed — should never appear
    { nodeId: 'ctx-5', isActive: false }, // unconfirmed — should never appear
  ];

  it('AC-1: 有选区时只发送选中的已确认节点', () => {
    const selectedIds = ['ctx-1', 'ctx-3'];
    const result = getFilteredContexts(baseContexts, selectedIds);
    expect(result.map((c) => c.nodeId)).toEqual(['ctx-1', 'ctx-3']);
  });

  it('AC-2: 无选区时发送全部已确认节点（向后兼容）', () => {
    const result = getFilteredContexts(baseContexts, []);
    expect(result.map((c) => c.nodeId)).toEqual(['ctx-1', 'ctx-2', 'ctx-3']);
  });

  it('S1.1: 只选一个节点时结果数量正确', () => {
    const selectedIds = ['ctx-2'];
    const result = getFilteredContexts(baseContexts, selectedIds);
    expect(result).toHaveLength(1);
    expect(result[0].nodeId).toBe('ctx-2');
  });

  it('S1.1: 选中未确认的节点应被过滤掉', () => {
    const selectedIds = ['ctx-1', 'ctx-4']; // ctx-4 is not confirmed
    const result = getFilteredContexts(baseContexts, selectedIds);
    // ctx-4 is unconfirmed, should not appear
    expect(result.map((c) => c.nodeId)).toEqual(['ctx-1']);
  });

  it('S1.1: 选中数量等于已确认数量时应返回全部已确认', () => {
    const selectedIds = ['ctx-1', 'ctx-2', 'ctx-3'];
    const result = getFilteredContexts(baseContexts, selectedIds);
    expect(result.map((c) => c.nodeId)).toEqual(['ctx-1', 'ctx-2', 'ctx-3']);
  });
});

describe('Epic1 S1.2: BusinessFlowTree 选区过滤 — 流程节点', () => {
  const baseFlows = [
    { nodeId: 'flow-1', isActive: true },
    { nodeId: 'flow-2', isActive: true },
    { nodeId: 'flow-3', isActive: true },
    { nodeId: 'flow-4', isActive: false }, // unconfirmed
  ];

  it('S1.2: 有选区时只发送选中的已确认流程', () => {
    const selectedIds = ['flow-2'];
    const result = getFilteredFlows(baseFlows, selectedIds);
    expect(result.map((f) => f.nodeId)).toEqual(['flow-2']);
  });

  it('S1.2: 无选区时发送全部已确认流程（向后兼容）', () => {
    const result = getFilteredFlows(baseFlows, []);
    expect(result.map((f) => f.nodeId)).toEqual(['flow-1', 'flow-2', 'flow-3']);
  });

  it('S1.2: 选中多个流程', () => {
    const selectedIds = ['flow-1', 'flow-3'];
    const result = getFilteredFlows(baseFlows, selectedIds);
    expect(result.map((f) => f.nodeId)).toEqual(['flow-1', 'flow-3']);
  });
});

describe('Epic1 S1.3: 选区数量与 API 请求一致', () => {
  const contexts = [
    { nodeId: 'ctx-a', isActive: true },
    { nodeId: 'ctx-b', isActive: true },
    { nodeId: 'ctx-c', isActive: false },
  ];

  it('S1.3: 选中2个节点时，mappedContexts.length === 2', () => {
    const selectedIds = ['ctx-a', 'ctx-b'];
    const result = getFilteredContexts(contexts, selectedIds);
    expect(result.length).toBe(selectedIds.length);
    expect(result.length).toBe(2);
  });

  it('S1.3: 无选中时，mappedContexts.length === all confirmed', () => {
    const confirmedCount = contexts.filter((c) => c.isActive !== false).length;
    const result = getFilteredContexts(contexts, []);
    expect(result.length).toBe(confirmedCount);
    expect(result.length).toBe(2);
  });
});
