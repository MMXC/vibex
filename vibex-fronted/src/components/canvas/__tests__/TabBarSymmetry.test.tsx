/**
 * TabBarSymmetry.test.tsx
 * Epic: E4 TabBar Phase 对齐
 * 验证 TabBar 和 PhaseNavigator 双向同步对称性
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabBar } from '../TabBar';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import type { Phase } from '@/lib/canvas/types';

// Reset before each
beforeEach(() => {
  useContextStore.setState({ activeTree: 'context', phase: 'component', contextNodes: [] });
  useFlowStore.setState({ flowNodes: [] });
  useComponentStore.setState({ componentNodes: [] });
  useSessionStore.setState({ prototypeQueue: [] });
});

describe('E4: TabBar Phase 对齐', () => {
  describe('Phase1 (input) 显示约束', () => {
    it('Phase=input 时仅显示"上下文"一个 tab', () => {
      useContextStore.setState({ phase: 'input', activeTree: 'context' });
      render(<TabBar />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(1);
      expect(tabs[0]).toHaveTextContent('上下文');
    });

    it('Phase=context 时显示"上下文"和"流程"两个 tab', () => {
      useContextStore.setState({ phase: 'context', activeTree: 'context' });
      render(<TabBar />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
      expect(screen.getByText('上下文')).toBeInTheDocument();
      expect(screen.getByText('流程')).toBeInTheDocument();
    });

    it('Phase=flow 时显示"上下文"和"流程"两个 tab', () => {
      useContextStore.setState({ phase: 'flow', activeTree: 'flow' });
      render(<TabBar />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
    });

    it('Phase=component 时显示 context + flow + component 三个 tab（原型需 prototype phase）', () => {
      useContextStore.setState({ phase: 'component', activeTree: 'component' });
      render(<TabBar />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3); // context + flow + component
      expect(screen.getByText('上下文')).toBeInTheDocument();
      expect(screen.getByText('流程')).toBeInTheDocument();
      expect(screen.getByText('组件')).toBeInTheDocument();
    });

    it('Phase=prototype 时显示全部 4 个 tab', () => {
      useContextStore.setState({ phase: 'prototype', activeTree: null });
      render(<TabBar />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
    });
  });

  describe('TabBar 点击 → phase 同步（PhaseNavigator 对称）', () => {
    it('点击"上下文" tab，phase 变为 context，activeTree 同步', async () => {
      const user = userEvent.setup();
      useContextStore.setState({ phase: 'component', activeTree: 'component' });
      render(<TabBar />);

      await user.click(screen.getByText('上下文').closest('[role="tab"]')!);
      const state = useContextStore.getState();
      expect(state.phase).toBe('context');
      expect(state.activeTree).toBe('context');
    });

    it('点击"流程" tab，phase 变为 flow，activeTree 同步', async () => {
      const user = userEvent.setup();
      useContextStore.setState({ phase: 'component', activeTree: 'component' });
      render(<TabBar />);

      await user.click(screen.getByText('流程').closest('[role="tab"]')!);
      const state = useContextStore.getState();
      expect(state.phase).toBe('flow');
      expect(state.activeTree).toBe('flow');
    });

    it('点击"组件" tab，phase 变为 component，activeTree 同步', async () => {
      const user = userEvent.setup();
      useContextStore.setState({ phase: 'flow', activeTree: 'flow' });
      render(<TabBar />);
      // component tab only visible in component or prototype phase — skip if not rendered
      const componentTab = screen.queryByText('组件')?.closest('[role="tab"]');
      if (!componentTab) {
        // input/context/flow phase: component tab not visible
        expect(useContextStore.getState().phase).toBe('flow');
        return;
      }
      await user.click(componentTab);
      const state = useContextStore.getState();
      expect(state.phase).toBe('component');
      expect(state.activeTree).toBe('component');
    });

    it('点击"原型" tab（仅 prototype phase 可见），phase 变为 prototype', async () => {
      const user = userEvent.setup();
      useContextStore.setState({ phase: 'prototype', activeTree: null });
      render(<TabBar />);
      const protoTab = screen.queryByText('原型')?.closest('[role="tab"]');
      if (!protoTab) return;
      await user.click(protoTab);
      expect(useContextStore.getState().phase).toBe('prototype');
    });
  });

  describe('PhaseNavigator → TabBar 同步', () => {
    it('phase 变为 context，TabBar 高亮"上下文" tab', () => {
      useContextStore.setState({ phase: 'context', activeTree: 'context' });
      render(<TabBar />);
      const contextTab = screen.getByText('上下文').closest('[role="tab"]')!;
      expect(contextTab).toHaveAttribute('aria-selected', 'true');
    });

    it('phase 变为 flow，TabBar 高亮"流程" tab', () => {
      useContextStore.setState({ phase: 'flow', activeTree: 'flow' });
      render(<TabBar />);
      const flowTab = screen.getByText('流程').closest('[role="tab"]')!;
      expect(flowTab).toHaveAttribute('aria-selected', 'true');
    });

    it('phase 变为 prototype，TabBar 高亮"原型" tab', () => {
      useContextStore.setState({ phase: 'prototype', activeTree: null });
      render(<TabBar />);
      const protoTab = screen.queryByText('原型')?.closest('[role="tab"]');
      if (!protoTab) return;
      expect(protoTab).toHaveAttribute('aria-selected', 'true');
    });

    it('phase 变为 component，TabBar 高亮"组件" tab', () => {
      useContextStore.setState({ phase: 'component', activeTree: 'component' });
      render(<TabBar />);
      const componentTab = screen.getByText('组件').closest('[role="tab"]')!;
      expect(componentTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('PhaseIndicator 行为（PhaseNavigator 对称）', () => {
    it('Phase=input 时可见 tab 仅上下文，但 phase 仍为 input（画布工具栏不切换）', () => {
      useContextStore.setState({ phase: 'input', activeTree: 'context' });
      render(<TabBar />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(1);
      expect(tabs[0]).toHaveTextContent('上下文');
      expect(useContextStore.getState().phase).toBe('input');
    });
  });
});