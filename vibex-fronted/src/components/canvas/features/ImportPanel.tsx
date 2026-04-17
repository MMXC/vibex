'use client';

/**
 * ImportPanel — 画布数据导入面板
 * E3-U3: 导入面板
 */

import React, { useCallback, useState, useRef } from 'react';
import { parseFile, roundTripTest, type CanvasExportData } from '@/services/import/ImportService';
import { importFromImage, type ImportedComponent } from '@/services/figma/image-import';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { usePrototypeStore } from '@/stores/prototypeStore';
import { canvasLogger } from '@/lib/canvas/canvasLogger';
import styles from './ImportPanel.module.css';

interface ImportPanelProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

type ImportStatus = 'idle' | 'parsing' | 'success' | 'error';
type PanelTab = 'canvas' | 'image';

export function ImportPanel({ open, onClose }: ImportPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('canvas');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [importData, setImportData] = useState<CanvasExportData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setContextNodes = useContextStore((s) => s.setContextNodes);
  const setFlowNodes = useFlowStore((s) => s.setFlowNodes);
  const setComponentNodes = useComponentStore((s) => s.setComponentNodes);
  const addNode = usePrototypeStore((s) => s.addNode);

  // Image tab state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<ImportedComponent[] | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

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

  // Image tab handlers
  const handleImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('仅支持 PNG/JPG/JPEG 格式');
      return;
    }
    setImageError(null);
    setImageFile(file);
    setImageResult(null);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleImageAnalyze = useCallback(async () => {
    if (!imageFile) return;
    setImageLoading(true);
    setImageError(null);
    setImageResult(null);
    try {
      const result = await importFromImage(imageFile);
      if (result.success && result.components) {
        setImageResult(result.components);
      } else {
        setImageError(result.error ?? '识别失败');
      }
    } catch {
      setImageError('识别失败，请重试');
    } finally {
      setImageLoading(false);
    }
  }, [imageFile]);

  const handleImageImport = useCallback(() => {
    if (!imageResult) return;
    const centerX = 200 + Math.random() * 200;
    const centerY = 200 + Math.random() * 200;
    imageResult.forEach((comp, i) => {
      addNode(
        { id: `imported_${Date.now()}_${i}`, type: comp.type as any, props: comp.props ?? {} } as any,
        { x: centerX + i * 120, y: centerY }
      );
    });
    setImageFile(null);
    setImagePreview(null);
    setImageResult(null);
    onClose();
  }, [imageResult, addNode, onClose]);

  const handleImageClear = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setImageResult(null);
    setImageError(null);
  }, []);

  if (!open) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="导入画布">
        <div className={styles.header}>
          <h2 className={styles.title}>📥 导入</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'canvas' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('canvas')}
          >
            画布文件
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'image' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('image')}
          >
            图片识别
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'canvas' && (
            <>
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
            </>
          )}

          {activeTab === 'image' && (
            <div className={styles.imageTab}>
              <div className={styles.imageUpload}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageFileChange}
                  className={styles.fileInput}
                  id="image-upload"
                />
                <label htmlFor="image-upload" className={styles.uploadLabel}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="预览" className={styles.imagePreview} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <p>点击上传图片</p>
                      <p className={styles.uploadHint}>支持 PNG / JPG / JPEG，小于 10MB</p>
                    </div>
                  )}
                </label>
              </div>

              {imageError && (
                <div className={styles.imageError}>
                  <span>{imageError}</span>
                  <button type="button" onClick={() => setImageError(null)}>✕</button>
                </div>
              )}

              {imageResult && imageResult.length > 0 && (
                <div className={styles.imageResult}>
                  <p className={styles.resultTitle}>识别到 {imageResult.length} 个组件：</p>
                  <div className={styles.componentList}>
                    {imageResult.map((c, i) => (
                      <div key={i} className={styles.componentItem}>
                        <span className={styles.componentType}>{c.type}</span>
                        <span className={styles.componentName}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.imageActions}>
                {imagePreview && !imageResult && (
                  <button
                    type="button"
                    className={styles.analyzeBtn}
                    onClick={handleImageAnalyze}
                    disabled={imageLoading}
                  >
                    {imageLoading ? '正在识别...' : '开始识别'}
                  </button>
                )}
                {imageResult && imageResult.length > 0 && (
                  <button type="button" className={styles.importBtn} onClick={handleImageImport}>
                    确认导入 {imageResult.length} 个组件
                  </button>
                )}
                {imagePreview && (
                  <button type="button" className={styles.clearBtn} onClick={handleImageClear}>
                    清除
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
