/**
 * ConflictDialog.e5.test.tsx — S82-E5: Auto-resolve strategy selection
 * Tests: showAutoResolve prop, Auto-merge/Keep mine/Keep theirs buttons,
 *   conflict highlight CSS class, onAutoResolve callback, dialog rendering
 *
 * Required: ≥8 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ConflictDialog } from '../ConflictDialog';

const defaultProps = {
  isOpen: true,
  canvasId: 'canvas-1',
  localRevision: 5,
  remoteRevision: 6,
  onResolve: vi.fn(),
  onClose: vi.fn(),
};

describe('ConflictDialog — S82-E5 Auto-resolve strategy selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-E5-01: Dialog renders when showAutoResolve=true
  it('renders auto-resolve section when showAutoResolve=true', () => {
    render(<ConflictDialog {...defaultProps} showAutoResolve={true} />);
    expect(screen.getByTestId('auto-resolve-section')).toBeInTheDocument();
  });

  // TC-E5-02: Dialog does not show auto-resolve when showAutoResolve=false (default)
  it('does not render auto-resolve section when showAutoResolve is false', () => {
    render(<ConflictDialog {...defaultProps} />);
    expect(screen.queryByTestId('auto-resolve-section')).not.toBeInTheDocument();
  });

  // TC-E5-03: Dialog title changes to "自动解决策略" when showAutoResolve=true
  it('shows auto-resolve title when showAutoResolve=true', () => {
    render(<ConflictDialog {...defaultProps} showAutoResolve={true} />);
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('自动解决策略');
  });

  // TC-E5-04: Auto-merge button exists and has correct aria-label
  it('renders Auto-merge button with correct aria-label', () => {
    render(<ConflictDialog {...defaultProps} showAutoResolve={true} />);
    const btn = screen.getByTestId('btn-auto-merge');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', '自动合并：智能合并双方修改');
  });

  // TC-E5-05: Keep mine button exists and has correct aria-label
  it('renders Keep Mine button with correct aria-label', () => {
    render(<ConflictDialog {...defaultProps} showAutoResolve={true} />);
    const btn = screen.getByTestId('btn-keep-mine');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', '保留本地版本');
  });

  // TC-E5-06: Keep theirs button exists and has correct aria-label
  it('renders Keep Theirs button with correct aria-label', () => {
    render(<ConflictDialog {...defaultProps} showAutoResolve={true} />);
    const btn = screen.getByTestId('btn-keep-theirs');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', '使用远程版本');
  });

  // TC-E5-07: onAutoResolve is called with 'auto-merge' when Auto-merge button is clicked
  it('calls onAutoResolve with auto-merge strategy', () => {
    const onAutoResolve = vi.fn();
    render(<ConflictDialog {...defaultProps} showAutoResolve={true} onAutoResolve={onAutoResolve} />);
    fireEvent.click(screen.getByTestId('btn-auto-merge'));
    expect(onAutoResolve).toHaveBeenCalledTimes(1);
    expect(onAutoResolve).toHaveBeenCalledWith('auto-merge');
  });

  // TC-E5-08: onAutoResolve is called with 'keep-mine' when Keep Mine button is clicked
  it('calls onAutoResolve with keep-mine strategy', () => {
    const onAutoResolve = vi.fn();
    render(<ConflictDialog {...defaultProps} showAutoResolve={true} onAutoResolve={onAutoResolve} />);
    fireEvent.click(screen.getByTestId('btn-keep-mine'));
    expect(onAutoResolve).toHaveBeenCalledTimes(1);
    expect(onAutoResolve).toHaveBeenCalledWith('keep-mine');
  });

  // TC-E5-09: onAutoResolve is called with 'keep-theirs' when Keep Theirs button is clicked
  it('calls onAutoResolve with keep-theirs strategy', () => {
    const onAutoResolve = vi.fn();
    render(<ConflictDialog {...defaultProps} showAutoResolve={true} onAutoResolve={onAutoResolve} />);
    fireEvent.click(screen.getByTestId('btn-keep-theirs'));
    expect(onAutoResolve).toHaveBeenCalledTimes(1);
    expect(onAutoResolve).toHaveBeenCalledWith('keep-theirs');
  });

  // TC-E5-10: Dialog still renders standard actions when showAutoResolve=true
  it('renders standard discard-local button even when showAutoResolve=true', () => {
    render(<ConflictDialog {...defaultProps} showAutoResolve={true} />);
    expect(screen.getByTestId('btn-discard-local')).toBeInTheDocument();
  });

  // TC-E5-11: Auto-resolve buttons are keyboard accessible (all three focusable)
  it('all three auto-resolve buttons are focusable', () => {
    render(<ConflictDialog {...defaultProps} showAutoResolve={true} />);
    const autoMerge = screen.getByTestId('btn-auto-merge');
    const keepMine = screen.getByTestId('btn-keep-mine');
    const keepTheirs = screen.getByTestId('btn-keep-theirs');
    expect(autoMerge).not.toBeDisabled();
    expect(keepMine).not.toBeDisabled();
    expect(keepTheirs).not.toBeDisabled();
  });

  // TC-E5-12: Close button still works with showAutoResolve=true
  it('close button is accessible when showAutoResolve=true', () => {
    const onClose = vi.fn();
    render(<ConflictDialog {...defaultProps} showAutoResolve={true} onClose={onClose} />);
    const closeBtn = screen.getByTestId('dialog-close');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // TC-E5-13: Strategy buttons do not call onResolve (they call onAutoResolve)
  it('auto-resolve buttons do NOT call onResolve callback', () => {
    const onResolve = vi.fn();
    render(<ConflictDialog {...defaultProps} showAutoResolve={true} onResolve={onResolve} />);
    fireEvent.click(screen.getByTestId('btn-auto-merge'));
    fireEvent.click(screen.getByTestId('btn-keep-mine'));
    fireEvent.click(screen.getByTestId('btn-keep-theirs'));
    expect(onResolve).not.toHaveBeenCalled();
  });

  // TC-E5-14: showAutoResolve description text is present
  it('shows auto-resolve description text', () => {
    render(<ConflictDialog {...defaultProps} showAutoResolve={true} />);
    // Only the <p> description contains the full auto-resolve description
    expect(screen.getByText(/协作冲突已触发。请选择自动解决策略/)).toBeInTheDocument();
  });
});
