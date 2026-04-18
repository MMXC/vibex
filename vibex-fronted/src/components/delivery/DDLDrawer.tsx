/**
 * DDLDrawer — Sprint5 T7: DDL Tab View
 * Generates and displays DDL SQL from API chapter endpoints.
 */

'use client';

import React, { useMemo, useState } from 'react';
import { useDDSCanvasStore } from '@/stores/dds';
import type { APIEndpointCard } from '@/types/dds';
import { generateDDL, type DDLTable } from '@/lib/delivery/DDLGenerator';
import { formatDDL, downloadDDL } from '@/lib/delivery/formatDDL';
import { Database } from 'lucide-react';
import styles from './delivery.module.css';

export function DDLDrawer() {
  const apiCards = useDDSCanvasStore((s) => s.chapters.api?.cards ?? []) as APIEndpointCard[];
  const [previewSQL, setPreviewSQL] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const tables: DDLTable[] = useMemo(() => generateDDL(apiCards), [apiCards]);

  const sqlPreview = useMemo(() => formatDDL(tables, 'mysql'), [tables]);

  const handlePreview = () => {
    setPreviewSQL(sqlPreview);
    setShowPreview(true);
  };

  const handleDownload = () => {
    downloadDDL(tables, 'vibex-schema.sql');
  };

  if (apiCards.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Database size={32} style={{ opacity: 0.3 }} />
        <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px' }}>
          暂无 API 端点
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
          在 DDS 画布的 API 章节添加端点后，可在此生成 DDL
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      {/* Header */}
      <div className={styles.ddlHeader}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>
            {tables.length} 个数据表
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
            从 {apiCards.length} 个 API 端点自动推断
          </div>
        </div>
        <div className={styles.ddlActions}>
          <button
            type="button"
            className={styles.ddlBtn}
            onClick={handlePreview}
          >
            预览 SQL
          </button>
          <button
            type="button"
            className={`${styles.ddlBtn} ${styles.ddlBtnPrimary}`}
            onClick={handleDownload}
          >
            下载 .sql
          </button>
        </div>
      </div>

      {/* Table list */}
      <div className={styles.tableList}>
        {tables.map((table) => (
          <div key={table.tableName} className={styles.ddlTable}>
            <div className={styles.ddlTableName}>
              <Database size={14} />
              <code>{table.tableName}</code>
            </div>
            <div className={styles.ddlColumnCount}>
              {table.columns.length} 列
            </div>
          </div>
        ))}
      </div>

      {/* SQL Preview modal */}
      {showPreview && (
        <div
          className={styles.previewOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="DDL SQL 预览"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false); }}
        >
          <div className={styles.previewModal}>
            <div className={styles.previewHeader}>
              <h3>DDL SQL 预览</h3>
              <button
                type="button"
                className={styles.previewClose}
                onClick={() => setShowPreview(false)}
              >
                ×
              </button>
            </div>
            <pre className={styles.sqlPreview}>
              <code>{sqlPreview}</code>
            </pre>
            <div className={styles.previewFooter}>
              <button
                type="button"
                className={`${styles.ddlBtn} ${styles.ddlBtnPrimary}`}
                onClick={() => { handleDownload(); setShowPreview(false); }}
              >
                下载 .sql
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
