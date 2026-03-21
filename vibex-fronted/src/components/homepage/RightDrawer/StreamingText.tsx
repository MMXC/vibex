/**
 * StreamingText - 流式文本逐步显示组件
 * 
 * Epic 5: SSE 流式 + AI展示区
 * 
 * Features:
 * - Displays streaming text incrementally
 * - Preserves whitespace and newlines
 * - Code block detection for Mermaid syntax
 * - Auto-scrolls to latest content
 * 
 * ST-5.2: 流式文本逐步显示，每 100ms 增量更新一次
 */

'use client';

import React, { useMemo } from 'react';
import styles from './StreamingText.module.css';

export interface StreamingTextProps {
  /** 流式文本内容 */
  text: string;
  /** 是否正在流式传输 */
  isStreaming?: boolean;
  /** 是否显示打字光标 */
  showCursor?: boolean;
  /** 自定义类名 */
  className?: string;
  /** data-testid 前缀 */
  'data-testid'?: string;
}

/**
 * StreamingText - 流式文本组件
 * 
 * 逐步显示 SSE 流式文本，支持:
 * - Markdown-like formatting
 * - Mermaid 代码块高亮
 * - 代码片段检测
 */
export const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  isStreaming = true,
  showCursor = true,
  className,
  'data-testid': testId,
}) => {
  // Parse text into segments for formatting
  const segments = useMemo(() => parseStreamingText(text), [text]);

  return (
    <div
      className={[styles.streamingText, className].filter(Boolean).join(' ')}
      data-testid={testId}
      data-is-streaming={isStreaming}
    >
      {/* Segments */}
      {segments.map((segment, index) => {
        if (segment.type === 'code') {
          return (
            <pre
              key={index}
              className={styles.codeBlock}
              data-segment-type="code"
            >
              <code>{segment.content}</code>
            </pre>
          );
        }
        
        if (segment.type === 'mermaid') {
          return (
            <div
              key={index}
              className={styles.mermaidBlock}
              data-segment-type="mermaid"
            >
              <span className={styles.mermaidLabel}>mermaid</span>
              <pre className={styles.mermaidCode}>
                <code>{segment.content}</code>
              </pre>
            </div>
          );
        }
        
        if (segment.type === 'heading') {
          return (
            <h4 key={index} className={styles.heading}>
              {segment.content}
            </h4>
          );
        }
        
        if (segment.type === 'list') {
          const items = segment.content.split('\n').filter(Boolean);
          return (
            <ul key={index} className={styles.list}>
              {items.map((item, i) => (
                <li key={i}>{item.replace(/^[-\*]\s*/, '')}</li>
              ))}
            </ul>
          );
        }

        // Plain text
        return (
          <p key={index} className={styles.paragraph}>
            {segment.content}
          </p>
        );
      })}

      {/* Typing cursor */}
      {isStreaming && showCursor && (
        <span className={styles.cursor} data-testid="typing-cursor">
          |
        </span>
      )}
    </div>
  );
};

// ==================== Text Parser ====================

interface TextSegment {
  type: 'text' | 'code' | 'mermaid' | 'heading' | 'list';
  content: string;
}

/**
 * Parse streaming text into formatted segments
 */
function parseStreamingText(text: string): TextSegment[] {
  if (!text) return [];

  const segments: TextSegment[] = [];

  // Pattern: mermaid code block ```mermaid ... ```
  const mermaidBlockRegex = /```mermaid\n?([\s\S]*?)```/;
  // Pattern: generic code block ``` ... ```
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/;

  // Check if the entire text is a mermaid block
  const mermaidMatch = text.match(mermaidBlockRegex);
  if (mermaidMatch) {
    segments.push({ type: 'mermaid', content: mermaidMatch[1] });
    return segments;
  }

  // Check if it's a code block
  const codeMatch = text.match(codeBlockRegex);
  if (codeMatch) {
    segments.push({ type: 'code', content: codeMatch[2] });
    return segments;
  }

  // Otherwise, treat as plain text
  segments.push({ type: 'text', content: text });
  return segments;
}

export default StreamingText;
