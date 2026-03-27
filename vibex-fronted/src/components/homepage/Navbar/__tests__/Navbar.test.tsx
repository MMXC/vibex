/**
 * Navbar Tests
 * Epic 2: Header 导航
 * ST-2.1: Logo 显示
 * ST-2.2: 导航链接 (模板)
 * ST-2.3: 未登录显示 CTA 按钮
 * ST-2.4: 登录后显示用户/项目入口
 * F-2.1: Auth guard (新画布按钮 auth check)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// =============================================================================
// Mocks — jest.mock calls are hoisted by Jest before imports
// =============================================================================

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/navigation (for useRouter in auth guard tests)
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

// Mock authStore
const mockAuthIsAuthenticated = jest.fn();
jest.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ isAuthenticated: mockAuthIsAuthenticated() }),
}));

// Mock Toast
const mockShowToastFn = jest.fn();
const mockHideToastFn = jest.fn();
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ toasts: [], showToast: mockShowToastFn, hideToast: mockHideToastFn }),
}));

import { Navbar } from '../Navbar';

// =============================================================================
// Helper
// =============================================================================
function setupAuth(isAuth: boolean) {
  mockAuthIsAuthenticated.mockReturnValue(isAuth);
}

// =============================================================================
// Tests
// =============================================================================
describe('Navbar', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupAuth(false);
  });

  describe('ST-2.1: Logo 显示', () => {
    it('显示 VibeX Logo', () => {
      render(<Navbar isAuthenticated={false} onLoginClick={jest.fn()} />);
      expect(screen.getByText('VibeX')).toBeInTheDocument();
    });

    it('显示 Logo 图标', () => {
      render(<Navbar isAuthenticated={false} onLoginClick={jest.fn()} />);
      expect(screen.getByText('◈', { selector: '.logoIcon' })).toBeInTheDocument();
    });

    it('Logo 可自定义标题', () => {
      render(<Navbar isAuthenticated={false} onLoginClick={jest.fn()} title="CustomTitle" />);
      expect(screen.getByText('CustomTitle')).toBeInTheDocument();
    });
  });

  describe('ST-2.2: 导航链接', () => {
    it('渲染模板链接', () => {
      render(<Navbar isAuthenticated={false} onLoginClick={jest.fn()} />);
      expect(screen.getByRole('link', { name: '模板' })).toBeInTheDocument();
    });

    it('模板链接指向 /templates', () => {
      render(<Navbar isAuthenticated={false} onLoginClick={jest.fn()} />);
      expect(screen.getByRole('link', { name: '模板' })).toHaveAttribute('href', '/templates');
    });
  });

  describe('ST-2.3: 未登录显示 CTA 按钮', () => {
    it('未登录显示 开始使用 按钮', () => {
      render(<Navbar isAuthenticated={false} onLoginClick={jest.fn()} />);
      expect(screen.getByRole('button', { name: '开始使用' })).toBeInTheDocument();
    });

    it('点击开始使用按钮调用 onLoginClick', () => {
      const onLoginClick = jest.fn();
      render(<Navbar isAuthenticated={false} onLoginClick={onLoginClick} />);
      fireEvent.click(screen.getByRole('button', { name: '开始使用' }));
      expect(onLoginClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('ST-2.4: 登录后显示项目入口', () => {
    it('已登录显示 我的项目 链接', () => {
      render(<Navbar isAuthenticated={true} onLoginClick={jest.fn()} />);
      expect(screen.getByRole('link', { name: '我的项目' })).toBeInTheDocument();
    });

    it('我的项目链接指向 /dashboard', () => {
      render(<Navbar isAuthenticated={true} onLoginClick={jest.fn()} />);
      expect(screen.getByRole('link', { name: '我的项目' })).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('className 传递', () => {
    it('支持自定义 className', () => {
      render(<Navbar isAuthenticated={false} onLoginClick={jest.fn()} className="custom-class" />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('custom-class');
    });
  });

  // =============================================================================
  // F-2.1: Auth guard tests (未登录引导优化)
  // =============================================================================
  describe('F-2.1: 新画布按钮 auth guard', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      setupAuth(false);
    });

    it('新画布按钮有 data-testid="new-canvas-btn"', () => {
      render(<Navbar isAuthenticated={undefined} onLoginClick={jest.fn()} />);
      expect(screen.getByTestId('new-canvas-btn')).toBeInTheDocument();
    });

    it('未登录时 start-cta-btn 显示', () => {
      render(<Navbar isAuthenticated={undefined} onLoginClick={jest.fn()} />);
      expect(screen.getByTestId('start-cta-btn')).toBeInTheDocument();
    });

    it('登录后 my-projects-btn 显示', () => {
      setupAuth(true);
      render(<Navbar isAuthenticated={undefined} onLoginClick={jest.fn()} />);
      expect(screen.getByTestId('my-projects-btn')).toBeInTheDocument();
    });

    it('未登录点击新画布按钮：调用 onLoginClick + 显示 toast', () => {
      const onLoginClick = jest.fn();
      render(<Navbar isAuthenticated={undefined} onLoginClick={onLoginClick} />);
      fireEvent.click(screen.getByTestId('new-canvas-btn'));
      expect(onLoginClick).toHaveBeenCalledTimes(1);
      expect(mockShowToastFn).toHaveBeenCalledWith('请先登录后再使用画布功能', 'warning');
    });

    it('未登录点击新画布按钮：router.push 不被调用', () => {
      render(<Navbar isAuthenticated={undefined} onLoginClick={jest.fn()} />);
      fireEvent.click(screen.getByTestId('new-canvas-btn'));
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('登录后点击新画布按钮：触发 router.push("/canvas")', () => {
      setupAuth(true);
      render(<Navbar isAuthenticated={undefined} onLoginClick={jest.fn()} />);
      fireEvent.click(screen.getByTestId('new-canvas-btn'));
      expect(mockRouterPush).toHaveBeenCalledWith('/canvas');
    });
  });
});
