/**
 * MessageDrawer.test.tsx — Epic 3: 消息抽屉集成测试
 *
 * S3.1: MessageDrawer 使用 canvasStore.rightDrawerOpen
 * S3.2: SSE 状态显示
 * S3.3: 中止按钮
 */
// @ts-nocheck


import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageDrawer } from '@/components/canvas/messageDrawer/MessageDrawer';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { useMessageDrawerStore } from '@/components/canvas/messageDrawer/messageDrawerStore';

function setupCanvasStore(overrides = {}) {
  useCanvasStore.setState({
    rightDrawerOpen: false,
    rightDrawerWidth: 200,
    sseStatus: 'idle',
    sseError: null,
    flowGenerating: false,
    aiThinking: false,
    abortGeneration: jest.fn(),
    toggleRightDrawer: jest.fn(),
    ...overrides,
  });
}

describe('Epic 3 S3.1: MessageDrawer uses canvasStore.rightDrawerOpen', () => {
  beforeEach(() => {
    useMessageDrawerStore.setState({ messages: [] });
    setupCanvasStore({ rightDrawerOpen: false });
  });

  it('AC-S3.1: 抽屉关闭时 aria-hidden=true', () => {
    setupCanvasStore({ rightDrawerOpen: false });
    render(<MessageDrawer />);
    const drawer = screen.getByTestId('message-drawer');
    expect(drawer).toHaveAttribute('aria-hidden', 'true');
  });

  it('AC-S3.1: 抽屉打开时 aria-hidden=false', () => {
    setupCanvasStore({ rightDrawerOpen: true });
    render(<MessageDrawer />);
    const drawer = screen.getByTestId('message-drawer');
    expect(drawer).toHaveAttribute('aria-hidden', 'false');
  });

  it('AC-S3.1: 打开时显示标题', () => {
    setupCanvasStore({ rightDrawerOpen: true });
    render(<MessageDrawer />);
    expect(screen.getByText('💬 消息')).toBeInTheDocument();
  });
});

describe('Epic 3 S3.2: SSE Status Display', () => {
  beforeEach(() => {
    useMessageDrawerStore.setState({ messages: [] });
    setupCanvasStore({ rightDrawerOpen: true });
  });

  it('AC-S3.2: idle 状态显示待机', () => {
    setupCanvasStore({ rightDrawerOpen: true, sseStatus: 'idle' });
    render(<MessageDrawer />);
    expect(screen.getByTestId('sse-status-pill')).toHaveTextContent('待机');
  });

  it('AC-S3.2: connecting 状态显示连接中', () => {
    setupCanvasStore({ rightDrawerOpen: true, sseStatus: 'connecting' });
    render(<MessageDrawer />);
    expect(screen.getByTestId('sse-status-pill')).toHaveTextContent('连接中');
  });

  it('AC-S3.2: connected 状态显示已连接', () => {
    setupCanvasStore({ rightDrawerOpen: true, sseStatus: 'connected' });
    render(<MessageDrawer />);
    expect(screen.getByTestId('sse-status-pill')).toHaveTextContent('已连接');
  });

  it('AC-S3.2: error 状态显示错误并显示错误信息', () => {
    setupCanvasStore({ rightDrawerOpen: true, sseStatus: 'error', sseError: '连接失败' });
    render(<MessageDrawer />);
    expect(screen.getByTestId('sse-status-pill')).toHaveTextContent('错误');
    expect(screen.getByTestId('sse-status-pill')).toHaveAttribute('title', '连接失败');
  });
});

describe('Epic 3 S3.3: Abort Button', () => {
  beforeEach(() => {
    useMessageDrawerStore.setState({ messages: [] });
  });

  it('AC-S3.3: 生成中显示中止按钮', () => {
    const abortGeneration = jest.fn();
    setupCanvasStore({ rightDrawerOpen: true, flowGenerating: true, abortGeneration });
    render(<MessageDrawer />);
    expect(screen.getByTestId('abort-bar')).toBeInTheDocument();
    expect(screen.getByTestId('abort-button')).toBeInTheDocument();
  });

  it('AC-S3.3: aiThinking=true 时显示中止按钮', () => {
    const abortGeneration = jest.fn();
    setupCanvasStore({ rightDrawerOpen: true, aiThinking: true, abortGeneration });
    render(<MessageDrawer />);
    expect(screen.getByTestId('abort-bar')).toBeInTheDocument();
  });

  it('AC-S3.3: 点击中止按钮调用 abortGeneration', () => {
    const abortGeneration = jest.fn();
    setupCanvasStore({ rightDrawerOpen: true, flowGenerating: true, abortGeneration });
    render(<MessageDrawer />);
    fireEvent.click(screen.getByTestId('abort-button'));
    expect(abortGeneration).toHaveBeenCalledTimes(1);
  });

  it('AC-S3.3: 生成结束（flowGenerating=false, aiThinking=false）不显示中止按钮', () => {
    setupCanvasStore({ rightDrawerOpen: true, flowGenerating: false, aiThinking: false });
    render(<MessageDrawer />);
    expect(screen.queryByTestId('abort-bar')).not.toBeInTheDocument();
  });
});

describe('Epic 1: messageDrawerStore — 消息存储（保持独立）', () => {
  beforeEach(() => {
    useMessageDrawerStore.setState({ messages: [] });
  });

  it('addMessage 添加消息', () => {
    const { addMessage } = useMessageDrawerStore.getState();
    addMessage({ type: 'user_action', content: '添加了上下文节点' });
    expect(useMessageDrawerStore.getState().messages).toHaveLength(1);
  });

  it('clearMessages 清空消息', () => {
    const { addMessage, clearMessages } = useMessageDrawerStore.getState();
    addMessage({ type: 'system', content: '测试' });
    clearMessages();
    expect(useMessageDrawerStore.getState().messages).toHaveLength(0);
  });

  it('toggleDrawer 切换抽屉状态（messageDrawerStore 保持独立，不影响 canvasStore）', () => {
    // Verify messageDrawerStore.toggleDrawer still works for its own state
    const { toggleDrawer } = useMessageDrawerStore.getState();
    expect(useMessageDrawerStore.getState().isOpen).toBe(false);
    toggleDrawer();
    expect(useMessageDrawerStore.getState().isOpen).toBe(true);
  });
});
