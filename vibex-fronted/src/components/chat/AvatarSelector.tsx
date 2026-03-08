'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './AvatarSelector.module.css';

export interface AvatarItem {
  id: string;
  name: string;
  avatar: string;
  category: string;
  description?: string;
  recentlyUsed?: boolean;
}

export interface AvatarSelectorProps {
  /** 头像列表 */
  avatars: AvatarItem[];
  /** 已选中的头像 ID */
  selected?: string | string[];
  /** 多选模式 */
  multiple?: boolean;
  /** 最大选择数量 (多选模式) */
  maxSelect?: number;
  /** 搜索回调 */
  onSearch?: (query: string) => void;
  /** 选择回调 */
  onSelect?: (avatarId: string | string[]) => void;
  /** 自定义类名 */
  className?: string;
}

export function AvatarSelector({
  avatars,
  selected,
  multiple = false,
  maxSelect,
  onSearch,
  onSelect,
  className = '',
}: AvatarSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // 转换 selected 为数组格式
  const selectedArray = useMemo((): string[] => {
    if (!selected) return [];
    if (multiple) {
      return Array.isArray(selected) ? selected : [selected];
    }
    return typeof selected === 'string' ? [selected] : [];
  }, [multiple, selected]);

  // 提取分类
  const categories = useMemo(() => {
    const cats = new Set(avatars.map((a) => a.category));
    return ['all', ...Array.from(cats)];
  }, [avatars]);

  // 过滤头像
  const filteredAvatars = useMemo(() => {
    let result = avatars;

    // 按分类过滤
    if (activeCategory !== 'all') {
      result = result.filter((a) => a.category === activeCategory);
    }

    // 按搜索词过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query)
      );
    }

    // 排序：最近使用 > 名称
    return result.sort((a, b) => {
      if (a.recentlyUsed && !b.recentlyUsed) return -1;
      if (!a.recentlyUsed && b.recentlyUsed) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [avatars, activeCategory, searchQuery]);

  // 搜索处理
  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      onSearch?.(query);
    },
    [onSearch]
  );

  // 选择头像
  const handleSelect = useCallback(
    (avatarId: string) => {
      if (multiple) {
        const isSelected = selectedArray.includes(avatarId);

        if (isSelected) {
          // 取消选择
          onSelect?.(selectedArray.filter((id) => id !== avatarId));
        } else if (!maxSelect || selectedArray.length < maxSelect) {
          // 新增选择
          onSelect?.([...selectedArray, avatarId]);
        }
      } else {
        onSelect?.(avatarId);
      }
    },
    [multiple, selectedArray, maxSelect, onSelect]
  );

  // 检查是否选中
  const isSelected = useCallback(
    (avatarId: string) => {
      return selectedArray.includes(avatarId);
    },
    [selectedArray]
  );

  return (
    <div className={`${styles.container} ${className}`}>
      {/* 搜索栏 */}
      <div className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索 AI 角色..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {/* 分类过滤 */}
      <div className={styles.categories}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.categoryButton} ${activeCategory === cat ? styles.active : ''}`}
            onClick={() => setActiveCategory(cat)}
            type="button"
          >
            {cat === 'all' ? '全部' : cat}
          </button>
        ))}
      </div>

      {/* 头像网格 */}
      <div className={styles.avatarGrid}>
        {filteredAvatars.map((avatar) => (
          <div
            key={avatar.id}
            className={`${styles.avatarItem} ${isSelected(avatar.id) ? styles.selected : ''}`}
            onClick={() => handleSelect(avatar.id)}
            role="checkbox"
            aria-checked={isSelected(avatar.id)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleSelect(avatar.id);
              }
            }}
          >
            <div className={styles.avatarImage}>
              <img
                src={avatar.avatar}
                alt={avatar.name}
                onError={(e) => {
                  // 回退到默认头像
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="20" fill="%23ccc"/><circle cx="50" cy="100" r="35" fill="%23ccc"/></svg>';
                }}
              />
              {avatar.recentlyUsed && (
                <span className={styles.recentBadge}>最近</span>
              )}
            </div>
            <div className={styles.avatarInfo}>
              <div className={styles.avatarName}>{avatar.name}</div>
              {avatar.description && (
                <div className={styles.avatarDesc}>{avatar.description}</div>
              )}
            </div>
            <div className={styles.checkbox}>
              {isSelected(avatar.id) && '✓'}
            </div>
          </div>
        ))}
      </div>

      {/* 已选数量提示 */}
      {multiple && (
        <div className={styles.selectionInfo}>
          已选择 {selectedArray.length} 个角色
          {maxSelect && ` (最多 ${maxSelect})`}
        </div>
      )}

      {/* 空状态 */}
      {filteredAvatars.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🔍</span>
          <p>未找到匹配的 AI 角色</p>
        </div>
      )}
    </div>
  );
}

// 头像选择器弹窗
interface AvatarSelectorModalProps extends AvatarSelectorProps {
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function AvatarSelectorModal({
  open,
  onClose,
  title = '选择 AI 角色',
  ...props
}: AvatarSelectorModalProps) {
  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <AvatarSelector {...props} />
      </div>
    </div>
  );
}

export default AvatarSelector;
