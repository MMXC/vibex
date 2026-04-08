/**
 * ShortcutPanel — 测试用例
 *
 * 覆盖范围:
 * 1. open=false 时不渲染
 * 2. open=true 时渲染快捷键列表
 * 3. 点击关闭按钮触发 onClose
 * 4. 点击遮罩触发 onClose
 * 5. 所有快捷键正确显示（合并了 ShortcutHintPanel 和 ShortcutHelpPanel 的所有快捷键）
 * 6. 新增的 Space 快捷键显示正确
 * 7. 底部提示文本显示正确
 * 8. data-testid 属性正确
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShortcutPanel, SHORTCUTS } from '../ShortcutPanel';

describe('ShortcutPanel', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('open=false 时不渲染面板', () => {
    render(<ShortcutPanel open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('open=true 时渲染对话框', () => {
    render(<ShortcutPanel {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('shortcut-panel')).toBeInTheDocument();
  });

  it('显示所有合并后的快捷键和描述', () => {
    render(<ShortcutPanel {...defaultProps} />);
    
    // 来自原 ShortcutHintPanel 的快捷键
    expect(screen.getByText('撤销')).toBeInTheDocument();
    expect(screen.getByText('重做')).toBeInTheDocument();
    expect(screen.getByText('搜索节点')).toBeInTheDocument();
    expect(screen.getByText('确认选中节点')).toBeInTheDocument();
    expect(screen.getByText('生成上下文')).toBeInTheDocument();
    expect(screen.getByText('新建节点（当前树）')).toBeInTheDocument();
    expect(screen.getByText('放大画布')).toBeInTheDocument();
    expect(screen.getByText('缩小画布')).toBeInTheDocument();
    expect(screen.getByText('重置缩放')).toBeInTheDocument();
    expect(screen.getByText('删除选中节点')).toBeInTheDocument();
    expect(screen.getByText('全选节点')).toBeInTheDocument();
    expect(screen.getByText('取消选择/关闭对话框/退出最大化')).toBeInTheDocument();
    
    // 来自原 ShortcutHelpPanel 的快捷键
    expect(screen.getByText('生成图谱')).toBeInTheDocument();
    expect(screen.getByText('切换到上下文树')).toBeInTheDocument();
    expect(screen.getByText('切换到流程树')).toBeInTheDocument();
    expect(screen.getByText('切换到组件树')).toBeInTheDocument();
    
    // 新增快捷键
    expect(screen.getByText('空格键')).toBeInTheDocument();
    
    // 公共快捷键
    expect(screen.getByText('最大化画布/退出最大化')).toBeInTheDocument();
    expect(screen.getByText('显示/隐藏本面板')).toBeInTheDocument();
  });

  it('所有 SHORTCUTS 数组中的项都正确渲染', () => {
    render(<ShortcutPanel {...defaultProps} />);
    SHORTCUTS.forEach((shortcut) => {
      expect(screen.getByText(shortcut.description)).toBeInTheDocument();
    });
  });

  it('点击关闭按钮触发 onClose', () => {
    render(<ShortcutPanel {...defaultProps} />);
    const closeBtn = screen.getByRole('button', { name: '关闭快捷键提示' });
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('点击遮罩层触发 onClose', () => {
    render(<ShortcutPanel {...defaultProps} />);
    const overlay = screen.getByRole('dialog').parentElement;
    if (overlay) {
      fireEvent.click(overlay);
    }
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('标题显示正确', () => {
    render(<ShortcutPanel {...defaultProps} />);
    expect(screen.getByText('快捷键')).toBeInTheDocument();
  });

  it('底部提示文本显示正确', () => {
    render(<ShortcutPanel {...defaultProps} />);
    expect(screen.getByText('在文本输入框中，快捷键不会触发')).toBeInTheDocument();
  });

  it('aria 属性正确传递', () => {
    render(<ShortcutPanel {...defaultProps} />);
    SHORTCUTS.forEach((shortcut) => {
      const ariaLabel = shortcut.keys.join('+');
      expect(screen.getByLabelText(ariaLabel)).toBeInTheDocument();
    });
  });
});
