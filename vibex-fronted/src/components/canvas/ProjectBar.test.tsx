/**
 * ProjectBar.test.tsx
 *
 * E3-F3.1: hasAllNodes isActive !== false 检查
 * Verifies create-project button respects node isActive state
 */
import { vi, Mock } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { ProjectBar } from './ProjectBar';
import * as contextStore from '@/lib/canvas/stores/contextStore';
import * as flowStore from '@/lib/canvas/stores/flowStore';
import * as componentStore from '@/lib/canvas/stores/componentStore';
import * as uiStore from '@/lib/canvas/stores/uiStore';
import * as sessionStore from '@/lib/canvas/stores/sessionStore';

vi.mock('@/lib/canvas/stores/contextStore');
vi.mock('@/lib/canvas/stores/flowStore');
vi.mock('@/lib/canvas/stores/componentStore');
vi.mock('@/lib/canvas/stores/uiStore');
vi.mock('@/lib/canvas/stores/sessionStore');

function setupStores(overrides: {
  contextNodes?: Array<{ nodeId: string; name: string; isActive: boolean; status: string; [k: string]: unknown }>;
  flowNodes?: Array<{ nodeId: string; name: string; contextId: string; isActive: boolean; status: string; [k: string]: unknown }>;
  componentNodes?: Array<{ nodeId: string; name: string; isActive: boolean; status: string; [k: string]: unknown }>;
} = {}) {
  const {
    contextNodes = [],
    flowNodes = [],
    componentNodes = [],
  } = overrides;

  (contextStore.useContextStore as Mock).mockImplementation((selector: (s: unknown) => unknown) => {
    const state = { contextNodes, setPhase: vi.fn() };
    return selector(state);
  });
  (flowStore.useFlowStore as Mock).mockImplementation((selector: (s: unknown) => unknown) => {
    const state = { flowNodes };
    return selector(state);
  });
  (componentStore.useComponentStore as Mock).mockImplementation((selector: (s: unknown) => unknown) => {
    const state = { componentNodes };
    return selector(state);
  });
  (uiStore.useUIStore as Mock).mockImplementation((selector: (s: unknown) => unknown) => {
    const state = { leftDrawerOpen: false, rightDrawerOpen: false };
    return selector(state);
  });
  (sessionStore.useSessionStore as Mock).mockImplementation((selector: (s: unknown) => unknown) => {
    const state = {
      projectId: null,
      setProjectId: vi.fn(),
      addToQueue: vi.fn(),
      prototypeQueue: [],
    };
    return selector(state);
  });
}

