/**
 * Header Component - Epic 2: Header 导航
 * 
 * 功能：
 * - ST-2.1: Logo 显示 (VibeX)
 * - ST-2.2: 导航链接 (4个): /projects, /templates, /docs, /login
 * - ST-2.3: 未登录显示登录按钮
 * - ST-2.4: 登录后显示用户头像
 * 
 * 使用 CSS Modules 进行样式隔离
 * 状态来自 Store (authStore)
 */
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import styles from './Header.module.css';

// 导航链接配置
const NAV_LINKS = [
  { href: '/projects', label: '我的项目' },
  { href: '/templates', label: '模板' },
  { href: '/docs', label: '文档' },
] as const;

export interface HeaderProps {
  /** 登录点击回调 */
  onLoginClick?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * Header - 顶部导航组件
 * 
 * 支持状态：
 * - 未登录：显示登录按钮
 * - 已登录：显示用户头像 + 退出按钮
 */
export const Header: React.FC<HeaderProps> = ({
  onLoginClick,
  className = '',
}) => {
  const { isAuthenticated, user } = useAuthStore();

  // ST-2.4: 登录后显示用户头像
  const renderUserAvatar = () => {
    if (!isAuthenticated || !user) return null;

    return (
      <div className={styles.userMenu} data-testid="user-avatar-container">
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name || 'avatar'}
            width={36}
            height={36}
            className={styles.avatar}
            data-testid="user-avatar-image"
          />
        ) : (
          <div className={styles.avatarPlaceholder} data-testid="user-avatar-placeholder">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <span className={styles.userName}>{user.name || user.email}</span>
      </div>
    );
  };

  return (
    <header className={`${styles.header} ${className}`} data-testid="header">
      {/* ST-2.1: Logo */}
      <Link href="/" className={styles.logo} data-testid="logo">
        <span className={styles.logoIcon}>◈</span>
        <span className={styles.logoText}>VibeX</span>
      </Link>

      {/* ST-2.2: 导航链接 */}
      <nav className={styles.navLinks} data-testid="nav-links">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={styles.navLink}
            data-testid={`nav-link-${link.href.replace('/', '')}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* ST-2.3 / ST-2.4: 认证状态 */}
      <div className={styles.authSection} data-testid="auth-section">
        {isAuthenticated ? (
          renderUserAvatar()
        ) : (
          <button
            className={styles.loginButton}
            onClick={onLoginClick}
            data-testid="login-button"
          >
            登录
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
