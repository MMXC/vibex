/**
 * CommandPalette.tsx — S84-E3 base + S88-E5 extension
 *
 * S84-E3: VS Code-style quick-open panel (Ctrl+K / Cmd+K).
 * Features: fuzzy search, recent canvases, keyboard navigation.
 *
 * S88-E5 Extension:
 * - Category sidebar (全部/画布/模板/协作/视图/设置)
 * - Shortcut conflict detection with ⚠ warning icon
 * - Recent commands section (max 5, localStorage persisted)
 * - Category search prefix `>画布 xxx`
 *
 * Usage:
 *   <CommandPalette />
 *   (mount once in DDSCanvasPage, register shortcut)
 */
'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  useCommandPaletteStore,
  getCommandsByCategory,
  type CommandCategory,
  type CommandRegistry,
  type CommandItem,
  type SearchResult,
} from '@/stores/commandPaletteStore';
import { useKeyboardConflict } from '@/hooks/useKeyboardConflict';
import { CommandCategorySidebar } from './CommandCategorySidebar';
import styles from './CommandPalette.module.css';
import sidebarStyles from './CommandPaletteWithSidebar.module.css';

interface CommandPaletteProps {
  /** Canvas entries to populate the search index */
  canvases?: Array<{ id: string; name: string }>;
}

