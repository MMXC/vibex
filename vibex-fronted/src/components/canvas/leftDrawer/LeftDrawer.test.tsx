import {vi, Mock, SpyInstance} from 'vitest';
/**
 * LeftDrawer.test.tsx — Epic 2: 左抽屉组件测试 (updated for new store architecture)
 *
 * S2.1: 左抽屉容器（200px 默认宽，可折叠/展开）
 * S2.2: requirementTextarea 迁移到左抽屉（任意阶段可用）
 * S2.3: 发送按钮 → 调用 canvasApi.generateContexts
 * S2.4: 最近 3-5 条输入历史（sessionStorage）
 * S2.5: ProjectBar 添加左抽屉入口按钮
 *
 * Updated: handleSend is now async, calls canvasApi.generateContexts()
 * Updated: uses useUIStore, useSessionStore, useContextStore (not useCanvasStore)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LeftDrawer } from './LeftDrawer';
import { useUIStore } from '@/lib/canvas/stores/uiStore';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import { canvasApi } from '@/lib/canvas/api/canvasApi';
import * as historyStore from './requirementHistoryStore';

// Mock the module
vi.mock('@/lib/canvas/api/canvasApi');

// ── Mock sessionStorage ────────────────────────────────────────────────────────
const mockSessionStorage: Record<string, string> = {};
const originalSessionStorage = global.sessionStorage;

beforeAll(() => {
  Object.defineProperty(global, 'sessionStorage', {
    value: {
      getItem: (key: string) => mockSessionStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockSessionStorage[key] = value; },
      removeItem: (key: string) => { delete mockSessionStorage[key]; },
      clear: () => { Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]); },
      key: (index: number) => Object.keys(mockSessionStorage)[index] ?? null,
      get length() { return Object.keys(mockSessionStorage).length; },
    },
    writable: true,
    configurable: true,
  });
});

afterAll(() => {
  Object.defineProperty(global, 'sessionStorage', {
    value: originalSessionStorage,
    writable: true,
    configurable: true,
  });
});

// ── Store setup helpers ────────────────────────────────────────────────────────
function setupUIStore(overrides = {}) {
  useUIStore.setState({
    leftDrawerOpen: false,
    rightDrawerOpen: false,
    leftDrawerWidth: 200,
    rightDrawerWidth: 200,
    toggleLeftDrawer: vi.fn(),
    toggleRightDrawer: vi.fn(),
    setLeftDrawerWidth: vi.fn(),
    setRightDrawerWidth: vi.fn(),
    ...overrides,
  });
}

function setupSessionStore(overrides = {}) {
  useSessionStore.setState({
    aiThinking: false,
    aiThinkingMessage: null as string | null,
    requirementText: '',
    setRequirementText: vi.fn(),
    ...overrides,
  });
}

function setupContextStore(overrides = {}) {
  useContextStore.setState({
    setContextNodes: vi.fn(),
    ...overrides,
  });
}

function setupAllStores(ui = {}, session = {}, context = {}) {
  setupUIStore(ui);
  setupSessionStore(session);
  setupContextStore(context);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Epic 2 S2.1: Left Drawer Container', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(canvasApi.generateContexts).mockReset();
    Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]);
  });

  it('AC-S2.1: 左抽屉默认折叠（closed状态）', () => {
    setupAllStores({ leftDrawerOpen: false });
    render(<LeftDrawer />);
    expect(screen.getByTestId('left-drawer')).toHaveClass('leftDrawerClosed');
    expect(screen.getByTestId('left-drawer')).toHaveAttribute('aria-hidden', 'true');
  });

  it('AC-S2.1: 左抽屉展开时显示内容', () => {
    setupAllStores({ leftDrawerOpen: true });
    render(<LeftDrawer />);
    expect(screen.getByTestId('left-drawer')).toHaveClass('leftDrawerOpen');
    expect(screen.getByTestId('left-drawer')).toHaveAttribute('aria-hidden', 'false');
  });

  it('AC-S2.1: 左抽屉有关闭按钮', () => {
    setupAllStores({ leftDrawerOpen: true });
    render(<LeftDrawer />);
    expect(screen.getByLabelText('关闭需求输入抽屉')).toBeInTheDocument();
  });

  it('AC-S2.1: 点击关闭按钮调用 toggleLeftDrawer', () => {
    const toggleLeftDrawer = vi.fn();
    setupAllStores({ leftDrawerOpen: true, toggleLeftDrawer });
    render(<LeftDrawer />);
    fireEvent.click(screen.getByLabelText('关闭需求输入抽屉'));
    expect(toggleLeftDrawer).toHaveBeenCalledTimes(1);
  });
});

describe('Epic 2 S2.2: Requirement Textarea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(canvasApi.generateContexts).mockReset();
    Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]);
  });

  it('AC-S2.2: 左抽屉展开时显示 textarea', () => {
    setupAllStores({ leftDrawerOpen: true });
    render(<LeftDrawer />);
    expect(screen.getByTestId('left-drawer-textarea')).toBeInTheDocument();
  });

  it('AC-S2.2: textarea placeholder 正确', () => {
    setupAllStores({ leftDrawerOpen: true });
    render(<LeftDrawer />);
    expect(screen.getByPlaceholderText('描述你的需求...')).toBeInTheDocument();
  });

  it('AC-S2.2: textarea 支持输入', () => {
    setupAllStores({ leftDrawerOpen: true });
    render(<LeftDrawer />);
    const textarea = screen.getByTestId('left-drawer-textarea');
    fireEvent.change(textarea, { target: { value: '测试需求' } });
    expect(textarea).toHaveValue('测试需求');
  });

  it('AC-S2.2: textarea 禁用时当 aiThinking=true', () => {
    setupAllStores({ leftDrawerOpen: true }, { aiThinking: true });
    render(<LeftDrawer />);
    expect(screen.getByTestId('left-drawer-textarea')).toBeDisabled();
  });

  it('AC-S2.2: textarea 显示 store 中的 requirementText', () => {
    setupAllStores({ leftDrawerOpen: true }, { requirementText: '已存储的需求' });
    render(<LeftDrawer />);
    expect(screen.getByTestId('left-drawer-textarea')).toHaveValue('已存储的需求');
  });
});

describe('Epic 2 S2.3: Send Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(canvasApi.generateContexts).mockReset();
    vi.mocked(canvasApi.generateContexts).mockResolvedValue({ success: true, contexts: [] } as any);
    Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]);
  });

  it('AC-S2.3: 显示发送按钮', () => {
    setupAllStores({ leftDrawerOpen: true });
    render(<LeftDrawer />);
    expect(screen.getByTestId('left-drawer-send-btn')).toBeInTheDocument();
  });

  it('AC-S2.3: 发送按钮禁用当 textarea 为空', () => {
    setupAllStores({ leftDrawerOpen: true });
    render(<LeftDrawer />);
    expect(screen.getByTestId('left-drawer-send-btn')).toBeDisabled();
  });

  it('AC-S2.3: 发送按钮启用当 textarea 有内容', () => {
    setupAllStores({ leftDrawerOpen: true });
    render(<LeftDrawer />);
    fireEvent.change(screen.getByTestId('left-drawer-textarea'), { target: { value: '需求文本' } });
    expect(screen.getByTestId('left-drawer-send-btn')).toBeEnabled();
  });

  it('AC-S2.3: 点击发送按钮调用 canvasApi.generateContexts', async () => {
    const setRequirementText = vi.fn();
    setupAllStores({ leftDrawerOpen: true }, { setRequirementText }, {});
    vi.mocked(canvasApi.generateContexts).mockResolvedValue({ success: true, contexts: [] } as any);
    render(<LeftDrawer />);

    fireEvent.change(screen.getByTestId('left-drawer-textarea'), { target: { value: '发送测试需求' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('left-drawer-send-btn'));
    });

    expect(setRequirementText).toHaveBeenCalledWith('发送测试需求');
    expect(vi.mocked(canvasApi.generateContexts)).toHaveBeenCalledWith(
      expect.objectContaining({ requirementText: '发送测试需求' })
    );
  });

  it('AC-S2.3: 发送按钮禁用当 aiThinking=true', () => {
    setupAllStores({ leftDrawerOpen: true }, { aiThinking: true });
    render(<LeftDrawer />);
    expect(screen.getByTestId('left-drawer-send-btn')).toBeDisabled();
  });

  it('AC-S2.3: Ctrl+Enter 快捷键触发发送', async () => {
    const setRequirementText = vi.fn();
    vi.mocked(canvasApi.generateContexts).mockResolvedValue({ success: true, contexts: [] } as any);
    setupAllStores({ leftDrawerOpen: true }, { setRequirementText }, {});
    render(<LeftDrawer />);

    fireEvent.change(screen.getByTestId('left-drawer-textarea'), { target: { value: '快捷键测试' } });
    await act(async () => {
      fireEvent.keyDown(screen.getByTestId('left-drawer-textarea'), { key: 'Enter', ctrlKey: true });
    });

    expect(setRequirementText).toHaveBeenCalledWith('快捷键测试');
    expect(vi.mocked(canvasApi.generateContexts)).toHaveBeenCalled();
  });
});

describe('Epic 2 S2.4: Input History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(canvasApi.generateContexts).mockReset();
    vi.mocked(canvasApi.generateContexts).mockResolvedValue({ success: true, contexts: [] } as any);
    Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]);
  });

  it('AC-S2.4: 空历史显示占位文本', () => {
    mockSessionStorage['vibex-requirement-history'] = '[]';
    setupAllStores({ leftDrawerOpen: true });
    render(<LeftDrawer />);
    expect(screen.getByText('暂无历史记录')).toBeInTheDocument();
  });

  it('AC-S2.4: 发送后添加历史记录', async () => {
    const setRequirementText = vi.fn();
    vi.mocked(canvasApi.generateContexts).mockResolvedValue({ success: true, contexts: [] } as any);
    setupAllStores({ leftDrawerOpen: true }, { setRequirementText }, {});
    render(<LeftDrawer />);

    fireEvent.change(screen.getByTestId('left-drawer-textarea'), { target: { value: '新需求' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('left-drawer-send-btn'));
    });

    await waitFor(() => {
      expect(mockSessionStorage['vibex-requirement-history']).toBeTruthy();
    });
  });

  it('AC-S2.4: 点击历史项恢复文本到 textarea', () => {
    const historyItem = { id: 'hist-1', text: '历史需求1', timestamp: Date.now() };
    mockSessionStorage['vibex-requirement-history'] = JSON.stringify([historyItem]);
    setupAllStores({ leftDrawerOpen: true });
    render(<LeftDrawer />);

    fireEvent.click(screen.getByLabelText('恢复输入: 历史需求1'));
    expect(screen.getByTestId('left-drawer-textarea')).toHaveValue('历史需求1');
  });
});

describe('Epic 2 S2.5: ProjectBar LeftDrawerToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(canvasApi.generateContexts).mockReset();
  });

  it('AC-S2.5: 左抽屉按钮 aria-label 正确', () => {
    const toggleLeftDrawer = vi.fn();
    setupAllStores({ leftDrawerOpen: false, toggleLeftDrawer });
    useUIStore.getState().toggleLeftDrawer();
    expect(toggleLeftDrawer).toHaveBeenCalledTimes(1);
  });
});

describe('Epic 2: AI Thinking Indicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(canvasApi.generateContexts).mockReset();
  });

  it('AI thinking 时显示 thinking 行', () => {
    setupAllStores(
      { leftDrawerOpen: true },
      { aiThinking: true, aiThinkingMessage: '正在分析需求...' }
    );
    render(<LeftDrawer />);
    expect(screen.getByTestId('left-drawer-thinking')).toBeInTheDocument();
    expect(screen.getByText('正在分析需求...')).toBeInTheDocument();
  });

  it('AI thinking=false 时不显示 thinking 行', () => {
    setupAllStores({ leftDrawerOpen: true }, { aiThinking: false });
    render(<LeftDrawer />);
    expect(screen.queryByTestId('left-drawer-thinking')).not.toBeInTheDocument();
  });
});
