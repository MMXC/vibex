import React, { useState, useMemo } from 'react';
import styles from './Table.module.css';

export interface TableColumn<T> {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey?: string | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  emptyText?: string;
  loading?: boolean;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function Table<T extends Record<string, any>>({
  columns,
  data,
  rowKey = 'id',
  onRowClick,
  striped = true,
  bordered = false,
  hoverable = true,
  size = 'md',
  emptyText = 'No data available',
  loading = false,
  className = '',
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] ?? String(index);
  };

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  const tableClasses = [
    styles.table,
    styles[size],
    bordered && styles.bordered,
    className,
  ].filter(Boolean).join(' ');

  const renderSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return (
        <span className={styles.sortIcon}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 5L6 2L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3 7L6 10L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      );
    }

    return (
      <span className={`${styles.sortIcon} ${styles.sortActive}`}>
        {sortDirection === 'asc' ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 8L6 4L9 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4L6 8L9 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <table className={tableClasses}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: column.width }}
                  className={`${styles.th} ${column.sortable ? styles.sortable : ''}`}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {columns.map((column) => (
                  <td key={column.key} className={styles.skeleton}>
                    <div className={styles.skeletonLine} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <table className={tableClasses}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width }}
                className={[
                  styles.th,
                  column.sortable && styles.sortable,
                  column.align && styles[`align-${column.align}`],
                ].filter(Boolean).join(' ')}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <span className={styles.thContent}>
                  {column.title}
                  {column.sortable && renderSortIcon(column.key)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {emptyText}
              </td>
            </tr>
          ) : (
            sortedData.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                className={[
                  styles.tr,
                  striped && index % 2 === 1 && styles.striped,
                  hoverable && styles.hoverable,
                  onRowClick && styles.clickable,
                ].filter(Boolean).join(' ')}
                onClick={() => onRowClick?.(record, index)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={[
                      styles.td,
                      column.align && styles[`align-${column.align}`],
                    ].filter(Boolean).join(' ')}
                  >
                    {column.render
                      ? column.render(record[column.key], record, index)
                      : record[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
