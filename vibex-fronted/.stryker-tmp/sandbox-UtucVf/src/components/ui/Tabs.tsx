// @ts-nocheck
'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  /** Tab 标签 */
  label: React.ReactNode;
  /** Tab 内容 */
  content?: React.ReactNode;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 唯一标识 */
  key?: string;
}

export interface TabsProps {
  /** Tab 项列表 */
  items: TabItem[];
  /** 当前激活的 tab 索引 (受控模式) */
  activeIndex?: number;
  /** 默认激活的 tab 索引 (非受控模式) */
  defaultIndex?: number;
  /** Tab 切换回调 */
  onChange?: (index: number) => void;
  /** Tab 样式变体 */
  variant?: 'line' | 'pill' | 'card';
  /** 是否可关闭 (配合 onClose 使用) */
  closable?: boolean;
  /** Tab 关闭回调 */
  onClose?: (index: number) => void;
  /** 是否显示底部操作栏 */
  showActions?: boolean;
  /** 渲染额外的操作区域 */
  actions?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 位置 */
  position?: 'top' | 'bottom';
}

export function Tabs({
  items,
  activeIndex: controlledActiveIndex,
  defaultIndex = 0,
  onChange,
  variant = 'line',
  closable = false,
  onClose,
  showActions = false,
  actions,
  className = '',
  position = 'top',
}: TabsProps) {
  // 确定初始索引 - 确保不超出范围
  const initialIndex = defaultIndex < items.length ? defaultIndex : 0;
  const [uncontrolledIndex, setUncontrolledIndex] = useState(initialIndex);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 确定当前激活的索引 (受控优先)
  const currentIndex =
    controlledActiveIndex !== undefined
      ? controlledActiveIndex
      : uncontrolledIndex;

  const handleTabClick = (index: number, disabled?: boolean) => {
    if (disabled) return;

    if (controlledActiveIndex === undefined) {
      setUncontrolledIndex(index);
    }
    onChange?.(index);
  };

  const handleClose = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    onClose?.(index);
  };

  // 更新指示器位置
  useEffect(() => {
    const activeTab = tabRefs.current[currentIndex];
    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    }
  }, [currentIndex, variant]);

  const renderTabContent = () => {
    const activeItem = items[currentIndex];
    if (!activeItem?.content) return null;
    return <div className={styles.content}>{activeItem.content}</div>;
  };

  return (
    <div className={`${styles.container} ${styles[variant]} ${className}`}>
      <div className={`${styles.tabList} ${styles[position]}`}>
        <div className={styles.tabs}>
          {items.map((item, index) => {
            const isActive = index === currentIndex;
            const isDisabled = item.disabled;

            return (
              <button
                key={index}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                className={`${styles.tab} ${isActive ? styles.active : ''} ${isDisabled ? styles.disabled : ''}`}
                onClick={() => handleTabClick(index, isDisabled)}
                disabled={isDisabled}
                role="tab"
                aria-selected={isActive}
                aria-disabled={isDisabled}
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                <span className={styles.label}>{item.label}</span>
                {closable && !isDisabled && (
                  <span
                    className={styles.close}
                    onClick={(e) => handleClose(e, index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClose(e as unknown as React.MouseEvent, index);
                      }
                    }}
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}
          {/* 指示器 */}
          {variant === 'line' && (
            <div
              className={styles.indicator}
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
              }}
            />
          )}
        </div>
        {showActions && actions && (
          <div className={styles.actions}>{actions}</div>
        )}
      </div>
      {renderTabContent()}
    </div>
  );
}

export default Tabs;
