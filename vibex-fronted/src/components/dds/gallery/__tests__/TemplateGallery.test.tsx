/**
 * TemplateGallery.test.tsx — S82-E2: Template Gallery UI
 *
 * Unit tests for TemplateGallery component.
 * Verifies: thumbnail grid render, category filter, search, card preview, DoD items.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { TemplateGallery } from '../TemplateGallery';
import type { RequirementTemplate, TemplateCategory } from '@/data/templates';

/** Mock template data */
const mockTemplates: RequirementTemplate[] = [
  {
    id: 'tpl-001',
    name: 'Ecommerce SaaS',
    displayName: '电商 SaaS 模板',
    description: '完整的电商解决方案，含商品、订单、支付模块',
    category: 'ecommerce' as TemplateCategory,
    tags: ['saas', 'ecommerce', 'payment'],
    icon: '🛒',
    scenes: [],
    isFavorite: false,
  },
  {
    id: 'tpl-002',
    name: 'Social Platform',
    displayName: '社交平台模板',
    description: '社交网络应用，含用户、动态、消息功能',
    category: 'social' as TemplateCategory,
    tags: ['social', 'messaging'],
    icon: '🌐',
    scenes: [],
    isFavorite: true,
  },
  {
    id: 'tpl-003',
    name: 'Healthcare App',
    displayName: '医疗健康应用',
    description: '在线问诊、健康管理功能',
    category: 'healthcare' as TemplateCategory,
    tags: ['healthcare'],
    icon: '🏥',
    scenes: [],
    isFavorite: false,
  },
];

const mockStore = {
  templates: mockTemplates,
  filteredTemplates: mockTemplates,
  selectedCategory: 'all' as TemplateCategory | 'all',
  searchQuery: '',
  setCategory: vi.fn(),
  setSearchQuery: vi.fn(),
  applyFilters: vi.fn(() => mockTemplates),
  toggleFavorite: vi.fn(),
  isFavorite: vi.fn((id: string) => {
    const t = mockTemplates.find((t) => t.id === id);
    return t?.isFavorite ?? false;
  }),
  selectTemplate: vi.fn(),
};

// Stable reference for the mock — same object across all selector calls
let storeRef = mockStore;
vi.mock('@/stores/templateStore', () => ({
  useTemplateStore: vi.fn((selector?: (s: typeof mockStore) => unknown) => {
    if (selector) return selector(storeRef);
    return storeRef;
  }),
}));

import { useTemplateStore } from '@/stores/templateStore';

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  // Reset storeRef to mockStore for each test
  storeRef = { ...mockStore };
  // Re-configure useTemplateStore to return the reset storeRef
  (useTemplateStore as ReturnType<typeof vi.fn>).mockImplementation(
    (selector?: (s: typeof mockStore) => unknown) => {
      if (selector) return selector(storeRef);
      return storeRef;
    }
  );
});

describe('TemplateGallery', () => {
  it('renders the gallery title', () => {
    render(<TemplateGallery open />);
    expect(screen.getByRole('heading', { name: '模板画廊' })).toBeInTheDocument();
  });

  it('renders thumbnail grid with template cards', () => {
    render(<TemplateGallery open />);
    expect(screen.getByText('电商 SaaS 模板')).toBeInTheDocument();
    expect(screen.getByText('社交平台模板')).toBeInTheDocument();
  });

  it('renders category filter tabs', () => {
    render(<TemplateGallery open />);
    expect(screen.getByRole('tab', { name: '全部' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '电商' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '社交' })).toBeInTheDocument();
  });

  it('calls setCategory when category tab is clicked', async () => {
    render(<TemplateGallery open />);
    await userEvent.click(screen.getByRole('tab', { name: '电商' }));
    expect(storeRef.setCategory).toHaveBeenCalledWith('ecommerce');
  });

  it('calls setSearchQuery when search input changes', async () => {
    render(<TemplateGallery open />);
    const searchInput = screen.getByRole('searchbox', { name: '搜索模板' });
    await userEvent.type(searchInput, '电商');
    expect(storeRef.setSearchQuery).toHaveBeenCalledWith('电商');
  });

  it('shows preview dialog when card is clicked', async () => {
    render(<TemplateGallery open />);
    await userEvent.click(screen.getByText('电商 SaaS 模板'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '插入画布' })).toBeInTheDocument();
  });

  it('closes preview dialog on cancel', async () => {
    render(<TemplateGallery open />);
    await userEvent.click(screen.getByText('电商 SaaS 模板'));
    await userEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onInsert callback when Insert is clicked', async () => {
    const onInsert = vi.fn();
    render(<TemplateGallery open onInsert={onInsert} />);
    await userEvent.click(screen.getByText('电商 SaaS 模板'));
    await userEvent.click(screen.getByRole('button', { name: '插入画布' }));
    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(onInsert).toHaveBeenCalledWith(mockTemplates[0]);
  });

  it('shows empty state when no templates match', () => {
    storeRef = { ...mockStore, filteredTemplates: [], templates: [] };
    (useTemplateStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector?: (s: typeof mockStore) => unknown) => {
        if (selector) return selector(storeRef);
        return storeRef;
      }
    );
    render(<TemplateGallery open />);
    expect(screen.getByText('没有找到匹配的模板')).toBeInTheDocument();
  });

  it('displays result count', () => {
    render(<TemplateGallery open />);
    // storeRef.filteredTemplates = mockTemplates = 3 items
    expect(screen.getByText('3 个模板')).toBeInTheDocument();
  });

  it('renders tag badges on cards', () => {
    render(<TemplateGallery open />);
    // storeRef.filteredTemplates = [tpl-001, tpl-002, tpl-003]; tpl-001 tags: saas/ecommerce/payment
    expect(screen.getByText('saas')).toBeInTheDocument();
    expect(screen.getByText('ecommerce')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    render(<TemplateGallery open={false} />);
    expect(screen.queryByRole('heading', { name: '模板画廊' })).not.toBeInTheDocument();
  });
});
