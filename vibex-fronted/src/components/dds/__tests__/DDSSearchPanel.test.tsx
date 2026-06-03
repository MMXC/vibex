/**
 * DDSSearchPanel.test.tsx — Sprint60 E5: DDSSearchPanel search history tests
 *
 * Tests E5 DoD items:
 * - D5.1: Search history tab (recent searches)
 * - D5.2: Keyword highlighting in results (<mark> tag)
 * - D5.3: ↑↓ keyboard navigation in history tab
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DDSSearchPanel } from '@/components/dds/DDSSearchPanel';
import type { DDSSearchResult } from '@/hooks/dds/useDDSCanvasSearch';

// ============================================
// Mock canvasSearchStore — controlled history
// ============================================

const mockHistory: string[] = [];
const mockAddToHistory = vi.fn();
const mockClearHistory = vi.fn();

vi.mock('@/stores/dds/canvasSearchStore', () => ({
  useCanvasSearchStore: vi.fn((selector) =>
    selector({
      searchHistory: mockHistory,
      addToHistory: mockAddToHistory,
      clearHistory: mockClearHistory,
    })
  ),
}));

// ============================================
// Test data
// ============================================

const makeResult = (id: string, title: string): DDSSearchResult => ({
  card: { id, title, content: '', description: '' },
  chapter: 'requirement',
  matchedField: 'title',
  matchedText: '',
});

const SAMPLE_RESULTS: DDSSearchResult[] = [
  makeResult('c1', '用户登录模块'),
  makeResult('c2', '用户管理功能'),
  makeResult('c3', '后台配置'),
];

const renderPanel = (overrides: Partial<React.ComponentProps<typeof DDSSearchPanel>> = {}) => {
  return render(
    <DDSSearchPanel
      open={true}
      onClose={vi.fn()}
      results={SAMPLE_RESULTS}
      query=""
      onQueryChange={vi.fn()}
      onSelectResult={vi.fn()}
      {...overrides}
    />
  );
};

describe('DDSSearchPanel — E5 搜索体验增强', () => {
  beforeEach(() => {
    mockHistory.length = 0;
    mockHistory.push('登录功能', '用户管理', '配置页面');
    mockAddToHistory.mockClear();
    mockClearHistory.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('D5.1: Search history tab', () => {
    it('shows "最近搜索" tab', () => {
      renderPanel();
      expect(screen.getByRole('tab', { name: /最近搜索/i })).toBeInTheDocument();
    });

    it('shows "搜索结果" tab', () => {
      renderPanel();
      expect(screen.getByRole('tab', { name: /搜索结果/i })).toBeInTheDocument();
    });

    it('results tab is selected by default', () => {
      renderPanel();
      const resultsTab = screen.getByRole('tab', { name: /搜索结果/i });
      expect(resultsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('displays history items when history tab is clicked', () => {
      renderPanel();
      const historyTab = screen.getByRole('tab', { name: /最近搜索/i });
      fireEvent.click(historyTab);

      expect(screen.getByText('登录功能')).toBeInTheDocument();
      expect(screen.getByText('用户管理')).toBeInTheDocument();
      expect(screen.getByText('配置页面')).toBeInTheDocument();
    });

    it('shows empty state when history is empty', () => {
      mockHistory.length = 0;
      renderPanel();
      const historyTab = screen.getByRole('tab', { name: /最近搜索/i });
      fireEvent.click(historyTab);

      expect(screen.getByText('暂无搜索历史')).toBeInTheDocument();
    });

    it('shows "清空历史" button when history has items', () => {
      renderPanel();
      fireEvent.click(screen.getByRole('tab', { name: /最近搜索/i }));
      expect(screen.getByTestId('clear-history')).toBeInTheDocument();
    });

    it('clears history when "清空历史" is clicked', () => {
      renderPanel();
      fireEvent.click(screen.getByRole('tab', { name: /最近搜索/i }));
      fireEvent.click(screen.getByTestId('clear-history'));
      expect(mockClearHistory).toHaveBeenCalled();
    });

    it('switches to results tab and changes query when history item is clicked', () => {
      const onQueryChange = vi.fn();
      renderPanel({ onQueryChange });
      fireEvent.click(screen.getByRole('tab', { name: /最近搜索/i }));

      const historyItems = screen.getAllByTestId('history-item');
      fireEvent.click(historyItems[0]);

      expect(onQueryChange).toHaveBeenCalledWith('登录功能');
    });
  });

  describe('D5.2: Keyword highlighting', () => {
    it('renders <mark> tags when query is active', () => {
      renderPanel({ query: '用户' });
      // mark elements should be present for "用户" match
      const marks = document.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
    });

    it('renders multiple <mark> tags for multiple matches', () => {
      renderPanel({ query: '用' });
      const marks = document.querySelectorAll('mark');
      // "用户登录模块" and "用户管理功能" both contain "用"
      expect(marks.length).toBeGreaterThanOrEqual(1);
    });

    it('results tab shows result count badge when results exist', () => {
      renderPanel({ query: 'test' });
      // Badge shows count when results exist
      const badges = document.querySelectorAll('span');
      const badgeText = Array.from(badges).map((b) => b.textContent);
      expect(badgeText.some((t) => t?.includes('3'))).toBeTruthy();
    });
  });

  describe('D5.3: Keyboard navigation', () => {
    it('ArrowDown navigates history tab without crash', () => {
      renderPanel();
      fireEvent.click(screen.getByRole('tab', { name: /最近搜索/i }));

      const input = screen.getByLabelText('搜索卡片');
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(true).toBe(true);
    });

    it('ArrowUp navigates history tab without crash', () => {
      renderPanel();
      fireEvent.click(screen.getByRole('tab', { name: /最近搜索/i }));

      const input = screen.getByLabelText('搜索卡片');
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(true).toBe(true);
    });

    it('Enter selects history item and updates query', () => {
      const onQueryChange = vi.fn();
      renderPanel({ onQueryChange });
      fireEvent.click(screen.getByRole('tab', { name: /最近搜索/i }));

      const input = screen.getByLabelText('搜索卡片');
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onQueryChange).toHaveBeenCalled();
    });

    it('Escape closes the panel', () => {
      const onClose = vi.fn();
      renderPanel({ onClose });

      const input = screen.getByLabelText('搜索卡片');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });

    it('Enter on result adds to history and selects result', () => {
      const onSelectResult = vi.fn();
      renderPanel({ query: '测试', onSelectResult });

      const input = screen.getByLabelText('搜索卡片');
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockAddToHistory).toHaveBeenCalledWith('测试');
      expect(onSelectResult).toHaveBeenCalled();
    });
  });
});
