/**
 * ComponentTreeGrouping.test.ts — 组件树分组逻辑单元测试
 *
 * Tests for:
 * - inferIsCommon(): 多维判断组件是否为通用组件
 * - getPageLabel(): flowId → 页面名称（支持4层fallback）
 * - matchFlowNode(): 共享flowId→flowNode匹配函数
 * - groupByFlowId(): 组件节点分组
 */
import { inferIsCommon, getPageLabel, groupByFlowId, matchFlowNode } from '@/components/canvas/ComponentTree';
import type { ComponentNode, BusinessFlowNode } from '@/lib/canvas/types';

const flowNodes: BusinessFlowNode[] = [
  { nodeId: 'flow-1', name: '订单流程', type: 'sequence' },
  { nodeId: 'flow-2', name: '用户认证流程', type: 'sequence' },
  { nodeId: 'flow-3', name: '支付流程', type: 'sequence' },
];

const makeNode = (overrides: Partial<ComponentNode> = {}): ComponentNode =>
  ({
    nodeId: 'node-1',
    flowId: 'flow-1',
    name: '测试组件',
    type: 'page',
    props: {},
    api: { method: 'GET', path: '/api/test', params: [] },
    status: 'pending',
    confirmed: false,
    children: [],
    ...overrides,
  } as ComponentNode);

// =============================================================================
// inferIsCommon
// =============================================================================

describe('inferIsCommon', () => {
  test('flowId=mock → true', () => {
    expect(inferIsCommon(makeNode({ flowId: 'mock' }))).toBe(true);
  });

  test('flowId=manual → true', () => {
    expect(inferIsCommon(makeNode({ flowId: 'manual' }))).toBe(true);
  });

  test('flowId=common → true', () => {
    expect(inferIsCommon(makeNode({ flowId: 'common' }))).toBe(true);
  });

  test('flowId=空字符串 → true', () => {
    expect(inferIsCommon(makeNode({ flowId: '' }))).toBe(true);
  });

  test('flowId=undefined → true', () => {
    expect(inferIsCommon(makeNode({ flowId: undefined as any }))).toBe(true);
  });

  test('type=modal（通用组件类型）→ true（不受 flowId 影响）', () => {
    expect(inferIsCommon(makeNode({ flowId: 'flow-1', type: 'modal' }))).toBe(true);
  });

  test('type=button（通用组件类型）→ true', () => {
    expect(inferIsCommon(makeNode({ flowId: 'flow-1', type: 'button' }))).toBe(true);
  });

  test('type=input（通用组件类型）→ true', () => {
    expect(inferIsCommon(makeNode({ flowId: 'flow-1', type: 'input' }))).toBe(true);
  });

  test('type=page + flowId=有效值 → false', () => {
    expect(inferIsCommon(makeNode({ flowId: 'flow-1', type: 'page' }))).toBe(false);
  });

  test('type=list + flowId=有效值 → false', () => {
    expect(inferIsCommon(makeNode({ flowId: 'flow-2', type: 'list' }))).toBe(false);
  });
});

// =============================================================================
// matchFlowNode
// =============================================================================

describe('matchFlowNode', () => {
  test('精确匹配 nodeId → 返回对应 flowNode', () => {
    const result = matchFlowNode('flow-1', flowNodes);
    expect(result).not.toBeNull();
    expect(result!.nodeId).toBe('flow-1');
    expect(result!.name).toBe('订单流程');
  });

  test('无匹配 → 返回 null', () => {
    const result = matchFlowNode('xyz-unknown', flowNodes);
    expect(result).toBeNull();
  });

  test('空 flowId → 返回 null', () => {
    const result = matchFlowNode('', flowNodes);
    expect(result).toBeNull();
  });

  test('prefix 匹配: flowId 是 nodeId 的前缀', () => {
    const nodes = [{ nodeId: 'flow-1-v2', name: '订单v2', type: 'sequence' as const }];
    const result = matchFlowNode('flow-1', nodes);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('订单v2');
  });

  test('prefix 匹配: nodeId 是 flowId 的前缀', () => {
    const nodes = [{ nodeId: 'flow-1', name: '订单', type: 'sequence' as const }];
    const result = matchFlowNode('flow-1-v2', nodes);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('订单');
  });

  test('名称模糊匹配: 英文名称部分匹配', () => {
    const nodes = [
      { nodeId: 'flow-x', name: 'Order Management', type: 'sequence' as const },
    ];
    const result = matchFlowNode('order', nodes);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Order Management');
  });

  test('名称模糊匹配: 中文名称精确匹配', () => {
    const result = matchFlowNode('订', flowNodes);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('订单流程');
  });

  test('名称模糊匹配: 忽略空格/中划线/下划线', () => {
    const nodes = [{ nodeId: 'flow-x', name: '用户_认证-流程', type: 'sequence' as const }];
    const result = matchFlowNode('用户认证', nodes);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('用户_认证-流程');
  });
});

// =============================================================================
// getPageLabel
// =============================================================================

