import React, { useState, useRef, useEffect } from 'react';
import styles from './MessageActions.module.css';

export interface MessageActionsProps {
  /** 消息内容 */
  content: string;
  /** 消息ID */
  messageId?: string;
  /** 复制成功回调 */
  onCopy?: (content: string) => void;
  /** 分享成功回调 */
  onShare?: (content: string) => void;
  /** 自定义类名 */
  className?: string;
  /** 是否显示操作按钮（默认悬停显示） */
  alwaysVisible?: boolean;
}

export interface MessageActionsRef {
  /** 触发复制 */
  copy: () => Promise<void>;
  /** 触发分享 */
  share: () => Promise<void>;
}

export default function MessageActions(
  {
    content,
    messageId,
    onCopy,
    onShare,
    className,
    alwaysVisible = false,
  }: MessageActionsProps,
  ref: React.Ref<MessageActionsRef>
) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 暴露方法给父组件
  useEffect(() => {
    if (ref && typeof ref === 'object') {
      (ref as React.MutableRefObject<MessageActionsRef>).current = {
        copy: handleCopy,
        share: handleShare,
      };
    }
  }, [content]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.(content);
    } catch (err) {
      console.error('Failed to copy:', err);
      // 降级方案：使用旧版 clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = content;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        onCopy?.(content);
      } catch (e) {
        console.error('Fallback copy failed:', e);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VibeX 消息',
          text: content,
          url: window.location.href,
        });
        onShare?.(content);
      } catch (err) {
        // 用户取消分享不报错
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      // 不支持 Web Share API 时，降级到复制
      await handleCopy();
    }
  };

  const handleCopyLink = async () => {
    try {
      // 生成消息链接（可以根据实际需求定制）
      const messageLink = `${window.location.origin}/chat?messageId=${messageId || ''}`;
      await navigator.clipboard.writeText(messageLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.(messageLink);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
    setShowMenu(false);
  };

  return (
    <div
      className={`${styles.container} ${className || ''} ${alwaysVisible ? styles.visible : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
    >
      {/* 复制按钮 */}
      <button
        className={`${styles.actionBtn} ${copied ? styles.copied : ''}`}
        onClick={handleCopy}
        title={copied ? '已复制!' : '复制内容'}
        aria-label={copied ? '已复制' : '复制'}
      >
        {copied ? (
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>

      {/* 分享按钮 */}
      <div className={styles.shareWrapper} ref={menuRef}>
        <button
          className={styles.actionBtn}
          onClick={() => setShowMenu(!showMenu)}
          title="分享"
          aria-label="分享"
          aria-expanded={showMenu}
        >
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>

        {/* 分享菜单 */}
        {showMenu && (
          <div className={styles.menu}>
            <button className={styles.menuItem} onClick={handleCopyLink}>
              <svg
                className={styles.menuIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              复制链接
            </button>
            <button className={styles.menuItem} onClick={handleShare}>
              <svg
                className={styles.menuIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              更多分享
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 添加 forwardRef 支持
const MessageActionsWithRef = React.forwardRef<
  MessageActionsRef,
  MessageActionsProps
>(MessageActions);
export { MessageActionsWithRef as MessageActions };
