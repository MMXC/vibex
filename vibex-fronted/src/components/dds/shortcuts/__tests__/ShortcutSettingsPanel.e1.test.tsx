/**
 * ShortcutSettingsPanel.e1.test.tsx — S71-E1: Tab4 "自定义" + Tab Navigation
 * Tests: tab switching, custom shortcuts filter, empty custom state
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useShortcutStore } from '@/stores/shortcutStore';
import { ShortcutSettingsPanel } from '../ShortcutSettingsPanel';

// IndexedDB guard
const mockIndexedDB = { open: vi.fn(), deleteDatabase: vi.fn() };
Object.defineProperty(globalThis, 'indexedDB', { value: mockIndexedDB });

// Mock ShortcutEditor (E4 component, not E1 focus)
vi.mock('../ShortcutEditor', () => ({
  ShortcutEditor: vi.fn(() => null),
}));

// Mock ShortcutKeyInput
vi.mock('../ShortcutKeyInput', () => ({
  ShortcutKeyInput: vi.fn(() => null),
}));

function renderPanel() {
  const onClose = vi.fn();
  return { ...render(<ShortcutSettingsPanel onClose={onClose} />), onClose };
}

function resetStore() {
  act(() => {
    useShortcutStore.getState().loadDefaults();
  });
}

describe('ShortcutSettingsPanel E1 — Tab Navigation', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders 5 tab buttons', () => {
    renderPanel();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveTextContent('导航');
    expect(tabs[4]).toHaveTextContent('自定义');
  });

  it('navigation tab is active by default', () => {
    renderPanel();
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('clicking custom tab switches view', () => {
    renderPanel();
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[4]); // custom tab
    expect(tabs[4]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('shows custom badge with count when custom shortcuts exist', async () => {
    // Add a custom shortcut
    await act(async () => {
      await useShortcutStore.getState().addBinding('save', 'Cmd+Shift+S');
    });

    renderPanel();
    const tabs = screen.getAllByRole('tab');
    // The custom tab badge should show count
    const customBadge = tabs[4].querySelector('[class*="tabBadge"]');
    expect(customBadge).toBeTruthy();
    expect(customBadge).toHaveTextContent('1');
  });

  it('no custom badge when no custom shortcuts', () => {
    renderPanel();
    const tabs = screen.getAllByRole('tab');
    const customBadge = tabs[4].querySelector('[class*="tabBadge"]');
    expect(customBadge).toBeNull();
  });
});

describe('ShortcutSettingsPanel E1 — Tab4 "自定义" Content', () => {
  beforeEach(() => {
    resetStore();
  });

  it('shows empty message when no custom shortcuts', () => {
    renderPanel();
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[4]); // custom tab

    expect(screen.getByText(/暂无自定义快捷键/)).toBeTruthy();
  });

  it('shows custom shortcuts when they exist', async () => {
    // Add two custom shortcuts
    await act(async () => {
      await useShortcutStore.getState().addBinding('save', 'Cmd+Shift+S');
      await useShortcutStore.getState().addBinding('undo', 'Cmd+Alt+Z');
    });

    renderPanel();
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[4]); // custom tab

    expect(screen.getByText(/以下 2 个快捷键已被自定义修改/)).toBeTruthy();
    // Table rows for save and undo
    expect(screen.getByText('保存')).toBeTruthy();
    expect(screen.getByText('撤销')).toBeTruthy();
  });

  it('shows edit button for each custom shortcut', async () => {
    await act(async () => {
      await useShortcutStore.getState().addBinding('save', 'Cmd+Shift+S');
    });

    renderPanel();
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[4]); // custom tab

    // "编辑" is the button text (title="修改")
    const editButtons = screen.getAllByRole('button', { name: /编辑/ });
    expect(editButtons).toHaveLength(1); // only save is custom
  });

  it('shows reset button for each custom shortcut', async () => {
    await act(async () => {
      await useShortcutStore.getState().addBinding('save', 'Cmd+Shift+S');
    });

    renderPanel();
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[4]); // custom tab

    // Only the custom tab body — "重置" appears in row + "重置所有" in footer
    const table = document.querySelector('table');
    const resetButtons = table ? table.querySelectorAll('button') : [];
    const resetInTable = Array.from(resetButtons).filter((b) => b.textContent === '重置');
    expect(resetInTable).toHaveLength(1); // only save is custom
  });

  it('reset button restores default key and removes from custom tab', async () => {
    await act(async () => {
      await useShortcutStore.getState().addBinding('save', 'Cmd+Shift+S');
    });

    renderPanel();
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[4]); // custom tab

    const resetButtons = screen.getAllByRole('button', { name: /重置/ });
    await act(async () => {
      fireEvent.click(resetButtons[0]);
    });

    // After reset, no custom shortcuts → empty message
    expect(screen.getByText(/暂无自定义快捷键/)).toBeTruthy();
  });

  it('shows custom shortcut badge (✏️) on modified shortcuts', async () => {
    await act(async () => {
      await useShortcutStore.getState().addBinding('save', 'Cmd+Shift+S');
    });

    renderPanel();
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[4]); // custom tab

    // The custom badge emoji appears in the description cell
    const saveCell = screen.getByText('保存').closest('tr');
    expect(saveCell?.innerHTML).toContain('✏️');
  });
});
