/**
 * Flow List Tests
 */

import { render, screen } from '@testing-library/react';
import { FlowList } from '../flow-list/FlowList';

describe('FlowList', () => {
  const mockFlows = [
    { id: '1', name: 'Flow 1', status: 'draft' as const, nodeCount: 5, updatedAt: '2024-01-01' },
    { id: '2', name: 'Flow 2', status: 'active' as const, nodeCount: 10, updatedAt: '2024-01-02' },
  ];

  it('should render flows', () => {
    render(<FlowList flows={mockFlows} />);
    expect(screen.getByText('Flow 1')).toBeInTheDocument();
    expect(screen.getByText('Flow 2')).toBeInTheDocument();
  });

  it('should show count', () => {
    render(<FlowList flows={mockFlows} />);
    expect(screen.getByText('2 个流程')).toBeInTheDocument();
  });
});
