import { render, screen } from '@testing-library/react';
import Badge from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders badge with children', () => {
    render(<Badge>5</Badge>);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders badge with different variants', () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    expect(container.firstChild).toHaveClass('badge');
  });

  it('renders badge with size', () => {
    const { container } = render(<Badge size="small">Small</Badge>);
    expect(container.firstChild).toHaveClass('small');
  });
});
