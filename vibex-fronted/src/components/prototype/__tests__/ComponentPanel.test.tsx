/**
 * ComponentPanel — Unit Tests
 * Epic1: E1-U1
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentPanel } from '../ComponentPanel';

// Bypass zustand persist middleware
vi.mock('zustand/middleware', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    persist: vi.fn((fn) => fn),
  };
});

// ============================================
// Helpers
// ============================================

function renderComponent() {
  return render(<ComponentPanel />);
}

// ============================================
// Tests
// ============================================

describe('ComponentPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the panel with a heading', () => {
    renderComponent();
    expect(screen.getByRole('complementary', { name: /组件面板/i })).toBeInTheDocument();
    expect(screen.getByText('组件')).toBeInTheDocument();
  });

  it('displays the count of DEFAULT_COMPONENTS', () => {
    renderComponent();
    // DEFAULT_COMPONENTS has 10 items
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders all 10 component cards', () => {
    renderComponent();
    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(10);
  });

  it('renders Button card', () => {
    renderComponent();
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('renders Input card', () => {
    renderComponent();
    expect(screen.getByText('Input')).toBeInTheDocument();
  });

  it('renders Card card', () => {
    renderComponent();
    expect(screen.getByText('Card')).toBeInTheDocument();
  });

  it('renders Container card', () => {
    renderComponent();
    expect(screen.getByText('Container')).toBeInTheDocument();
  });

  it('renders Header card', () => {
    renderComponent();
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('renders Navigation card', () => {
    renderComponent();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('renders Modal card', () => {
    renderComponent();
    expect(screen.getByText('Modal')).toBeInTheDocument();
  });

  it('renders Table card', () => {
    renderComponent();
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  it('renders Form card', () => {
    renderComponent();
    expect(screen.getByText('Form')).toBeInTheDocument();
  });

  it('renders Image card', () => {
    renderComponent();
    expect(screen.getByText('Image')).toBeInTheDocument();
  });

  it('each card has draggable attribute', () => {
    renderComponent();
    const cards = screen.getAllByRole('listitem');
    cards.forEach((card) => {
      expect(card).toHaveAttribute('draggable', 'true');
    });
  });

  it('each card has aria-label for accessibility', () => {
    renderComponent();
    const cards = screen.getAllByRole('listitem');
    cards.forEach((card) => {
      expect(card).toHaveAttribute('aria-label');
      expect(card.getAttribute('aria-label')).toMatch(/拖拽/);
    });
  });

  it('renders a draggable card for each component', () => {
    renderComponent();
    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(10);
    // All cards are draggable
    cards.forEach((card) => {
      expect(card).toHaveAttribute('draggable', 'true');
    });
  });
});
