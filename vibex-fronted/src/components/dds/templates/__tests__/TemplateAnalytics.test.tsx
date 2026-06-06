/**
 * TemplateAnalytics.test.ts — Template Analytics Panel Tests
 * Sprint67 E3: 模板画廊使用分析 + AI推荐
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TemplateAnalytics } from '../TemplateAnalytics';

// Mock Zustand store
vi.mock('@/stores/templateStore', () => ({
  useTemplateStore: vi.fn(() => ({
    templates: [
      { id: 't1', name: '流程图A', category: 'flowchart' as const, description: 'desc1', icon: '🔀', tags: ['flow'], metadata: { tags: ['flow'] } },
      { id: 't2', name: '思维导图B', category: 'mindmap' as const, description: 'desc2', icon: '🧠', tags: ['brainstorm'], metadata: { tags: ['brainstorm'] } },
      { id: 't3', name: '流程图C', category: 'flowchart' as const, description: 'desc3', icon: '🔀', tags: ['flow'], metadata: { tags: ['flow'] } },
    ],
    stats: {
      usageCount: { t1: 10, t2: 5, t3: 8 },
      ratings: {},
    },
    selectedTags: ['flow'],
    topTemplates: (limit: number) => {
      return [
        { id: 't1', name: '流程图A', category: 'flowchart' as const, description: 'desc1', icon: '🔀', tags: ['flow'], metadata: { tags: ['flow'] } },
        { id: 't3', name: '流程图C', category: 'flowchart' as const, description: 'desc3', icon: '🔀', tags: ['flow'], metadata: { tags: ['flow'] } },
        { id: 't2', name: '思维导图B', category: 'mindmap' as const, description: 'desc2', icon: '🧠', tags: ['brainstorm'], metadata: { tags: ['brainstorm'] } },
      ].slice(0, limit);
    },
    getCategoryStats: () => ({
      all: { count: 3, avgUsage: 7.7 },
      flowchart: { count: 2, avgUsage: 9 },
      mindmap: { count: 1, avgUsage: 5 },
      uml: { count: 0, avgUsage: 0 },
      other: { count: 0, avgUsage: 0 },
    }),
    calcRecommendScore: (id: string) => {
      const scores: Record<string, number> = { t1: 0.65, t2: 0.30, t3: 0.55 };
      return scores[id] ?? 0;
    },
  })),
}));

describe('TemplateAnalytics', () => {
  it('renders usage leaderboard', () => {
    render(<TemplateAnalytics />);
    expect(screen.getByText('🔥 使用排行榜')).toBeTruthy();
  });

  it('shows top template first with usage count', () => {
    render(<TemplateAnalytics />);
    // "流程图A" appears in both leaderboard and AI recommendations
    expect(screen.getAllByText('流程图A').length).toBeGreaterThan(0);
    // Usage count badge
    expect(screen.getByText('10次')).toBeTruthy();
  });

  it('renders category statistics', () => {
    render(<TemplateAnalytics />);
    expect(screen.getByText('📊 分类统计')).toBeTruthy();
    // Use getAllByText since category labels appear in both chart and leaderboard
    expect(screen.getAllByText('全部').length).toBeGreaterThan(0);
  });

  it('renders AI recommendations section', () => {
    render(<TemplateAnalytics />);
    expect(screen.getByText('✨ 为你推荐')).toBeTruthy();
  });

  it('calls onTemplateSelect when leaderboard item is clicked', async () => {
    const handleSelect = vi.fn();
    render(<TemplateAnalytics onTemplateSelect={handleSelect} />);
    const items = screen.getAllByText('流程图A');
    if (items.length > 0) {
      // Click the first one (in leaderboard)
      items[0].closest('li')?.click();
    }
    // Should have been called
    expect(handleSelect).toHaveBeenCalledWith('t1');
  });
});
