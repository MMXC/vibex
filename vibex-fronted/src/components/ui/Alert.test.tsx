import { render, screen, fireEvent } from '@testing-library/react';
import Alert from '@/components/ui/Alert';

describe('Alert', () => {
  it('renders alert with message', () => {
    render(<Alert>Test message</Alert>);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders alert with title', () => {
    render(<Alert title="Test Title">Test message</Alert>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { container } = render(<Alert variant="info">Info message</Alert>);
    expect(container.firstChild).toHaveClass('alert');
  });

  it('renders with close button when closable', () => {
    const onClose = vi.fn();
    render(
      <Alert closable onClose={onClose}>
        Test message
      </Alert>
    );
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });
});
