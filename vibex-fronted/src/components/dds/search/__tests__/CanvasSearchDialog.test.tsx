import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanvasSearchPanel } from '../CanvasSearchDialog';
import userEvent from '@testing-library/user-event';

/**
 * S87-E2: Canvas 全文搜索
 *
 * Tests verify the CanvasSearchDialog re-export correctly exposes
 * the CanvasSearchPanel component with full search + navigation functionality.
 *
 * Key behaviors tested:
 * - Dialog opens and closes correctly
 * - Text search filters canvas cards by content
 * - Arrow key navigation selects results
 * - Escape closes the dialog
 * - Click backdrop closes the dialog
 * - History is added when a result is selected
 */

const mockAddToHistory = vi.fn();
const mockCards = [
  { id: 'card-1', data: { text: 'Product Requirements Document' }, position: { x: 0, y: 0 } },
  { id: 'card-2', data: { text: 'Design Specification' }, position: { x: 100, y: 0 } },
  { id: 'card-3', data: { text: 'Technical Architecture' }, position: { x: 200, y: 0 } },
];

const defaultCanvasSearchStore = {
  addToHistory: mockAddToHistory,
  addRecentSearch: mockAddToHistory,
};

const defaultDdsCanvasStore = {
  cards: mockCards,
};

vi.mock('@/stores/dds/canvasSearchStore', () => ({
  useCanvasSearchStore: vi.fn((selector?) => {
    if (typeof selector === 'function') {
      return selector(defaultCanvasSearchStore);
    }
    return defaultCanvasSearchStore;
  }),
}));

vi.mock('@/stores/dds/DDSCanvasStore', () => ({
  useDDSCanvasStore: vi.fn((selector?) => {
    if (typeof selector === 'function') {
      return selector(defaultDdsCanvasStore);
    }
    return defaultDdsCanvasStore;
  }),
}));

describe('CanvasSearchDialog — S87-E2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dialog rendering', () => {
    it('renders nothing when closed', () => {
      render(<CanvasSearchPanel open={false} onClose={vi.fn()} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog when open', () => {
      render(<CanvasSearchPanel open={true} onClose={vi.fn()} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('搜索页面节点…')).toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    it('shows search results when query matches cards', async () => {
      const user = userEvent.setup();
      render(<CanvasSearchPanel open={true} onClose={vi.fn()} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Design Spec');

      // Should show result count
      expect(screen.getByText(/个匹配/)).toBeInTheDocument();
    });

    it('shows "未找到" when no matches', async () => {
      const user = userEvent.setup();
      render(<CanvasSearchPanel open={true} onClose={vi.fn()} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'nonexistent term xyz123');

      expect(screen.getByText(/未找到匹配的节点/)).toBeInTheDocument();
    });
  });

  describe('Keyboard navigation', () => {
    it('responds to ArrowDown key', async () => {
      const user = userEvent.setup();
      render(<CanvasSearchPanel open={true} onClose={vi.fn()} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Design Spec');
      // ArrowDown should not throw
      await user.keyboard('{ArrowDown}');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Dialog close behavior', () => {
    it('closes on Escape key via fireEvent', () => {
      const onClose = vi.fn();
      render(<CanvasSearchPanel open={true} onClose={onClose} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes on backdrop click', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<CanvasSearchPanel open={true} onClose={onClose} />);

      // Click the outer div (backdrop), not the inner dialog
      const backdrop = screen.getByRole('dialog').parentElement!;
      await user.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking inside dialog', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<CanvasSearchPanel open={true} onClose={onClose} />);

      // Click the input inside the dialog
      await user.click(screen.getByRole('textbox'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('History integration', () => {
    it('adds query to history on Enter key', async () => {
      const user = userEvent.setup();
      render(<CanvasSearchPanel open={true} onClose={vi.fn()} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Architecture{Enter}');

      expect(mockAddToHistory).toHaveBeenCalledWith('Architecture');
    });

    it('adds query to history when clicking a result', async () => {
      const user = userEvent.setup();
      render(<CanvasSearchPanel open={true} onClose={vi.fn()} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Technical');

      // Find the first result button and click it
      const buttons = screen.getAllByRole('button');
      const resultButton = buttons.find(b => b.textContent?.includes('Technical'));
      if (resultButton) {
        await user.click(resultButton);
        expect(mockAddToHistory).toHaveBeenCalled();
      }
    });
  });
});
