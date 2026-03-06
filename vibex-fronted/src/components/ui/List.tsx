import React from 'react';
import styles from './List.module.css';

export interface ListItem {
  id: string | number;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  disabled?: boolean;
  children?: ListItem[];
}

export interface ListProps {
  items: ListItem[];
  variant?: 'default' | 'glass' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  separated?: boolean;
  hoverable?: boolean;
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelect?: (id: string | number) => void;
  onItemClick?: (item: ListItem, index: number) => void;
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  loading?: boolean;
  loadingCount?: number;
  renderItem?: (item: ListItem, index: number) => React.ReactNode;
  className?: string;
  nested?: boolean;
}

export function List({
  items,
  variant = 'default',
  size = 'md',
  separated = false,
  hoverable = false,
  selectable = false,
  selectedIds = [],
  onSelect,
  onItemClick,
  emptyText = 'No items available',
  emptyIcon,
  loading = false,
  loadingCount = 5,
  renderItem,
  className = '',
  nested = false,
}: ListProps) {
  const isSelected = (id: string | number) => selectedIds.includes(id);

  const handleItemClick = (item: ListItem, index: number) => {
    if (item.disabled) return;

    if (selectable && onSelect) {
      onSelect(item.id);
    }

    onItemClick?.(item, index);
  };

  const renderDefaultItem = (item: ListItem, index: number) => {
    const isItemSelected = selectable && isSelected(item.id);

    return (
      <div
        key={item.id}
        className={[
          styles.listItem,
          item.disabled && styles.disabled,
          isItemSelected && styles.selected,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => handleItemClick(item, index)}
        role={selectable ? 'option' : 'listitem'}
        aria-selected={isItemSelected}
        aria-disabled={item.disabled}
      >
        {item.icon && <div className={styles.listIcon}>{item.icon}</div>}

        <div className={styles.listContent}>
          <span className={styles.listTitle}>{item.title}</span>
          {item.description && (
            <span className={styles.listDescription}>{item.description}</span>
          )}
        </div>

        {item.meta && <div className={styles.listMeta}>{item.meta}</div>}

        {item.actions && (
          <div className={styles.listActions}>{item.actions}</div>
        )}

        {item.children && item.children.length > 0 && (
          <List items={item.children} variant={variant} size={size} nested />
        )}
      </div>
    );
  };

  const renderLoadingState = () => {
    return (
      <div className={styles.loading}>
        {[...Array(loadingCount)].map((_, index) => (
          <div key={index} className={styles.loadingItem}>
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonContent}>
              <div className={`${styles.skeletonLine} ${styles.medium}`} />
              <div className={`${styles.skeletonLine} ${styles.short}`} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEmptyState = () => {
    return (
      <div className={styles.empty}>
        {emptyIcon && <div className={styles.emptyIcon}>{emptyIcon}</div>}
        <span className={styles.emptyText}>{emptyText}</span>
      </div>
    );
  };

  const containerClasses = [
    styles.list,
    styles[variant],
    styles[size],
    separated && styles.separated,
    hoverable && styles.hoverable,
    selectable && styles.selectable,
    nested && styles.nested,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (loading) {
    return <div className={containerClasses}>{renderLoadingState()}</div>;
  }

  if (items.length === 0) {
    return <div className={containerClasses}>{renderEmptyState()}</div>;
  }

  return (
    <div className={containerClasses} role={selectable ? 'listbox' : 'list'}>
      {items.map((item, index) =>
        renderItem ? renderItem(item, index) : renderDefaultItem(item, index)
      )}
    </div>
  );
}

export default List;
