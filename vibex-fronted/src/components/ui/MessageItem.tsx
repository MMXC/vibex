import React, { useState } from 'react';
import styles from './MessageItem.module.css';

export interface MessageItemProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  quotedContent?: string;
  onReply?: (messageId: string, content: string) => void;
  onCopy?: (content: string) => void;
  onShare?: (content: string) => void;
}

export default function MessageItem({
  id,
  role,
  content,
  createdAt,
  quotedContent,
  onReply,
  onCopy,
  onShare,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleReply = () => {
    if (onReply) {
      onReply(id, content);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onCopy) {
        onCopy(content);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VibeX 消息',
          text: content,
        });
        if (onShare) {
          onShare(content);
        }
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`${styles.container} ${styles[role]}`}>
      {/* 引用内容 */}
      {quotedContent && (
        <div className={styles.quote}>
          <span className={styles.quoteLabel}>引用:</span>
          <span className={styles.quoteContent}>{quotedContent}</span>
        </div>
      )}

      {/* 消息内容 */}
      <div className={styles.content}>{content}</div>

      {/* 元信息 */}
      <div className={styles.meta}>
        <span className={styles.time}>{formatTime(createdAt)}</span>

        {/* 操作按钮 */}
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={handleReply}
            title="回复"
          >
            ↩
          </button>
          <button
            className={styles.actionBtn}
            onClick={handleCopy}
            title={copied ? '已复制!' : '复制'}
          >
            {copied ? '✓' : '📋'}
          </button>
          <div className={styles.shareWrapper}>
            <button
              className={styles.actionBtn}
              onClick={() => setShowShareMenu(!showShareMenu)}
              title="分享"
            >
              ↗
            </button>
            {showShareMenu && (
              <div className={styles.shareMenu}>
                <button onClick={handleShare} className={styles.shareOption}>
                  复制链接
                </button>
                <button onClick={handleShare} className={styles.shareOption}>
                  分享到...
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
