import React from 'react';
import styles from './Grid.module.css';

export interface GridItem {
  id: string | number;
  content?: React.ReactNode;
  children?: React.ReactNode;
  span?: number;
  rowSpan?: number;
  disabled?: boolean;
}

export interface GridProps {
  items?: GridItem[];
  columns?: number | { [key: string]: number };
  gap?: number | string;
  rowGap?: number | string;
  columnGap?: number | string;
  variant?: 'default' | 'glass' | 'subtle' | 'cards';
  size?: 'sm' | 'md' | 'lg';
  autoFit?: boolean;
  minItemWidth?: number | string;
  maxItemWidth?: number | string;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  hoverable?: boolean;
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelect?: (id: string | number) => void;
  onItemClick?: (item: GridItem, index: number) => void;
  renderItem?: (item: GridItem, index: number) => React.ReactNode;
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  loading?: boolean;
  loadingCount?: number;
  className?: string;
}

function getColumnsClass(
  columns: number | { [key: string]: number } | undefined
): string {
  if (!columns) return '';
  if (typeof columns === 'number') {
    return styles[`col${columns}`];
  }
  // Handle responsive columns
  const classes: string[] = [];
  if (columns.xs) classes.push(styles[`colXs${columns.xs}`]);
  if (columns.sm) classes.push(styles[`colSm${columns.sm}`]);
  if (columns.md) classes.push(styles[`colMd${columns.md}`]);
  if (columns.lg) classes.push(styles[`colLg${columns.lg}`]);
  if (columns.xl) classes.push(styles[`colXl${columns.xl}`]);
  if (columns['2xl']) classes.push(styles[`col2xl${columns['2xl']}`]);
  return classes.join(' ');
}

export function Grid({
  items = [],
  columns,
  gap,
  rowGap,
  columnGap,
  variant = 'default',
  size = 'md',
  autoFit = false,
  minItemWidth = '250px',
  maxItemWidth,
  align = 'stretch',
  justify = 'start',
  hoverable = false,
  selectable = false,
  selectedIds = [],
  onSelect,
  onItemClick,
  renderItem,
  emptyText = 'No items available',
  emptyIcon,
  loading = false,
  loadingCount = 6,
  className = '',
}: GridProps) {
  const isSelected = (id: string | number) => selectedIds.includes(id);

  const handleItemClick = (item: GridItem, index: number) => {
    if (item.disabled) return;

    if (selectable && onSelect) {
      onSelect(item.id);
    }

    onItemClick?.(item, index);
  };

  const getItemStyle = (item: GridItem): React.CSSProperties => {
    const style: React.CSSProperties = {};
    if (item.span) {
      style.gridColumn = `span ${item.span}`;
    }
    if (item.rowSpan) {
      style.gridRow = `span ${item.rowSpan}`;
    }
    return style;
  };

  const renderDefaultItem = (item: GridItem, index: number) => {
    const isItemSelected = selectable && isSelected(item.id);
    const itemClasses = [
      styles.gridItem,
      item.disabled && styles.disabled,
      isItemSelected && styles.selected,
      hoverable && styles.hoverable,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        key={item.id}
        className={itemClasses}
        style={getItemStyle(item)}
        onClick={() => handleItemClick(item, index)}
        role={selectable ? 'option' : 'listitem'}
        aria-selected={isItemSelected}
        aria-disabled={item.disabled}
      >
        {item.children || item.content}
      </div>
    );
  };

  const renderLoadingState = () => {
    return (
      <div className={styles.loading}>
        {[...Array(loadingCount)].map((_, index) => (
          <div key={index} className={`${styles.gridItem} ${styles.skeleton}`}>
            <div className={styles.skeletonContent}>
              <div
                className={`${styles.skeletonLine} ${styles.skeletonTitle}`}
              />
              <div
                className={`${styles.skeletonLine} ${styles.skeletonText}`}
              />
              <div
                className={`${styles.skeletonLine} ${styles.skeletonTextShort}`}
              />
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

  const gridStyle: React.CSSProperties = {
    ...(gap !== undefined && { gap }),
    ...(rowGap !== undefined && { rowGap }),
    ...(columnGap !== undefined && { columnGap }),
    ...(autoFit && {
      gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
    }),
    ...(maxItemWidth && !autoFit && { maxWidth: maxItemWidth as string }),
    alignItems: align === 'stretch' ? 'stretch' : align,
    justifyContent:
      justify === 'between'
        ? 'space-between'
        : justify === 'around'
          ? 'space-around'
          : justify === 'evenly'
            ? 'space-evenly'
            : justify,
  };

  const containerClasses = [
    styles.grid,
    styles[variant],
    styles[size],
    !autoFit && columns && getColumnsClass(columns),
    autoFit && styles.autoFit,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (loading) {
    return (
      <div className={containerClasses} style={gridStyle}>
        {renderLoadingState()}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={containerClasses} style={gridStyle}>
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className={containerClasses} style={gridStyle}>
      {items.map((item, index) =>
        renderItem ? renderItem(item, index) : renderDefaultItem(item, index)
      )}
    </div>
  );
}

export default Grid;
