import React from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import type { NavbarComponentProps } from '@/types/homepage';

/**
 * Navbar - 顶部导航组件
 * 
 * 功能：
 * - Logo 展示
 * - 导航链接 (设计、模板)
 * - 登录/CTA 按钮
 */
export const Navbar: React.FC<NavbarComponentProps> = ({
  isAuthenticated,
  onLoginClick,
  className = '',
  title = 'VibeX',
}) => {
  return (
    <nav className={`${styles.navbar} ${className}`}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>◈</span>
        <span className={styles.logoText}>{title}</span>
      </div>
      <div className={styles.navLinks}>
        <Link href="/templates" className={styles.navLink}>
          模板
        </Link>
        {!isAuthenticated ? (
          <button className={styles.ctaButton} onClick={onLoginClick}>
            开始使用
          </button>
        ) : (
          <Link href="/dashboard" className={styles.ctaButton}>
            我的项目
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;