import React, { useState, useRef, useEffect, forwardRef } from 'react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'size'
> {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  variant?: 'default' | 'filled' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  searchable?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      label,
      error,
      hint,
      placeholder = 'Select an option',
      variant = 'default',
      size = 'md',
      searchable = false,
      disabled = false,
      clearable = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const selectedOption = options.find((opt) => opt.value === value);
    const hasError = Boolean(error);

    const filteredOptions = searchable
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(search.toLowerCase())
        )
      : options;

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearch('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (isOpen && listRef.current) {
        const selectedElement = listRef.current.querySelector(
          `[data-selected="true"]`
        );
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [isOpen, value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isOpen) {
            const focusedElement = listRef.current?.querySelector(
              '[data-focused="true"]'
            );
            if (focusedElement) {
              const optionValue = (focusedElement as HTMLElement).dataset.value;
              const option = options.find((opt) => opt.value === optionValue);
              if (option && !option.disabled) {
                onChange?.(option.value);
                setIsOpen(false);
                setSearch('');
              }
            }
          } else {
            setIsOpen(true);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearch('');
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            const currentIndex = filteredOptions.findIndex(
              (opt) => opt.value === value
            );
            const nextIndex = Math.min(
              currentIndex + 1,
              filteredOptions.length - 1
            );
            if (nextIndex >= 0) {
              onChange?.(filteredOptions[nextIndex].value);
            }
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            const currentIndex = filteredOptions.findIndex(
              (opt) => opt.value === value
            );
            const prevIndex = Math.max(currentIndex - 1, 0);
            if (prevIndex >= 0) {
              onChange?.(filteredOptions[prevIndex].value);
            }
          }
          break;
      }
    };

    const handleSelect = (option: SelectOption) => {
      if (option.disabled) return;
      onChange?.(option.value);
      setIsOpen(false);
      setSearch('');
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('');
    };

    return (
      <div className={`${styles.wrapper} ${className}`}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}
        <div
          ref={containerRef}
          className={`${styles.selectContainer} ${styles[variant]} ${styles[size]} ${isOpen ? styles.open : ''} ${hasError ? styles.error : ''} ${disabled ? styles.disabled : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${selectId}-listbox`}
        >
          <div className={styles.trigger}>
            {selectedOption ? (
              <span className={styles.value}>
                {selectedOption.icon && (
                  <span className={styles.optionIcon}>
                    {selectedOption.icon}
                  </span>
                )}
                {selectedOption.label}
              </span>
            ) : (
              <span className={styles.placeholder}>{placeholder}</span>
            )}
          </div>

          <div className={styles.actions}>
            {clearable && value && !disabled && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={handleClear}
                tabIndex={-1}
                aria-label="Clear selection"
              >
                <svg
                  width="14"
                  height="14"
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
            <span className={styles.chevron}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>

          {isOpen && (
            <div className={styles.dropdown}>
              {searchable && (
                <div className={styles.searchWrapper}>
                  <svg
                    className={styles.searchIcon}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
              )}
              <ul
                ref={listRef}
                className={styles.optionsList}
                id={`${selectId}-listbox`}
                role="listbox"
                aria-label="Select options"
              >
                {filteredOptions.length === 0 ? (
                  <li className={styles.noOptions}>No options found</li>
                ) : (
                  filteredOptions.map((option, index) => (
                    <li
                      key={option.value}
                      className={`${styles.option} ${option.value === value ? styles.selected : ''} ${option.disabled ? styles.optionDisabled : ''}`}
                      role="option"
                      aria-selected={option.value === value}
                      data-selected={option.value === value}
                      data-focused={index === 0 && !value ? true : undefined}
                      data-value={option.value}
                      onClick={() => handleSelect(option)}
                    >
                      {option.icon && (
                        <span className={styles.optionIcon}>{option.icon}</span>
                      )}
                      {option.label}
                      {option.value === value && (
                        <span className={styles.checkmark}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
        {(error || hint) && (
          <span
            className={`${styles.message} ${hasError ? styles.errorMessage : styles.hintMessage}`}
          >
            {error || hint}
          </span>
        )}
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={styles.hiddenSelect}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
