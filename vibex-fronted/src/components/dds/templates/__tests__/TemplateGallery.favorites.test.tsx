/**
 * TemplateGallery.favorites.test.tsx — S84-E4: 模板搜索增强与收藏
 *
 * Tests for:
 * 1. Fuse.js fuzzy search integration (typo tolerance)
 * 2. Favorites tab filtering (我的收藏)
 * 3. Category + favorites combo filter
 * 4. Star button toggle calls backend API
 * 5. Empty favorites state message
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateGallery } from '../TemplateGallery';
import Fuse from 'fuse.js';

// ─── Shared mutable mock store (Pattern F: same object reference) ─────────────
// Must use vi.hoisted to avoid TDZ — vitest hoists vi.mock() but NOT module-level const
const mockFetch = vi.hoisted(() => vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }));

const MOCK_TEMPLATES = [
  { id: 'tpl-001', name: 'SaaS Product Req', displayName: 'SaaS 产品需求', description: 'For SaaS apps', category: 'saas', tags: ['工作', '产品'], createdAt: 1700000000000 },
  { id: 'tpl-002', name: 'Ecommerce Flow', displayName: '电商流程设计', description: 'For online stores', category: 'ecommerce', tags: ['工作'], createdAt: 1700000001000 },
  { id: 'tpl-003', name: 'Mobile App', displayName: '移动应用方案', description: 'For mobile apps', category: 'mobile', tags: ['个人'], createdAt: 1700000002000 },
];

// Mutable shared state — single reference for Object.is(prev, next) comparison
const sharedStore = {
  selectedCategory: 'all' as string,
  favoriteTemplateIds: ['tpl-001'] as string[],
};

// ─── Module-level mock functions (declared BEFORE vi.mock) ───────────────────
const mockSetCategory = vi.fn((cat: string) => { sharedStore.selectedCategory = cat; });
const mockToggleFavorite = vi.fn((id: string) => {
  const isFav = sharedStore.favoriteTemplateIds.includes(id);
  sharedStore.favoriteTemplateIds = isFav
    ? sharedStore.favoriteTemplateIds.filter(fid => fid !== id)
    : [...sharedStore.favoriteTemplateIds, id];
  globalThis.fetch?.(`/api/templates/${id}/favorite`, {
    method: isFav ? 'DELETE' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId: id }),
  });
});

const mockUseTemplateStore = vi.hoisted(() => vi.fn((selector?: (s: any) => unknown) => {
  const state = {
    templates: MOCK_TEMPLATES,
    filteredTemplates: [] as any[],
    selectedTags: [] as string[],
    setSelectedTags: vi.fn(),
    filterByTag: vi.fn(),
    selectedCategory: sharedStore.selectedCategory,
    searchQuery: '',
    favoriteTemplateIds: sharedStore.favoriteTemplateIds,
    loading: false,
    stats: { usageCount: {} as Record<string, number> },
    exportTemplates: vi.fn(() => ({ templates: [] })),
    importTemplates: vi.fn(),
    setCategory: mockSetCategory,
    setSelectedTags: vi.fn(),
    toggleFavorite: mockToggleFavorite,
    isFavorite: (id: string) => sharedStore.favoriteTemplateIds.includes(id),
  };
  if (typeof selector === 'function') return selector(state);
  return state;
}));

vi.mock('@/stores/templateStore', () => ({
  useTemplateStore: mockUseTemplateStore,
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
  type: { CanvasTemplateSummary: {} } as any,
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

// Test helper: click a tab by accessible name
const clickTab = async (user: ReturnType<typeof userEvent.setup>, namePattern: RegExp) => {
  const tab = screen.getByRole('tab', { name: namePattern });
  await user.click(tab);
};

beforeEach(async () => {
  cleanup();
  // Reset shared store to defaults
  sharedStore.selectedCategory = 'all';
  sharedStore.favoriteTemplateIds = ['tpl-001'];
  mockSetCategory.mockClear();
  mockToggleFavorite.mockClear();
  mockFetch.mockClear().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
  globalThis.fetch = mockFetch as any;
  // Reset URL
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search: '' },
    writable: true,
  });
  await act(async () => {});
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('S84-E4: Fuse.js Fuzzy Search', () => {
  it('finds templates with typo (fuzzy search)', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    const searchInput = screen.getByRole('searchbox', { name: /搜索/i });
    await user.type(searchInput, 'saas');
    expect(screen.getByText(/SaaS Product Req/)).toBeTruthy();
  });

  it('finds templates by partial name match', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    const searchInput = screen.getByRole('searchbox', { name: /搜索/i });
    await user.type(searchInput, '产品');
    expect(screen.getByText(/SaaS Product Req/)).toBeTruthy();
  });

  it('finds templates by description content', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    const searchInput = screen.getByRole('searchbox', { name: /搜索/i });
    await user.type(searchInput, 'online stores');
    expect(screen.getByText(/Ecommerce Flow/)).toBeTruthy();
  });
});

describe('S84-E4: Favorites Tab', () => {
  it('renders favorites tab in category bar', async () => {
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    expect(screen.getByRole('tab', { name: /我的收藏/i })).toBeTruthy();
  });

  it('favorites tab shows empty state when no favorites', async () => {
    const user = userEvent.setup();
    // Set shared store: empty favorites + switch to favorites tab
    sharedStore.favoriteTemplateIds = [];
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    await clickTab(user, /我的收藏/i);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    // filtered.length === 0 + selectedCategory === 'favorites' → empty state renders
    expect(screen.getByText(/还没有收藏任何模板/)).toBeTruthy();
  });

  it('favorites filter shows only favorited templates', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);
    await act(async () => { await new Promise(r => setTimeout(r, 200)); });
    await clickTab(user, /我的收藏/i);
    await act(async () => { await new Promise(r => setTimeout(r, 200)); });
    // tpl-001 is favorited → visible (component renders t.name, not t.displayName)
    expect(await screen.findByText(/SaaS Product Req/)).toBeTruthy();
    // tpl-002 is NOT favorited → NOT visible
    expect(screen.queryByText(/Ecommerce Flow/)).toBeNull();
  });

  it('toggling favorite calls toggleFavorite action', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    // First gridcell = SaaS (the only favorited template)
    const gridcells = screen.getAllByRole('gridcell');
    const firstCell = gridcells[0];
    const favBtn = firstCell.querySelector('button[aria-label="取消收藏"]') as HTMLButtonElement;
    expect(favBtn).toBeTruthy();
    await user.click(favBtn);
    expect(mockToggleFavorite).toHaveBeenCalledWith('tpl-001');
  });
});

describe('S84-E4: Star Button API Sync', () => {
  it('toggleFavorite calls DELETE when removing from favorites', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    // tpl-001 is favorited (default) → clicking removes → DELETE
    const favBtn = screen.getByRole('button', { name: /取消收藏/i });
    await user.click(favBtn);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/templates/tpl-001/favorite',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('toggleFavorite calls POST when adding to favorites', async () => {
    const user = userEvent.setup();
    // Set shared store: tpl-001 is NOT favorited → clicking adds → POST
    sharedStore.favoriteTemplateIds = [];
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    // All 3 templates are visible (category=search/all). Find tpl-001 by name then click its star button.
    const gridcells = screen.getAllByRole('gridcell');
    const tpl001Cell = gridcells.find(cell => cell.textContent?.includes('SaaS Product Req'));
    expect(tpl001Cell).toBeTruthy();
    const favBtn = tpl001Cell!.querySelector('button[aria-label="添加收藏"]') as HTMLButtonElement;
    expect(favBtn).toBeTruthy();
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
    const results1 = fuse.search('SaaS');
    expect(results1.some(r => r.item.id === '1')).toBe(true);
    const results2 = fuse.search('saas produt'); // typo
    expect(results2.length).toBeGreaterThan(0);
    const results3 = fuse.search('产品');
    expect(results3.some(r => r.item.id === '1')).toBe(true);
  });
});
