import {vi, Mock, SpyInstance} from 'vitest';
/**
 * BoundedContextTree.test.tsx — Epic 1: E1 checkbox UX fix
 * Updated for new store architecture (useContextStore only).
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BoundedContextNode } from '@/lib/canvas/types';
import { BoundedContextTree } from './BoundedContextTree';
import * as contextStore from '@/lib/canvas/stores/contextStore';

const ctxNodes: BoundedContextNode[] = [
  { nodeId: 'ctx-1', name: '患者管理', description: '管理患者基本信息', type: 'core', isActive: true, status: 'confirmed', children: [] },
  { nodeId: 'ctx-2', name: '预约挂号', description: '处理预约和排班', type: 'supporting', isActive: false, status: 'pending', children: [] },
  { nodeId: 'ctx-3', name: '支付结算', description: '诊金支付和医保结算', type: 'generic', isActive: false, status: 'pending', children: [] },
];

const mockToggleContextNode = vi.fn();
const mockToggleNodeSelect = vi.fn();
const mockAdvancePhase = vi.fn();

vi.mock('@/lib/canvas/stores/contextStore', () => ({
  useContextStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      contextNodes: ctxNodes,
      phase: 'context',
      advancePhase: mockAdvancePhase,
      activeTree: 'context',
      setActiveTree: vi.fn(),
      selectedNodeIds: { context: [] as string[], flow: [] as string[], component: [] as string[] },
      toggleNodeSelect: mockToggleNodeSelect,
      selectAllNodes: vi.fn(),
      clearNodeSelection: vi.fn(),
      deleteSelectedNodes: vi.fn(),
      toggleContextNode: mockToggleContextNode,
      toggleContextSelection: vi.fn(),
      setContextNodes: vi.fn(),
      addContextNode: vi.fn(),
      deleteContextNode: vi.fn(),
      editContextNode: vi.fn(),
      confirmContextNode: vi.fn(),
      setContextDraft: vi.fn(),
      contextDraft: null,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/lib/canvas/stores/flowStore', () => ({
  useFlowStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = { flowNodes: [], phase: 'context' as const, activeTree: 'context' as const };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/lib/canvas/stores/sessionStore', () => ({
  useSessionStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = { aiThinking: false, aiThinkingMessage: null, requirementText: '' };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/hooks/canvas/useDragSelection', () => ({
  useDragSelection: vi.fn(() => ({
    isDragging: false, selectionBox: null, containerRef: { current: null }, isNodeInBox: vi.fn(), isSelecting: false,
  })),
  useModifierKey: vi.fn(() => false),
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: vi.fn(() => ({ showToast: vi.fn() })),
}));

describe('BoundedContextTree — Epic 1: E1 checkbox UX', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(cleanup);

  it('renders all context nodes', () => {
    render(<BoundedContextTree />);
    expect(screen.getByText('患者管理')).toBeInTheDocument();
    expect(screen.getByText('预约挂号')).toBeInTheDocument();
    expect(screen.getByText('支付结算')).toBeInTheDocument();
  });

  it('has exactly 1 checkbox per node', () => {
    render(<BoundedContextTree />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('each checkbox has aria-label="确认节点"', () => {
    render(<BoundedContextTree />);
    for (const cb of screen.getAllByRole('checkbox')) {
      expect(cb).toHaveAttribute('aria-label', '确认节点');
    }
  });

  it('clicking checkbox calls both toggleContextNode (confirmation) and toggleNodeSelect (selection)', async () => {
    const user = userEvent.setup();
    render(<BoundedContextTree />);
    await user.click(screen.getAllByRole('checkbox')[0]);
    // Fix: checkbox now calls both toggleContextNode (toggles status) and
    // onToggleSelect/toggleNodeSelect (updates selection for card color)
    expect(mockToggleContextNode).toHaveBeenCalledWith('ctx-1');
    expect(mockToggleNodeSelect).toHaveBeenCalledWith('context', 'ctx-1');
  });

  it('has no nodeTypeBadge (type text hidden)', () => {
    render(<BoundedContextTree />);
    expect(screen.queryByText('核心')).not.toBeInTheDocument();
    expect(screen.queryByText('支撑')).not.toBeInTheDocument();
    expect(screen.queryByText('通用')).not.toBeInTheDocument();
  });

  it('has no confirmedBadge (no extra checkmarks)', () => {
    render(<BoundedContextTree />);
    expect(document.querySelectorAll('[aria-label="已确认"]')).toHaveLength(0);
  });

  it('has advance-to-flow button when nodes exist', () => {
    render(<BoundedContextTree />);
    expect(screen.getByText(/继续到流程树/)).toBeInTheDocument();
  });

  it('advance button calls advancePhase', async () => {
    const user = userEvent.setup();
    render(<BoundedContextTree />);
    await user.click(screen.getByText(/继续到流程树/));
    expect(mockAdvancePhase).toHaveBeenCalledTimes(1);
  });
});

// ─── E4-F4.1: allConfirmed 检查 status === 'confirmed' ───────────────────────────────────────
// Mock helper: override contextStore with custom nodes
function withContextNodes(nodes: Partial<BoundedContextNode>[]) {
  const fullNodes = nodes.map((n, i) => ({
    nodeId: n.nodeId ?? `ctx-${i}`,
    name: n.name ?? `Node ${i}`,
    description: n.description ?? '',
    type: (n.type ?? 'core') as 'core' | 'supporting' | 'generic',
    isActive: n.isActive ?? true,
    status: (n.status ?? 'pending') as 'pending' | 'confirmed' | 'error',
    children: n.children ?? [],
  }));

  vi.mocked(contextStore.useContextStore).mockImplementation(
    ((selector?: (s: Record<string, unknown>) => unknown) => {
      const state = {
        contextNodes: fullNodes,
        phase: 'context',
        advancePhase: vi.fn(),
        activeTree: 'context',
        setActiveTree: vi.fn(),
        selectedNodeIds: { context: [] as string[], flow: [] as string[], component: [] as string[] },
        toggleNodeSelect: vi.fn(),
        selectAllNodes: vi.fn(),
        clearNodeSelection: vi.fn(),
        deleteSelectedNodes: vi.fn(),
        toggleContextNode: vi.fn(),
        toggleContextSelection: vi.fn(),
        setContextNodes: vi.fn(),
        addContextNode: vi.fn(),
        deleteContextNode: vi.fn(),
        editContextNode: vi.fn(),
        confirmContextNode: vi.fn(),
        setContextDraft: vi.fn(),
        contextDraft: null,
      };
      return selector ? selector(state) : state;
    }) as typeof contextStore.useContextStore
  );
}

describe('E4-F4.1: allConfirmed 检查 status === confirmed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock to default state for each test
    vi.mocked(contextStore.useContextStore).mockImplementation(
      ((selector?: (s: Record<string, unknown>) => unknown) => {
        const state = {
          contextNodes: ctxNodes,
          phase: 'context',
          advancePhase: mockAdvancePhase,
          activeTree: 'context',
          setActiveTree: vi.fn(),
          selectedNodeIds: { context: [] as string[], flow: [] as string[], component: [] as string[] },
          toggleNodeSelect: mockToggleNodeSelect,
          selectAllNodes: vi.fn(),
          clearNodeSelection: vi.fn(),
          deleteSelectedNodes: vi.fn(),
          toggleContextNode: mockToggleContextNode,
          toggleContextSelection: vi.fn(),
          setContextNodes: vi.fn(),
          addContextNode: vi.fn(),
          deleteContextNode: vi.fn(),
          editContextNode: vi.fn(),
          confirmContextNode: vi.fn(),
          setContextDraft: vi.fn(),
          contextDraft: null,
        };
        return selector ? selector(state) : state;
      }) as typeof contextStore.useContextStore
    );
  });
  afterEach(cleanup);

  // AC-F4.1-1: 所有节点 status === 'confirmed' → allConfirmed === true → 按钮显示"已确认"
  it('AC-F4.1-1: 所有节点 status=confirmed 时按钮显示"已确认"', () => {
    withContextNodes([
      { nodeId: 'ctx-1', name: '患者管理', status: 'confirmed', isActive: true },
      { nodeId: 'ctx-2', name: '预约挂号', status: 'confirmed', isActive: true },
    ]);

    render(<BoundedContextTree />);
    expect(screen.getByText('✓ 已确认 → 继续到流程树')).toBeInTheDocument();
  });

  // AC-F4.1-2: 所有节点 isActive !== false 但 status !== 'confirmed' → allConfirmed === false
  it('AC-F4.1-2: isActive=true 但 status=pending 时按钮仍显示"确认所有"（旧逻辑 bug 场景）', () => {
    withContextNodes([
      { nodeId: 'ctx-1', name: '患者管理', status: 'pending', isActive: true },
      { nodeId: 'ctx-2', name: '预约挂号', status: 'pending', isActive: true },
    ]);

    render(<BoundedContextTree />);
    // 修复后 allConfirmed === false（因为 status !== 'confirmed'）
    expect(screen.getByText('确认所有 → 继续到流程树')).toBeInTheDocument();
    expect(screen.queryByText('✓ 已确认 → 继续到流程树')).not.toBeInTheDocument();
  });

  // AC-F4.1-3: 部分节点 status === 'confirmed' → allConfirmed === false
  it('AC-F4.1-3: 部分节点 confirmed 时按钮显示"确认所有"', () => {
    withContextNodes([
      { nodeId: 'ctx-1', name: '患者管理', status: 'confirmed', isActive: true },
      { nodeId: 'ctx-2', name: '预约挂号', status: 'pending', isActive: false },
    ]);

    render(<BoundedContextTree />);
    expect(screen.getByText('确认所有 → 继续到流程树')).toBeInTheDocument();
  });
});
