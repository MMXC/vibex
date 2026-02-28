'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './MobileNav.module.css';

interface MenuItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  children?: MenuItem[];
}

interface MobileNavProps {
  /** 菜单项 */
  items: MenuItem[];
  /** 品牌/Logo 区域 */
  brand?: React.ReactNode;
  /** 是否固定在顶部 */
  fixed?: boolean;
  /** 自定义类名 */
  className?: string;
}

export function MobileNav({
  items,
  brand,
  fixed = true,
  className = '',
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC 关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      setActiveSubmenu(activeSubmenu === item.label ? null : item.label);
    } else if (item.onClick) {
      item.onClick();
      setIsOpen(false);
    }
  };

  const renderMenuItems = (menuItems: MenuItem[], level = 0) => (
    <ul className={`${styles.menuList} ${level > 0 ? styles.submenu : ''}`}>
      {menuItems.map((item, index) => (
        <li key={index} className={styles.menuItem}>
          <button
            className={styles.menuLink}
            onClick={() => handleItemClick(item)}
            aria-expanded={item.children ? activeSubmenu === item.label : undefined}
          >
            {item.icon && <span className={styles.menuIcon}>{item.icon}</span>}
            <span className={styles.menuLabel}>{item.label}</span>
            {item.children && (
              <span className={`${styles.chevron} ${activeSubmenu === item.label ? styles.open : ''}`}>
                ▶
              </span>
            )}
          </button>
          
          {item.children && activeSubmenu === item.label && (
            <div className={styles.submenuContent}>
              {renderMenuItems(item.children, level + 1)}
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <nav className={`${styles.nav} ${fixed ? styles.fixed : ''} ${className}`}>
      {/* 头部 */}
      <div className={styles.header}>
        {brand && <div className={styles.brand}>{brand}</div>}
        
        {/* 汉堡按钮 */}
        <button
          className={`${styles.hamburger} ${isOpen ? styles.open : ''}`}
          onClick={toggleMenu}
          aria-label={isOpen ? '关闭菜单' : '打开菜单'}
          aria-expanded={isOpen}
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>
      </div>

      {/* 菜单面板 */}
      <div 
        ref={menuRef}
        className={`${styles.menuPanel} ${isOpen ? styles.open : ''}`}
        role="menu"
      >
        {renderMenuItems(items)}
      </div>

      {/* 遮罩层 */}
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}
    </nav>
  );
}

// 桌面端导航栏 (配合移动端)
interface NavbarProps {
  children: React.ReactNode;
  brand?: React.ReactNode;
  fixed?: boolean;
  className?: string;
}

export function Navbar({ children, brand, fixed = true, className = '' }: NavbarProps) {
  return (
    <header className={`${styles.navbar} ${fixed ? styles.fixed : ''} ${className}`}>
      <div className={styles.navbarContent}>
        {brand && <div className={styles.brand}>{brand}</div>}
        <nav className={styles.navbarNav}>{children}</nav>
      </div>
    </header>
  );
}
