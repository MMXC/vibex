import { render } from '@testing-library/react';
import Card from '@/components/ui/Card';

describe('Card', () => {
  it('renders card with children', () => {
    const { container } = render(<Card>Card content</Card>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { container } = render(<Card variant="elevated">Content</Card>);
    expect(container.firstChild).toHaveClass('card');
  });

  it('renders with padding', () => {
    const { container } = render(<Card padding="large">Content</Card>);
    expect(container.firstChild).toHaveClass('padding-large');
  });

  it('renders with hover', () => {
    const { container } = render(<Card hover>Content</Card>);
    expect(container.firstChild).toHaveClass('hoverable');
  });
});
