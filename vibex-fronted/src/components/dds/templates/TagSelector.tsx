/**
 * TagSelector.tsx — E4: Template Advanced Search & Filtering
 *
 * Multi-select tag component with custom tag creation support.
 * Integrates with templateStore.filterOptions.tags (AND logic).
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import { TEMPLATE_USE_CASE_TAGS, type TemplateTag } from '@/data/templates';
import styles from './TagSelector.module.css';

interface TagSelectorProps {
  /** Currently selected tags */
  selected: string[];
  /** Called when selection changes */
  onChange: (tags: string[]) => void;
  /** Allow custom tag creation (default: true) */
  allowCustom?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

export function TagSelector({
  selected,
  onChange,
  allowCustom = true,
  placeholder = '选择或创建标签...',
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowCustomInput(false);
        setCustomInput('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when custom input shows
  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCustomInput]);

  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter(t => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const handleCustomTag = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustomInput('');
    setShowCustomInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomTag();
    } else if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomInput('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(selected.filter(t => t !== tag));
  };

  // Merge predefined + custom tags for display
  const predefinedTagValues = TEMPLATE_USE_CASE_TAGS.map(t => t.value);
  const customTags = selected.filter(t => !predefinedTagValues.includes(t as TemplateTag));

  return (
    <div className={styles.container} ref={dropdownRef}>
      {/* Selected tags display */}
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="标签选择器"
      >
        {selected.length === 0 ? (
          <span className={styles.placeholder}>{placeholder}</span>
        ) : (
          <div className={styles.selectedTags}>
            {selected.slice(0, 3).map(tag => {
              const predefined = TEMPLATE_USE_CASE_TAGS.find(t => t.value === tag);
              return (
                <span
                  key={tag}
                  className={styles.selectedTag}
                  style={predefined ? { backgroundColor: `${predefined.color}22`, color: predefined.color } : {}}
                >
                  {predefined?.label ?? tag}
                  <button
                    type="button"
                    className={styles.removeTag}
                    onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                    aria-label={`移除 ${tag}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
            {selected.length > 3 && (
              <span className={styles.moreTag}>+{selected.length - 3}</span>
            )}
          </div>
        )}
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown} role="listbox" aria-label="可用标签">
          {/* Predefined tags */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>使用场景标签</div>
            {TEMPLATE_USE_CASE_TAGS.map(({ value, label, color }) => {
              const isSelected = selected.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.tagOption} ${isSelected ? styles.tagOptionSelected : ''}`}
                  style={isSelected ? { backgroundColor: `${color}22`, color, borderColor: color } : {}}
                  onClick={() => toggleTag(value)}
                >
                  {isSelected && <span className={styles.checkmark}>✓</span>}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Custom tags section */}
          {customTags.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>自定义标签</div>
              {customTags.map(tag => {
                const isSelected = selected.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`${styles.tagOption} ${isSelected ? styles.tagOptionSelected : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {isSelected && <span className={styles.checkmark}>✓</span>}
                    {tag}
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom tag creation */}
          {allowCustom && (
            <div className={styles.customSection}>
              {showCustomInput ? (
                <div className={styles.customInputRow}>
                  <input
                    ref={inputRef}
                    type="text"
                    className={styles.customInput}
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入自定义标签..."
                    maxLength={20}
                    aria-label="自定义标签输入"
                  />
                  <button
                    type="button"
                    className={styles.customAddBtn}
                    onClick={handleCustomTag}
                    disabled={!customInput.trim()}
                  >
                    添加
                  </button>
                  <button
                    type="button"
                    className={styles.customCancelBtn}
                    onClick={() => { setShowCustomInput(false); setCustomInput(''); }}
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.createTagBtn}
                  onClick={() => setShowCustomInput(true)}
                >
                  + 创建自定义标签
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
