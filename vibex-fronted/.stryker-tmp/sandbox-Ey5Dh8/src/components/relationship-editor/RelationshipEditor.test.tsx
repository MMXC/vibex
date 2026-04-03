/**
 * Relationship Editor Tests
 */
// @ts-nocheck


import { render, screen } from '@testing-library/react';
import { RelationshipEditor } from '../relationship-editor/RelationshipEditor';

describe('RelationshipEditor', () => {
  const mockEntities = [
    { id: '1', name: 'User' },
    { id: '2', name: 'Order' },
  ];

  const mockRelationships = [
    { id: 'r1', sourceId: '1', targetId: '2', type: 'one-to-many' as const },
  ];

  it('should render', () => {
    render(<RelationshipEditor relationships={mockRelationships} entities={mockEntities} />);
    expect(screen.getByText('添加关系')).toBeInTheDocument();
  });

  it('should show add button', () => {
    render(<RelationshipEditor relationships={[]} entities={mockEntities} />);
    expect(screen.getByText('添加关系')).toBeInTheDocument();
  });
});
