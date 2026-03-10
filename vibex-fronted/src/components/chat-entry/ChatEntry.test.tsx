/**
 * Chat Entry Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ChatEntry } from '../chat-entry/ChatEntry';

describe('ChatEntry', () => {
  it('should render', () => {
    render(<ChatEntry />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('开始你的项目');
  });

  it('should show placeholder', () => {
    render(<ChatEntry placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('should call onSubmit with requirement', () => {
    const onSubmit = jest.fn();
    render(<ChatEntry onSubmit={onSubmit} />);
    const textarea = screen.getByPlaceholderText(/描述你的需求/);
    fireEvent.change(textarea, { target: { value: 'Test requirement' } });
    fireEvent.click(screen.getByText('开始设计'));
    expect(onSubmit).toHaveBeenCalledWith('Test requirement');
  });

  it('should show error for empty input', () => {
    render(<ChatEntry />);
    fireEvent.click(screen.getByText('开始设计'));
    expect(screen.getByText(/请输入需求描述/)).toBeInTheDocument();
  });

  it('should show example buttons', () => {
    render(<ChatEntry />);
    expect(screen.getByText('用户管理系统')).toBeInTheDocument();
    expect(screen.getByText('电商平台')).toBeInTheDocument();
    expect(screen.getByText('博客系统')).toBeInTheDocument();
  });
});
