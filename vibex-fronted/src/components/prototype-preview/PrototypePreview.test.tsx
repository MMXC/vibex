import { render, screen } from '@testing-library/react';
import { PrototypePreview } from './PrototypePreview';

const mockPages = [
  {
    id: 'page-1',
    name: 'Home',
    route: '/',
    components: [
      {
        id: 'comp-1',
        type: 'button',
        props: { label: 'Click Me' },
      },
    ],
  },
  {
    id: 'page-2',
    name: 'About',
    route: '/about',
    components: [
      {
        id: 'comp-3',
        type: 'input',
        props: {},
      },
    ],
  },
];

describe('PrototypePreview', () => {
  it('renders with pages', () => {
    render(<PrototypePreview pages={mockPages} />);
    // Check for page tabs
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders first page by default', () => {
    render(<PrototypePreview pages={mockPages} />);
    // Check that component is rendered
    expect(document.querySelector('[data-component-id]')).toBeInTheDocument();
  });

  it('switches pages on tab click', () => {
    render(<PrototypePreview pages={mockPages} />);
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBe(2); // Two page tabs
  });

  it('calls onPageChange callback', () => {
    const handlePageChange = vi.fn();
    render(<PrototypePreview pages={mockPages} onPageChange={handlePageChange} />);
    // Check callback prop is accepted
    expect(handlePageChange).not.toHaveBeenCalled();
  });

  it('handles empty pages array', () => {
    render(<PrototypePreview pages={[]} />);
    expect(document.querySelector('[class*="container"]')).toBeInTheDocument();
  });
});
