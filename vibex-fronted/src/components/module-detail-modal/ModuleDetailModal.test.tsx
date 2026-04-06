/**
 * Module Detail Modal Tests
 */

import { render, screen } from '@testing-library/react';
import { ModuleDetailModal } from '../module-detail-modal/ModuleDetailModal';

describe('ModuleDetailModal', () => {
  const mockModule = {
    id: '1',
    name: 'Test Module',
    description: 'Test description',
    status: 'completed' as const,
  };

  it('should render when open', () => {
    render(<ModuleDetailModal isOpen module={mockModule} onClose={vi.fn()} />);
    expect(screen.getByText('Test Module')).toBeInTheDocument();
  });

  it('should show status', () => {
    render(<ModuleDetailModal isOpen module={mockModule} onClose={vi.fn()} />);
    expect(screen.getByText('✓ 完成')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<ModuleDetailModal isOpen={false} module={mockModule} onClose={vi.fn()} />);
  });
});
