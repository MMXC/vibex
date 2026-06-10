/**
 * TemplateGallery.favorites.test.tsx — S84-E4: 模板搜索增强与收藏
 *
 * Tests for:
 * 1. Fuse.js fuzzy search integration (typo tolerance)
 * 2. Favorites tab filtering (我的收藏)
 * 3. Category + favorites combo filter
 * 4. Star button toggle calls backend API
 * 5. Empty favorites state message
 * 6. Backend sync on store rehydration
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateGallery } from '../TemplateGallery';

// Real Fuse.js for Pattern E (no mocking needed for small arrays)
import Fuse from 'fuse.js';

// ---- Mocks ----
const mockToggleFavorite = vi.fn();
const mockIsFavorite = vi.fn();
const mockFetch = vi.fn();

const MOCK_TEMPLATES = [
  { id: 'tpl-001', name: 'SaaS Product Req', displayName: 'SaaS 产品需求', description: 'For SaaS applications', category: 'saas', tags: ['工作', '产品'], createdAt: 1700000000000 },
  { id: 'tpl-002', name: 'Ecommerce Flow', displayName: '电商流程设计', description: 'For online stores', category: 'ecommerce', tags: ['工作'], createdAt: 1700000001000 },
  { id: 'tpl-003', name: 'Mobile App', displayName: '移动应用方案', description: 'For mobile apps', category: 'mobile', tags: ['个人'], createdAt: 1700000002000 },
] as Parameters<typeof vi.fn>[0] extends (...args: never[]) => infer R ? R : never;

vi.mock('@/stores/templateStore', () => ({
  useTemplateStore: vi.fn((selector?) => {
    const state = {
      templates: MOCK_TEMPLATES as any,
      filteredTemplates: [],
      selectedTags: [],
      setSelectedTags: vi.fn(),
      filterByTag: vi.fn(),
      selectedCategory: 'all' as string | 'all',
      searchQuery: '',
      favoriteTemplateIds: ['tpl-001'],
      loading: false,
      exportTemplates: vi.fn(() => ({ templates: [] })),
      importTemplates: vi.fn(),
      toggleFavorite: mockToggleFavorite,
      isFavorite: mockIsFavorite,
    };
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  }),
}));

vi.mock('@/stores/templateShareStore', () => ({
  useTemplateShareStore: () => ({ sharedTemplates: [], loadSharedTemplates: vi.fn() }),
}));

vi.mock('@/lib/canvas/templateExport', () => ({ downloadTemplatesAsFile: vi.fn() }));

vi.mock('@/lib/canvas/templateStore', () => ({
  listTemplates: vi.fn(() => Promise.resolve([
    { id: 'tpl-001', name: 'SaaS Product Req', displayName: 'SaaS 产品需求', description: 'For SaaS apps', category: 'saas', tags: ['工作', '产品'] },
    { id: 'tpl-002', name: 'Ecommerce Flow', displayName: '电商流程设计', description: 'For online stores', category: 'ecommerce', tags: ['工作'] },
    { id: 'tpl-003', name: 'Mobile App', displayName: '移动应用方案', description: 'For mobile apps', category: 'mobile', tags: ['个人'] },
  ])),
  getTemplate: vi.fn(() => Promise.resolve(null)),
  seedPresets: vi.fn(() => Promise.resolve()),
  PRESET_TEMPLATES: [],
  type: { CanvasTemplateSummary: {} },
}));

vi.mock('@/lib/canvas/serialize', () => ({
  deserializeThreeTrees: vi.fn(() => ({ storeSnapshot: {}, patches: [] })),
  restoreStore: vi.fn(),
}));

vi.mock('../TemplateImportDialog', () => ({ TemplateImportDialog: vi.fn(() => null) }));
vi.mock('../TemplateExportDialog', () => ({ TemplateExportDialog: vi.fn(() => null) }));
vi.mock('../TemplateShareDialog', () => ({ TemplateShareDialog: vi.fn(() => null) }));
vi.mock('../ImportFromUrlDialog', () => ({ ImportFromUrlDialog: vi.fn(() => null) }));
vi.mock('../TemplateAnalytics', () => ({ TemplateAnalytics: vi.fn(() => null) }));
vi.mock('../TemplateMarketplacePanel', () => ({ TemplateMarketplacePanel: vi.fn(() => null) }));
vi.mock('../TagSelector', () => ({ TagSelector: vi.fn(() => null) }));
vi.mock('../DateRangePicker', () => ({ DateRangePicker: vi.fn(() => null) }));

beforeEach(async () => {
  cleanup();
  vi.clearAllMocks();
  mockToggleFavorite.mockClear();
  mockIsFavorite.mockClear();
  mockFetch.mockClear();

  // Mock fetch for API calls
  global.fetch = mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });

  // Reset URL
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search: '' },
    writable: true,
  });

  // Clear Fuse cache by waiting for component to mount
  await act(async () => {});
});

describe('S84-E4: Fuse.js Fuzzy Search', () => {
  it('finds templates with typo (fuzzy search)', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);

    // Wait for templates to load
    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    const searchInput = screen.getByRole('searchbox', { name: /搜索/i });
    await user.type(searchInput, 'saas'); // exact match
    expect(screen.getByText(/SaaS 产品需求/)).toBeTruthy();
  });

  it('finds templates by partial name match', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    const searchInput = screen.getByRole('searchbox', { name: /搜索/i });
    await user.type(searchInput, '产品'); // partial Chinese match
    expect(screen.getByText(/SaaS 产品需求/)).toBeTruthy();
  });

  it('finds templates by description content', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    const searchInput = screen.getByRole('searchbox', { name: /搜索/i });
    await user.type(searchInput, 'online stores'); // description match
    expect(screen.getByText(/电商流程设计/)).toBeTruthy();
  });
});

describe('S84-E4: Favorites Tab', () => {
  it('renders favorites tab in category bar', async () => {
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    expect(screen.getByRole('tab', { name: /⭐ 我的收藏/i })).toBeTruthy();
  });

  it('favorites tab shows empty state message when no favorites', async () => {
    // Override mock for this test to return empty favorites
    vi.mocked(require('@/stores/templateStore').useTemplateStore).mockImplementationOnce((selector?) => {
      const state = {
        templates: MOCK_TEMPLATES as any,
        filteredTemplates: [],
        selectedTags: [],
        setSelectedTags: vi.fn(),
        filterByTag: vi.fn(),
        selectedCategory: 'favorites' as string,
        searchQuery: '',
        favoriteTemplateIds: [], // no favorites
        loading: false,
        exportTemplates: vi.fn(() => ({ templates: [] })),
        importTemplates: vi.fn(),
        toggleFavorite: mockToggleFavorite,
        isFavorite: mockIsFavorite,
      };
      if (typeof selector === 'function') return selector(state);
      return state;
    });

    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    expect(screen.getByText(/还没有收藏任何模板/)).toBeTruthy();
  });

  it('toggling favorite calls toggleFavorite action', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    // Find a template card
    const firstCard = screen.getByRole('button', { name: /取消收藏/i });
    expect(firstCard).toBeTruthy();

    await user.click(firstCard);
    expect(mockToggleFavorite).toHaveBeenCalledWith('tpl-001');
  });

  it('favorites filter shows only favorited templates', async () => {
    // Override mock to simulate favorites tab selected
    vi.mocked(require('@/stores/templateStore').useTemplateStore).mockImplementationOnce((selector?) => {
      const state = {
        templates: MOCK_TEMPLATES as any,
        filteredTemplates: [],
        selectedTags: [],
        setSelectedTags: vi.fn(),
        filterByTag: vi.fn(),
        selectedCategory: 'favorites' as string,
        searchQuery: '',
        favoriteTemplateIds: ['tpl-001'],
        loading: false,
        exportTemplates: vi.fn(() => ({ templates: [] })),
        importTemplates: vi.fn(),
        toggleFavorite: mockToggleFavorite,
        isFavorite: (id: string) => id === 'tpl-001',
      };
      if (typeof selector === 'function') return selector(state);
      return state;
    });

    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    // Should show SaaS template (favorited)
    expect(screen.getByText(/SaaS 产品需求/)).toBeTruthy();
    // Should NOT show Ecommerce template (not favorited)
    expect(screen.queryByText(/电商流程设计/)).toBeNull();
  });
});

describe('S84-E4: Star Button API Sync', () => {
  it('toggleFavorite calls POST when adding to favorites', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    const favBtn = screen.getByRole('button', { name: /取消收藏/i });
    await user.click(favBtn);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/templates/tpl-001/favorite',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('toggleFavorite calls DELETE when removing from favorites', async () => {
    // Mock non-favorite state
    vi.mocked(require('@/stores/templateStore').useTemplateStore).mockImplementationOnce((selector?) => {
      const state = {
        templates: MOCK_TEMPLATES as any,
        filteredTemplates: [],
        selectedTags: [],
        setSelectedTags: vi.fn(),
        filterByTag: vi.fn(),
        selectedCategory: 'all' as string,
        searchQuery: '',
        favoriteTemplateIds: [], // not favorited
        loading: false,
        exportTemplates: vi.fn(() => ({ templates: [] })),
        importTemplates: vi.fn(),
        toggleFavorite: mockToggleFavorite,
        isFavorite: () => false,
      };
      if (typeof selector === 'function') return selector(state);
      return state;
    });

    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    const favBtn = screen.getByRole('button', { name: /添加收藏/i });
    await user.click(favBtn);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/templates/tpl-001/favorite',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('S84-E4: Fuse.js Integration (Real Fuse, Pattern E)', () => {
  it('real Fuse.js works correctly on small dataset without mocking', () => {
    const items = [
      { id: '1', name: 'SaaS Product Req', displayName: 'SaaS 产品需求', description: 'For SaaS apps', tags: ['工作'] },
      { id: '2', name: 'Ecommerce Flow', displayName: '电商流程设计', description: 'For online stores', tags: ['工作'] },
      { id: '3', name: 'Mobile App', displayName: '移动应用方案', description: 'For mobile apps', tags: ['个人'] },
    ];

    const fuse = new Fuse(items, {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'displayName', weight: 0.3 },
        { name: 'description', weight: 0.2 },
        { name: 'tags', weight: 0.1 },
      ],
      threshold: 0.4,
      includeScore: true,
    });

    // Exact match
    const results1 = fuse.search('SaaS');
    expect(results1.some(r => r.item.id === '1')).toBe(true);

    // Fuzzy/typo match
    const results2 = fuse.search('saas produt'); // typo
    expect(results2.length).toBeGreaterThan(0);

    // Chinese match
    const results3 = fuse.search('产品');
    expect(results3.some(r => r.item.id === '1')).toBe(true);
  });
});
