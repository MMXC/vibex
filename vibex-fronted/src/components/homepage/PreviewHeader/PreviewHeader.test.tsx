/**
 * PreviewHeader Component Tests - Epic 4
 * 
 * 验收标准:
 * - ST-4.4: 缩放控制 (50%–200%)
 * - ST-4.6: 导出 PNG/SVG 按钮
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreviewHeader } from './PreviewHeader';

describe('PreviewHeader Component', () => {
  const defaultProps = {
    scale: 1,
    onScaleChange: vi.fn(),
    onExportPNG: vi.fn(),
    onExportSVG: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ST-4.4: 缩放控制 (50%–200%)', () => {
    it('应该显示缩放控制区域', () => {
      render(<PreviewHeader {...defaultProps} />);

      const scaleControl = screen.getByTestId('scale-control');
      expect(scaleControl).toBeInTheDocument();
    });

    it('应该显示缩放滑块', () => {
      render(<PreviewHeader {...defaultProps} />);

      const slider = screen.getByTestId('scale-slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('min', '0.5');
      expect(slider).toHaveAttribute('max', '2');
    });

    it('滑块值变化应该触发回调', () => {
      render(<PreviewHeader {...defaultProps} />);

      const slider = screen.getByTestId('scale-slider');
      fireEvent.change(slider, { target: { value: '1.5' } });

      expect(defaultProps.onScaleChange).toHaveBeenCalledWith(1.5);
    });

    it('应该显示缩放百分比值', () => {
      render(<PreviewHeader {...defaultProps} scale={1.5} />);

      const scaleValue = screen.getByTestId('scale-value');
      expect(scaleValue).toHaveTextContent('150%');
    });

    it('应该显示快速缩放选项 (50%, 75%, 100%, 125%, 150%, 200%)', () => {
      render(<PreviewHeader {...defaultProps} />);

      expect(screen.getByTestId('scale-option-0.5')).toBeInTheDocument();
      expect(screen.getByTestId('scale-option-0.75')).toBeInTheDocument();
      expect(screen.getByTestId('scale-option-1')).toBeInTheDocument();
      expect(screen.getByTestId('scale-option-1.25')).toBeInTheDocument();
      expect(screen.getByTestId('scale-option-1.5')).toBeInTheDocument();
      expect(screen.getByTestId('scale-option-2')).toBeInTheDocument();
    });

    it('点击快速缩放选项应该触发回调', () => {
      render(<PreviewHeader {...defaultProps} />);

      const option = screen.getByTestId('scale-option-0.5');
      fireEvent.click(option);

      expect(defaultProps.onScaleChange).toHaveBeenCalledWith(0.5);
    });

    it('当前缩放值的选项应该有激活样式', () => {
      render(<PreviewHeader {...defaultProps} scale={1} />);

      const activeOption = screen.getByTestId('scale-option-1');
      // 检查元素有激活类名
      expect(activeOption.className).toContain('scaleOptionActive');
    });

    it('应该显示图表类型标签', () => {
      render(<PreviewHeader {...defaultProps} diagramType="context" />);

      const diagramType = screen.getByTestId('diagram-type');
      expect(diagramType).toHaveTextContent('限界上下文');
    });
  });

  describe('ST-4.6: 导出按钮 (PNG / SVG)', () => {
    it('应该显示导出控制区域', () => {
      render(<PreviewHeader {...defaultProps} />);

      const exportControls = screen.getByTestId('export-controls');
      expect(exportControls).toBeInTheDocument();
    });

    it('应该显示 PNG 导出按钮', () => {
      render(<PreviewHeader {...defaultProps} />);

      const pngButton = screen.getByTestId('export-png-button');
      expect(pngButton).toBeInTheDocument();
      expect(pngButton).toHaveTextContent('PNG');
    });

    it('应该显示 SVG 导出按钮', () => {
      render(<PreviewHeader {...defaultProps} />);

      const svgButton = screen.getByTestId('export-svg-button');
      expect(svgButton).toBeInTheDocument();
      expect(svgButton).toHaveTextContent('SVG');
    });

    it('点击 PNG 按钮应该触发回调', () => {
      render(<PreviewHeader {...defaultProps} />);

      const pngButton = screen.getByTestId('export-png-button');
      fireEvent.click(pngButton);

      expect(defaultProps.onExportPNG).toHaveBeenCalledTimes(1);
    });

    it('点击 SVG 按钮应该触发回调', () => {
      render(<PreviewHeader {...defaultProps} />);

      const svgButton = screen.getByTestId('export-svg-button');
      fireEvent.click(svgButton);

      expect(defaultProps.onExportSVG).toHaveBeenCalledTimes(1);
    });

    it('正在导出时应该禁用按钮并显示加载状态', () => {
      render(<PreviewHeader {...defaultProps} isExporting={true} />);

      const pngButton = screen.getByTestId('export-png-button');
      const svgButton = screen.getByTestId('export-svg-button');

      expect(pngButton).toBeDisabled();
      expect(svgButton).toBeDisabled();
      expect(pngButton).toHaveTextContent('导出中...');
      expect(svgButton).toHaveTextContent('导出中...');
    });

    it('禁用状态下不应该触发导出回调', () => {
      // 使用 isExporting 来禁用按钮
      render(<PreviewHeader {...defaultProps} isExporting={true} />);

      const pngButton = screen.getByTestId('export-png-button');
      const svgButton = screen.getByTestId('export-svg-button');

      // 验证按钮确实被禁用
      expect(pngButton).toBeDisabled();
      expect(svgButton).toBeDisabled();

      // 禁用状态下点击不应该触发回调
      fireEvent.click(pngButton);
      fireEvent.click(svgButton);

      expect(defaultProps.onExportPNG).not.toHaveBeenCalled();
      expect(defaultProps.onExportSVG).not.toHaveBeenCalled();
    });
  });
});
