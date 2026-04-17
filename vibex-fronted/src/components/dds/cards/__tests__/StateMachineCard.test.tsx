import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StateMachineCard } from '../StateMachineCard';
import type { StateMachineCard as SMCardType } from '@/types/dds';

const baseCard: SMCardType = {
  id: 'sm-1',
  type: 'state-machine',
  title: 'Order State Machine',
  position: { x: 0, y: 0 },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  states: [
    { id: 's1', stateId: 'pending', stateType: 'initial', label: 'Pending' },
    { id: 's2', stateId: 'processing', stateType: 'normal', label: 'Processing' },
    { id: 's3', stateId: 'completed', stateType: 'final', label: 'Completed' },
  ],
  transitions: [
    { id: 't1', from: 'pending', to: 'processing', event: 'submit', type: 'normal' },
  ],
  initialState: 'pending',
};

describe('StateMachineCard', () => {
  it('renders card title', () => {
    render(<StateMachineCard card={baseCard} />);
    expect(screen.getByText('Order State Machine')).toBeInTheDocument();
  });

  it('renders state count', () => {
    render(<StateMachineCard card={baseCard} />);
    expect(screen.getByText('3 states')).toBeInTheDocument();
  });

  it('renders first 5 states', () => {
    const manyStates = {
      ...baseCard,
      states: Array.from({ length: 8 }, (_, i) => ({
        id: `s${i}`, stateId: `state${i}`, stateType: 'normal' as const, label: `State ${i}`,
      })),
    };
    render(<StateMachineCard card={manyStates} />);
    expect(screen.getByText('State 0')).toBeInTheDocument();
    expect(screen.getByText('State 4')).toBeInTheDocument();
    expect(screen.getByText('+3 more')).toBeInTheDocument();
  });

  it('renders transition count', () => {
    render(<StateMachineCard card={baseCard} />);
    expect(screen.getByText('1 transitions')).toBeInTheDocument();
  });

  it('renders state labels', () => {
    render(<StateMachineCard card={baseCard} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('applies selected class', () => {
    const { container } = render(<StateMachineCard card={baseCard} selected={true} />);
    expect(container.querySelector('[class*="selected"]')).toBeInTheDocument();
  });

  it('renders without states gracefully', () => {
    const noStates = { ...baseCard, states: [] };
    const { container } = render(<StateMachineCard card={noStates} />);
    expect(container.querySelector('[class*="states"]')).not.toBeInTheDocument();
  });
});
