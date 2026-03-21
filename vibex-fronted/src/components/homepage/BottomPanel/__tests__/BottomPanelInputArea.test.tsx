/**
 * BottomPanelInputArea Tests
 * Epic 6: 底部面板 - 需求录入 TextArea
 * ST-6.2: 需求录入 TextArea (支持 5000 字)
 * ST-6.3: 发送按钮
 * ST-6.10: 快捷键支持 (Ctrl+Enter 发送)
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BottomPanelInputArea } from '../BottomPanelInputArea';

describe('BottomPanelInputArea', () => {
  describe('ST-6.2: 需求录入 TextArea (支持 5000 字)', () => {
    it('渲染 TextArea', () => {
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={jest.fn()} />);
      expect(screen.getByTestId('requirement-input')).toBeInTheDocument();
    });

    it('默认占位符正确', () => {
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={jest.fn()} />);
      expect(screen.getByTestId('requirement-input')).toHaveAttribute('placeholder', '输入需求或问题...');
    });

    it('支持自定义占位符', () => {
      render(
        <BottomPanelInputArea
          onChange={jest.fn()}
          onSend={jest.fn()}
          placeholder="自定义占位符"
        />
      );
      expect(screen.getByTestId('requirement-input')).toHaveAttribute('placeholder', '自定义占位符');
    });

    it('粘贴 5000 字不崩溃', () => {
      const longText = 'a'.repeat(5000);
      const onChange = jest.fn();
      render(<BottomPanelInputArea onChange={onChange} onSend={jest.fn()} />);

      const textarea = screen.getByTestId('requirement-input');
      fireEvent.change(textarea, { target: { value: longText } });

      expect(textarea).toHaveValue(longText);
      expect(onChange).toHaveBeenCalledWith(longText);
    });

    it('字数超过 5000 时显示警告样式', () => {
      const overLimitText = 'a'.repeat(5001);
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={jest.fn()} />);

      const textarea = screen.getByTestId('requirement-input');
      fireEvent.change(textarea, { target: { value: overLimitText } });

      expect(textarea).toHaveClass('overLimit');
    });

    it('字数统计显示正确', () => {
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={jest.fn()} />);

      const textarea = screen.getByTestId('requirement-input');
      fireEvent.change(textarea, { target: { value: '测试内容' } });

      expect(screen.getByTestId('char-count')).toHaveTextContent('4/5000');
    });

    it('字数超过 5000 时统计显示错误样式', () => {
      const overLimitText = 'a'.repeat(5001);
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={jest.fn()} />);

      const textarea = screen.getByTestId('requirement-input');
      fireEvent.change(textarea, { target: { value: overLimitText } });

      const charCount = screen.getByTestId('char-count');
      expect(charCount).toHaveClass('charCountError');
    });

    it('defaultValue 用于恢复草稿', () => {
      render(
        <BottomPanelInputArea
          onChange={jest.fn()}
          onSend={jest.fn()}
          defaultValue="已保存的草稿"
        />
      );
      expect(screen.getByTestId('requirement-input')).toHaveValue('已保存的草稿');
    });
  });

  describe('ST-6.3: 发送按钮', () => {
    it('发送按钮存在', () => {
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={jest.fn()} />);
      expect(screen.getByTestId('send-btn')).toBeInTheDocument();
    });

    it('TextArea 为空时发送按钮禁用', () => {
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={jest.fn()} />);
      expect(screen.getByTestId('send-btn')).toBeDisabled();
    });

    it('TextArea 有内容时发送按钮启用', () => {
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={jest.fn()} />);
      fireEvent.change(screen.getByTestId('requirement-input'), { target: { value: 'test' } });
      expect(screen.getByTestId('send-btn')).not.toBeDisabled();
    });

    it('点击发送按钮调用 onSend', () => {
      const onSend = jest.fn();
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={onSend} />);
      fireEvent.change(screen.getByTestId('requirement-input'), { target: { value: 'test' } });
      fireEvent.click(screen.getByTestId('send-btn'));
      expect(onSend).toHaveBeenCalledWith('test');
    });

    it('发送后清空 TextArea', () => {
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={jest.fn()} />);
      fireEvent.change(screen.getByTestId('requirement-input'), { target: { value: 'test' } });
      fireEvent.click(screen.getByTestId('send-btn'));
      expect(screen.getByTestId('requirement-input')).toHaveValue('');
    });

    it('发送后清空时同步 onChange', () => {
      const onChange = jest.fn();
      render(<BottomPanelInputArea onChange={onChange} onSend={jest.fn()} />);
      fireEvent.change(screen.getByTestId('requirement-input'), { target: { value: 'test' } });
      fireEvent.click(screen.getByTestId('send-btn'));
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('空白内容不发送', () => {
      const onSend = jest.fn();
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={onSend} />);
      fireEvent.change(screen.getByTestId('requirement-input'), { target: { value: '   ' } });
      fireEvent.click(screen.getByTestId('send-btn'));
      expect(onSend).not.toHaveBeenCalled();
    });

    it('disabled 状态下发送按钮禁用', () => {
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={jest.fn()} disabled />);
      fireEvent.change(screen.getByTestId('requirement-input'), { target: { value: 'test' } });
      expect(screen.getByTestId('send-btn')).toBeDisabled();
    });

    it('isSending 状态下发送按钮禁用', () => {
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={jest.fn()} isSending />);
      fireEvent.change(screen.getByTestId('requirement-input'), { target: { value: 'test' } });
      expect(screen.getByTestId('send-btn')).toBeDisabled();
    });

    it('超过字数限制时发送按钮禁用', () => {
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={jest.fn()} />);
      fireEvent.change(screen.getByTestId('requirement-input'), { target: { value: 'a'.repeat(5001) } });
      expect(screen.getByTestId('send-btn')).toBeDisabled();
    });
  });

  describe('ST-6.10: 快捷键支持 (Ctrl+Enter 发送)', () => {
    it('Ctrl+Enter 发送消息', () => {
      const onSend = jest.fn();
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={onSend} />);
      const textarea = screen.getByTestId('requirement-input');
      fireEvent.change(textarea, { target: { value: 'test' } });
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
      expect(onSend).toHaveBeenCalledWith('test');
    });

    it('Command+Enter 发送消息 (Mac)', () => {
      const onSend = jest.fn();
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={onSend} />);
      const textarea = screen.getByTestId('requirement-input');
      fireEvent.change(textarea, { target: { value: 'test' } });
      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
      expect(onSend).toHaveBeenCalledWith('test');
    });

    it('普通 Enter 不发送 (保持换行)', () => {
      const onSend = jest.fn();
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={onSend} />);
      const textarea = screen.getByTestId('requirement-input');
      fireEvent.change(textarea, { target: { value: 'test' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });
      expect(onSend).not.toHaveBeenCalled();
    });

    it('Shift+Enter 不发送 (保持换行)', () => {
      const onSend = jest.fn();
      render(<BottomPanelInputArea onChange={jest.fn()} onSend={onSend} />);
      const textarea = screen.getByTestId('requirement-input');
      fireEvent.change(textarea, { target: { value: 'test' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
      expect(onSend).not.toHaveBeenCalled();
    });
  });
});
