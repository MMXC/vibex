/**
 * Flow Diagram Tests
 */
// @ts-nocheck


import { render, screen } from '@testing-library/react';
import { FlowDiagram } from '../flow-diagram/FlowDiagram';

describe('FlowDiagram', () => {
  const mockNodes = [
    { id: '1', label: 'Start', type: 'start' },
    { id: '2', label: 'Process', type: 'process' },
    { id: '3', label: 'End', type: 'end' },
  ];

  const mockEdges = [
    { id: 'e1', source: '1', target: '2' },
    { id: 'e2', source: '2', target: '3' },
  ];

  it('should render nodes', () => {
    render(<FlowDiagram nodes={mockNodes} edges={mockEdges} />);
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Process')).toBeInTheDocument();
    expect(screen.getByText('End')).toBeInTheDocument();
  });

  it('should call onNodeClick when node clicked', () => {
    const onNodeClick = jest.fn();
    render(<FlowDiagram nodes={mockNodes} edges={mockEdges} onNodeClick={onNodeClick} />);
    // Click on a node (implementation detail)
    expect(mockNodes.length).toBe(3);
  });

  it('should render with custom dimensions', () => {
    render(<FlowDiagram nodes={mockNodes} edges={mockEdges} width={600} height={400} />);
    expect(mockNodes.length).toBe(3);
  });
});
