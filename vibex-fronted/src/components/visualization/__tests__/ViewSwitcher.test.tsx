/**
 * Tests for ViewSwitcher component
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewSwitcher } from '../ViewSwitcher';

describe('ViewSwitcher', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  afterEach(cleanup);

  describe('rendering', () => {
    it('renders all three view buttons', () => {
      render(<ViewSwitcher value="flow" onChange={mockOnChange} />);
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
      // When showLabels=false, accessible name is just the icon
      expect(screen.getByRole('tab', { name: /🔗/ })).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onChange when a tab is clicked', async () => {
      const user = userEvent.setup();
      render(<ViewSwitcher value="flow" onChange={mockOnChange} />);
      await user.click(screen.getByRole('tab', { name: /mermaid/i }));
      expect(mockOnChange).toHaveBeenCalledWith('mermaid');
    });

    it('does not call onChange when clicking the active tab', async () => {
      const user = userEvent.setup();
      render(<ViewSwitcher value="flow" onChange={mockOnChange} />);
      await user.click(screen.getByRole('tab', { name: /flow/i }));
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(
        <ViewSwitcher value="flow" onChange={mockOnChange} disabled={true} />
      );
      await user.click(screen.getByRole('tab', { name: /mermaid/i }));
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

  describe('data attributes', () => {
    it('sets data-type attribute on each tab', () => {
      render(<ViewSwitcher value="flow" onChange={mockOnChange} />);
      expect(screen.getByRole('tab', { name: /flow/i })).toHaveAttribute('data-type', 'flow');
      expect(screen.getByRole('tab', { name: /mermaid/i })).toHaveAttribute('data-type', 'mermaid');
      expect(screen.getByRole('tab', { name: /json/i })).toHaveAttribute('data-type', 'json');
    });
  });
});
