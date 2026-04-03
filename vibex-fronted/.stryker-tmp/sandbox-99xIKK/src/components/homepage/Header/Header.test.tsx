/**
 * Header Component Tests - Epic 2
 * 
 * 验收标准:
 * - ST-2.1: Logo 显示
 * - ST-2.2: 导航链接 (4个)
 * - ST-2.3: 未登录显示登录按钮
 * - ST-2.4: 登录后显示用户头像
 */
// @ts-nocheck

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import { useAuthStore } from '@/stores/authStore';

// Mock authStore
jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('Header Component', () => {
  const mockOnLoginClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ST-2.1: Logo 显示', () => {
    it('应该显示 VibeX Logo', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(<Header onLoginClick={mockOnLoginClick} />);

      const logo = screen.getByTestId('logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveTextContent('VibeX');
    });

    it('Logo 应该有链接指向首页', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(<Header onLoginClick={mockOnLoginClick} />);

      const logo = screen.getByTestId('logo');
      expect(logo).toHaveAttribute('href', '/');
    });
  });

  describe('ST-2.2: 导航链接 (4个)', () => {
    it('应该显示 3 个导航链接 (我的项目, 模板, 文档)', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(<Header onLoginClick={mockOnLoginClick} />);

      const navLinks = screen.getByTestId('nav-links');
      expect(navLinks).toBeInTheDocument();

      // ST-2.2: 导航链接
      expect(screen.getByTestId('nav-link-projects')).toHaveTextContent('我的项目');
      expect(screen.getByTestId('nav-link-templates')).toHaveTextContent('模板');
      expect(screen.getByTestId('nav-link-docs')).toHaveTextContent('文档');
    });

    it('导航链接应该指向正确的路径', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(<Header onLoginClick={mockOnLoginClick} />);

      expect(screen.getByTestId('nav-link-projects')).toHaveAttribute('href', '/projects');
      expect(screen.getByTestId('nav-link-templates')).toHaveAttribute('href', '/templates');
      expect(screen.getByTestId('nav-link-docs')).toHaveAttribute('href', '/docs');
    });
  });

  describe('ST-2.3: 未登录显示登录按钮', () => {
    it('未登录状态应该显示登录按钮', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(<Header onLoginClick={mockOnLoginClick} />);

      const loginButton = screen.getByTestId('login-button');
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveTextContent('登录');
    });

    it('点击登录按钮应该触发回调', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(<Header onLoginClick={mockOnLoginClick} />);

      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      expect(mockOnLoginClick).toHaveBeenCalledTimes(1);
    });

    it('登录后不应该显示登录按钮', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      });

      render(<Header onLoginClick={mockOnLoginClick} />);

      expect(screen.queryByTestId('login-button')).not.toBeInTheDocument();
    });
  });

  describe('ST-2.4: 登录后显示用户头像', () => {
    it('已登录状态应该显示用户头像容器', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      });

      render(<Header onLoginClick={mockOnLoginClick} />);

      const avatarContainer = screen.getByTestId('user-avatar-container');
      expect(avatarContainer).toBeInTheDocument();
    });

    it('有头像 URL 时应该显示头像图片', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com', name: 'Test User', avatar: '/avatar.png' },
      });

      render(<Header onLoginClick={mockOnLoginClick} />);

      const avatarImage = screen.getByTestId('user-avatar-image');
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('alt', 'Test User');
    });

    it('没有头像 URL 时应该显示首字母占位符', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      });

      render(<Header onLoginClick={mockOnLoginClick} />);

      const avatarPlaceholder = screen.getByTestId('user-avatar-placeholder');
      expect(avatarPlaceholder).toBeInTheDocument();
      expect(avatarPlaceholder).toHaveTextContent('T'); // Test User 的首字母
    });

    it('应该显示用户名', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      });

      render(<Header onLoginClick={mockOnLoginClick} />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });
});