export function CommandPalette({ canvases = [] }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isOpen = useCommandPaletteStore((s) => s.isOpen);
  const query = useCommandPaletteStore((s) => s.query);
  const results = useCommandPaletteStore((s) => s.results);
  const close = useCommandPaletteStore((s) => s.close);
  const setQuery = useCommandPaletteStore((s) => s.setQuery);
  const recordVisit = useCommandPaletteStore((s) => s.recordVisit);
  const setSearchIndex = useCommandPaletteStore((s) => s.setSearchIndex);
  // S88-E5: Category sidebar state
  const filterCategory = useCommandPaletteStore((s) => s.filterCategory);
  const setFilterCategory = useCommandPaletteStore((s) => s.setFilterCategory);
  const recentCommands = useCommandPaletteStore((s) => s.recentCommands);
  const addRecentCommand = useCommandPaletteStore((s) => s.addRecentCommand);

  // S88-E5: Determine if we should show command list (category mode)
  const showCommandMode = query.startsWith('>') || filterCategory !== 'all';

  // S88-E5: Parse category from `>画布 xxx` prefix
  const categoryPrefix = useMemo(() => {
    if (!query.startsWith('>')) return null;
    const match = query.match(/^>([\u4e00-\u9fa5a-zA-Z]+)\s*(.*)/);
    if (!match) return null;
    const catMap: Record<string, CommandCategory> = {
      '全部': 'all',
      '画布': 'canvas',
      '模板': 'template',
      '协作': 'collaboration',
      '视图': 'view',
      '设置': 'settings',
    };
    const cat = catMap[match[1]] ?? null;
    return { category: cat, restQuery: match[2] ?? '' };
  }, [query]);

  // S88-E5: Filter commands by active category + optional search
  const activeCategory: CommandCategory = categoryPrefix?.category ?? filterCategory;
  const searchQuery = categoryPrefix?.restQuery ?? query.replace(/^>\S+\s*/, '');
  const filteredCommands = useMemo(() => {
    if (!showCommandMode) return [];
    let cmds = getCommandsByCategory(activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      cmds = cmds.filter((c) => c.name.toLowerCase().includes(q));
    }
    return cmds;
  }, [showCommandMode, activeCategory, searchQuery]);

  // Build Fuse search index from canvases prop
  useEffect(() => {
    setSearchIndex(
      canvases.map((c) => ({
        id: c.id,
        name: c.name,
        lastVisited: new Date(0).toISOString(),
      }))
    );
  }, [canvases, setSearchIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Keep active item in view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  const handleNavigate = useCallback(
    (result: SearchResult) => {
      recordVisit(result.canvasId, result.name);
      close();
      router.push(`/canvas/${result.canvasId}`);
    },
    [recordVisit, close, router]
  );

  // S88-E5: Handle command execution
  const handleExecuteCommand = useCallback(
    (cmd: CommandRegistry) => {
      addRecentCommand(cmd);
      close();
      // Dispatch action (placeholder — actual routing can be wired via router)
      // For canvas commands, navigate; for settings, open settings panel
      if (cmd.category === 'canvas' && cmd.id === 'cmd-new-node') {
        router.push(`/canvas/new`);
      } else if (cmd.category === 'settings') {
        router.push('/settings');
      } else if (cmd.category === 'template') {
        router.push('/templates');
      }
    },
    [addRecentCommand, close, router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const totalItems = showCommandMode
        ? recentCommands.length + filteredCommands.length
        : results.length;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, totalItems - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (showCommandMode) {
          // Navigate through command list
          const cmdIndex = activeIndex - recentCommands.length;
          if (activeIndex < recentCommands.length && recentCommands[activeIndex]) {
            // Clicking recent command — navigate to its stored action
            const recent = recentCommands[activeIndex];
            const registry = getCommandsByCategory('all').find((c) => c.id === recent.id);
            if (registry) handleExecuteCommand(registry);
          } else if (cmdIndex >= 0 && filteredCommands[cmdIndex]) {
            handleExecuteCommand(filteredCommands[cmdIndex]);
          }
        } else {
          const item = results[activeIndex];
          if (item) handleNavigate(item);
        }
      }
    },
    [showCommandMode, results, filteredCommands, recentCommands, activeIndex, handleNavigate, handleExecuteCommand]
  );

  if (!isOpen) return null;

  const recentResults = results.filter((r) => r.type === 'recent');
  const searchResults = results.filter((r) => r.type === 'search');

  // S88-E5: Flatten command list for keyboard nav
  const allCommandItems = [
    ...recentCommands,
    ...filteredCommands,
  ];
  const totalCommandItems = allCommandItems.length;

  return (
    <div
      className={sidebarStyles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="命令面板"
    >
      <div className={sidebarStyles.panel}>
        {/* S88-E5: Category sidebar */}
        <CommandCategorySidebar
          activeCategory={filterCategory}
          onSelect={setFilterCategory}
        />

        {/* Main content area */}
        <div className={sidebarStyles.mainContent}>
          {/* Search input */}
          <div className={styles.inputRow}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              ref={inputRef}
              className={styles.input}
              type="text"
              placeholder={
                showCommandMode
                  ? '输入命令名称或使用 >分类 筛选...'
                  : '搜索画布名称或跳转...'
              }
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleKeyDown}
              aria-label={showCommandMode ? '搜索命令' : '搜索画布'}
              data-testid="command-palette-input"
            />
            <span className={styles.shortcutHint}>Esc 关闭</span>
          </div>

          {/* S88-E5: Command list mode */}
          {showCommandMode && (
            <div
              ref={listRef}
              className={styles.results}
              role="listbox"
              data-testid="command-palette-results"
            >
              {/* S88-E5: Recent commands section */}
              {recentCommands.length > 0 && (
                <>
                  <div className={styles.sectionLabel}>最近使用</div>
                  {recentCommands.map((cmd, i) => (
                    <CommandResultItem
                      key={cmd.id}
                      command={cmd}
                      isActive={i === activeIndex}
                      onClick={() => {
                        const registry = getCommandsByCategory('all').find((c) => c.id === cmd.id);
                        if (registry) handleExecuteCommand(registry);
                      }}
                      onMouseEnter={() => setActiveIndex(i)}
                    />
                  ))}
                </>
              )}

              {/* Command category results */}
              {filteredCommands.length > 0 && (
                <>
                  <div className={styles.sectionLabel}>命令列表</div>
                  {filteredCommands.map((cmd, i) => {
                    const globalIndex = recentCommands.length + i;
                    return (
                      <CommandResultItem
                        key={cmd.id}
                        command={cmd}
                        isActive={globalIndex === activeIndex}
                        onClick={() => handleExecuteCommand(cmd)}
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                      />
                    );
                  })}
                </>
              )}

              {/* Empty state for command mode */}
              {filteredCommands.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon} aria-hidden="true">🔍</div>
                  <div>未找到匹配的命令</div>
                </div>
              )}
            </div>
          )}

          {/* S84-E3: Canvas search mode (original) */}
          {!showCommandMode && (
            <div
              ref={listRef}
              className={styles.results}
              role="listbox"
              data-testid="command-palette-results"
            >
              {results.length === 0 && query.trim() && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon} aria-hidden="true">🔍</div>
                  <div>未找到匹配的画布</div>
                </div>
              )}

              {results.length === 0 && !query.trim() && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon} aria-hidden="true">💨</div>
                  <div>最近访问的画布将显示在这里</div>
                </div>
              )}

              {recentResults.length > 0 && (
                <>
                  <div className={styles.sectionLabel}>最近访问</div>
                  {recentResults.map((result, i) => (
                    <ResultItem
                      key={result.canvasId}
                      result={result}
                      isActive={i === activeIndex}
                      onClick={() => handleNavigate(result)}
                      onMouseEnter={() => setActiveIndex(i)}
                    />
                  ))}
                </>
              )}

              {searchResults.length > 0 && (
                <>
                  {recentResults.length > 0 && (
                    <div className={styles.sectionLabel}>搜索结果</div>
                  )}
                  {searchResults.map((result, i) => {
                    const globalIndex = recentResults.length + i;
                    return (
                      <ResultItem
                        key={result.canvasId}
                        result={result}
                        isActive={globalIndex === activeIndex}
                        onClick={() => handleNavigate(result)}
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                      />
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Footer hints */}
          <div className={styles.footer}>
            <span className={styles.footerHint}>
              <kbd className={styles.footerKey}>↑↓</kbd> 导航
            </span>
            <span className={styles.footerHint}>
              <kbd className={styles.footerKey}>Enter</kbd> 执行
            </span>
            <span className={styles.footerHint}>
              <kbd className={styles.footerKey}>Esc</kbd> 关闭
            </span>
            {showCommandMode && (
              <span className={styles.footerHint}>
                <kbd className={styles.footerKey}>{'>'}</kbd> 分类搜索
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Result Item (S84-E3 canvas mode) ====================

function ResultItem({
  result,
  isActive,
  onClick,
  onMouseEnter,
}: {
  result: SearchResult;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <div
      className={`${styles.resultItem}${isActive ? ' ' + styles.active : ''}`}
      role="option"
      aria-selected={isActive}
      data-active={isActive}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      data-testid={`command-palette-item-${result.canvasId}`}
    >
      <span className={styles.resultIcon} aria-hidden="true">
        {result.type === 'recent' ? '🕐' : '📄'}
      </span>
      <span className={styles.resultName}>{result.name}</span>
      {result.type === 'search' && (
        <span className={styles.resultMeta}>搜索匹配</span>
      )}
    </div>
  );
}

// ==================== Command Result Item (S88-E5) ====================

function CommandResultItem({
  command,
  isActive,
  onClick,
  onMouseEnter,
}: {
  command: CommandItem | CommandRegistry;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  const hasConflict = useKeyboardConflict(command.shortcut);
  const name = 'name' in command ? command.name : '';
  const shortcut = command.shortcut;

  return (
    <div
      className={`${styles.resultItem}${isActive ? ' ' + styles.active : ''}`}
      role="option"
      aria-selected={isActive}
      data-active={isActive}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      data-testid={`command-item-${command.id}`}
    >
      <span className={styles.resultIcon} aria-hidden="true">
        {'icon' in command ? command.icon : '⚡'}
      </span>
      <span className={styles.resultName}>{name}</span>
      {shortcut && (
        <span
          className={`${styles.resultMeta} ${hasConflict ? styles.conflictBadge : ''}`}
          title={hasConflict ? '此快捷键与系统快捷键冲突' : shortcut}
        >
          {shortcut}
          {hasConflict && ' ⚠️'}
        </span>
      )}
    </div>
  );
}
