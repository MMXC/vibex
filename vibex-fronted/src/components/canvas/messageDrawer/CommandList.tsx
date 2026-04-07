/**
 * CommandList.tsx — 命令下拉列表
 *
 * Epic 2: F2.2 命令下拉列表
 */

'use client';

import React from 'react';
import type { CommandId } from './CommandInput';

interface Command {
  id: string;
  label: string;
  description: string;
  nodeRequired: boolean;
}

interface CommandListProps {
  commands: readonly Command[];
  onSelect: (id: CommandId) => void;
  keyword: string;
}

function highlightKeyword(text: string, keyword: string): React.ReactNode {
  if (!keyword) return text;
  const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase()
      ? <mark key={i} className={styles.commandHighlight}>{part}</mark>
      : part
  );
}

import styles from './messageDrawer.module.css';

export function CommandList({ commands, onSelect, keyword }: CommandListProps) {
  if (commands.length === 0) {
    return (
      <div className={styles.commandList} role="listbox" aria-label="命令列表">
        <div className={styles.commandListEmpty}>没有匹配的命令</div>
      </div>
    );
  }

  return (
    <div className={styles.commandList} role="listbox" aria-label="命令列表">
      {commands.map((cmd) => (
        <button
          key={cmd.id}
          type="button"
          role="option"
          aria-selected={false}
          className={styles.commandItem}
          onClick={() => onSelect(cmd.id as CommandId)}
          title={cmd.description}
        >
          <span className={styles.commandLabel}>
            {highlightKeyword(cmd.label, keyword)}
          </span>
          <span className={styles.commandDesc}>{cmd.description}</span>
          {cmd.nodeRequired && (
            <span className={styles.commandBadge} title="需要先选中卡片">🎯</span>
          )}
        </button>
      ))}
    </div>
  );
}
