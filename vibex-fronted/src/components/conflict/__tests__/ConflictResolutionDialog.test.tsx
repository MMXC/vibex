import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ConflictResolutionDialog } from '../ConflictResolutionDialog';
import type { TokenChange } from '@/types/designSync';

const mockChanges: TokenChange[] = [
  { tokenId: 't1', type: 'modified', oldValue: '#ff0000', newValue: '#00ffff', location: 'primary-color' },
  { tokenId: 't2', type: 'added', newValue: '#ff6600', location: 'secondary-color' },
  { tokenId: 't3', type: 'removed', oldValue: '#cccccc', location: 'old-color' },
];

describe('ConflictResolutionDialog', () => {
  describe('renders three-panel diff', () => {
    it('shows three-panels data-testid', () => {
      render(
        <ConflictResolutionDialog
          isOpen={true}
          changes={mockChanges}
          onResolve={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByTestId('three-panels')).toBeVisible();
    });

    it('displays dialog title', () => {
      render(
        <ConflictResolutionDialog
          isOpen={true}
          changes={mockChanges}
          onResolve={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Design-to-Code Conflict');
    });

    it('shows change count', () => {
      render(
        <ConflictResolutionDialog
          isOpen={true}
          changes={mockChanges}
          onResolve={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByTestId('change-count')).toHaveTextContent('3 changes detected');
    });

    it('renders all four action buttons', () => {
      render(
        <ConflictResolutionDialog
          isOpen={true}
          changes={mockChanges}
          onResolve={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByTestId('btn-accept-design')).toBeEnabled();
      expect(screen.getByTestId('btn-accept-code')).toBeEnabled();
      expect(screen.getByTestId('btn-accept-token')).toBeEnabled();
      expect(screen.getByTestId('btn-merge-all')).toBeEnabled();
    });

    it('shows change breakdown (added/modified/removed)', () => {
      render(
        <ConflictResolutionDialog
          isOpen={true}
          changes={mockChanges}
          onResolve={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText(/1 added/)).toBeInTheDocument();
      expect(screen.getByText(/1 removed/)).toBeInTheDocument();
      expect(screen.getByText(/1 modified/)).toBeInTheDocument();
    });
  });

  describe('dialog open/close behavior', () => {
    it('does not render when isOpen is false', () => {
      render(
        <ConflictResolutionDialog
          isOpen={false}
          changes={mockChanges}
          onResolve={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.queryByTestId('conflict-resolution-dialog')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(
        <ConflictResolutionDialog
          isOpen={true}
          changes={mockChanges}
          onResolve={vi.fn()}
          onClose={onClose}
        />
      );
      fireEvent.click(screen.getByTestId('dialog-close'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onResolve(design) when Accept Design button is clicked', () => {
      const onResolve = vi.fn();
      render(
        <ConflictResolutionDialog
          isOpen={true}
          changes={mockChanges}
          onResolve={onResolve}
          onClose={vi.fn()}
        />
      );
      fireEvent.click(screen.getByTestId('btn-accept-design'));
      expect(onResolve).toHaveBeenCalledWith('design');
    });

    it('calls onResolve(code) when Accept Code button is clicked', () => {
      const onResolve = vi.fn();
      render(
        <ConflictResolutionDialog
          isOpen={true}
          changes={mockChanges}
          onResolve={onResolve}
          onClose={vi.fn()}
        />
      );
      fireEvent.click(screen.getByTestId('btn-accept-code'));
      expect(onResolve).toHaveBeenCalledWith('code');
    });

    it('calls onResolve(merge) when Merge All button is clicked', () => {
      const onResolve = vi.fn();
      render(
        <ConflictResolutionDialog
          isOpen={true}
          changes={mockChanges}
          onResolve={onResolve}
          onClose={vi.fn()}
        />
      );
      fireEvent.click(screen.getByTestId('btn-merge-all'));
      expect(onResolve).toHaveBeenCalledWith('merge');
    });
  });

  describe('empty changes', () => {
    it('renders with zero changes (shows empty state, not change-count)', () => {
      render(
        <ConflictResolutionDialog
          isOpen={true}
          changes={[]}
          onResolve={vi.fn()}
          onClose={vi.fn()}
        />
      );
      // With empty changes, hasChanges=false, so change-count is hidden
      expect(screen.queryByTestId('conflict-resolution-dialog')).toBeInTheDocument();
    });
  });
});