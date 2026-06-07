
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateGallery } from '../TemplateGallery';

vi.mock('@/stores/templateStore', () => ({
  useTemplateStore: vi.fn(() => ({
    templates: [],
    filteredTemplates: [],
    selectedTags: [],
    setSelectedTags: vi.fn(),
    filterByTag: vi.fn(),
    selectedCategory: 'all' as const,
    searchQuery: '',
    favoriteTemplateIds: [],
    loading: false,
    exportTemplates: vi.fn(() => ({ templates: [] })),
    importTemplates: vi.fn(),
  })),
}));

vi.mock('@/stores/templateShareStore', () => ({
  useTemplateShareStore: () => ({ sharedTemplates: [], loadSharedTemplates: vi.fn() }),
}));
vi.mock('@/lib/canvas/templateExport', () => ({ downloadTemplatesAsFile: vi.fn() }));
vi.mock('@/lib/canvas/templateStore', () => ({
  listTemplates: vi.fn(() => Promise.resolve([])),
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

beforeEach(() => {
  cleanup();
  // Clear URL params between tests — TemplateGallery reads tags from URL on mount
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search: '' },
    writable: true,
  });
});

describe('TemplateGallery — E2 Tag Filter', () => {
  it('renders tag filter chips for all TEMPLATE_USE_CASE_TAGS', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('group', { name: /使用场景标签/i })).toBeTruthy();
    const chips = screen.getAllByRole('button', { name: /工作|个人|教程|空白/ });
    expect(chips.length).toBe(4);
  });

  it('clicking a tag chip toggles aria-pressed', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /工作/ });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    await user.click(btn);
    expect(screen.getByRole('button', { name: /工作/ })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: /工作/ }));
    expect(screen.getByRole('button', { name: /工作/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('clear button appears after selecting a tag', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);
    expect(screen.queryByText('清除')).toBeNull();
    await user.click(screen.getByRole('button', { name: /工作/ }));
    await waitFor(() => expect(screen.getByText('清除')).toBeTruthy());
  });

  it('clear button disappears when tags are cleared', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /工作/ }));
    await waitFor(() => expect(screen.getByText('清除')).toBeTruthy());
    await user.click(screen.getByText('清除'));
    await waitFor(() => expect(screen.queryByText('清除')).toBeNull());
  });

  it('multiple tags can be selected simultaneously', async () => {
    const user = userEvent.setup();
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /工作/ }));
    await user.click(screen.getByRole('button', { name: /个人/ }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /工作/ })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /个人/ })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('renders with isOpen=false renders nothing', () => {
    const { container } = render(<TemplateGallery isOpen={false} onClose={vi.fn()} />);
    expect(container.textContent).toBe('');
  });
});
