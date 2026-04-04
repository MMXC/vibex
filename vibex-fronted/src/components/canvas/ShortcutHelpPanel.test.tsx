/**
 * ShortcutHelpPanel — 测试用例
 *
 * E2 测试覆盖:
 * 1. open=false 时不渲染
 * 2. open=true 时渲染快捷键列表
 * 3. 点击关闭按钮触发 onClose
 * 4. 点击遮罩触发 onClose
 * 5. 所有快捷键正确显示
 *
 * 遵守约束:
 * - 无 any 类型
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShortcutHelpPanel } from './ShortcutHelpPanel';

describe('ShortcutHelpPanel', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('open=false 时不渲染面板', () => {
    render(<ShortcutHelpPanel open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('open=true 时渲染对话框', () => {
    render(<ShortcutHelpPanel {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('显示所有快捷键和描述', () => {
    render(<ShortcutHelpPanel {...defaultProps} />);
    expect(screen.getByText('Ctrl+G')).toBeInTheDocument();
    expect(screen.getByText('生成图谱')).toBeInTheDocument();
    expect(screen.getByText('Alt+1')).toBeInTheDocument();
    expect(screen.getByText('切换到上下文树')).toBeInTheDocument();
    expect(screen.getByText('Alt+2')).toBeInTheDocument();
    expect(screen.getByText('切换到流程树')).toBeInTheDocument();
    expect(screen.getByText('Alt+3')).toBeInTheDocument();
    expect(screen.getByText('切换到组件树')).toBeInTheDocument();
    expect(screen.getByText('F11')).toBeInTheDocument();
    expect(screen.getByText('最大化画布')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText('显示/隐藏本面板')).toBeInTheDocument();
  });

  it('点击关闭按钮触发 onClose', () => {
    render(<ShortcutHelpPanel {...defaultProps} />);
    const closeBtn = screen.getByRole('button', { name: '关闭快捷键帮助' });
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('点击遮罩层触发 onClose', () => {
    render(<ShortcutHelpPanel {...defaultProps} />);
    const overlay = screen.getByRole('dialog').parentElement;
    if (overlay) {
      fireEvent.click(overlay);
    }
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('标题显示正确', () => {
    render(<ShortcutHelpPanel {...defaultProps} />);
    expect(screen.getByText('快捷键')).toBeInTheDocument();
  });

  it('底部提示文本显示正确', () => {
    render(<ShortcutHelpPanel {...defaultProps} />);
    expect(screen.getByText('按 Esc 或点击遮罩关闭')).toBeInTheDocument();
  });

  it('alt 属性正确传递到 kbd 元素', () => {
    render(<ShortcutHelpPanel {...defaultProps} />);
    const kbd = screen.getByLabelText('Ctrl+G');
    expect(kbd).toBeInTheDocument();
  });
});
