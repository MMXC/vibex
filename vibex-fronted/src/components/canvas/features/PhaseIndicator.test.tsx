/**
 * PhaseIndicator.test.tsx
 * Epic: canvas-canvas-context-nav | Epic 2: PhaseIndicator prototype 选项
 */

import { vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhaseIndicator } from './PhaseIndicator';

describe('PhaseIndicator — prototype phase support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // S2.1 AC-2.1.1: prototype option in dropdown when phase !== prototype
  it('shows prototype option in dropdown when phase === context (AC-2.1.1)', async () => {
    const onPhaseChange = vi.fn();
    render(<PhaseIndicator phase="context" onPhaseChange={onPhaseChange} />);

    // Trigger button should be visible
    expect(screen.getByRole('button', { name: /当前阶段/ })).toBeInTheDocument();

    // Click to open dropdown
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /当前阶段/ }));

    // prototype option should be visible
    expect(screen.getByText('🚀 原型队列')).toBeInTheDocument();
  });

  // S2.1 AC-2.1.2: clicking prototype option calls onPhaseChange('prototype')
  it('calls onPhaseChange with prototype when prototype option clicked (AC-2.1.2)', async () => {
    const user = userEvent.setup();
    const onPhaseChange = vi.fn();
    render(<PhaseIndicator phase="context" onPhaseChange={onPhaseChange} />);

    await user.click(screen.getByRole('button', { name: /当前阶段/ }));
    await user.click(screen.getByText('🚀 原型队列'));

    expect(onPhaseChange).toHaveBeenCalledWith('prototype');
  });

  // S2.1 AC-2.1.3: phase === 'prototype' → PhaseIndicator IS visible (no return null)
  it('renders PhaseIndicator when phase === prototype (AC-2.1.3)', () => {
    render(<PhaseIndicator phase="prototype" onPhaseChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /当前阶段/ })).toBeInTheDocument();
  });

  // Verify prototype option also works from flow phase
  it('shows prototype option in dropdown when phase === flow', async () => {
    const user = userEvent.setup();
    const onPhaseChange = vi.fn();
    render(<PhaseIndicator phase="flow" onPhaseChange={onPhaseChange} />);

    await user.click(screen.getByRole('button', { name: /当前阶段/ }));
    expect(screen.getByText('🚀 原型队列')).toBeInTheDocument();
  });

  // Verify prototype option also works from component phase
  it('shows prototype option in dropdown when phase === component', async () => {
    const user = userEvent.setup();
    const onPhaseChange = vi.fn();
    render(<PhaseIndicator phase="component" onPhaseChange={onPhaseChange} />);

    await user.click(screen.getByRole('button', { name: /当前阶段/ }));
    expect(screen.getByText('🚀 原型队列')).toBeInTheDocument();
  });
});
