'use client';

import React from 'react';
import styles from './Pagination.module.css';

export interface PaginationProps {
  /** 当前页码 (受控模式) */
  current?: number;
  /** 默认页码 (非受控模式) */
  defaultCurrent?: number;
  /** 总数据数 */
  total?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 可选的每页条数 */
  pageSizeOptions?: number[];
  /** 页码变化回调 */
  onChange?: (page: number, pageSize: number) => void;
  /** 每页条数变化回调 */
  onPageSizeChange?: (pageSize: number) => void;
  /** 显示快速跳转输入框 */
  showQuickJumper?: boolean;
  /** 显示页码输入框 */
  showPageSizeChanger?: boolean;
  /** 显示总条数 */
  showTotal?: boolean;
  /** 简单的分页模式 (仅 prev/next) */
  simple?: boolean;
  /** 样式变体 */
  variant?: 'default' | 'minimal' | 'pill';
  /** 自定义类名 */
  className?: string;
  /** 禁用状态 */
  disabled?: boolean;
  /** 最多显示的页码数 (省略号前) */
  maxVisiblePages?: number;
}

export function Pagination({
  current: controlledCurrent,
  defaultCurrent = 1,
  total = 0,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onChange,
  onPageSizeChange,
  showQuickJumper = false,
  showPageSizeChanger = false,
  showTotal = false,
  simple = false,
  variant = 'default',
  className = '',
  disabled = false,
  maxVisiblePages = 5,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [uncontrolledCurrent, setUncontrolledCurrent] = React.useState(
    defaultCurrent <= totalPages ? defaultCurrent : 1
  );
  const [uncontrolledPageSize, setUncontrolledPageSize] =
    React.useState(pageSize);
  const [jumpValue, setJumpValue] = React.useState('');

  // 受控优先
  const current =
    controlledCurrent !== undefined ? controlledCurrent : uncontrolledCurrent;
  const currentPageSize = pageSizeOptions.includes(pageSize)
    ? pageSize
    : uncontrolledPageSize;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || disabled) return;

    if (controlledCurrent === undefined) {
      setUncontrolledCurrent(page);
    }
    onChange?.(page, currentPageSize);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    if (controlledCurrent === undefined) {
      setUncontrolledCurrent(1);
    }
    setUncontrolledPageSize(newSize);
    onPageSizeChange?.(newSize);
    onChange?.(1, newSize);
  };

  const handleJumpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJumpValue(e.target.value);
  };

  const handleJumpSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(jumpValue, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        handlePageChange(page);
        setJumpValue('');
      }
    }
  };

  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const visible = Math.min(maxVisiblePages, totalPages);

    if (totalPages <= visible + 2) {
      // 全部显示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 总是显示第一页
      pages.push(1);

      const half = Math.floor(visible / 2);
      let start = current - half;
      let end = current + half;

      // 调整边界
      if (start <= 2) {
        start = 2;
        end = visible + 1;
      }
      if (end >= totalPages - 1) {
        end = totalPages - 1;
        start = totalPages - visible;
      }

      // 左侧省略号
      if (start > 2) {
        pages.push('ellipsis');
      }

      // 中间页码
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // 右侧省略号
      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }

      // 总是显示最后一页
      pages.push(totalPages);
    }

    return pages;
  };

  const renderPageNumbers = () => {
    if (simple) return null;

    return getPageNumbers().map((page, index) => {
      if (page === 'ellipsis') {
        return (
          <span key={`ellipsis-${index}`} className={styles.ellipsis}>
            ...
          </span>
        );
      }

      const isActive = page === current;
      return (
        <button
          key={page}
          className={`${styles.pageButton} ${isActive ? styles.active : ''}`}
          onClick={() => handlePageChange(page)}
          disabled={disabled}
          aria-current={isActive ? 'page' : undefined}
        >
          {page}
        </button>
      );
    });
  };

  const renderTotal = () => {
    if (!showTotal) return null;
    const start = (current - 1) * currentPageSize + 1;
    const end = Math.min(current * currentPageSize, total);
    return (
      <span className={styles.total}>
        {start}-{end} / {total}
      </span>
    );
  };

  const renderPageSizeSelect = () => {
    if (!showPageSizeChanger || simple) return null;
    return (
      <select
        className={styles.pageSizeSelect}
        value={currentPageSize}
        onChange={handlePageSizeChange}
        disabled={disabled}
      >
        {pageSizeOptions.map((size) => (
          <option key={size} value={size}>
            {size} 条/页
          </option>
        ))}
      </select>
    );
  };

  const renderQuickJumper = () => {
    if (!showQuickJumper || simple) return null;
    return (
      <div className={styles.quickJumper}>
        <span>跳至</span>
        <input
          type="number"
          className={styles.jumpInput}
          value={jumpValue}
          onChange={handleJumpChange}
          onKeyDown={handleJumpSubmit}
          disabled={disabled}
          min={1}
          max={totalPages}
        />
        <span>页</span>
      </div>
    );
  };

  const renderMinimal = () => {
    if (variant !== 'minimal') return null;
    return (
      <div className={`${styles.container} ${styles.minimal} ${className}`}>
        <button
          className={styles.minimalButton}
          onClick={() => handlePageChange(current - 1)}
          disabled={disabled || current <= 1}
          aria-label="上一页"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className={styles.minimalInfo}>
          {current} / {totalPages}
        </span>
        <button
          className={styles.minimalButton}
          onClick={() => handlePageChange(current + 1)}
          disabled={disabled || current >= totalPages}
          aria-label="下一页"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    );
  };

  if (variant === 'minimal') {
    return renderMinimal();
  }

  return (
    <div className={`${styles.container} ${styles[variant]} ${className}`}>
      {renderTotal()}

      <div className={styles.controls}>
        <button
          className={styles.navButton}
          onClick={() => handlePageChange(1)}
          disabled={disabled || current <= 1}
          aria-label="第一页"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
          </svg>
        </button>

        <button
          className={styles.navButton}
          onClick={() => handlePageChange(current - 1)}
          disabled={disabled || current <= 1}
          aria-label="上一页"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {renderPageNumbers()}

        <button
          className={styles.navButton}
          onClick={() => handlePageChange(current + 1)}
          disabled={disabled || current >= totalPages}
          aria-label="下一页"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <button
          className={styles.navButton}
          onClick={() => handlePageChange(totalPages)}
          disabled={disabled || current >= totalPages}
          aria-label="最后一页"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
          </svg>
        </button>
      </div>

      <div className={styles.extras}>
        {renderPageSizeSelect()}
        {renderQuickJumper()}
      </div>
    </div>
  );
}

export default Pagination;
