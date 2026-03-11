import { render, screen, fireEvent } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

describe('Card', () => {
  it('renders card with children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Card variant="default">Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
    
    rerender(<Card variant="glass">Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
    
    rerender(<Card variant="neon">Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders with padding options', () => {
    const { rerender } = render(<Card padding="none">Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
    
    rerender(<Card padding="sm">Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
    
    rerender(<Card padding="md">Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
    
    rerender(<Card padding="lg">Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders with hover effect', () => {
    const { container } = render(<Card hover>Content</Card>);
    expect(container.firstChild).toHaveClass('hoverable');
  });

  it('renders with different glow colors', () => {
    const { rerender, container } = render(<Card hover glowColor="cyan">Content</Card>);
    expect(container.firstChild).toHaveClass('glow-cyan');
    
    rerender(<Card hover glowColor="purple">Content</Card>);
    expect(container.firstChild).toHaveClass('glow-purple');
    
    rerender(<Card hover glowColor="pink">Content</Card>);
    expect(container.firstChild).toHaveClass('glow-pink');
    
    rerender(<Card hover glowColor="green">Content</Card>);
    expect(container.firstChild).toHaveClass('glow-green');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    const { container } = render(<Card onClick={handleClick}>Content</Card>);
    
    fireEvent.click(container.firstChild as Element);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper role for clickable card', () => {
    const { container } = render(<Card onClick={() => {}}>Content</Card>);
    expect(container.firstChild).toHaveAttribute('role', 'button');
  });
});

describe('CardHeader', () => {
  it('renders header with children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CardHeader className="header-class">Header</CardHeader>);
    expect(container.firstChild).toHaveClass('header-class');
  });
});

describe('CardContent', () => {
  it('renders content with children', () => {
    render(<CardContent>Body content</CardContent>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CardContent className="content-class">Content</CardContent>);
    expect(container.firstChild).toHaveClass('content-class');
  });
});

describe('CardFooter', () => {
  it('renders footer with children', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CardFooter className="footer-class">Footer</CardFooter>);
    expect(container.firstChild).toHaveClass('footer-class');
  });
});
