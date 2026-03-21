/**
 * ChatHistory - 历史记录面板
 * 功能: 显示最近 10 条对话记录，可展开查看
 * 规格: 展开高度 200px，最多显示 10 条
 */
import React, { useState, useCallback } from 'react';
import styles from './ChatHistory.module.css';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatHistoryProps {
  /** 历史消息列表（最近10条） */
  messages?: ChatMessage[];
  /** 最大显示条数 */
  maxItems?: number;
  /** 展开回调 */
  onExpand?: (messageId: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function truncateContent(content: string, maxLen = 60): string {
  if (content.length <= maxLen) return content;
  return content.slice(0, maxLen) + '...';
}

export function ChatHistory({
  messages = [],
  maxItems = 10,
  onExpand,
  disabled = false,
}: ChatHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 取最近 maxItems 条
  const recentMessages = messages.slice(-maxItems);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsExpanded((v) => !v);
    }
  }, [disabled]);

  const handleItemClick = useCallback(
    (messageId: string) => {
      if (!disabled) {
        onExpand?.(messageId);
      }
    },
    [disabled, onExpand]
  );

  if (messages.length === 0) {
    return (
      <div
        className={styles.container}
        data-testid="chat-history"
        aria-label="历史记录（暂无）"
      >
        <div className={styles.header} title="暂无历史记录">
          <span className={styles.icon}>📜</span>
          <span className={styles.title}>历史记录</span>
          <span className={styles.count}>0</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.container} ${isExpanded ? styles.expanded : ''}`}
      data-testid="chat-history"
      data-expanded={isExpanded}
      data-count={recentMessages.length}
    >
      {/* 标题栏 */}
      <button
        className={styles.header}
        onClick={handleToggle}
        disabled={disabled}
        type="button"
        aria-expanded={isExpanded}
        aria-label={`历史记录 ${recentMessages.length} 条，点击${isExpanded ? '收起' : '展开'}`}
        title={`历史记录 ${recentMessages.length} 条，点击${isExpanded ? '收起' : '展开'}`}
      >
        <span className={styles.icon}>📜</span>
        <span className={styles.title}>历史记录</span>
        <span className={styles.count}>{recentMessages.length}</span>
        <span className={`${styles.chevron} ${isExpanded ? styles.up : styles.down}`}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {/* 展开列表 */}
      {isExpanded && (
        <div className={styles.list} role="list" aria-label="历史消息列表">
          {recentMessages.map((msg) => (
            <button
              key={msg.id}
              className={`${styles.item} ${msg.role === 'user' ? styles.user : styles.assistant}`}
              onClick={() => handleItemClick(msg.id)}
              disabled={disabled}
              type="button"
              role="listitem"
              aria-label={`${msg.role === 'user' ? '用户' : 'AI'}消息: ${truncateContent(msg.content)}`}
              title={msg.content}
            >
              <span className={styles.roleIcon}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </span>
              <span className={styles.content}>
                {truncateContent(msg.content)}
              </span>
              <span className={styles.time}>
                {formatTime(msg.timestamp)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatHistory;
