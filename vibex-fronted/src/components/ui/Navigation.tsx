'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './Navigation.module.css';

export interface NavItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children?: NavItem[];
}

export interface NavigationProps {
  /** 导航项 */
  items: NavItem[];
  /** 品牌/Logo 区域 */
  brand?: React.ReactNode;
  /** 是否固定在顶部 */
  fixed?: boolean;
  /** 位置 */
  position?: 'left' | 'center' | 'right';
  /** 自定义类名 */
  className?: string;
  /** 底部内容 */
  footer?: React.ReactNode;
  /** 用户区域 */
  user?: React.ReactNode;
}

export function Navigation({
  items,
  brand,
  fixed = true,
  position = 'left',
  className = '',
  footer,
  user,
}: NavigationProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  // ESC 关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
      }
    };
    
    if (activeDropdown) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeDropdown]);

  const handleItemClick = (item: NavItem, index: number) => {
    if (item.disabled) return;
    
    if (item.children) {
      setActiveDropdown(activeDropdown === item.label ? null : item.label);
    } else if (item.onClick) {
      item.onClick();
    }
    // href handling is done via the link element
  };

  const renderNavItems = (navItems: NavItem[], isDropdown = false) => (
    <ul className={`${styles.navList} ${isDropdown ? styles.dropdown : ''}`}>
      {navItems.map((item, index) => (
        <li key={index} className={styles.navItem}>
          {item.href && !item.children ? (
            <a
              href={item.href}
              className={`${styles.navLink} ${item.active ? styles.active : ''} ${item.disabled ? styles.disabled : ''}`}
              onClick={(e) => {
                if (item.disabled) {
                  e.preventDefault();
                  return;
                }
                if (item.onClick) {
                  e.preventDefault();
                  item.onClick();
                }
              }}
            >
              {item.icon && <span className={styles.navIcon}>{item.icon}</span>}
              <span className={styles.navLabel}>{item.label}</span>
            </a>
          ) : (
            <button
              className={`${styles.navLink} ${item.active ? styles.active : ''} ${item.disabled ? styles.disabled : ''}`}
              onClick={() => handleItemClick(item, index)}
              disabled={item.disabled}
              aria-expanded={item.children ? activeDropdown === item.label : undefined}
              aria-haspopup={item.children ? 'true' : undefined}
            >
              {item.icon && <span className={styles.navIcon}>{item.icon}</span>}
              <span className={styles.navLabel}>{item.label}</span>
              {item.children && (
                <span className={`${styles.chevron} ${activeDropdown === item.label ? styles.open : ''}`}>
                  ▾
                </span>
              )}
            </button>
          )}
          
          {item.children && activeDropdown === item.label && (
            <div className={styles.dropdownMenu}>
              {item.children.map((child, childIndex) => (
                <a
                  key={childIndex}
                  href={child.href || '#'}
                  className={`${styles.dropdownItem} ${child.active ? styles.active : ''} ${child.disabled ? styles.disabled : ''}`}
                  onClick={(e) => {
                    if (child.disabled || !child.href) {
                      e.preventDefault();
                      child.onClick?.();
                      setActiveDropdown(null);
                    }
                  }}
                >
                  {child.icon && <span className={styles.dropdownIcon}>{child.icon}</span>}
                  <span className={styles.dropdownLabel}>{child.label}</span>
                </a>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <nav
      ref={navRef}
      className={`${styles.navigation} ${fixed ? styles.fixed : ''} ${className}`}
    >
      <div className={styles.container}>
        {/* 品牌区域 */}
        {brand && <div className={styles.brand}>{brand}</div>}

        {/* 导航项 - 位置 */}
        <div className={`${styles.navArea} ${styles[position]}`}>
          {renderNavItems(items)}
        </div>

        {/* 用户区域 */}
        {user && <div className={styles.userArea}>{user}</div>}
      </div>

      {/* 底部区域 */}
      {footer && <div className={styles.footer}>{footer}</div>}
    </nav>
  );
}

export default Navigation;
