/**
 * Entity Code Editor Component
 * 编辑 JSON 配置，应用、撤销
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import styles from './EntityCodeEditor.module.css';

export interface EntityConfig {
  id: string;
  name: string;
  type: string;
  attributes: Array<{
    name: string;
    type: string;
    required?: boolean;
  }>;
}

export interface EntityCodeEditorProps {
  initialConfig: EntityConfig;
  onApply?: (config: EntityConfig) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export function EntityCodeEditor({
  initialConfig,
  onApply,
  onCancel,
  readOnly = false,
}: EntityCodeEditorProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize with initial config
  useEffect(() => {
    setCode(JSON.stringify(initialConfig, null, 2));
    setHistory([JSON.stringify(initialConfig, null, 2)]);
    setHistoryIndex(0);
  }, [initialConfig]);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    setError(null);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newCode);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleApply = useCallback(() => {
    try {
      const parsed = JSON.parse(code) as EntityConfig;
      setError(null);
      onApply?.(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON 解析错误');
    }
  }, [code, onApply]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setCode(history[newIndex]!);
      setHistoryIndex(newIndex);
      setError(null);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setCode(history[newIndex]!);
      setHistoryIndex(newIndex);
      setError(null);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <span className={styles.title}>实体配置 (JSON)</span>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.toolButton}
            onClick={handleUndo}
            disabled={!canUndo || readOnly}
            title="撤销"
          >
            ⟲
          </button>
          <button
            type="button"
            className={styles.toolButton}
            onClick={handleRedo}
            disabled={!canRedo || readOnly}
            title="重做"
          >
            ⟳
          </button>
        </div>
      </div>

      <textarea
        className={`${styles.editor} ${error ? styles.editorError : ''}`}
        value={code}
        onChange={handleCodeChange}
        spellCheck={false}
        readOnly={readOnly}
        rows={20}
      />

      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠</span>
          {error}
        </div>
      )}

      {!readOnly && (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            取消
          </button>
          <button
            type="button"
            className={styles.applyButton}
            onClick={handleApply}
            disabled={!!error}
          >
            应用
          </button>
        </div>
      )}
    </div>
  );
}

export default EntityCodeEditor;
