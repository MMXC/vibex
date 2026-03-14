import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreviewArea } from './PreviewArea';

describe('PreviewArea', () => {
  const defaultProps = {
    content: '',
    isLoading: false,
    onRefresh: jest.fn(),
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
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button clicked', () => {
    const onRefresh = jest.fn();
    render(<PreviewArea {...defaultProps} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByText('🔄'));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('disables refresh button when loading', () => {
    const onRefresh = jest.fn();
    render(<PreviewArea {...defaultProps} isLoading={true} onRefresh={onRefresh} />);
    const button = screen.getByText('加载中...');
    expect(button).toBeDisabled();
  });
});