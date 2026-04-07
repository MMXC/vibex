import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreviewArea } from './PreviewArea';

describe('PreviewArea', () => {
  const defaultProps = {
    content: '',
    isLoading: false,
    onRefresh: vi.fn(),
  };

  it('renders correctly', () => {
    render(<PreviewArea {...defaultProps} />);
    expect(screen.getByText('预览')).toBeInTheDocument();
  });

  it('shows placeholder when no content', () => {
    render(<PreviewArea {...defaultProps} />);
    expect(screen.getByText('暂无预览内容')).toBeInTheDocument();
  });

  it('displays content when provided', () => {
    render(<PreviewArea {...defaultProps} content="Test preview content" />);
    expect(screen.getByText('Test preview content')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<PreviewArea {...defaultProps} isLoading={true} />);
    // Use getAllByText since "加载中..." appears in multiple places
    const loadingElements = screen.getAllByText('加载中...');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('calls onRefresh when refresh button clicked', () => {
    const onRefresh = vi.fn();
    render(<PreviewArea {...defaultProps} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByText('🔄'));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('disables refresh button when loading', () => {
    const onRefresh = vi.fn();
    render(<PreviewArea {...defaultProps} isLoading={true} onRefresh={onRefresh} />);
    // Use getAllByText since "加载中..." appears in multiple places
    const buttons = screen.getAllByText('加载中...');
    // The button should be the first one or we can check the button specifically
    const refreshButton = screen.getByRole('button', { name: '加载中...' });
    expect(refreshButton).toBeDisabled();
  });
});