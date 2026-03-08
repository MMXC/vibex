'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import styles from './SearchFilter.module.css';

// ==================== 类型定义 ====================

export interface SearchFilterOption {
  /** 选项值 */
  value: string;
  /** 显示标签 */
  label: string;
  /** 选项计数 */
  count?: number;
}

export interface SearchFilterConfig {
  /** 按日期范围过滤 */
  dateRange?: {
    enabled: boolean;
    options: SearchFilterOption[];
    default?: string;
  };
  /** 按消息角色过滤 */
  role?: {
    enabled: boolean;
    options: SearchFilterOption[];
    default?: string;
  };
  /** 按标签过滤 */
  tags?: {
    enabled: boolean;
    options: SearchFilterOption[];
    default?: string[];
  };
}

export interface SearchFilterProps {
  /** 搜索占位符 */
  placeholder?: string;
  /** 搜索回调 (防抖处理) */
  onSearch?: (query: string, filters: SearchFilters) => void;
  /** 过滤器配置 */
  filterConfig?: SearchFilterConfig;
  /** 自动聚焦 */
  autoFocus?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 紧凑模式 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 防抖延迟 (ms) */
  debounceMs?: number;
  /** 最大搜索结果预览数 */
  maxPreviewResults?: number;
}

export interface SearchFilters {
  dateRange?: string;
  role?: string;
  tags?: string[];
}

export interface SearchResult {
  id: string;
  content: string;
  highlight?: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
}

export interface SearchFilterRef {
  /** 设置搜索值 */
  setQuery: (query: string) => void;
  /** 设置过滤器 */
  setFilters: (filters: SearchFilters) => void;
  /** 清空搜索 */
  clear: () => void;
  /** 获取当前状态 */
  getState: () => { query: string; filters: SearchFilters };
  /** 聚焦输入框 */
  focus: () => void;
}

// ==================== 默认配置 ====================

const DEFAULT_DATE_OPTIONS: SearchFilterOption[] = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'year', label: '今年' },
];

const DEFAULT_ROLE_OPTIONS: SearchFilterOption[] = [
  { value: 'all', label: '全部消息' },
  { value: 'user', label: '用户消息' },
  { value: 'assistant', label: 'AI 回复' },
];

// ==================== 组件 ====================

