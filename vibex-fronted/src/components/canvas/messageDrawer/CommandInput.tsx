/**
 * CommandInput.tsx — 底部固定命令输入框
 *
 * Epic 2: F2.1 命令输入框
 * PRD D2: 5 个命令（/submit /gen-context /gen-flow /update-card /gen-component）
 * PRD D4: 底部输入框展示 /命令，无独立预览卡片
 * PRD D6: 命令执行只用 console.log，不调用 API
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useUIStore } from '@/lib/canvas/stores/uiStore';
import { addCommandMessage } from './messageDrawerStore';
import { CommandList } from './CommandList';
import styles from './messageDrawer.module.css';

const ALL_COMMANDS = [
  { id: 'submit',         label: '/submit',         description: '提交当前画布到后端',         nodeRequired: false },
  { id: 'gen-context',   label: '/gen-context',   description: '基于需求生成限界上下文树',   nodeRequired: false },
  { id: 'gen-flow',      label: '/gen-flow',      description: '基于上下文生成业务流程树',   nodeRequired: false },
  { id: 'gen-component',label: '/gen-component',  description: '基于流程生成组件树',         nodeRequired: false },
  { id: 'update-card',   label: '/update-card',   description: '更新选中的卡片节点',          nodeRequired: true  },
] as const;

type CommandId = typeof ALL_COMMANDS[number]['id'];

export { ALL_COMMANDS };
export type { CommandId };

export function CommandInput() {
  const [inputValue, setInputValue] = useState('');
  const [isCommandListOpen, setIsCommandListOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // F2.4: Check selected nodes for filtering
  const selectedNodeIds = useContextStore((s) => s.selectedNodeIds);
  const toggleRightDrawer = useUIStore((s) => s.toggleRightDrawer);
  const hasSelection = selectedNodeIds.context.length > 0 || selectedNodeIds.flow.length > 0;

  // ── Filter commands based on input keyword + node selection ──────────
  const filteredCommands = useCallback(() => {
    const keyword = inputValue.toLowerCase().replace(/^\//, '');

    return ALL_COMMANDS.filter((cmd) => {
      // Node-dependent filter (F2.4): only show /update-card when node selected
      if (cmd.nodeRequired && !hasSelection) return false;

      // Keyword filter (F2.3): filter by label prefix
      if (keyword) {
        return cmd.label.toLowerCase().includes(`/${keyword}`);
      }
      return true;
    });
  }, [inputValue, hasSelection]);

  // ── Trigger command list when `/` is typed ───────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (val === '/') {
      setIsCommandListOpen(true);
    } else if (val.startsWith('/')) {
      setIsCommandListOpen(true);
    } else {
      setIsCommandListOpen(false);
    }
  };

  // ── F2.6: Execute command ────────────────────────────────────────────
  const executeCommand = useCallback((commandId: CommandId) => {
    const cmd = ALL_COMMANDS.find((c) => c.id === commandId);
    if (!cmd) return;

    // F2.7: Append command_executed message to drawer
    addCommandMessage(cmd.label, `[Command] ${cmd.label} triggered`);

    // [E2] Auto-open right drawer after command execution
    toggleRightDrawer();

    // Close list and clear input
    setIsCommandListOpen(false);
    setInputValue('');
  }, [toggleRightDrawer]);

  // ── Click outside to close ────────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.commandInputWrapper}`)) {
        setIsCommandListOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className={styles.commandInputWrapper}>
      {/* F2.1: Input box */}
      <div className={styles.commandInputContainer}>
        <input
          ref={inputRef}
          type="text"
          className={styles.commandInput}
          placeholder="/命令..."
          value={inputValue}
          onChange={handleChange}
          aria-label="输入命令，支持 /submit /gen-context /gen-flow /update-card /gen-component"
          aria-expanded={isCommandListOpen}
          aria-haspopup="listbox"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* F2.2: Command dropdown list */}
      {isCommandListOpen && (
        <CommandList
          commands={filteredCommands()}
          onSelect={executeCommand}
          keyword={inputValue.replace(/^\//, '')}
        />
      )}
    </div>
  );
}
