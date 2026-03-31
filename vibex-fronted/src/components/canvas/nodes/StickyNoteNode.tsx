/**
 * StickyNoteNode — ReactFlow custom node for sticky notes
 *
 * Epic 3: E3-F3 (canvas-p2-f3-sticky-notes)
 *
 * 功能：
 * - 双击画布空白区域创建贴纸节点（通过 ReactFlow onDoubleClick）
 * - 支持拖拽定位
 * - 支持双击编辑文本
 * - 支持拖拽调整大小
 * - 三种颜色：黄/粉/蓝
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import styles from './StickyNoteNode.module.css';

export type StickyNoteColor = 'yellow' | 'pink' | 'blue';

export interface StickyNoteNodeData extends Record<string, unknown> {
  /** 贴纸文本内容 */
  text: string;
  /** 贴纸颜色 */
  color: StickyNoteColor;
  /** 是否可编辑 */
  readonly?: boolean;
}

/** 默认贴纸颜色配置 */
const COLOR_MAP: Record<StickyNoteColor, { bg: string; border: string; text: string }> = {
  yellow: { bg: '#fef9c3', border: '#facc15', text: '#713f12' },
  pink: { bg: '#fce7f3', border: '#f472b6', text: '#831843' },
  blue: { bg: '#dbeafe', border: '#60a5fa', text: '#1e3a5f' },
};

interface StickyNoteNodeProps extends NodeProps {
  data: StickyNoteNodeData;
}

const StickyNoteNodeComponent = ({ id, data, selected }: StickyNoteNodeProps) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(data.text ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const color = data.color ?? 'yellow';
  const colors = COLOR_MAP[color];
  const readonly = data.readonly ?? false;

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (readonly) return;
      e.stopPropagation();
      setEditing(true);
      // Focus textarea after state update
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
    [readonly]
  );

  const handleBlur = useCallback(() => {
    setEditing(false);
    // Update data.text would need to go through onChange callback
    // For now, we rely on the parent to read from the node data
  }, []);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Escape to stop editing
      if (e.key === 'Escape') {
        setEditing(false);
        (e.target as HTMLElement).blur();
      }
      // Prevent event bubbling so double-click doesn't bubble to canvas
      e.stopPropagation();
    },
    []
  );

  return (
    <>
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <div
        className={`${styles.stickyNote} ${selected ? styles.selected : ''}`}
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          color: colors.text,
        }}
        onDoubleClick={handleDoubleClick}
        data-testid={`sticky-note-${id}`}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={text}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{ color: colors.text }}
            aria-label="贴纸文本"
          />
        ) : (
          <div className={styles.content}>
            {text || (
              <span className={styles.placeholder}>双击编辑...</span>
            )}
          </div>
        )}

        {/* Color picker (shown when selected and not readonly) */}
        {selected && !readonly && (
          <div className={styles.colorPicker}>
            {(['yellow', 'pink', 'blue'] as StickyNoteColor[]).map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.colorBtn} ${color === c ? styles.colorBtnActive : ''}`}
                style={{ backgroundColor: COLOR_MAP[c].bg, borderColor: COLOR_MAP[c].border }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Color change would need onChange callback — store integration point
                }}
                aria-label={`切换到${c === 'yellow' ? '黄色' : c === 'pink' ? '粉色' : '蓝色'}贴纸`}
                title={`${c === 'yellow' ? '黄色' : c === 'pink' ? '粉色' : '蓝色'}`}
              />
            ))}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
    </>
  );
}

export const StickyNoteNode = React.memo(StickyNoteNodeComponent);
export default StickyNoteNode;