function SearchFilterComponent(
  {
    placeholder = '搜索消息...',
    onSearch,
    filterConfig,
    autoFocus = false,
    disabled = false,
    compact = false,
    className = '',
    debounceMs = 300,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    maxPreviewResults = 5,
  }: SearchFilterProps,
  ref: React.Ref<SearchFilterRef>
) {
  // State
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 合并默认配置
  const config = useMemo<SearchFilterConfig>(
    () => ({
      dateRange: {
        enabled: true,
        options: DEFAULT_DATE_OPTIONS,
        default: 'all',
        ...filterConfig?.dateRange,
      },
      role: {
        enabled: true,
        options: DEFAULT_ROLE_OPTIONS,
        default: 'all',
        ...filterConfig?.role,
      },
      tags: {
        enabled: false,
        options: [],
        ...filterConfig?.tags,
      },
    }),
    [filterConfig]
  );

  // 防抖搜索
  const debouncedSearch = useCallback(
    (searchQuery: string, searchFilters: SearchFilters) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onSearch?.(searchQuery, searchFilters);
      }, debounceMs);
    },
    [onSearch, debounceMs]
  );

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery, filters);
  };

  // 处理过滤器变化
  const handleFilterChange = (
    filterType: keyof SearchFilters,
    value: string | string[]
  ) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    debouncedSearch(query, newFilters);
  };

  // 处理标签切换
  const handleTagToggle = (tagValue: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagValue)
      ? currentTags.filter((t) => t !== tagValue)
      : [...currentTags, tagValue];
    handleFilterChange('tags', newTags);
  };

  // 清空搜索
  const handleClear = () => {
    setQuery('');
    setFilters({});
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onSearch?.('', {});
    inputRef.current?.focus();
  };

  // 点击外部关闭过滤器面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
        setActiveFilter(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 自动聚焦
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // 暴露方法给父组件
  useEffect(() => {
    if (ref && typeof ref === 'object') {
      (ref as React.MutableRefObject<SearchFilterRef>).current = {
        setQuery: (newQuery: string) => {
          setQuery(newQuery);
          debouncedSearch(newQuery, filters);
        },
        setFilters: (newFilters: SearchFilters) => {
          setFilters(newFilters);
          debouncedSearch(query, newFilters);
        },
        clear: handleClear,
        getState: () => ({ query, filters }),
        focus: () => inputRef.current?.focus(),
      };
    }
    // handleClear 在依赖中会导致无限循环，因为 ref 只需要设置一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, debouncedSearch]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isFilterOpen) {
        setIsFilterOpen(false);
        setActiveFilter(null);
      } else if (query) {
        handleClear();
      }
    } else if (e.key === '/' && e.ctrlKey) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  // 检查是否有活跃的过滤器
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.dateRange && filters.dateRange !== 'all') ||
      (filters.role && filters.role !== 'all') ||
      (filters.tags && filters.tags.length > 0)
    );
  }, [filters]);

  // 获取活跃过滤器数量
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange && filters.dateRange !== 'all') count++;
    if (filters.role && filters.role !== 'all') count++;
    if (filters.tags && filters.tags.length > 0) count += filters.tags.length;
    return count;
  }, [filters]);

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${compact ? styles.compact : ''} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* 搜索输入区 */}
      <div className={`${styles.searchBox} ${isFocused ? styles.focused : ''}`}>
        {/* 搜索图标 */}
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={styles.input}
          disabled={disabled}
          aria-label="搜索消息"
          aria-haspopup="listbox"
        />

        {/* 清除按钮 */}
        {query && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label="清除搜索"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* 过滤器按钮 */}
        {(config.dateRange?.enabled ||
          config.role?.enabled ||
          config.tags?.enabled) && (
          <button
            type="button"
            className={`${styles.filterBtn} ${isFilterOpen ? styles.active : ''} ${hasActiveFilters ? styles.hasFilters : ''}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            disabled={disabled}
            aria-label="过滤选项"
            aria-expanded={isFilterOpen}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {activeFilterCount > 0 && (
              <span className={styles.filterBadge}>{activeFilterCount}</span>
            )}
          </button>
        )}
      </div>

      {/* 过滤器面板 */}
      {isFilterOpen && (
        <div ref={filterPanelRef} className={styles.filterPanel} role="listbox">
          {/* 日期过滤 */}
          {config.dateRange?.enabled && (
            <div className={styles.filterSection}>
              <button
                type="button"
                className={`${styles.filterHeader} ${activeFilter === 'date' ? styles.activeHeader : ''}`}
                onClick={() =>
                  setActiveFilter(activeFilter === 'date' ? null : 'date')
                }
                aria-expanded={activeFilter === 'date'}
              >
                <span className={styles.filterIcon}>📅</span>
                <span className={styles.filterTitle}>时间范围</span>
                <span className={styles.filterValue}>
                  {
                    config.dateRange.options.find(
                      (o) => o.value === (filters.dateRange || 'all')
                    )?.label
                  }
                </span>
                <span
                  className={`${styles.chevron} ${activeFilter === 'date' ? styles.chevronOpen : ''}`}
                >
                  ▼
                </span>
              </button>

              {activeFilter === 'date' && (
                <div className={styles.filterOptions}>
                  {config.dateRange.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.optionBtn} ${(filters.dateRange || 'all') === option.value ? styles.selected : ''}`}
                      onClick={() =>
                        handleFilterChange('dateRange', option.value)
                      }
                    >
                      <span className={styles.optionLabel}>{option.label}</span>
                      {option.count !== undefined && (
                        <span className={styles.optionCount}>
                          {option.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 角色过滤 */}
          {config.role?.enabled && (
            <div className={styles.filterSection}>
              <button
                type="button"
                className={`${styles.filterHeader} ${activeFilter === 'role' ? styles.activeHeader : ''}`}
                onClick={() =>
                  setActiveFilter(activeFilter === 'role' ? null : 'role')
                }
                aria-expanded={activeFilter === 'role'}
              >
                <span className={styles.filterIcon}>💬</span>
                <span className={styles.filterTitle}>消息类型</span>
                <span className={styles.filterValue}>
                  {
                    config.role.options.find(
                      (o) => o.value === (filters.role || 'all')
                    )?.label
                  }
                </span>
                <span
                  className={`${styles.chevron} ${activeFilter === 'role' ? styles.chevronOpen : ''}`}
                >
                  ▼
                </span>
              </button>

              {activeFilter === 'role' && (
                <div className={styles.filterOptions}>
                  {config.role.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.optionBtn} ${(filters.role || 'all') === option.value ? styles.selected : ''}`}
                      onClick={() => handleFilterChange('role', option.value)}
                    >
                      <span className={styles.optionLabel}>{option.label}</span>
                      {option.count !== undefined && (
                        <span className={styles.optionCount}>
                          {option.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 标签过滤 */}
          {config.tags?.enabled && config.tags.options.length > 0 && (
            <div className={styles.filterSection}>
              <button
                type="button"
                className={`${styles.filterHeader} ${activeFilter === 'tags' ? styles.activeHeader : ''}`}
                onClick={() =>
                  setActiveFilter(activeFilter === 'tags' ? null : 'tags')
                }
                aria-expanded={activeFilter === 'tags'}
              >
                <span className={styles.filterIcon}>🏷️</span>
                <span className={styles.filterTitle}>标签</span>
                <span className={styles.filterValue}>
                  {filters.tags?.length || 0} 个已选
                </span>
                <span
                  className={`${styles.chevron} ${activeFilter === 'tags' ? styles.chevronOpen : ''}`}
                >
                  ▼
                </span>
              </button>

              {activeFilter === 'tags' && (
                <div className={styles.filterOptions}>
                  {config.tags.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.optionBtn} ${(filters.tags || []).includes(option.value) ? styles.selected : ''}`}
                      onClick={() => handleTagToggle(option.value)}
                    >
                      <span className={styles.checkbox}>
                        {(filters.tags || []).includes(option.value) && (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className={styles.optionLabel}>{option.label}</span>
                      {option.count !== undefined && (
                        <span className={styles.optionCount}>
                          {option.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 快捷操作 */}
          {hasActiveFilters && (
            <div className={styles.filterActions}>
              <button
                type="button"
                className={styles.clearFiltersBtn}
                onClick={() => {
                  setFilters({});
                  debouncedSearch(query, {});
                }}
              >
                清除所有过滤
              </button>
            </div>
          )}
        </div>
      )}

      {/* 搜索提示 */}
      {isFocused && !query && (
        <div className={styles.hint}>
          <span className={styles.hintText}>
            输入关键词搜索消息，按 <kbd>Esc</kbd> 清除
          </span>
        </div>
      )}
    </div>
  );
}

// 使用 forwardRef 导出
const SearchFilter = React.forwardRef<SearchFilterRef, SearchFilterProps>(
  SearchFilterComponent
);
export { SearchFilter };

// ==================== Hook ====================

/**
 * 搜索过滤 Hook - 用于管理搜索和过滤状态
 */
export function useSearchFilter(
  onSearch?: (query: string, filters: SearchFilters) => void,
  initialFilters?: SearchFilters
) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {});
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(
    (newQuery: string, newFilters: SearchFilters) => {
      setQuery(newQuery);
      setFilters(newFilters);
      setIsSearching(true);

      onSearch?.(newQuery, newFilters);

      // 模拟搜索完成
      setTimeout(() => setIsSearching(false), 300);
    },
    [onSearch]
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setFilters({});
    onSearch?.('', {});
  }, [onSearch]);

  const updateFilter = useCallback(
    (key: keyof SearchFilters, value: string | string[]) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      onSearch?.(query, newFilters);
    },
    [query, filters, onSearch]
  );

  const removeFilter = useCallback(
    (key: keyof SearchFilters) => {
      const newFilters = { ...filters };
      delete newFilters[key];
      setFilters(newFilters);
      onSearch?.(query, newFilters);
    },
    [query, filters, onSearch]
  );

  return {
    query,
    filters,
    isSearching,
    handleSearch,
    clearSearch,
    updateFilter,
    removeFilter,
    setQuery,
    setFilters,
  };
}

// ==================== 辅助函数 ====================

/**
 * 高亮搜索结果中的关键词
 */
export function highlightSearchMatch(text: string, query: string): string {
  if (!query.trim()) return text;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  );
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * 在消息中搜索
 */
export function searchInMessages(
  messages: SearchResult[],
  query: string,
  filters: SearchFilters
): SearchResult[] {
  let results = [...messages];

  // 文本搜索
  if (query.trim()) {
    const lowerQuery = query.toLowerCase();
    results = results.filter((msg) =>
      msg.content.toLowerCase().includes(lowerQuery)
    );
  }

  // 角色过滤
  if (filters.role && filters.role !== 'all') {
    results = results.filter((msg) => msg.role === filters.role);
  }

  // 日期范围过滤
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    let startDate: Date;
    switch (filters.dateRange) {
      case 'today':
        startDate = startOfDay;
        break;
      case 'week':
        startDate = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(startOfDay.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    results = results.filter((msg) => new Date(msg.createdAt) >= startDate);
  }

  // 标签过滤 (需要消息支持标签)
  // if (filters.tags && filters.tags.length > 0) {
  //   results = results.filter(msg =>
  //     filters.tags!.every(tag => msg.tags?.includes(tag))
  //   );
  // }

  return results;
}

export default SearchFilter;
