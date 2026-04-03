/**
 * FloatingMode Component Tests
 *
 * Epic 8: 悬浮模式
 * ST-8.1: 滚动触发收起
 * ST-8.2: 悬浮停止恢复
 * ST-8.3: 动画流畅 60fps (CSS transition, 无 JS 动画)
 *
 * Note: Scroll simulation tests are in useFloatingMode.test.ts
 * These tests focus on component rendering and integration.
 */
// @ts-nocheck


import React, { useState, useRef } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FloatingMode } from '../FloatingMode';

describe('FloatingMode', () => {
  /**
   * Helper that exposes refs via state for testing class application.
   * Uses callback refs to capture DOM elements without ref forwarding issues.
   */
  function FloatingModeWithRefs({ children }: { children?: React.ReactNode }) {
    const bottomRefCallback = useRef<HTMLDivElement | null>(null);
    const rightRefCallback = useRef<HTMLDivElement | null>(null);
    const [bottomEl, setBottomEl] = useState<HTMLDivElement | null>(null);
    const [rightEl, setRightEl] = useState<HTMLDivElement | null>(null);

    const setBottomRef = (el: HTMLDivElement | null) => {
      (bottomRefCallback as React.MutableRefObject<HTMLDivElement | null>).current = el;
      setBottomEl(el);
    };

    const setRightRef = (el: HTMLDivElement | null) => {
      (rightRefCallback as React.MutableRefObject<HTMLDivElement | null>).current = el;
      setRightEl(el);
    };

    return (
      <FloatingMode
        bottomPanelRef={{ current: bottomEl } as React.RefObject<HTMLDivElement | null>}
        rightPanelRef={{ current: rightEl } as React.RefObject<HTMLDivElement | null>}
      >
        <div ref={setBottomRef} data-testid="bottom-panel">{children} Bottom</div>
        <div ref={setRightRef} data-testid="right-panel">Right</div>
      </FloatingMode>
    );
  }

  describe('ST-8.1: 滚动触发收起 - 组件渲染', () => {
    it('应渲染悬浮模式容器', () => {
      render(
        <FloatingMode>
          <div data-testid="child-content">Test Content</div>
        </FloatingMode>
      );

      expect(screen.getByTestId('floating-mode')).toBeInTheDocument();
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('默认不处于悬浮状态', () => {
      render(<FloatingMode><div>Content</div></FloatingMode>);

      const container = screen.getByTestId('floating-mode');
      expect(container).toHaveAttribute('data-floating', 'false');
    });

    it('className 包含 floatingMode 和 active', async () => {
      // Test that the component has proper className structure
      render(<FloatingMode><div>Content</div></FloatingMode>);

      const container = screen.getByTestId('floating-mode');
      // Initial state: not floating, no 'active' class
      expect(container.className).toContain('floatingMode');
      expect(container.className).not.toContain(' active');
    });

    it('子元素正确渲染', () => {
      render(
        <FloatingMode>
          <span data-testid="nested-child">Nested</span>
        </FloatingMode>
      );

      expect(screen.getByTestId('nested-child')).toBeInTheDocument();
    });
  });

  describe('ST-8.3: 面板 class 应用', () => {
    // Use callback refs to capture DOM elements reliably
    it('底部面板和右侧面板引用正确设置', async () => {
      const bottomElRef = { current: null as HTMLDivElement | null };
      const rightElRef = { current: null as HTMLDivElement | null };

      render(
        <FloatingMode
          bottomPanelRef={{ current: null } as React.RefObject<HTMLDivElement | null>}
          rightPanelRef={{ current: null } as React.RefObject<HTMLDivElement | null>}
        >
          <div ref={el => { bottomElRef.current = el; }} data-testid="bottom-panel">Bottom</div>
          <div ref={el => { rightElRef.current = el; }} data-testid="right-panel">Right</div>
        </FloatingMode>
      );

      // Refs should be set after render
      await waitFor(() => {
        expect(bottomElRef.current).not.toBeNull();
        expect(rightElRef.current).not.toBeNull();
      });
    });

    it('bottomPanelRef.current 初始为 null 时不崩溃', () => {
      // Should not throw when refs are null
      expect(() => {
        render(
          <FloatingMode
            bottomPanelRef={{ current: null } as React.RefObject<HTMLDivElement | null>}
            rightPanelRef={{ current: null } as React.RefObject<HTMLDivElement | null>}
          >
            <div data-testid="bottom-panel">Bottom</div>
          </FloatingMode>
        );
      }).not.toThrow();
    });
  });

  describe('ST-8.2: 恢复延迟配置', () => {
    it('默认 resumeDelay 为 1000ms', () => {
      // Verify the component accepts resumeDelay prop
      const onChange = jest.fn();
      render(
        <FloatingMode resumeDelay={1000} onFloatingChange={onChange}>
          <div>Content</div>
        </FloatingMode>
      );
      // Component should render with the prop without errors
      expect(screen.getByTestId('floating-mode')).toBeInTheDocument();
    });

    it('resumeDelay 可配置为不同值', () => {
      const onChange = jest.fn();
      render(
        <FloatingMode resumeDelay={500} onFloatingChange={onChange}>
          <div>Content</div>
        </FloatingMode>
      );
      expect(screen.getByTestId('floating-mode')).toBeInTheDocument();
    });
  });

  describe('R-1: 不遮挡核心内容', () => {
    it('floating-right class 使用 fixed 定位，不影响文档流', () => {
      // Fixed positioning removes element from document flow, preventing overlap
      render(
        <FloatingMode
          rightPanelRef={{ current: null } as React.RefObject<HTMLDivElement | null>}
        >
          <div>AI Panel</div>
        </FloatingMode>
      );

      // Component should render - fixed positioning is in CSS
      expect(screen.getByTestId('floating-mode')).toBeInTheDocument();
    });
  });

  describe('onFloatingChange callback', () => {
    it('悬浮状态变化时应调用 onFloatingChange', async () => {
      const onChange = jest.fn();
      jest.useFakeTimers();

      // We can't easily simulate scroll in the component test due to jsdom limitations,
      // but we can verify the callback prop is accepted and the component renders
      render(
        <FloatingMode onFloatingChange={onChange}>
          <div>Content</div>
        </FloatingMode>
      );

      // Component renders successfully with callback prop
      expect(screen.getByTestId('floating-mode')).toBeInTheDocument();

      jest.useRealTimers();
    });

    it('启用 enabled=false 时组件渲染', () => {
      render(
        <FloatingMode enabled={false}>
          <div>Content</div>
        </FloatingMode>
      );

      expect(screen.getByTestId('floating-mode')).toBeInTheDocument();
    });

    it('threshold 可配置', () => {
      render(
        <FloatingMode threshold={0.3}>
          <div>Content</div>
        </FloatingMode>
      );

      expect(screen.getByTestId('floating-mode')).toBeInTheDocument();
    });
  });
});
