/**
 * ConflictDialog.test.tsx — Sprint58 E5: 协作冲突增强
 */

import { describe, it, expect, vi } from 'vitest';
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

describe('ConflictDialog', () => {
  it('renders dialog when isOpen=true', () => {
    render(<ConflictDialog {...defaultProps} />);
    expect(screen.getByTestId('conflict-dialog')).toBeInTheDocument();
  });

  it('does not render when isOpen=false', () => {
    render(<ConflictDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('conflict-dialog')).not.toBeInTheDocument();
  });

  it('shows local and remote revision numbers', () => {
    render(<ConflictDialog {...defaultProps} localRevision={10} remoteRevision={12} />);
    expect(screen.getByTestId('local-revision')).toHaveTextContent('10');
    expect(screen.getByTestId('remote-revision')).toHaveTextContent('12');
  });

  it('calls onResolve with discard-local when that button is clicked', () => {
    const onResolve = vi.fn();
    render(<ConflictDialog {...defaultProps} onResolve={onResolve} />);
    fireEvent.click(screen.getByTestId('btn-discard-local'));
    expect(onResolve).toHaveBeenCalledWith('discard-local');
  });

  it('calls onResolve with merge when that button is clicked', () => {
    const onResolve = vi.fn();
    render(<ConflictDialog {...defaultProps} onResolve={onResolve} />);
    fireEvent.click(screen.getByTestId('btn-merge'));
    expect(onResolve).toHaveBeenCalledWith('merge');
  });

  it('calls onResolve with discard-remote when that button is clicked', () => {
    const onResolve = vi.fn();
    render(<ConflictDialog {...defaultProps} onResolve={onResolve} />);
    fireEvent.click(screen.getByTestId('btn-discard-remote'));
    expect(onResolve).toHaveBeenCalledWith('discard-remote');
  });

  // E5: Manual merge
  it('shows manual merge button', () => {
    render(<ConflictDialog {...defaultProps} />);
    expect(screen.getByTestId('btn-manual')).toBeInTheDocument();
  });

  it('enters manual merge mode when manual button is clicked', () => {
    const onResolve = vi.fn();
    render(<ConflictDialog {...defaultProps} onResolve={onResolve} localData={{ nodes: [] }} remoteData={{ nodes: [{ id: 'n1' }] }} />);
    fireEvent.click(screen.getByTestId('btn-manual'));
    expect(screen.getByTestId('manual-merge-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('手动合并冲突');
  });

  it('pre-populates textarea with local data JSON', () => {
    const localData = { nodes: [{ id: 'n1', type: 'custom' }], edges: [] };
    render(<ConflictDialog {...defaultProps} onResolve={vi.fn()} localData={localData} />);
    fireEvent.click(screen.getByTestId('btn-manual'));
    const textarea = screen.getByTestId('manual-merge-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('"nodes"');
    expect(textarea.value).toContain('"n1"');
  });

  it('shows diff summary when local and remote data differ', () => {
    render(
      <ConflictDialog
        {...defaultProps}
        onResolve={vi.fn()}
        localData={{ nodes: [{ id: 'n1' }], extra: 'local-only' }}
        remoteData={{ nodes: [{ id: 'n1' }], extra: 'remote-only' }}
      />
    );
    fireEvent.click(screen.getByTestId('btn-manual'));
    expect(screen.getByTestId('diff-summary')).toBeInTheDocument();
  });

  it('calls onResolve with manual and content when submit is clicked', () => {
    const onResolve = vi.fn();
    render(<ConflictDialog {...defaultProps} onResolve={onResolve} localData={{ test: true }} />);
    fireEvent.click(screen.getByTestId('btn-manual'));
    const textarea = screen.getByTestId('manual-merge-textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"merged": true}' } });
    fireEvent.click(screen.getByTestId('btn-manual-submit'));
    expect(onResolve).toHaveBeenCalledWith('manual', '{"merged": true}');
  });

  it('goes back from manual mode when back button is clicked', () => {
    render(<ConflictDialog {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-manual'));
    expect(screen.getByTestId('manual-merge-textarea')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('dialog-close'));
    // After back, should show action buttons again
    expect(screen.getByTestId('btn-discard-local')).toBeInTheDocument();
  });
});
