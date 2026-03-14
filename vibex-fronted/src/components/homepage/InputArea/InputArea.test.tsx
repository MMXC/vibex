import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { InputArea } from './InputArea';

describe('InputArea', () => {
  const defaultProps = {
    value: '',
    placeholder: '请输入内容...',
    onChange: jest.fn(),
    onSubmit: jest.fn(),
    disabled: false,
  };

  it('renders correctly', () => {
    render(<InputArea {...defaultProps} />);
    expect(screen.getByPlaceholderText('请输入内容...')).toBeInTheDocument();
  });

  it('displays value when provided', () => {
    render(<InputArea {...defaultProps} value="Test input" />);
    expect(screen.getByDisplayValue('Test input')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const onChange = jest.fn();
    render(<InputArea {...defaultProps} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('请输入内容...'), {
      target: { value: 'new value' },
    });
    expect(onChange).toHaveBeenCalledWith('new value');
  });

  it('calls onSubmit when button clicked', () => {
    const onSubmit = jest.fn();
    render(<InputArea {...defaultProps} value="test" onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText('发送'));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('submits on Enter key', () => {
    const onSubmit = jest.fn();
    render(<InputArea {...defaultProps} value="test" onSubmit={onSubmit} />);
    fireEvent.keyDown(screen.getByPlaceholderText('请输入内容...'), {
      key: 'Enter',
    });
    expect(onSubmit).toHaveBeenCalled();
  });

  it('does not submit on Shift+Enter', () => {
    const onSubmit = jest.fn();
    render(<InputArea {...defaultProps} value="test" onSubmit={onSubmit} />);
    fireEvent.keyDown(screen.getByPlaceholderText('请输入内容...'), {
      key: 'Enter',
      shiftKey: true,
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables submit button when empty', () => {
    render(<InputArea {...defaultProps} value="" />);
    expect(screen.getByText('发送')).toBeDisabled();
  });

  it('disables submit button when disabled prop is true', () => {
    render(<InputArea {...defaultProps} value="test" disabled={true} />);
    expect(screen.getByText('发送')).toBeDisabled();
  });
});