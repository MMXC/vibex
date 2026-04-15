'use client';

/**
 * ImportPanel — 画布数据导入面板
 * E3-U3: 导入面板
 */

import React, { useCallback, useState, useRef } from 'react';
import { parseFile, roundTripTest, type CanvasExportData } from '@/services/import/ImportService';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { canvasLogger } from '@/lib/canvas/canvasLogger';
import styles from './ImportPanel.module.css';

interface ImportPanelProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

type ImportStatus = 'idle' | 'parsing' | 'success' | 'error';

export function ImportPanel({ open, onClose }: ImportPanelProps) {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [importData, setImportData] = useState<CanvasExportData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setContextNodes = useContextStore((s) => s.setContextNodes);
  const setFlowNodes = useFlowStore((s) => s.setFlowNodes);
  const setComponentNodes = useComponentStore((s) => s.setComponentNodes);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('parsing');
    setErrorMessage(null);
    setImportData(null);
    setRoundTripResult(null);

    try {
      const content = await file.text();
      const result = parseFile(content, file.name);

      if (!result.success || !result.data) {
        setStatus('error');
        setErrorMessage(result.error?.message ?? '导入失败');
        canvasLogger.default.error('[ImportPanel] parse error:', result.error);
        return;
      }

      setImportData(result.data);

      // Run round-trip test
      const rtResult = roundTripTest(result.data);
      setRoundTripResult(rtResult);

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : '读取文件失败');
      canvasLogger.default.error('[ImportPanel] file read error:', err);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleConfirmImport = useCallback(() => {
    if (!importData) return;

    try {
      if (importData.contextNodes) setContextNodes(importData.contextNodes);
      if (importData.flowNodes) setFlowNodes(importData.flowNodes);
      if (importData.componentNodes) setComponentNodes(importData.componentNodes);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '导入数据失败');
    }
  }, [importData, setContextNodes, setFlowNodes, setComponentNodes, onClose]);

  if (!open) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="导入画布">
        <div className={styles.header}>
          <h2 className={styles.title}>📥 导入画布</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* File input */}
          <div className={styles.uploadSection}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileSelect}
              className={styles.fileInput}
              id="import-file-input"
              data-testid="import-file-input"
            />
            <label htmlFor="import-file-input" className={styles.uploadBtn}>
              <span>📁</span>
              {status === 'parsing' ? '解析中...' : '选择 JSON 或 YAML 文件'}
            </label>
            <p className={styles.hint}>支持 .json 和 .yaml/.yml 格式</p>
          </div>

          {/* Parsing status */}
          {status === 'parsing' && (
            <div className={styles.parsingState}>
              <span className={styles.spinner} aria-hidden="true" />
              <span>正在解析文件...</span>
            </div>
          )}

          {/* Error */}
          {status === 'error' && errorMessage && (
            <div className={styles.errorBanner} role="alert">
              <span>❌ {errorMessage}</span>
            </div>
          )}

          {/* Success preview */}
          {status === 'success' && importData && (
            <div className={styles.preview}>
              <div className={styles.previewHeader}>
                <span className={styles.previewTitle}>📋 导入预览</span>
                <span className={styles.version}>v{importData.version}</span>
              </div>

              <div className={styles.stats}>
                <span>◇ 上下文: {importData.contextNodes?.length ?? 0}</span>
                <span>→ 流程: {importData.flowNodes?.length ?? 0}</span>
                <span>▣ 组件: {importData.componentNodes?.length ?? 0}</span>
              </div>

              {/* Round-trip status */}
              {roundTripResult !== null && (
                <div className={`${styles.roundTrip} ${roundTripResult ? styles.roundTripOk : styles.roundTripFail}`}>
                  <span>{roundTripResult ? '✓' : '⚠️'}</span>
                  <span>
                    {roundTripResult
                      ? 'Round-trip 验证通过'
                      : 'Round-trip 验证失败，数据可能不完全兼容'}
                  </span>
                </div>
              )}

              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleConfirmImport}
                data-testid="confirm-import-btn"
              >
                ✅ 确认导入
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
