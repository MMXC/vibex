import React, { useState, useEffect, useRef } from 'react';
import styles from './StreamingMessage.module.css';

export interface StreamingMessageProps {
  content: string;
  isStreaming?: boolean;
  onComplete?: () => void;
  className?: string;
}

export default function StreamingMessage({
  content,
  isStreaming = false,
  onComplete,
  className = '',
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 打字机效果
  useEffect(() => {
    if (isStreaming && content !== displayedContent) {
      const timer = setTimeout(() => {
        setDisplayedContent(content);
      }, 30); // 打字速度
      return () => clearTimeout(timer);
    } else if (!isStreaming) {
      setDisplayedContent(content);
    }
  }, [content, isStreaming, displayedContent]);

  // 完成后触发回调
  useEffect(() => {
    if (!isStreaming && content === displayedContent && onComplete) {
      onComplete();
    }
  }, [isStreaming, content, displayedContent, onComplete]);

  // 光标闪烁
  useEffect(() => {
    cursorIntervalRef.current = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className={`${styles.container} ${className}`}>
      <span className={styles.content}>
        {displayedContent}
        {isStreaming && (
          <span
            className={`${styles.cursor} ${cursorVisible ? styles.visible : ''}`}
          >
            |
          </span>
        )}
      </span>
    </div>
  );
}
