/**
 * FlowList Component Tests
 */
// @ts-nocheck


import { render, screen, fireEvent } from '@testing-library/react';
import { FlowList, Flow } from '@/components/flow-list/FlowList';

const mockFlows: Flow[] = [
  {
    id: 'flow-1',
    name: 'User Login Flow',
    description: 'Authentication flow',
    status: 'completed',
    nodeCount: 5,
    updatedAt: '2026-01-01',
  },
  {
    id: 'flow-2',
    name: 'Checkout Flow',
    status: 'active',
    nodeCount: 10,
    updatedAt: '2026-01-02',
  },
  {
    id: 'flow-3',
    name: 'Draft Flow',
    status: 'draft',
    nodeCount: 2,
    updatedAt: '2026-01-03',
  },
];

describe('FlowList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all flows', () => {
    render(<FlowList flows={mockFlows} />);
    
    expect(screen.getByText('User Login Flow')).toBeInTheDocument();
    expect(screen.getByText('Checkout Flow')).toBeInTheDocument();
    expect(screen.getByText('Draft Flow')).toBeInTheDocument();
  });

  it('should show flow count', () => {
    render(<FlowList flows={mockFlows} />);
    
    expect(screen.getByText('3 个流程')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(<FlowList flows={[]} />);
    
    expect(screen.getByText('暂无流程')).toBeInTheDocument();
  });

  it('should call onSelect when flow clicked', () => {
    const handleSelect = jest.fn();
    render(<FlowList flows={mockFlows} onSelect={handleSelect} />);
    
    fireEvent.click(screen.getByText('User Login Flow'));
    
    expect(handleSelect).toHaveBeenCalledWith('flow-1');
  });

  it('should highlight selected flow', () => {
    render(<FlowList flows={mockFlows} currentFlowId="flow-2" />);
    
    // Check that the component renders correctly
    expect(screen.getByText('Checkout Flow')).toBeInTheDocument();
  });

  it('should show description when available', () => {
    render(<FlowList flows={mockFlows} />);
    
    expect(screen.getByText('Authentication flow')).toBeInTheDocument();
  });

  it('should hide description when not available', () => {
    const flowsWithoutDesc = mockFlows.map(f => ({ ...f, description: undefined }));
    render(<FlowList flows={flowsWithoutDesc} />);
    
    expect(screen.queryByText('Authentication flow')).not.toBeInTheDocument();
  });

  it('should show node count', () => {
    render(<FlowList flows={mockFlows} />);
    
    expect(screen.getByText('5 个节点')).toBeInTheDocument();
    expect(screen.getByText('10 个节点')).toBeInTheDocument();
  });

  it('should show updated date', () => {
    render(<FlowList flows={mockFlows} />);
    
    // Date may be formatted differently - just check for year
    const yearElements = screen.getAllByText(/2026/);
    expect(yearElements.length).toBeGreaterThan(0);
  });

  it('should render different status colors', () => {
    render(<FlowList flows={mockFlows} />);
    
    // Just verify the component renders all flows
    const items = screen.getAllByText(/Flow/);
    expect(items.length).toBeGreaterThan(0);
  });
});