describe('getPageLabel', () => {
  test('flowId=mock → 🔧 通用组件', () => {
    expect(getPageLabel('mock', flowNodes)).toBe('🔧 通用组件');
  });

  test('flowId=manual → 🔧 通用组件', () => {
    expect(getPageLabel('manual', flowNodes)).toBe('🔧 通用组件');
  });

  test('flowId=空字符串 → 🔧 通用组件', () => {
    expect(getPageLabel('', flowNodes)).toBe('🔧 通用组件');
  });

  test('精确匹配 → 📄 流程名称', () => {
    expect(getPageLabel('flow-1', flowNodes)).toBe('📄 订单流程');
  });

  test('精确匹配 flow-2 → 📄 用户认证流程', () => {
    expect(getPageLabel('flow-2', flowNodes)).toBe('📄 用户认证流程');
  });

  test('无匹配 → ❓ flowId前缀', () => {
    const result = getPageLabel('xyz-unknown', flowNodes);
    expect(result.startsWith('❓')).toBe(true);
    expect(result).toContain('xyz-unknown');
  });

  test('长flowId截断显示', () => {
    const longId = 'very-long-flow-id-that-exceeds-12-chars';
    const result = getPageLabel(longId, flowNodes);
    expect(result.startsWith('❓')).toBe(true);
    expect(result).toContain('…');
    expect(result.length).toBeLessThan(longId.length + 3);
  });

  // E1-F1: pageName fallback tests
  describe('pageName fallback', () => {
    test('pageName 存在 → 返回 pageName', () => {
      expect(getPageLabel('flow-1', flowNodes, '自定义页面名')).toBe('📄 自定义页面名');
    });

    test('pageName 不存在 → fallback 到 BusinessFlowNode.name', () => {
      expect(getPageLabel('flow-1', flowNodes, undefined)).toBe('📄 订单流程');
    });

    test('pageName + 无 flowId 匹配 → pageName 优先', () => {
      expect(getPageLabel('unknown', flowNodes, '自定义')).toBe('📄 自定义');
    });
  });
});

// =============================================================================
// groupByFlowId
// =============================================================================

describe('groupByFlowId', () => {
  test('通用组件(modal)归入通用组并置顶', () => {
    const nodes: ComponentNode[] = [
      makeNode({ nodeId: 'p1', flowId: 'flow-1', type: 'page' }),
      makeNode({ nodeId: 'm1', flowId: 'flow-1', type: 'modal' }),
    ];
    const groups = groupByFlowId(nodes, flowNodes);

    expect(groups[0].isCommon).toBe(true);
    expect(groups[0].label).toBe('🔧 通用组件');
    expect(groups[0].nodes.map((n) => n.nodeId)).toContain('m1');
    expect(groups[1].nodes.map((n) => n.nodeId)).toContain('p1');
  });

  test('所有组件都是通用组件 → 仅一个通用分组', () => {
    const nodes: ComponentNode[] = [
      makeNode({ nodeId: 'b1', flowId: 'flow-1', type: 'button' }),
      makeNode({ nodeId: 'i1', flowId: 'flow-2', type: 'input' }),
    ];
    const groups = groupByFlowId(nodes, flowNodes);

    expect(groups.length).toBe(1);
    expect(groups[0].isCommon).toBe(true);
    expect(groups[0].label).toBe('🔧 通用组件');
  });

  test('无通用组件 → 仅页面分组，无通用组', () => {
    const nodes: ComponentNode[] = [
      makeNode({ nodeId: 'p1', flowId: 'flow-1', type: 'page' }),
      makeNode({ nodeId: 'p2', flowId: 'flow-2', type: 'page' }),
    ];
    const groups = groupByFlowId(nodes, flowNodes);

    const commonGroup = groups.find((g) => g.isCommon);
    expect(commonGroup).toBeUndefined();
    expect(groups.length).toBe(2);
  });

  test('未知页面(flowId无匹配)排在已知页面之后', () => {
    const nodes: ComponentNode[] = [
      makeNode({ nodeId: 'p1', flowId: 'flow-1', type: 'page' }),
      makeNode({ nodeId: 'p2', flowId: 'unknown-flow', type: 'page' }),
      makeNode({ nodeId: 'p3', flowId: 'flow-2', type: 'page' }),
    ];
    const groups = groupByFlowId(nodes, flowNodes);

    // Unknown pages should be at the end
    const unknownGroup = groups.find((g) => g.label.startsWith('❓'));
    const lastIndex = groups.indexOf(unknownGroup!);
    expect(lastIndex).toBe(groups.length - 1);
  });

  // E1-F2: componentCount metadata tests
  describe('componentCount metadata', () => {
    test('ComponentGroup 包含 pageId + componentCount', () => {
      const nodes: ComponentNode[] = [
        makeNode({ nodeId: 'p1', flowId: 'flow-1' }),
        makeNode({ nodeId: 'p2', flowId: 'flow-1' }),
      ];
      const groups = groupByFlowId(nodes, flowNodes);
      const group = groups.find((g) => g.groupId === 'flow-1');
      expect(group?.pageId).toBe('flow-1');
      expect(group?.componentCount).toBe(2);
    });

    test('通用组件组 pageId=__common__, componentCount 正确', () => {
      const nodes: ComponentNode[] = [
        makeNode({ nodeId: 'm1', flowId: 'flow-1', type: 'modal' }),
        makeNode({ nodeId: 'b1', flowId: 'flow-2', type: 'button' }),
      ];
      const groups = groupByFlowId(nodes, flowNodes);
      const commonGroup = groups.find((g) => g.isCommon);
      expect(commonGroup?.pageId).toBe('__common__');
      expect(commonGroup?.componentCount).toBe(2);
    });

    test('componentCount 等于 nodes.length', () => {
      const nodes: ComponentNode[] = [
        makeNode({ nodeId: 'p1', flowId: 'flow-1', type: 'page' }),
        makeNode({ nodeId: 'p2', flowId: 'flow-1', type: 'page' }),
        makeNode({ nodeId: 'p3', flowId: 'flow-1', type: 'page' }),
      ];
      const groups = groupByFlowId(nodes, flowNodes);
      const group = groups.find((g) => g.groupId === 'flow-1');
      expect(group?.componentCount).toBe(3);
      expect(group?.nodes.length).toBe(3);
    });
  });
});
