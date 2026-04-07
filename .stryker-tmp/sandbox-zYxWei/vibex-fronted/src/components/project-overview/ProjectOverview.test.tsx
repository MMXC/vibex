/**
 * Project Overview Tests
 */
// @ts-nocheck


import { render, screen } from '@testing-library/react';
import { ProjectOverview } from '../project-overview/ProjectOverview';

describe('ProjectOverview', () => {
  const mockModules = [
    { id: '1', name: 'Clarification', status: 'completed' as const },
    { id: '2', name: 'Domain Model', status: 'in-progress' as const, progress: 50 },
    { id: '3', name: 'UI Generation', status: 'pending' as const },
  ];

  it('should render modules', () => {
    render(<ProjectOverview modules={mockModules} />);
    expect(screen.getByText('Clarification')).toBeInTheDocument();
    expect(screen.getByText('Domain Model')).toBeInTheDocument();
    expect(screen.getByText('UI Generation')).toBeInTheDocument();
  });

  it('should show progress', () => {
    render(<ProjectOverview modules={mockModules} />);
    expect(screen.getByText('1/3 完成')).toBeInTheDocument();
  });

  it('should handle empty modules', () => {
    render(<ProjectOverview modules={[]} />);
    expect(screen.getByText('0/0 完成')).toBeInTheDocument();
  });
});
