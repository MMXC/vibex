/**
 * CommandCategorySidebar.test.tsx — S88-E5: 命令面板增强
 * ≥8 test cases covering: render, category selection, ARIA attributes
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CommandCategorySidebar } from './CommandCategorySidebar';
import { useCommandPaletteStore } from '@/stores/commandPaletteStore';

// Helper to reset store before each test
function resetStore() {
  const store = useCommandPaletteStore.getState();
  store.setFilterCategory('all');
}

describe('CommandCategorySidebar', () => {
  beforeEach(() => {
    resetStore();
  });

  // T1: renders all 6 category buttons
  it('T1: renders all 6 category buttons', () => {
    render(
      <CommandCategorySidebar
        activeCategory="all"
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByTestId('category-btn-all')).toBeInTheDocument();
    expect(screen.getByTestId('category-btn-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('category-btn-template')).toBeInTheDocument();
    expect(screen.getByTestId('category-btn-collaboration')).toBeInTheDocument();
    expect(screen.getByTestId('category-btn-view')).toBeInTheDocument();
    expect(screen.getByTestId('category-btn-settings')).toBeInTheDocument();
  });

  // T2: active category button has aria-pressed="true"
  it('T2: active category has aria-pressed=true', () => {
    render(
      <CommandCategorySidebar
        activeCategory="canvas"
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByTestId('category-btn-canvas')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('category-btn-all')).toHaveAttribute('aria-pressed', 'false');
  });

  // T3: clicking category button calls onSelect with correct category
  it('T3: clicking category calls onSelect with correct category', () => {
    const onSelect = vi.fn();
    render(
      <CommandCategorySidebar
        activeCategory="all"
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByTestId('category-btn-template'));
    expect(onSelect).toHaveBeenCalledWith('template');
  });

  // T4: all categories are clickable
  it('T4: all 6 categories are clickable', () => {
    const onSelect = vi.fn();
    render(
      <CommandCategorySidebar
        activeCategory="all"
        onSelect={onSelect}
      />
    );
    const categories = ['canvas', 'template', 'collaboration', 'view', 'settings'];
    for (const cat of categories) {
      fireEvent.click(screen.getByTestId(`category-btn-${cat}`));
      expect(onSelect).toHaveBeenLastCalledWith(cat);
    }
  });

  // T5: has navigation role
  it('T5: has navigation role and label', () => {
    render(
      <CommandCategorySidebar
        activeCategory="all"
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', '命令分类');
  });

  // T6: category label text is visible
  it('T6: category labels are visible', () => {
    render(
      <CommandCategorySidebar
        activeCategory="all"
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('画布')).toBeInTheDocument();
    expect(screen.getByText('模板')).toBeInTheDocument();
    expect(screen.getByText('协作')).toBeInTheDocument();
    expect(screen.getByText('视图')).toBeInTheDocument();
    expect(screen.getByText('设置')).toBeInTheDocument();
  });

  // T7: switching category updates active state
  it('T7: switching category updates which button is active', () => {
    const { rerender } = render(
      <CommandCategorySidebar
        activeCategory="all"
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByTestId('category-btn-all')).toHaveAttribute('aria-pressed', 'true');

    rerender(
      <CommandCategorySidebar
        activeCategory="view"
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByTestId('category-btn-view')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('category-btn-all')).toHaveAttribute('aria-pressed', 'false');
  });

  // T8: clicking active category still fires onSelect (toggle behavior)
  it('T8: clicking already-active category fires onSelect', () => {
    const onSelect = vi.fn();
    render(
      <CommandCategorySidebar
        activeCategory="settings"
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByTestId('category-btn-settings'));
    expect(onSelect).toHaveBeenCalledWith('settings');
  });
});