describe('E3-F3.1: hasAllNodes isActive !== false 检查', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // AC-F3.1-1: 三树均有节点且所有节点 isActive !== false → button enabled
  it('AC-F3.1-1: 三树全部 isActive 时按钮 enabled', () => {
    setupStores({
      contextNodes: [
        { nodeId: 'ctx-1', name: '患者管理', isActive: true, status: 'confirmed' },
      ],
      flowNodes: [
        { nodeId: 'flow-1', name: 'Order Flow', contextId: 'ctx-1', isActive: true, status: 'confirmed' },
      ],
      componentNodes: [
        { nodeId: 'comp-1', name: 'Component A', isActive: true, status: 'confirmed' },
      ],
    });

    render(<ProjectBar />);
    const btn = screen.getByRole('button', { name: '创建项目并开始生成原型' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  // AC-F3.1-2: 三树均有节点但任意一个树存在 isActive === false → button disabled
  it('AC-F3.1-2: 任意树存在 isActive=false 时按钮 disabled', () => {
    // componentNodes 中有 isActive=false
    setupStores({
      contextNodes: [
        { nodeId: 'ctx-1', name: '患者管理', isActive: true, status: 'confirmed' },
      ],
      flowNodes: [
        { nodeId: 'flow-1', name: 'Order Flow', contextId: 'ctx-1', isActive: true, status: 'confirmed' },
      ],
      componentNodes: [
        { nodeId: 'comp-1', name: 'Component A', isActive: true, status: 'confirmed' },
        { nodeId: 'comp-2', name: 'Component B', isActive: false, status: 'pending' },
      ],
    });

    render(<ProjectBar />);
    const btn = screen.getByRole('button', { name: '创建项目并开始生成原型' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  // AC-F3.1-3: 组件树为空（三树缺一） → button disabled
  it('AC-F3.1-3: 组件树为空时按钮 disabled', () => {
    setupStores({
      contextNodes: [
        { nodeId: 'ctx-1', name: '患者管理', isActive: true, status: 'confirmed' },
      ],
      flowNodes: [
        { nodeId: 'flow-1', name: 'Order Flow', contextId: 'ctx-1', isActive: true, status: 'confirmed' },
      ],
      componentNodes: [],
    });

    render(<ProjectBar />);
    const btn = screen.getByRole('button', { name: '创建项目并开始生成原型' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  // AC-F3.1-4 (额外): flowNodes 全 deactive → button disabled
  it('AC-F3.1-4: flowNodes 全 deactive 时按钮 disabled', () => {
    setupStores({
      contextNodes: [
        { nodeId: 'ctx-1', name: '患者管理', isActive: true, status: 'confirmed' },
      ],
      flowNodes: [
        { nodeId: 'flow-1', name: 'Order Flow', contextId: 'ctx-1', isActive: false, status: 'pending' },
      ],
      componentNodes: [
        { nodeId: 'comp-1', name: 'Component A', isActive: true, status: 'confirmed' },
      ],
    });

    render(<ProjectBar />);
    const btn = screen.getByRole('button', { name: '创建项目并开始生成原型' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});

describe('E3-F3.2: tooltip 与 hasAllNodes 失败原因一致', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // AC-F3.2-1: componentNodes 为空 → tooltip "请先生成组件树"
  it('AC-F3.2-1: 组件树为空时 tooltip 显示"请先生成组件树"', () => {
    setupStores({
      contextNodes: [{ nodeId: 'ctx-1', name: '患者管理', isActive: true, status: 'confirmed' }],
      flowNodes: [{ nodeId: 'flow-1', name: 'Order Flow', contextId: 'ctx-1', isActive: true, status: 'confirmed' }],
      componentNodes: [],
    });

    render(<ProjectBar />);
    const btn = screen.getByRole('button', { name: '创建项目并开始生成原型' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.title).toBe('请先生成组件树');
  });

  // AC-F3.2-2: contextInactive 时 tooltip 显示对应原因
  it('AC-F3.2-2: contextInactive 时 tooltip 显示"请先确认所有上下文节点"', () => {
    setupStores({
      contextNodes: [
        { nodeId: 'ctx-1', name: '患者管理', isActive: false, status: 'pending' },
      ],
      flowNodes: [{ nodeId: 'flow-1', name: 'Order Flow', contextId: 'ctx-1', isActive: true, status: 'confirmed' }],
      componentNodes: [{ nodeId: 'comp-1', name: 'Component A', isActive: true, status: 'confirmed' }],
    });

    render(<ProjectBar />);
    const btn = screen.getByRole('button', { name: '创建项目并开始生成原型' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.title).toBe('请先确认所有上下文节点');
  });

  it('AC-F3.2-3: flowInactive 时 tooltip 显示"请先确认所有流程节点"', () => {
    setupStores({
      contextNodes: [{ nodeId: 'ctx-1', name: '患者管理', isActive: true, status: 'confirmed' }],
      flowNodes: [
        { nodeId: 'flow-1', name: 'Order Flow', contextId: 'ctx-1', isActive: false, status: 'pending' },
      ],
      componentNodes: [{ nodeId: 'comp-1', name: 'Component A', isActive: true, status: 'confirmed' }],
    });

    render(<ProjectBar />);
    const btn = screen.getByRole('button', { name: '创建项目并开始生成原型' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.title).toBe('请先确认所有流程节点');
  });

  it('AC-F3.2-4: componentInactive 时 tooltip 显示"请先确认所有组件节点"', () => {
    setupStores({
      contextNodes: [{ nodeId: 'ctx-1', name: '患者管理', isActive: true, status: 'confirmed' }],
      flowNodes: [{ nodeId: 'flow-1', name: 'Order Flow', contextId: 'ctx-1', isActive: true, status: 'confirmed' }],
      componentNodes: [
        { nodeId: 'comp-1', name: 'Component A', isActive: true, status: 'confirmed' },
        { nodeId: 'comp-2', name: 'Component B', isActive: false, status: 'pending' },
      ],
    });

    render(<ProjectBar />);
    const btn = screen.getByRole('button', { name: '创建项目并开始生成原型' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.title).toBe('请先确认所有组件节点');
  });

  // AC-F3.2-5: 按钮 enabled 时 tooltip 显示"创建项目并开始生成原型"
  it('AC-F3.2-5: 三树全部 active 时 tooltip 显示"创建项目并开始生成原型"', () => {
    setupStores({
      contextNodes: [{ nodeId: 'ctx-1', name: '患者管理', isActive: true, status: 'confirmed' }],
      flowNodes: [{ nodeId: 'flow-1', name: 'Order Flow', contextId: 'ctx-1', isActive: true, status: 'confirmed' }],
      componentNodes: [{ nodeId: 'comp-1', name: 'Component A', isActive: true, status: 'confirmed' }],
    });

    render(<ProjectBar />);
    const btn = screen.getByRole('button', { name: '创建项目并开始生成原型' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.title).toBe('创建项目并开始生成原型');
  });
});
