/**
 * Tests for FeatureFlagToggle component (Epic 2)
 */
// @ts-nocheck


import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeatureFlagToggle } from '../FeatureFlagToggle';

describe('FeatureFlagToggle', () => {
  const defaultProps = {
    isEnabled: false,
    onToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render toggle pill', () => {
    render(<FeatureFlagToggle {...defaultProps} />);
    expect(screen.getByTestId('toggle-pill')).toBeTruthy();
  });

  it('should show OFF badge when disabled', () => {
    render(<FeatureFlagToggle {...defaultProps} isEnabled={false} />);
    expect(screen.getByText('OFF')).toBeInTheDocument();
    expect(screen.getByText('CardTree')).toBeInTheDocument();
  });

  it('should show ON badge when enabled', () => {
    render(<FeatureFlagToggle {...defaultProps} isEnabled={true} />);
    expect(screen.getByText('ON')).toBeInTheDocument();
  });

  it('should call onToggle when pill is clicked', () => {
    render(<FeatureFlagToggle {...defaultProps} isEnabled={false} />);
    fireEvent.click(screen.getByTestId('toggle-pill'));
    expect(defaultProps.onToggle).toHaveBeenCalledWith(true);
  });

  it('should open panel when pill is clicked', () => {
    render(<FeatureFlagToggle {...defaultProps} isEnabled={false} />);
    fireEvent.click(screen.getByTestId('toggle-pill'));
    expect(screen.getByTestId('toggle-panel')).toBeTruthy();
  });

  it('should close panel when opened pill is clicked again', () => {
    render(<FeatureFlagToggle {...defaultProps} isEnabled={false} />);
    fireEvent.click(screen.getByTestId('toggle-pill')); // open
    fireEvent.click(screen.getByTestId('toggle-pill')); // close
    expect(screen.queryByTestId('toggle-panel')).toBeNull();
  });

  it('should show CardTree option in panel (tree layout radio)', () => {
    render(<FeatureFlagToggle {...defaultProps} isEnabled={false} />);
    fireEvent.click(screen.getByTestId('toggle-pill'));
    expect(screen.getByText('🌲 CardTree 树形布局')).toBeInTheDocument();
  });

  it('should show GridLayout option in panel', () => {
    render(<FeatureFlagToggle {...defaultProps} isEnabled={false} />);
    fireEvent.click(screen.getByTestId('toggle-pill'));
    expect(screen.getByText('📋 GridLayout 网格布局')).toBeInTheDocument();
  });

  it('should call onToggle with true when CardTree radio selected', () => {
    render(<FeatureFlagToggle {...defaultProps} isEnabled={false} />);
    fireEvent.click(screen.getByTestId('toggle-pill'));
    const radioOptions = screen.getAllByRole('radio');
    fireEvent.change(radioOptions[0]); // CardTree radio
    expect(defaultProps.onToggle).toHaveBeenCalledWith(true);
  });

  it('should call onToggle with false when GridLayout radio selected', () => {
    render(<FeatureFlagToggle {...defaultProps} isEnabled={true} />);
    fireEvent.click(screen.getByTestId('toggle-pill'));
    const radioOptions = screen.getAllByRole('radio');
    fireEvent.change(radioOptions[1]); // GridLayout radio
    expect(defaultProps.onToggle).toHaveBeenCalledWith(false);
  });

  it('should show correct emoji for disabled state', () => {
    render(<FeatureFlagToggle {...defaultProps} isEnabled={false} />);
    expect(screen.getByText('📋')).toBeInTheDocument();
  });

  it('should show correct emoji for enabled state', () => {
    render(<FeatureFlagToggle {...defaultProps} isEnabled={true} />);
    expect(screen.getByText('🌲')).toBeInTheDocument();
  });

  it('should have feature-flag-toggle data-testid', () => {
    render(<FeatureFlagToggle {...defaultProps} />);
    expect(screen.getByTestId('feature-flag-toggle')).toBeTruthy();
  });
});
