'use client';

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import styles from './StreamingMessage.module.css';

export interface StreamingMessageProps {
  /** 消息内容 */
  content: string;
  /** 是否正在流式输出 */
  isStreaming?: boolean;
  /** 流式输出速度 (ms) */
  streamingSpeed?: number;
  /** 显示时间 */
  timestamp?: string;
  /** 角色 */
  role: 'user' | 'assistant';
  /** 自定义类名 */
  className?: string;
  /** 流式完成回调 */
  onStreamComplete?: () => void;
  /** 内容变化回调 */
  onContentChange?: (content: string) => void;
}

/**
 * 流式消息组件 - 优化版
 * 支持平滑的字符流式显示、光标效果和性能优化
 */
export const StreamingMessage = memo(function StreamingMessage({
  content,
  isStreaming = false,
  streamingSpeed = 20,
  timestamp,
  role,
  className = '',
  onStreamComplete,
  onContentChange,
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState(content);
  const [isTyping, setIsTyping] = useState(isStreaming);
  const contentRef = useRef(content);
  const streamRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 当 content prop 变化时更新 ref
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // 流式输出逻辑
  useEffect(() => {
    if (isStreaming && content) {
      setIsTyping(true);
      setDisplayedContent('');

      let currentIndex = 0;
      const totalLength = content.length;

      const stream = () => {
        if (currentIndex < totalLength) {
          // 每次渲染添加多个字符以提高性能
          const chunkSize = Math.min(3, totalLength - currentIndex);
          const nextContent = content.substring(0, currentIndex + chunkSize);

          setDisplayedContent(nextContent);
          onContentChange?.(nextContent);

          currentIndex += chunkSize;

          // 使用 setTimeout 而不是 requestAnimationFrame 以控制速度
          streamRef.current = window.setTimeout(stream, streamingSpeed);
        } else {
          setIsTyping(false);
          onStreamComplete?.();
        }
      };

      stream();

      return () => {
        if (streamRef.current) {
          clearTimeout(streamRef.current);
        }
      };
    } else if (!isStreaming) {
      setDisplayedContent(content);
      setIsTyping(false);
    }
  }, [isStreaming, content, streamingSpeed, onStreamComplete, onContentChange]);

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current && isStreaming) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [displayedContent, isStreaming]);

  // 格式化时间
  const formatTime = useCallback((timeStr?: string) => {
    if (!timeStr) return '';
    try {
      return new Date(timeStr).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }, []);

  const isUser = role === 'user';

  return (
    <div
      ref={containerRef}
      className={`
        ${styles.message}
        ${isUser ? styles.userMessage : styles.assistantMessage}
        ${className}
      `}
    >
      <div className={styles.avatar}>{isUser ? 'U' : '◈'}</div>
      <div
        className={`${styles.content} ${isUser ? styles.userContent : styles.assistantContent}`}
      >
        <div className={styles.bubble}>
          <StreamingText content={displayedContent} isStreaming={isTyping} />
        </div>
        {timestamp && (
          <span className={styles.time}>{formatTime(timestamp)}</span>
        )}
      </div>
    </div>
  );
});

/**
 * 流式文本组件 - 处理字符级别的流式显示
 */
interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
}

const StreamingText = memo(function StreamingText({
  content,
  isStreaming,
}: StreamingTextProps) {
  // 简单的 Markdown 渲染 - 处理换行和代码块
  const renderContent = (text: string) => {
    if (!text) return null;

    // 处理换行
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
      // 检测代码块
      if (line.startsWith('```')) {
        return <br key={lineIndex} />;
      }

      // 处理行内代码
      const codeMatch = line.match(/`([^`]+)`/);
      if (codeMatch) {
        const parts = line.split(/`([^`]+)`/);
        return (
          <span key={lineIndex}>
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <code key={i} className={styles.inlineCode}>
                  {part}
                </code>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        );
      }

      return (
        <span key={lineIndex}>
          {line}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {renderContent(content)}
      {isStreaming && <span className={styles.cursor} />}
    </>
  );
});

// 默认导出
export default StreamingMessage;
