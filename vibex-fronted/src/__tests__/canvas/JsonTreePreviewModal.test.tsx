/**
 * Unit tests for JsonTreePreviewModal — buildPagesData function
 * Spec: docs/vibex-proposals-20260411-page-structure/specs/03-json-preview.md §4.1
 *
 * Tests E2-S1/S2/S3 acceptance criteria:
 * - buildPagesData transforms groups → spec JSON format
 * - pageId, pageName, componentCount visible in output
 * - Common component group (pageId='__common__') handled correctly
 * - Nested children serialized correctly
 * - pageName field propagates through components
 */

import { describe, it, expect } from 'vitest';
import { buildPagesData } from '@/components/canvas/json-tree/JsonTreePreviewModal';
import type { ComponentGroup } from '@/components/canvas/ComponentTree';

// Helper to create a minimal ComponentGroup
function makeGroup(overrides: Partial<ComponentGroup> & { groupId: string; label: string; nodes: ComponentGroup['nodes'] }): ComponentGroup {
  return {
    color: '#10b981',
    pageId: '__unknown__',
    componentCount: 0,
    ...overrides,
  };
}

function makeNode(overrides: Partial<{ nodeId: string; name: string; type: string; flowId: string; status: string; pageName?: string; children: Array<{ nodeId: string; name: string; type: string; flowId: string; status: string }> }> = {}) {
  return {
    nodeId: 'node-1',
    name: 'Button',
    type: 'button',
    flowId: 'flow-1',
    status: 'pending',
    pageName: undefined,
    children: [],
    ...overrides,
  };
}

describe('buildPagesData', () => {
  it('transforms ComponentGroup[] to pages JSON format', () => {
    const groups: ComponentGroup[] = [
      makeGroup({
        groupId: 'flow-1',
        label: '📄 首页',
        pageId: 'flow-1',
        componentCount: 2,
        isCommon: false,
        nodes: [
          makeNode({ nodeId: 'p1', name: '按钮1', type: 'button', flowId: 'flow-1' }),
          makeNode({ nodeId: 'p2', name: '输入框', type: 'input', flowId: 'flow-1' }),
        ],
      }),
    ];

    const result = buildPagesData(groups);

    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].pageId).toBe('flow-1');
    expect(result.pages[0].componentCount).toBe(2);
    expect(result.pages[0].components).toHaveLength(2);
    expect(result.totalComponents).toBe(2);
    expect(result.generatedAt).toBeDefined();
  });

  it('strips emoji prefix from label to get pageName', () => {
    const groups: ComponentGroup[] = [
      makeGroup({
        groupId: 'flow-home',
        label: '📄 首页',
        pageId: 'flow-home',
        componentCount: 1,
        isCommon: false,
        nodes: [makeNode({ nodeId: 'c1', name: 'Test', type: 'button', flowId: 'flow-home' })],
      }),
    ];

    const result = buildPagesData(groups);
    expect(result.pages[0].pageName).toBe('首页');
  });

  it('handles common component group (pageId=__common__)', () => {
    const groups: ComponentGroup[] = [
      makeGroup({
        groupId: '__common__',
        label: '🔧 通用组件',
        pageId: '__common__',
        componentCount: 1,
        isCommon: true,
        nodes: [makeNode({ nodeId: 'c3', name: '分割线', type: 'divider', flowId: '__common__' })],
      }),
    ];

    const result = buildPagesData(groups);
    expect(result.pages[0].pageId).toBe('__common__');
    expect(result.pages[0].pageName).toBe('通用组件');
    expect(result.pages[0].isCommon).toBe(true);
    expect(result.pages[0].componentCount).toBe(1);
  });

  it('includes pageName field in component nodes', () => {
    const groups: ComponentGroup[] = [
      makeGroup({
        groupId: 'flow-x',
        label: '📄 Custom Page',
        pageId: 'flow-x',
        componentCount: 1,
        isCommon: false,
        nodes: [makeNode({ nodeId: 'c1', name: 'Button', type: 'button', flowId: 'flow-x', pageName: '自定义页面' })],
      }),
    ];

    const result = buildPagesData(groups);
    expect(result.pages[0].components[0].pageName).toBe('自定义页面');
  });

  it('serializes nested children correctly', () => {
    const groups: ComponentGroup[] = [
      makeGroup({
        groupId: 'flow-1',
        label: '📄 Page',
        pageId: 'flow-1',
        componentCount: 1,
        isCommon: false,
        nodes: [
          makeNode({
            nodeId: 'parent',
            name: 'Container',
            type: 'container',
            flowId: 'flow-1',
            children: [
              { nodeId: 'child1', name: 'Button', type: 'button', flowId: 'flow-1', status: 'pending' },
              { nodeId: 'child2', name: 'Input', type: 'input', flowId: 'flow-1', status: 'pending' },
            ],
          }),
        ],
      }),
    ];

    const result = buildPagesData(groups);
    expect(result.pages[0].components[0].children).toHaveLength(2);
    expect(result.pages[0].components[0].children![0].nodeId).toBe('child1');
    expect(result.pages[0].components[0].children![1].nodeId).toBe('child2');
  });

  it('totalComponents equals sum of all node counts', () => {
    const groups: ComponentGroup[] = [
      makeGroup({
        groupId: 'flow-1',
        label: '📄 Page 1',
        pageId: 'flow-1',
        componentCount: 2,
        isCommon: false,
        nodes: [makeNode({ nodeId: 'c1' }), makeNode({ nodeId: 'c2' })],
      }),
      makeGroup({
        groupId: '__common__',
        label: '🔧 Common',
        pageId: '__common__',
        componentCount: 3,
        isCommon: true,
        nodes: [makeNode({ nodeId: 'c3' }), makeNode({ nodeId: 'c4' }), makeNode({ nodeId: 'c5' })],
      }),
    ];

    const result = buildPagesData(groups);
    expect(result.totalComponents).toBe(5);
    expect(result.pages).toHaveLength(2);
  });

  it('omits children field when array is empty', () => {
    const groups: ComponentGroup[] = [
      makeGroup({
        groupId: 'flow-1',
        label: '📄 Page',
        pageId: 'flow-1',
        componentCount: 1,
        isCommon: false,
        nodes: [makeNode({ nodeId: 'c1', children: [] })],
      }),
    ];

    const result = buildPagesData(groups);
    const component = result.pages[0].components[0];
    expect(component.children).toBeUndefined();
  });
});
