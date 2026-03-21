/**
 * Navbar Tests
 * Epic 2: Header 导航
 * ST-2.1: Logo 显示
 * ST-2.2: 导航链接 (模板)
 * ST-2.3: 未登录显示 CTA 按钮
 * ST-2.4: 登录后显示用户/项目入口
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Navbar } from '../Navbar';
import * as nextLink from 'next/link';

// Mock Next.js Link
jest.mock('next/link', () => {
  return {
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
  };
});

describe('Navbar', () => {
  describe('ST-2.1: Logo 显示', () => {
    it('显示 VibeX Logo', () => {
      render(<Navbar isAuthenticated={false} onLoginClick={jest.fn()} />);
      expect(screen.getByText('VibeX')).toBeInTheDocument();
    });

    it('显示 Logo 图标', () => {
      render(<Navbar isAuthenticated={false} onLoginClick={jest.fn()} />);
      expect(screen.getByText('◈')).toBeInTheDocument();
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
});
