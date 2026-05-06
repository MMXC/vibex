/**
 * ProtoEditor — Main Drag-and-Drop Layout Editor
 *
 * Layout: [RoutingDrawer] [ComponentPanel] [ProtoFlowCanvas] [ProtoAttrPanel]
 *
 * Epic1: E1-U1 ~ E1-U4 integration
 * Epic2: Mock data tab (built into ProtoAttrPanel)
 * Epic3: Routing drawer (RoutingDrawer component)
 * Epic4: Export (inline modal)
 */

'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePrototypeStore } from '@/stores/prototypeStore';
import { ComponentPanel } from './ComponentPanel';
import { ProtoFlowCanvas } from './ProtoFlowCanvas';
import { ProtoAttrPanel } from './ProtoAttrPanel';
import { RoutingDrawer } from './RoutingDrawer';
import styles from './ProtoEditor.module.css';

// ==================== Props ====================

export interface ProtoEditorProps {
  className?: string;
}

// ==================== Export Modal ====================

function ExportModal({
  exportData,
  onClose,
}: {
  exportData: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.querySelector<HTMLTextAreaElement>('.exportTextarea');
      if (ta) {
        ta.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [exportData]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>导出原型 JSON</span>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.modalHint}>
            导出的 JSON 包含 version 2.0 格式，含节点数据、Mock数据和页面路由
          </p>
          {copied && (
            <div className={styles.modalSuccess}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              已复制到剪贴板
            </div>
          )}
          <textarea
            className={styles.exportTextarea}
            defaultValue={exportData}
            readOnly
          />
        </div>
        <div className={styles.modalFooter}>
          <button className={`${styles.modalBtn} ${styles.modalBtnSecondary}`} onClick={onClose}>
            关闭
          </button>
          <button className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={handleCopy}>
            复制 JSON
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Import Modal ====================

function ImportModal({
  onImport,
  onClose,
}: {
  onImport: (data: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = useCallback(() => {
    if (!value.trim()) {
      setError('请输入 JSON 数据');
      return;
    }
    try {
      const parsed = JSON.parse(value);
      if (!parsed.version) {
        setError('无效格式：缺少 version 字段');
        return;
      }
      onImport(value);
      onClose();
    } catch {
      setError('JSON 解析失败，请检查格式');
    }
  }, [value, onImport, onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>导入原型 JSON</span>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.modalHint}>粘贴导出的 JSON 数据，导入后将替换当前画布</p>
          {error && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 6,
              color: '#f87171',
              fontSize: 13,
              marginBottom: 12,
            }}>
              {error}
            </div>
          )}
          <textarea
            className={styles.exportTextarea}
            placeholder='{"version":"2.0",...}'
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(null); }}
            style={{ height: 260 }}
          />
        </div>
        <div className={styles.modalFooter}>
          <button className={`${styles.modalBtn} ${styles.modalBtnSecondary}`} onClick={onClose}>
            取消
          </button>
          <button className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={handleImport}>
            导入
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Main Editor ====================

export const ProtoEditor = memo(function ProtoEditor({
  className = '',
}: ProtoEditorProps) {
  const { getExportData, loadFromExport, nodes, clearCanvas } = usePrototypeStore();
  const breakpoint = usePrototypeStore((s) => s.breakpoint);
  const setBreakpoint = usePrototypeStore((s) => s.setBreakpoint);

  const [showRoutingDrawer, setShowRoutingDrawer] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exportData, setExportData] = useState('');

  // S-P2.3: Loading indicator for > 200 nodes
  const loadStartRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (nodes.length > 200) {
      setIsLoading(true);
      loadStartRef.current = Date.now();
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    setIsLoading(false);
  }, [nodes.length]);

  const handleExport = useCallback(() => {
    const data = getExportData();
    setExportData(JSON.stringify(data, null, 2));
    setShowExport(true);
  }, [getExportData]);

  const handleImport = useCallback(
    (raw: string) => {
      try {
        const data = JSON.parse(raw);
        loadFromExport(data);
      } catch {
        // error handled in modal
      }
    },
    [loadFromExport]
  );

  const handleClear = useCallback(() => {
    if (confirm('确定清空画布？此操作不可撤销')) {
      clearCanvas();
    }
  }, [clearCanvas]);

  return (
    <div className={`${styles.page} ${className}`}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/prototype" className={styles.backBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            原型
          </Link>
          <span className={styles.headerTitle}>拖拽布局编辑器</span>
            {isLoading ? (
              <span style={{
                fontSize: 11,
                color: 'rgba(99,102,241,0.8)',
                background: 'rgba(99,102,241,0.1)',
                padding: '2px 7px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#818cf8', animation: 'pulse 1s infinite' }} />
                加载中 {nodes.length}
              </span>
            ) : (
              <span style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.04)',
                padding: '2px 7px',
                borderRadius: 10,
              }}>
                {nodes.length} 节点
              </span>
            )}
        </div>

        <div className={styles.headerSpacer} />

        <div className={styles.headerActions}>
          {/* === E3: DeviceSwitcher === */}
          <div className={styles.deviceSwitcher} role="toolbar" aria-label="设备切换">
            <button
              type="button"
              className={`${styles.deviceBtn} ${breakpoint === '375' ? styles.deviceBtnActive : ''}`}
              onClick={() => setBreakpoint('375')}
              aria-label="手机"
              aria-pressed={breakpoint === '375'}
              title="375px — 手机"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2" />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.deviceBtn} ${breakpoint === '768' ? styles.deviceBtnActive : ''}`}
              onClick={() => setBreakpoint('768')}
              aria-label="平板"
              aria-pressed={breakpoint === '768'}
              title="768px — 平板"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2" />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.deviceBtn} ${breakpoint === '1024' ? styles.deviceBtnActive : ''}`}
              onClick={() => setBreakpoint('1024')}
              aria-label="桌面"
              aria-pressed={breakpoint === '1024'}
              title="1024px — 桌面"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </button>
          </div>
          {/* === E3: END === */}

          {/* Routing drawer toggle */}
          <button
            className={`${styles.iconBtn} ${showRoutingDrawer ? styles.active : ''}`}
            onClick={() => setShowRoutingDrawer(!showRoutingDrawer)}
            title={showRoutingDrawer ? '隐藏页面列表' : '显示页面列表'}
            style={{
              background: showRoutingDrawer ? 'rgba(99,102,241,0.15)' : undefined,
              borderColor: showRoutingDrawer ? 'rgba(99,102,241,0.3)' : undefined,
              color: showRoutingDrawer ? '#818cf8' : undefined,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </button>

          {/* Import */}
          <button
            className={styles.actionBtn}
            onClick={() => setShowImport(true)}
            title="导入 JSON"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            导入
          </button>

          {/* Clear */}
          <button
            className={styles.actionBtn}
            onClick={handleClear}
            title="清空画布"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            清空
          </button>

          {/* Export */}
          <button
            className={styles.exportBtn}
            onClick={handleExport}
            title="导出 JSON"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出
          </button>
        </div>
      </header>

      {/* Body */}
      <div className={styles.body}>
        {/* Routing Drawer (left) */}
        {showRoutingDrawer && (
          <RoutingDrawer />
        )}

        {/* Component Panel (left) */}
        <ComponentPanel className={styles.protoComponentPanel} />

        {/* Canvas (center) */}
        <ProtoFlowCanvas className={styles.protoFlowCanvas} />

        {/* Attr Panel (right) */}
        <ProtoAttrPanel className={styles.protoAttrPanel} />
      </div>

      {/* Export Modal */}
      {showExport && (
        <ExportModal
          exportData={exportData}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportModal
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
});
