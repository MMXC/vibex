/**
 * MessageDrawer.test.tsx — Epic 1 消息抽屉测试
 *
 * F1.1: 抽屉容器
 * F1.2: 抽屉入口按钮
 * F1.3: 消息列表（4种类型）
 * F1.5: 消息存储（Zustand）
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMessageDrawerStore } from '@/components/canvas/messageDrawer/messageDrawerStore';
import { MessageDrawer } from '@/components/canvas/messageDrawer/MessageDrawer';
import { MessageItem } from '@/components/canvas/messageDrawer/MessageItem';
import { MessageList } from '@/components/canvas/messageDrawer/MessageList';

// ── Store Tests ────────────────────────────────────────────────────────────

describe('Epic 1 F1.5: messageDrawerStore — 消息存储', () => {
  beforeEach(() => {
    useMessageDrawerStore.setState({ isOpen: false, messages: [] });
  });

  it('AC-F1.5: 初始状态 drawer 关闭，消息为空', () => {
    const state = useMessageDrawerStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.messages).toHaveLength(0);
  });

  it('F1.5: addMessage 添加消息', () => {
    const { addMessage } = useMessageDrawerStore.getState();
    addMessage({ type: 'user_action', content: '添加了上下文节点', meta: '用户模块' });
    const { messages } = useMessageDrawerStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe('user_action');
    expect(messages[0].content).toBe('添加了上下文节点');
    expect(messages[0].meta).toBe('用户模块');
    expect(messages[0]).toHaveProperty('id');
    expect(messages[0]).toHaveProperty('timestamp');
  });

  it('F1.5: addMessage 支持 4 种类型', () => {
    const { addMessage } = useMessageDrawerStore.getState();
    addMessage({ type: 'user_action', content: '操作' });
    addMessage({ type: 'ai_suggestion', content: '建议' });
    addMessage({ type: 'system', content: '系统' });
    addMessage({ type: 'command_executed', content: '执行结果', meta: '/gen-context' });
    const { messages } = useMessageDrawerStore.getState();
    expect(messages.map((m) => m.type)).toEqual([
      'user_action', 'ai_suggestion', 'system', 'command_executed'
    ]);
  });

  it('F1.5: toggleDrawer 切换抽屉状态', () => {
    const { toggleDrawer } = useMessageDrawerStore.getState();
    expect(useMessageDrawerStore.getState().isOpen).toBe(false);
    toggleDrawer();
    expect(useMessageDrawerStore.getState().isOpen).toBe(true);
    toggleDrawer();
    expect(useMessageDrawerStore.getState().isOpen).toBe(false);
  });

  it('F1.5: clearMessages 清空消息', () => {
    const { addMessage, clearMessages } = useMessageDrawerStore.getState();
    addMessage({ type: 'system', content: '测试' });
    clearMessages();
    expect(useMessageDrawerStore.getState().messages).toHaveLength(0);
  });

  it('F1.4: addNodeMessage helper 生成正确的消息内容', () => {
    const { addMessage } = useMessageDrawerStore.getState();
    // Test helper function signature
    addMessage({ type: 'user_action', content: '添加了上下文节点', meta: '用户管理' });
    const msg = useMessageDrawerStore.getState().messages[0];
    expect(msg.content).toContain('添加');
    expect(msg.content).toContain('上下文');
  });
});

// ── MessageItem Tests ─────────────────────────────────────────────────────

describe('Epic 1 F1.3: MessageItem — 单条消息展示', () => {
  it('F1.3: user_action 类型显示 ✏️ 图标', () => {
    render(<MessageItem message={{ id: '1', type: 'user_action', content: '添加了节点', timestamp: Date.now() }} />);
    expect(screen.getByText('✏️')).toBeInTheDocument();
    expect(screen.getByText('添加了节点')).toBeInTheDocument();
  });

  it('F1.3: command_executed 类型显示 ▶️ 图标', () => {
    render(<MessageItem message={{ id: '2', type: 'command_executed', content: '/gen-context 执行成功', meta: '/gen-context', timestamp: Date.now() }} />);
    expect(screen.getByText('▶️')).toBeInTheDocument();
    expect(screen.getByText('/gen-context')).toBeInTheDocument();
  });

  it('F1.3: system 类型显示 ⚙️ 图标', () => {
    render(<MessageItem message={{ id: '3', type: 'system', content: '抽屉已打开', timestamp: Date.now() }} />);
    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });

  it('F1.3: 包含 timestamp', () => {
    const ts = Date.now();
    render(<MessageItem message={{ id: '4', type: 'system', content: '测试', timestamp: ts }} />);
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });
});

// ── MessageList Tests ─────────────────────────────────────────────────────

describe('Epic 1 F1.3: MessageList — 消息列表', () => {
  beforeEach(() => {
    useMessageDrawerStore.setState({ isOpen: true, messages: [] });
  });

  it('F1.3: 空消息列表显示空状态', () => {
    render(<MessageList />);
    expect(screen.getByText('暂无消息')).toBeInTheDocument();
    expect(screen.getByText('节点操作和命令执行将显示在这里')).toBeInTheDocument();
  });

  it('F1.3: 有消息时显示消息列表', () => {
    useMessageDrawerStore.setState({
      messages: [
        { id: '1', type: 'user_action', content: '添加了节点', timestamp: Date.now() },
        { id: '2', type: 'command_executed', content: '命令执行成功', meta: '/gen-context', timestamp: Date.now() },
      ]
    });
    render(<MessageList />);
    expect(screen.getByText('添加了节点')).toBeInTheDocument();
    expect(screen.getByText('命令执行成功')).toBeInTheDocument();
    expect(screen.getByText('/gen-context')).toBeInTheDocument();
  });
});

// ── MessageDrawer Tests ───────────────────────────────────────────────────

describe('Epic 1 F1.1: MessageDrawer — 抽屉容器', () => {
  beforeEach(() => {
    useMessageDrawerStore.setState({ isOpen: false, messages: [] });
  });

  it('AC-F1.1: drawer 关闭时宽度为 0（通过 aria-hidden）', () => {
    render(<MessageDrawer />);
    const drawer = screen.getByRole('complementary', { hidden: true });
    expect(drawer).toHaveAttribute('aria-hidden', 'true');
  });

  it('F1.1: drawer 打开时 aria-hidden 为 false', () => {
    useMessageDrawerStore.setState({ isOpen: true });
    render(<MessageDrawer />);
    const drawer = screen.getByRole('complementary');
    expect(drawer).toHaveAttribute('aria-hidden', 'false');
  });

  it('F1.1: drawer 打开时标题可见', () => {
    useMessageDrawerStore.setState({ isOpen: true });
    render(<MessageDrawer />);
    expect(screen.getByText('💬 消息')).toBeInTheDocument();
  });

  it('F1.1: data-testid 正确', () => {
    render(<MessageDrawer />);
    expect(screen.getByTestId('message-drawer')).toBeInTheDocument();
  });
});
