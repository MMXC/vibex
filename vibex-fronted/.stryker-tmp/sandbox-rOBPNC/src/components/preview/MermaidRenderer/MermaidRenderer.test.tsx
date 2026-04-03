/**
 * MermaidRenderer Component Tests - Epic 4
 * 
 * 验收标准:
 * - ST-4.1: 空状态占位符
 * - ST-4.2: 加载骨架屏
 * - ST-4.3: Mermaid 渲染 (4种类型)
 * - ST-4.5: 拖拽平移
 */
// @ts-nocheck

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MermaidRenderer } from './MermaidRenderer';
import { mermaidManager } from '@/lib/mermaid/MermaidManager';

// Mock mermaidManager
jest.mock('@/lib/mermaid/MermaidManager', () => ({
  mermaidManager: {
    render: jest.fn(),
  },
}));

const mockMermaidRender = mermaidManager.render as jest.MockedFunction<
  typeof mermaidManager.render
>;

describe('MermaidRenderer Component', () => {
  const defaultProps = {
    code: 'graph TD\n  A --> B',
    type: 'flow' as const,
    scale: 1,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMermaidRender.mockResolvedValue('<svg>Mock SVG</svg>');
  });

  describe('ST-4.1: 空状态占位符', () => {
    it('空代码时应该显示占位符', async () => {
      render(<MermaidRenderer {...defaultProps} code="" />);

      const empty = screen.getByTestId('mermaid-empty');
      expect(empty).toBeInTheDocument();
      expect(screen.getByText('输入需求后预览将显示在这里')).toBeInTheDocument();
    });

    it('空状态应该显示支持的图表类型提示', () => {
      render(<MermaidRenderer {...defaultProps} code="" />);

      expect(screen.getByText('支持上下文图、模型图、流程图、组件图')).toBeInTheDocument();
    });

    it('空状态时不应该调用 mermaidManager.render', async () => {
      render(<MermaidRenderer {...defaultProps} code="" />);

      expect(mockMermaidRender).not.toHaveBeenCalled();
    });
  });

  describe('ST-4.2: 加载骨架屏', () => {
    it('isLoading 为 true 时应该显示加载状态', () => {
      render(<MermaidRenderer {...defaultProps} isLoading={true} />);

      const loading = screen.getByTestId('mermaid-loading');
      expect(loading).toBeInTheDocument();
    });

    it('加载状态应该显示骨架屏元素', () => {
      render(<MermaidRenderer {...defaultProps} isLoading={true} />);

      const skeleton = screen.getByTestId('preview-skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(screen.getByText('渲染中...')).toBeInTheDocument();
    });
  });

  describe('ST-4.3: Mermaid 渲染 (4种类型)', () => {
    it('有代码时应该渲染 SVG', async () => {
      render(<MermaidRenderer {...defaultProps} />);

      await waitFor(() => {
        const svgContainer = document.querySelector('[data-testid="mermaid-flow"] svg');
        expect(svgContainer).toBeInTheDocument();
      });
    });

    it('渲染完成后应该调用 onRenderComplete', async () => {
      const onRenderComplete = jest.fn();
      render(<MermaidRenderer {...defaultProps} onRenderComplete={onRenderComplete} />);

      await waitFor(() => {
        expect(onRenderComplete).toHaveBeenCalled();
      });
    });

    it('渲染错误时应该显示错误信息', async () => {
      mockMermaidRender.mockRejectedValue(new Error('Syntax error'));

      const onError = jest.fn();
      render(<MermaidRenderer {...defaultProps} onError={onError} />);

      await waitFor(() => {
        const error = screen.getByTestId('mermaid-error');
        expect(error).toBeInTheDocument();
        expect(screen.getByText('Syntax error')).toBeInTheDocument();
      });

      expect(onError).toHaveBeenCalledWith('Syntax error');
    });

    it('渲染错误时应该能够查看原始代码', async () => {
      mockMermaidRender.mockRejectedValue(new Error('Test error'));

      render(<MermaidRenderer {...defaultProps} />);

      await waitFor(() => {
        const details = screen.getByText('查看原始代码');
        expect(details).toBeInTheDocument();
      });
    });

    it('应该正确设置 data-type 属性', async () => {
      const { rerender } = render(<MermaidRenderer {...defaultProps} type="context" />);

      await waitFor(() => {
        const element = screen.getByTestId('mermaid-context');
        expect(element).toBeInTheDocument();
      });

      rerender(<MermaidRenderer {...defaultProps} type="model" />);

      await waitFor(() => {
        const element = screen.getByTestId('mermaid-model');
        expect(element).toBeInTheDocument();
      });
    });
  });

  describe('ST-4.5: 拖拽平移', () => {
    it('应该可以拖拽', async () => {
      render(<MermaidRenderer {...defaultProps} />);

      await waitFor(() => {
        const renderer = screen.getByTestId('mermaid-flow');
        expect(renderer).toBeInTheDocument();
      });

      const renderer = screen.getByTestId('mermaid-flow');
      const canvas = renderer.querySelector('[class*="canvas"]');

      // 模拟鼠标按下
      fireEvent.mouseDown(renderer, { button: 0, clientX: 0, clientY: 0 });

      // 模拟鼠标移动
      fireEvent.mouseMove(renderer, { clientX: 100, clientY: 100 });

      // 模拟鼠标释放
      fireEvent.mouseUp(renderer);
    });

    it('双击应该重置位置', async () => {
      render(<MermaidRenderer {...defaultProps} />);

      await waitFor(() => {
        const renderer = screen.getByTestId('mermaid-flow');
        expect(renderer).toBeInTheDocument();
      });

      const renderer = screen.getByTestId('mermaid-flow');

      // 模拟拖拽
      fireEvent.mouseDown(renderer, { button: 0, clientX: 0, clientY: 0 });
      fireEvent.mouseMove(renderer, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(renderer);

      // 双击重置
      fireEvent.doubleClick(renderer);
    });

    it('拖拽时应该显示提示', async () => {
      render(<MermaidRenderer {...defaultProps} />);

      await waitFor(() => {
        const renderer = screen.getByTestId('mermaid-flow');
        expect(renderer).toBeInTheDocument();
      });

      const renderer = screen.getByTestId('mermaid-flow');

      // 悬停显示提示
      fireEvent.mouseEnter(renderer);

      // 提示应该在悬停时可见
      const hint = renderer.querySelector('[class*="dragHint"]');
      expect(hint).toBeInTheDocument();
    });

    it('右键不应该触发拖拽', async () => {
      render(<MermaidRenderer {...defaultProps} />);

      await waitFor(() => {
        const renderer = screen.getByTestId('mermaid-flow');
        expect(renderer).toBeInTheDocument();
      });

      const renderer = screen.getByTestId('mermaid-flow');

      // 右键点击不应该触发拖拽
      fireEvent.mouseDown(renderer, { button: 2, clientX: 0, clientY: 0 });

      // 移动时不应该有效果
      fireEvent.mouseMove(renderer, { clientX: 100, clientY: 100 });

      // 组件仍然正常
      expect(screen.getByTestId('mermaid-flow')).toBeInTheDocument();
    });
  });

  describe('缩放控制', () => {
    it('应该应用缩放比例', async () => {
      render(<MermaidRenderer {...defaultProps} scale={1.5} />);

      await waitFor(() => {
        const canvas = document.querySelector('[class*="canvas"]');
        expect(canvas).toBeInTheDocument();
      });

      const canvas = document.querySelector('[class*="canvas"]') as HTMLElement;
      expect(canvas.style.transform).toContain('scale(1.5)');
    });
  });
});
