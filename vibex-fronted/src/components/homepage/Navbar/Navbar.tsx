import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import type { NavbarComponentProps } from '@/types/homepage';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';

/**
 * Navbar - 顶部导航组件
 *
 * 功能：
 * - Logo 展示
 * - 导航链接 (设计、模板)
 * - 登录/CTA 按钮
 */
/**
 * Navbar - 顶部导航组件
 *
 * 功能：
 * - Logo 展示
 * - 导航链接 (设计、模板)
 * - 登录/CTA 按钮
 * - F-2.1: 新画布按钮添加登录检查，未登录显示 toast
 */
export const Navbar: React.FC<NavbarComponentProps> = ({
  isAuthenticated,
  onLoginClick,
  className = '',
  title = 'VibeX',
}) => {
  const authStoreAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const { showToast } = useToast();

  // F-2.1: Check auth from both props (page-level) and store (global)
  const isAuth = isAuthenticated ?? authStoreAuthenticated;

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isAuth) {
      e.preventDefault();
      showToast('请先登录后再使用画布功能', 'warning');
      onLoginClick?.();
      return;
    }
    router.push('/canvas');
  };

  const handleLoginClick = () => {
    onLoginClick?.();
  };

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
        <button
          className={styles.canvasLink}
          onClick={handleCanvasClick}
          type="button"
          aria-label="新画布"
          data-testid="new-canvas-btn"
        >
          <span>◈</span> 新画布
        </button>
        {!isAuth ? (
          <button
            className={styles.ctaButton}
            onClick={handleLoginClick}
            data-testid="start-cta-btn"
          >
            开始使用
          </button>
        ) : (
          <Link href="/dashboard" className={styles.ctaButton} data-testid="my-projects-btn">
            我的项目
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
