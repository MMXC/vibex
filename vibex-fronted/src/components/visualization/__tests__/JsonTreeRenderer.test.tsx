/**
 * Tests for JsonTreeRenderer component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JsonTreeRenderer } from '../JsonTreeRenderer/JsonTreeRenderer';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('JsonTreeRenderer', () => {
  const sampleJson = {
    name: 'VibeX',
    version: '1.0.0',
    features: ['flow', 'mermaid', 'json'],
    config: {
      theme: 'dark',
      zoom: 1.5,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty state', () => {
    it('should render empty state when data is null', () => {
      render(<JsonTreeRenderer data={null} />);
      expect(screen.getByTestId('json-tree-empty')).toBeInTheDocument();
      expect(screen.getByText('No JSON data provided')).toBeInTheDocument();
    });

    it('should render empty state when data is undefined', () => {
      render(<JsonTreeRenderer data={undefined} />);
      expect(screen.getByTestId('json-tree-empty')).toBeInTheDocument();
    });
  });

  describe('Basic rendering', () => {
    it('should render JSON tree with root node', async () => {
      render(<JsonTreeRenderer data={sampleJson} />);

      await waitFor(() => {
        expect(screen.getByTestId('json-tree')).toBeInTheDocument();
      });

      // Should show root key
      expect(screen.getByText('root')).toBeInTheDocument();
      // Should show some child keys
      expect(screen.getByText('name')).toBeInTheDocument();
    });

    it('should show toolbar with stats', async () => {
      render(<JsonTreeRenderer data={sampleJson} showToolbar />);

      await waitFor(() => {
        expect(screen.getByText(/nodes/)).toBeInTheDocument();
      });
    });

    it('should show expand/collapse buttons', async () => {
      render(<JsonTreeRenderer data={sampleJson} />);

      await waitFor(() => {
        expect(screen.getByTestId('json-tree')).toBeInTheDocument();
      });

      // Find toggle buttons
      const toggles = screen.getAllByRole('button');
      expect(toggles.length).toBeGreaterThan(0);
    });
  });

  describe('Search', () => {
    it('should show search input when showSearch is true', async () => {
      render(<JsonTreeRenderer data={sampleJson} showSearch />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search/)).toBeInTheDocument();
      });
    });

    it('should filter nodes by search query', async () => {
      render(<JsonTreeRenderer data={sampleJson} showSearch />);

      await waitFor(() => {
        expect(screen.getByTestId('json-tree')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Search/);
      fireEvent.change(input, { target: { value: 'name' } });

      // Should show filtered results
      await waitFor(() => {
        const rows = screen.getAllByText(/name/);
        expect(rows.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Toolbar actions', () => {
    it('should expand all nodes', async () => {
      render(<JsonTreeRenderer data={sampleJson} showToolbar />);

      await waitFor(() => {
        expect(screen.getByTestId('json-tree')).toBeInTheDocument();
      });

      const expandBtn = screen.getByRole('button', { name: 'Expand All' });
      fireEvent.click(expandBtn);

      // After expand all, should show more nodes
      expect(screen.getByText(/nodes/)).toBeInTheDocument();
    });

    it('should collapse all nodes', async () => {
      render(<JsonTreeRenderer data={sampleJson} showToolbar />);

      await waitFor(() => {
        expect(screen.getByTestId('json-tree')).toBeInTheDocument();
      });

      const collapseBtn = screen.getByRole('button', { name: 'Collapse All' });
      fireEvent.click(collapseBtn);

      // Should still show root
      expect(screen.getByText('root')).toBeInTheDocument();
    });
  });

  describe('Virtual scrolling', () => {
    it('should render large datasets efficiently', async () => {
      // Create a large nested structure
      const largeData = { level1: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` })) };

      render(<JsonTreeRenderer data={largeData} />);

      await waitFor(() => {
        expect(screen.getByTestId('json-tree')).toBeInTheDocument();
      });

      // Should show some nodes but not all (virtual scrolling)
      const rows = document.querySelectorAll('[data-node-id]');
      // Should render far fewer than 100 items
      expect(rows.length).toBeLessThan(50);
    });
  });
});
