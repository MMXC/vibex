/**
 * Flow Code Editor Component
 * 编辑 JSON 配置，应用、撤销
 */
// @ts-nocheck


'use client';

import { useState, useCallback, useEffect } from 'react';
import styles from './FlowCodeEditor.module.css';

export interface FlowConfig {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    x: number;
    y: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

export interface FlowCodeEditorProps {
  initialConfig: FlowConfig;
  onApply?: (config: FlowConfig) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export function FlowCodeEditor({ initialConfig, onApply, onCancel, readOnly = false }: FlowCodeEditorProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    setCode(JSON.stringify(initialConfig, null, 2));
    setHistory([JSON.stringify(initialConfig, null, 2)]);
    setHistoryIndex(0);
  }, [initialConfig]);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    setError(null);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newCode);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleApply = useCallback(() => {
    try {
      const parsed = JSON.parse(code) as FlowConfig;
      setError(null);
      onApply?.(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON 解析错误');
    }
  }, [code, onApply]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setCode(history[newIndex]);
      setHistoryIndex(newIndex);
      setError(null);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setCode(history[newIndex]);
      setHistoryIndex(newIndex);
      setError(null);
    }
  }, [history, historyIndex]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <span className={styles.title}>流程配置 (JSON)</span>
        <div className={styles.actions}>
          <button type="button" className={styles.toolButton} onClick={handleUndo} disabled={historyIndex <= 0 || readOnly} title="撤销">⟲</button>
          <button type="button" className={styles.toolButton} onClick={handleRedo} disabled={historyIndex >= history.length - 1 || readOnly} title="重做">⟳</button>
        </div>
      </div>
      <textarea className={`${styles.editor} ${error ? styles.error : ''}`} value={code} onChange={handleCodeChange} spellCheck={false} readOnly={readOnly} rows={20} />
      {error && <div className={styles.errorMessage}>{error}</div>}
      {!readOnly && (
        <div className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>取消</button>
          <button type="button" className={styles.applyButton} onClick={handleApply} disabled={!!error}>应用</button>
        </div>
      )}
    </div>
  );
}

export default FlowCodeEditor;
