// @ts-nocheck
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNavigationStore, NavItem } from '@/stores/navigationStore';
import styles from './GlobalNav.module.css';

interface GlobalNavProps {
  className?: string;
}

export function GlobalNav({ className }: GlobalNavProps) {
  const pathname = usePathname();
  const { globalNavItems, currentGlobalNav, setGlobalNav, toggleMobileMenu } =
    useNavigationStore();

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Check if we're in a project context
  const isInProject =
    pathname?.startsWith('/project') || pathname?.startsWith('/projects/');

  return (
    <header className={`${styles.header} ${className || ''}`}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>◆</span>
          <span className={styles.logoText}>VibeX</span>
        </Link>

        {/* Navigation Items */}
        <nav className={styles.nav}>
          {globalNavItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${
                pathname === item.href || pathname?.startsWith(item.href + '/')
                  ? styles.active
                  : ''
              }`}
              onClick={() => setGlobalNav(item.id)}
            >
              {item.label}
              {item.badge && item.badge > 0 && (
                <span className={styles.badge}>{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className={styles.right}>
          {/* Mobile Menu Toggle */}
          <button
            className={styles.mobileToggle}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span className={styles.hamburger}></span>
          </button>

          {/* User Menu */}
          <div className={styles.userMenu}>
            <button
              className={styles.userButton}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <span className={styles.avatar}>U</span>
            </button>

            {userMenuOpen && (
              <div className={styles.dropdown}>
                <Link href="/profile" className={styles.dropdownItem}>
                  个人资料
                </Link>
                <Link href="/user-settings" className={styles.dropdownItem}>
                  设置
                </Link>
                <hr className={styles.divider} />
                <button className={styles.dropdownItem}>退出登录</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
