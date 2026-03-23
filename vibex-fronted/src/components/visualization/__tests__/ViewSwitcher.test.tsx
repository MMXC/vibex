/**
 * Tests for ViewSwitcher component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewSwitcher } from '../ViewSwitcher';
import type { VisualizationType } from '@/types/visualization';

describe('ViewSwitcher', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('renders all three view buttons', () => {
      render(
        <ViewSwitcher value="flow" onChange={mockOnChange} />
      );
      expect(screen.getByRole('tab', { name: /flow/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /mermaid/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /json/i })).toBeInTheDocument();
    });

    it('has role="tablist" for accessibility', () => {
      render(<ViewSwitcher value="flow" onChange={mockOnChange} />);
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('shows the active tab with aria-selected="true"', () => {
      render(<ViewSwitcher value="mermaid" onChange={mockOnChange} />);
      const mermaidTab = screen.getByRole('tab', { name: /mermaid/i });
      expect(mermaidTab).toHaveAttribute('aria-selected', 'true');
    });

    it('shows non-active tabs with aria-selected="false"', () => {
      render(<ViewSwitcher value="mermaid" onChange={mockOnChange} />);
      const flowTab = screen.getByRole('tab', { name: /flow/i });
      expect(flowTab).toHaveAttribute('aria-selected', 'false');
    });

    it('renders without labels when showLabels is false', () => {
      render(
        <ViewSwitcher value="flow" onChange={mockOnChange} showLabels={false} />
      );
      expect(screen.getByRole('tab', { name: /flow/i })).toBeInTheDocument();
      // Labels should still have text content from icon
      const flowTab = screen.getByRole('tab', { name: /flow/i });
      expect(flowTab).toHaveTextContent('🔗');
    });
  });

  describe('interaction', () => {
    it('calls onChange when a tab is clicked', () => {
      render(<ViewSwitcher value="flow" onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('tab', { name: /mermaid/i }));
      expect(mockOnChange).toHaveBeenCalledWith('mermaid');
    });

    it('does not call onChange when clicking the active tab', () => {
      render(<ViewSwitcher value="flow" onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('tab', { name: /flow/i }));
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not call onChange when disabled', () => {
      render(
        <ViewSwitcher value="flow" onChange={mockOnChange} disabled={true} />
      );
      fireEvent.click(screen.getByRole('tab', { name: /mermaid/i }));
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('disables tabs when disabled prop is true', () => {
      render(
        <ViewSwitcher value="flow" onChange={mockOnChange} disabled={true} />
      );
      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toBeDisabled();
      });
    });
  });

  describe('keyboard navigation', () => {
    it('navigates to next tab on ArrowRight', () => {
      render(<ViewSwitcher value="flow" onChange={mockOnChange} />);
      const flowTab = screen.getByRole('tab', { name: /flow/i });
      flowTab.focus();
      fireEvent.keyDown(flowTab, { key: 'ArrowRight' });
      expect(mockOnChange).toHaveBeenCalledWith('mermaid');
    });

    it('navigates to previous tab on ArrowLeft', () => {
      render(<ViewSwitcher value="mermaid" onChange={mockOnChange} />);
      const mermaidTab = screen.getByRole('tab', { name: /mermaid/i });
      mermaidTab.focus();
      fireEvent.keyDown(mermaidTab, { key: 'ArrowLeft' });
      expect(mockOnChange).toHaveBeenCalledWith('flow');
    });

    it('wraps around from last to first on ArrowRight', () => {
      render(<ViewSwitcher value="json" onChange={mockOnChange} />);
      const jsonTab = screen.getByRole('tab', { name: /json/i });
      jsonTab.focus();
      fireEvent.keyDown(jsonTab, { key: 'ArrowRight' });
      expect(mockOnChange).toHaveBeenCalledWith('flow');
    });

    it('wraps around from first to last on ArrowLeft', () => {
      render(<ViewSwitcher value="flow" onChange={mockOnChange} />);
      const flowTab = screen.getByRole('tab', { name: /flow/i });
      flowTab.focus();
      fireEvent.keyDown(flowTab, { key: 'ArrowLeft' });
      expect(mockOnChange).toHaveBeenCalledWith('json');
    });

    it('triggers onChange on Enter key', () => {
      render(<ViewSwitcher value="flow" onChange={mockOnChange} />);
      const mermaidTab = screen.getByRole('tab', { name: /mermaid/i });
      fireEvent.keyDown(mermaidTab, { key: 'Enter' });
      expect(mockOnChange).toHaveBeenCalledWith('mermaid');
    });

    it('triggers onChange on Space key', () => {
      render(<ViewSwitcher value="flow" onChange={mockOnChange} />);
      const jsonTab = screen.getByRole('tab', { name: /json/i });
      fireEvent.keyDown(jsonTab, { key: ' ' });
      expect(mockOnChange).toHaveBeenCalledWith('json');
    });
  });

  describe('data attributes', () => {
    it('sets data-type attribute on each tab', () => {
      render(<ViewSwitcher value="flow" onChange={mockOnChange} />);
      expect(screen.getByRole('tab', { name: /flow/i })).toHaveAttribute('data-type', 'flow');
      expect(screen.getByRole('tab', { name: /mermaid/i })).toHaveAttribute('data-type', 'mermaid');
      expect(screen.getByRole('tab', { name: /json/i })).toHaveAttribute('data-type', 'json');
    });
  });
});
