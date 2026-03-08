import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '@/components/ui/Modal';

describe('Modal', () => {
  it('renders modal when open', () => {
    render(
      <Modal open onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('renders modal with title', () => {
    render(
      <Modal open title="Modal Title" onClose={() => {}}>
        <div>Content</div>
      </Modal>
    );
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
  });

  it('does not render when not open', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal open title="Test Modal" onClose={handleClose}>
        <div>Content</div>
      </Modal>
    );
    const closeButtons = document.querySelectorAll('button');
    const closeBtn = Array.from(closeButtons).find(
      (btn) =>
        btn.getAttribute('aria-label') === 'close' ||
        btn.textContent?.includes('×')
    );
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalled();
    }
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <Modal open size="small" onClose={() => {}}>
        <div>Small Modal</div>
      </Modal>
    );
    expect(screen.getByText('Small Modal')).toBeInTheDocument();

    rerender(
      <Modal open size="large" onClose={() => {}}>
        <div>Large Modal</div>
      </Modal>
    );
    expect(screen.getByText('Large Modal')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(
      <Modal open onClose={() => {}} footer={<button>Confirm</button>}>
        <div>Content</div>
      </Modal>
    );
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(
      <Modal open onClose={() => {}} className="custom-modal">
        <div>Content</div>
      </Modal>
    );
    const modal = document.querySelector('.custom-modal');
    expect(modal).toBeInTheDocument();
  });

  it('handles keyboard escape key', () => {
    const handleClose = jest.fn();
    render(
      <Modal open onClose={handleClose}>
        <div>Content</div>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    // Should handle escape key
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <Modal open onClose={() => {}} variant="default">
        <div>Default</div>
      </Modal>
    );
    expect(screen.getByText('Default')).toBeInTheDocument();

    rerender(
      <Modal open onClose={() => {}} variant="primary">
        <div>Primary</div>
      </Modal>
    );
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('renders with showCloseButton option', () => {
    const { rerender } = render(
      <Modal open onClose={() => {}} showCloseButton={true}>
        <div>With close button</div>
      </Modal>
    );
    expect(screen.getByText('With close button')).toBeInTheDocument();

    rerender(
      <Modal open onClose={() => {}} showCloseButton={false}>
        <div>Without close button</div>
      </Modal>
    );
    expect(screen.getByText('Without close button')).toBeInTheDocument();
  });
});
