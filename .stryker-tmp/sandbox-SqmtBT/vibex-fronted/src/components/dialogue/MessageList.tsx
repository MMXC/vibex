/**
 * Dialogue Message List Component
 * 显示对话消息列表
 */
// @ts-nocheck


'use client';

import { useEffect, useRef } from 'react';
import styles from './MessageList.module.css';

export interface DialogueMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  quickReplies?: string[];
}

export interface MessageListProps {
  messages: DialogueMessage[];
  onQuickReply?: (reply: string, messageId: string) => void;
  isLoading?: boolean;
}

export function MessageList({ messages, onQuickReply, isLoading }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.container} ref={listRef}>
      {messages.length === 0 && (
        <div className={styles.empty}>
          <p>👋 你好！请描述你的项目需求</p>
        </div>
      )}
      
      {messages.map((msg) => (
        <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
          <div className={styles.avatar}>
            {msg.role === 'user' ? '👤' : msg.role === 'assistant' ? '🤖' : '⚙️'}
          </div>
          <div className={styles.content}>
            <div className={styles.bubble}>{msg.content}</div>
            <div className={styles.meta}>
              <span className={styles.time}>{formatTime(msg.timestamp)}</span>
            </div>
            
            {/* Quick Replies */}
            {msg.quickReplies && msg.quickReplies.length > 0 && (
              <div className={styles.quickReplies}>
                {msg.quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    className={styles.quickReply}
                    onClick={() => onQuickReply?.(reply, msg.id)}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className={`${styles.message} ${styles.assistant}`}>
          <div className={styles.avatar}>🤖</div>
          <div className={styles.content}>
            <div className={styles.bubble}>
              <span className={styles.typing}>
                <span className={styles.dot}>●</span>
                <span className={styles.dot}>●</span>
                <span className={styles.dot}>●</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageList;
