/**
 * CanvasDashboard.test.tsx — Sprint55 E3: CanvasDashboard vitest
 *
 * Tests:
 * - Renders loading state when store not yet loaded
 * - Renders empty state when no canvases exist
 * - Renders canvas cards when canvases exist
 * - Create button opens dialog
 * - Delete button opens confirmation dialog
 * - Rename double-click shows inline input
 * - Search filters canvas list
 * - Sort buttons switch sort mode
 */

'use client';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CanvasDashboard } from '../CanvasDashboard';

// JSDOM does not support dialog.showModal — add global mock
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});

// Mock canvasListStore
const mockStore = {
  isLoaded: false,
  canvases: [],
  searchTerm: '',
  loadCanvases: vi.fn(),
  createCanvas: vi.fn().mockResolvedValue({ id: 'c1', name: 'Test Canvas', thumbnail: null, createdAt: '2026-06-01', updatedAt: '2026-06-01' }),
  deleteCanvas: vi.fn(),
  renameCanvas: vi.fn(),
  getSortedCanvases: vi.fn().mockReturnValue([]),
  getFilteredCanvases: vi.fn().mockReturnValue([]),
  setSearchTerm: vi.fn(),
};

vi.mock('@/stores/canvasListStore', () => ({
  useCanvasListStore: () => mockStore,
}));

// Mock next/navigation
const mockRouter = { push: vi.fn() };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('CanvasDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.isLoaded = false;
    mockStore.canvases = [];
    mockStore.searchTerm = '';
  });

  it('shows loading state when not yet loaded', () => {
    render(<CanvasDashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('加载中…')).toBeInTheDocument();
  });

  it('shows empty state when no canvases and not loading', () => {
    mockStore.isLoaded = true;
    mockStore.getSortedCanvases.mockReturnValue([]);

    render(<CanvasDashboard />);
    expect(screen.getByText('还没有画布')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-dashboard-create-btn')).toBeInTheDocument();
  });

  it('shows empty state with search term when no results', () => {
    mockStore.isLoaded = true;
    mockStore.searchTerm = 'foo';
    mockStore.getFilteredCanvases.mockReturnValue([]);

    render(<CanvasDashboard />);
    expect(screen.getByText(/未找到匹配/i)).toBeInTheDocument();
  });

  it('renders canvas cards when canvases exist', () => {
    mockStore.isLoaded = true;
    mockStore.canvases = [
      { id: 'c1', name: 'Canvas One', thumbnail: null, createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
      { id: 'c2', name: 'Canvas Two', thumbnail: null, createdAt: '2026-06-02T00:00:00.000Z', updatedAt: '2026-06-02T00:00:00.000Z' },
    ];
    mockStore.getSortedCanvases.mockReturnValue(mockStore.canvases);

    render(<CanvasDashboard />);
    expect(screen.getByTestId('canvas-name-c1')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-name-c2')).toBeInTheDocument();
  });

  it('create button opens dialog', () => {
    mockStore.isLoaded = true;
    mockStore.getSortedCanvases.mockReturnValue([]);

    render(<CanvasDashboard />);
    const createBtn = screen.getByTestId('canvas-dashboard-create-btn');
    fireEvent.click(createBtn);

    // Dialog should be shown via showModal (native dialog)
    const dialog = document.querySelector('dialog[open]') as HTMLDialogElement | null;
    expect(dialog).not.toBeNull();
    expect(screen.getByTestId('create-canvas-name-input')).toBeInTheDocument();
  });

  it('delete button opens confirmation dialog', () => {
    mockStore.isLoaded = true;
    mockStore.canvases = [
      { id: 'c1', name: 'Test', thumbnail: null, createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
    ];
    mockStore.getSortedCanvases.mockReturnValue(mockStore.canvases);

    render(<CanvasDashboard />);

    // Hover to reveal delete button
    const card = screen.getByTestId('canvas-card-c1');
    fireEvent.mouseEnter(card);
    const deleteBtn = screen.getByTestId('delete-btn-c1');
    fireEvent.click(deleteBtn);

    expect(screen.getByTestId('confirm-delete-btn')).toBeInTheDocument();
    expect(screen.getByText('确认删除')).toBeInTheDocument();
  });

  it('double-click on canvas name shows rename input', () => {
    mockStore.isLoaded = true;
    mockStore.canvases = [
      { id: 'c1', name: 'Canvas One', thumbnail: null, createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
    ];
    mockStore.getSortedCanvases.mockReturnValue(mockStore.canvases);

    render(<CanvasDashboard />);

    const nameBtn = screen.getByTestId('canvas-name-c1');
    fireEvent.doubleClick(nameBtn);

    const input = screen.getByTestId('rename-input-c1');
    expect(input).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe('Canvas One');
  });

  it('search input calls setSearchTerm', () => {
    mockStore.isLoaded = true;
    mockStore.getSortedCanvases.mockReturnValue([]);
    mockStore.getFilteredCanvases.mockReturnValue([]);

    render(<CanvasDashboard />);
    const searchInput = screen.getByTestId('canvas-dashboard-search');
    fireEvent.change(searchInput, { target: { value: 'foo' } });

    expect(mockStore.setSearchTerm).toHaveBeenCalledWith('foo');
  });

  it('sort buttons change sort mode', () => {
    mockStore.isLoaded = true;
    mockStore.getSortedCanvases.mockReturnValue([]);

    render(<CanvasDashboard />);

    const nameSortBtn = screen.getByRole('button', { name: /名称/ });
    fireEvent.click(nameSortBtn);
    expect(nameSortBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
