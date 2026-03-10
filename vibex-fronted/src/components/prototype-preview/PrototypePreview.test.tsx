/**
 * Prototype Preview Tests
 */

import { render, screen } from '@testing-library/react';
import { PrototypePreview } from '../prototype-preview/PrototypePreview';

describe('PrototypePreview', () => {
  const mockPages = [
    { id: '1', name: 'Home', route: '/', components: [
      { id: 'c1', type: 'header', props: { label: 'Header' } },
    ]},
    { id: '2', name: 'About', route: '/about', components: [] },
  ];

  it('should render pages', () => {
    render(<PrototypePreview pages={mockPages} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('should show page tabs', () => {
    render(<PrototypePreview pages={mockPages} />);
    const tabs = screen.getAllByRole('button');
    expect(tabs.length).toBeGreaterThan(0);
  });

  it('should switch pages', () => {
    const onPageChange = jest.fn();
    render(<PrototypePreview pages={mockPages} onPageChange={onPageChange} />);
  });
});
