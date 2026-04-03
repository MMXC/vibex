/**
 * LoginDrawer Tests
 */
// @ts-nocheck


import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginDrawer } from '../LoginDrawer';

// Mock apiService
jest.mock('@/services/api', () => ({
  apiService: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

import { apiService } from '@/services/api';

const mockApi = apiService as jest.Mocked<typeof apiService>;

describe('LoginDrawer', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnClose.mockClear();
    mockOnSuccess.mockClear();
  });

  describe('rendering', () => {
    it('should render nothing when isOpen is false', () => {
      const { container } = render(
        <LoginDrawer isOpen={false} onClose={mockOnClose} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render drawer when isOpen is true', () => {
      render(<LoginDrawer isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument();
    });

    it('should show register mode when switched', () => {
      render(<LoginDrawer isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText('立即注册'));

      expect(screen.getByRole('heading', { name: '注册' })).toBeInTheDocument();
    });

    it('should show login mode initially', () => {
      render(<LoginDrawer isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument();
    });
  });

  describe('form fields', () => {
    it('should have email input', () => {
      render(<LoginDrawer isOpen={true} onClose={mockOnClose} />);

      expect(
        screen.getByPlaceholderText(/name@example.com/)
      ).toBeInTheDocument();
    });

    it('should have password input', () => {
      render(<LoginDrawer isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByPlaceholderText(/••/)).toBeInTheDocument();
    });

    it('should have name input in register mode', () => {
      render(<LoginDrawer isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText('立即注册'));

      expect(screen.getByPlaceholderText(/输入用户名/)).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onClose when close button clicked', () => {
      render(<LoginDrawer isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText('×'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should switch between login and register', () => {
      render(<LoginDrawer isOpen={true} onClose={mockOnClose} />);

      // Initially in login mode
      expect(screen.getByText('立即注册')).toBeInTheDocument();

      // Switch to register
      fireEvent.click(screen.getByText('立即注册'));
      expect(screen.getByText('立即登录')).toBeInTheDocument();

      // Switch back to login
      fireEvent.click(screen.getByText('立即登录'));
      expect(screen.getByText('立即注册')).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    const fillAndSubmit = async () => {
      const emailInput = screen.getByPlaceholderText(/name@example.com/);
      const passwordInput = screen.getByPlaceholderText(/••/);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });

      const form = document.querySelector('form');
      fireEvent.submit(form!);
    };

    it('should call login API on submit', async () => {
      mockApi.login.mockResolvedValue({ token: 'test-token' });

      render(
        <LoginDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await fillAndSubmit();

      await waitFor(() => {
        expect(mockApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
        });
      });
    });

    it('should call register API on submit in register mode', async () => {
      mockApi.register.mockResolvedValue({ token: 'test-token' });

      render(
        <LoginDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText('立即注册'));

      const nameInput = screen.getByPlaceholderText(/输入用户名/);
      fireEvent.change(nameInput, { target: { value: 'Test User' } });

      await fillAndSubmit();

      await waitFor(() => {
        expect(mockApi.register).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password',
        });
      });
    });

    it('should show loading state during submission', async () => {
      mockApi.login.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<LoginDrawer isOpen={true} onClose={mockOnClose} />);

      await fillAndSubmit();

      expect(screen.getByText('处理中...')).toBeInTheDocument();
    });

    it('should show error on login failure', async () => {
      mockApi.login.mockRejectedValue(new Error('Invalid credentials'));

      render(<LoginDrawer isOpen={true} onClose={mockOnClose} />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/)).toBeInTheDocument();
      });
    });

    it('should call onSuccess on successful login', async () => {
      mockApi.login.mockResolvedValue({ token: 'test-token' });

      render(
        <LoginDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await fillAndSubmit();

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('props', () => {
    it('should accept onSuccess prop', () => {
      render(
        <LoginDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should work without onSuccess prop', () => {
      const { container } = render(
        <LoginDrawer isOpen={true} onClose={mockOnClose} />
      );
      expect(container).toBeInTheDocument();
    });
  });
});
