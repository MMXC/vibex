/**
 * ActionBar Tests
 * Epic 6: 底部面板 - 操作按钮栏
 * ST-6.4: AI 快捷询问
 * ST-6.5: 诊断/优化按钮
 * ST-6.7: 保存草稿
 * ST-6.8: 重新生成按钮
 * ST-6.9: 创建项目按钮
 */
// @ts-nocheck


import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ActionBar } from '../ActionBar';

describe('ActionBar', () => {
  const defaultProps = {
    isGenerating: false,
    onAIAsk: jest.fn(),
    onDiagnose: jest.fn(),
    onOptimize: jest.fn(),
    onHistory: jest.fn(),
    onSave: jest.fn(),
    onRegenerate: jest.fn(),
    onCreateProject: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ST-6.4: AI 快捷询问 (左侧按钮组)', () => {
    it('渲染 AI 询问按钮', () => {
      render(<ActionBar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /AI询问/i })).toBeInTheDocument();
    });

    it('点击调用 onAIAsk', () => {
      render(<ActionBar {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /AI询问/i }));
      expect(defaultProps.onAIAsk).toHaveBeenCalledTimes(1);
    });

    it('isGenerating 时禁用 AI 询问按钮', () => {
      render(<ActionBar {...defaultProps} isGenerating />);
      expect(screen.getByRole('button', { name: /AI询问/i })).toBeDisabled();
    });

    it('渲染诊断按钮', () => {
      render(<ActionBar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /诊断/i })).toBeInTheDocument();
    });

    it('点击调用 onDiagnose', () => {
      render(<ActionBar {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /诊断/i }));
      expect(defaultProps.onDiagnose).toHaveBeenCalledTimes(1);
    });

    it('isGenerating 时禁用诊断按钮', () => {
      render(<ActionBar {...defaultProps} isGenerating />);
      expect(screen.getByRole('button', { name: /诊断/i })).toBeDisabled();
    });

    it('渲染优化按钮', () => {
      render(<ActionBar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /优化/i })).toBeInTheDocument();
    });

    it('点击调用 onOptimize', () => {
      render(<ActionBar {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /优化/i }));
      expect(defaultProps.onOptimize).toHaveBeenCalledTimes(1);
    });

    it('渲染历史按钮', () => {
      render(<ActionBar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /历史/i })).toBeInTheDocument();
    });

    it('点击调用 onHistory', () => {
      render(<ActionBar {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /历史/i }));
      expect(defaultProps.onHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('ST-6.7: 保存草稿', () => {
    it('渲染保存按钮', () => {
      render(<ActionBar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /保存/i })).toBeInTheDocument();
    });

    it('点击调用 onSave', () => {
      render(<ActionBar {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /保存/i }));
      expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    });

    it('isGenerating 时禁用保存按钮', () => {
      render(<ActionBar {...defaultProps} isGenerating />);
      expect(screen.getByRole('button', { name: /保存/i })).toBeDisabled();
    });
  });

  describe('ST-6.8: 重新生成按钮', () => {
    it('渲染重新生成按钮', () => {
      render(<ActionBar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /重新生成/i })).toBeInTheDocument();
    });

    it('点击调用 onRegenerate', () => {
      render(<ActionBar {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /重新生成/i }));
      expect(defaultProps.onRegenerate).toHaveBeenCalledTimes(1);
    });

    it('isGenerating 时禁用重新生成按钮', () => {
      render(<ActionBar {...defaultProps} isGenerating />);
      expect(screen.getByRole('button', { name: /重新生成/i })).toBeDisabled();
    });
  });

  describe('ST-6.9: 创建项目按钮', () => {
    it('渲染创建项目按钮', () => {
      render(<ActionBar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /创建项目/i })).toBeInTheDocument();
    });

    it('点击调用 onCreateProject', () => {
      render(<ActionBar {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /创建项目/i }));
      expect(defaultProps.onCreateProject).toHaveBeenCalledTimes(1);
    });

    it('isGenerating 时禁用创建项目按钮', () => {
      render(<ActionBar {...defaultProps} isGenerating />);
      expect(screen.getByRole('button', { name: /创建项目/i })).toBeDisabled();
    });

    it('创建项目按钮有 primary class', () => {
      render(<ActionBar {...defaultProps} />);
      const createBtn = screen.getByRole('button', { name: /创建项目/i });
      // CSS module class names are hashed; just verify it has 'primary' substring
      expect(createBtn.className).toContain('primary');
    });
  });

  describe('Toolbar Accessibility', () => {
    it('role="toolbar" 用于工具栏无障碍', () => {
      render(<ActionBar {...defaultProps} />);
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('aria-label="操作工具栏"', () => {
      render(<ActionBar {...defaultProps} />);
      expect(screen.getByRole('toolbar', { name: '操作工具栏' })).toBeInTheDocument();
    });

    it('data-testid="action-bar"', () => {
      render(<ActionBar {...defaultProps} />);
      expect(screen.getByTestId('action-bar')).toBeInTheDocument();
    });
  });
});
