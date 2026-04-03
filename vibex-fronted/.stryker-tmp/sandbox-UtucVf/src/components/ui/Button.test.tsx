// @ts-nocheck
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders with different variants', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    expect(container.firstChild).toHaveClass('primary');
  });

  it('renders with different sizes', () => {
    const { container } = render(<Button size="small">Small</Button>);
    expect(container.firstChild).toHaveClass('small');
  });

  it('renders disabled state', () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    expect(container.firstChild).toBeDisabled();
  });

  it('renders loading state', () => {
    const { container } = render(<Button loading>Loading</Button>);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });
});
