/**
 * CollapseHandle Tests
 * Epic 6: 底部面板 - 收起手柄
 * ST-6.1: 收起/展开手柄 (30px)
 */
// @ts-nocheck


import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CollapseHandle } from '../CollapseHandle';

describe('CollapseHandle', () => {
  describe('ST-6.1: 收起/展开手柄', () => {
    it('渲染默认展开状态', () => {
      render(<CollapseHandle isCollapsed={false} onToggle={jest.fn()} />);
      expect(screen.getByTestId('collapse-handle')).toBeInTheDocument();
      expect(screen.getByText('⬆️')).toBeInTheDocument();
      expect(screen.getByText('拖动收起')).toBeInTheDocument();
    });

    it('渲染收起状态', () => {
      render(<CollapseHandle isCollapsed={true} onToggle={jest.fn()} />);
      expect(screen.getByText('⬇️')).toBeInTheDocument();
      expect(screen.getByText('展开')).toBeInTheDocument();
    });

    it('点击时调用 onToggle', () => {
      const onToggle = jest.fn();
      render(<CollapseHandle isCollapsed={false} onToggle={onToggle} />);
      fireEvent.click(screen.getByTestId('collapse-handle'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('键盘 Enter 触发 onToggle', () => {
      const onToggle = jest.fn();
      render(<CollapseHandle isCollapsed={false} onToggle={onToggle} />);
      const handle = screen.getByTestId('collapse-handle');
      handle.focus();
      fireEvent.keyDown(handle, { key: 'Enter' });
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('键盘空格触发 onToggle', () => {
      const onToggle = jest.fn();
      render(<CollapseHandle isCollapsed={false} onToggle={onToggle} />);
      const handle = screen.getByTestId('collapse-handle');
      handle.focus();
      fireEvent.keyDown(handle, { key: ' ' });
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('role="button" 用于无障碍', () => {
      render(<CollapseHandle isCollapsed={false} onToggle={jest.fn()} />);
      expect(screen.getByRole('button', { name: /展开面板|拖动收起/ })).toBeInTheDocument();
    });

    it('title 属性正确', () => {
      const { rerender } = render(<CollapseHandle isCollapsed={false} onToggle={jest.fn()} />);
      expect(screen.getByTestId('collapse-handle')).toHaveAttribute('title', '收起面板');

      rerender(<CollapseHandle isCollapsed={true} onToggle={jest.fn()} />);
      expect(screen.getByTestId('collapse-handle')).toHaveAttribute('title', '展开面板');
    });

    it('tabIndex=0 可键盘访问', () => {
      render(<CollapseHandle isCollapsed={false} onToggle={jest.fn()} />);
      expect(screen.getByTestId('collapse-handle')).toHaveAttribute('tabIndex', '0');
    });
  });
});
