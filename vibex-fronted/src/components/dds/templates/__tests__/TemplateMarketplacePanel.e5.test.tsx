/**
 * TemplateMarketplacePanel.e5.test.tsx — Sprint71 E5: 模板评分与收藏增强
 * Tests: sort selector, rating stars, favorite button
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

const mockRateTemplate = vi.fn();
const mockToggleFavorite = vi.fn();
const mockGetTemplateStats = vi.fn(() => ({ avgRating: 4.5, ratingCount: 2, usageCount: 0 }));
const mockIsFavorite = vi.fn(() => false);
const mockFeaturedTemplates = vi.fn(() => []);
const mockGetMarketplaceTemplates = vi.fn(() => []);
const mockSearchMarketplace = vi.fn(() => []);
const mockGetTopRatedTemplates = vi.fn(() => []);
const mockStats = { usageCount: {} as Record<string, number>, ratings: {} as Record<string, number[]> };

vi.mock('@/stores/templateStore', () => ({
  useTemplateStore: () => ({
    rateTemplate: mockRateTemplate,
    toggleFavorite: mockToggleFavorite,
    getTemplateStats: mockGetTemplateStats,
    isFavorite: mockIsFavorite,
    featuredTemplates: mockFeaturedTemplates,
    getMarketplaceTemplates: mockGetMarketplaceTemplates,
    searchMarketplace: mockSearchMarketplace,
    getTopRatedTemplates: mockGetTopRatedTemplates,
    stats: mockStats,
  }),
}));

import { TemplateMarketplacePanel } from '../TemplateMarketplacePanel';

const mockTemplates = [
  { id: 'tmpl-1', name: 'tmpl-1', displayName: 'Test Template', description: 'A test', icon: '📋' },
];

describe('TemplateMarketplacePanel — E5 rating & sort', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFeaturedTemplates.mockReturnValue(mockTemplates);
    mockGetMarketplaceTemplates.mockReturnValue(mockTemplates);
    mockIsFavorite.mockReturnValue(false);
    mockGetTemplateStats.mockReturnValue({ avgRating: 4.5, ratingCount: 2, usageCount: 0 });
  });

  it('renders sort selector buttons', () => {
    render(<TemplateMarketplacePanel onTemplateSelect={vi.fn()} />);
    expect(screen.getByText('⭐ 评分最高')).toBeInTheDocument();
    expect(screen.getByText('🔥 使用最多')).toBeInTheDocument();
    expect(screen.getByText('📅 最近使用')).toBeInTheDocument();
  });

  it('activates sort button when clicked', () => {
    render(<TemplateMarketplacePanel onTemplateSelect={vi.fn()} />);
    const usageBtn = screen.getByText('🔥 使用最多');
    fireEvent.click(usageBtn);
    expect(usageBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows rating stars on template card', () => {
    render(<TemplateMarketplacePanel onTemplateSelect={vi.fn()} />);
    // Use first() since we have featured + grid sections
    const stars = screen.getAllByTestId('rating-stars')[0];
    expect(stars).toBeInTheDocument();
  });

  it('calls toggleFavorite when favorite button clicked', () => {
    render(<TemplateMarketplacePanel onTemplateSelect={vi.fn()} />);
    const favBtn = screen.getAllByTestId('favorite-btn')[0];
    fireEvent.click(favBtn);
    expect(mockToggleFavorite).toHaveBeenCalledWith('tmpl-1');
  });

  it('renders marketplace panel with test-id', () => {
    render(<TemplateMarketplacePanel onTemplateSelect={vi.fn()} />);
    expect(screen.getByTestId('marketplace-panel')).toBeInTheDocument();
  });

  it('calls onTemplateSelect when card is clicked', () => {
    const onSelect = vi.fn();
    render(<TemplateMarketplacePanel onTemplateSelect={onSelect} />);
    const card = screen.getAllByTestId('template-card')[0];
    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith('tmpl-1');
  });
});
