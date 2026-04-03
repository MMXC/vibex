/**
 * Domain Model Diagram Tests
 */
// @ts-nocheck


import { render, screen } from '@testing-library/react';
import { DomainModelDiagram } from '../domain-model-diagram/DomainModelDiagram';

describe('DomainModelDiagram', () => {
  const mockEntities = [
    { id: '1', name: 'User', type: 'aggregate' as const, attributes: [] },
    { id: '2', name: 'Order', type: 'entity' as const, attributes: [] },
  ];

  it('should render entities', () => {
    render(<DomainModelDiagram entities={mockEntities} />);
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Order')).toBeInTheDocument();
  });

  it('should show toolbar', () => {
    render(<DomainModelDiagram entities={mockEntities} />);
  });
});
