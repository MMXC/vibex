/**
 * ContextTab - 限界上下文导出 Tab
 */
// @ts-nocheck


'use client';

import React, { useState } from 'react';
import { useDeliveryStore, type BoundedContext, type ExportFormat } from '@/stores/deliveryStore';
import { Package } from 'lucide-react';
import styles from './delivery.module.css';

interface ContextCardProps {
  context: BoundedContext;
}

function ContextCard({ context }: ContextCardProps) {
  const { exportItem, isExporting, exportProgress } = useDeliveryStore();
  const [showPreview, setShowPreview] = useState(false);
  
  const isCurrentExport = exportProgress?.type === 'context' && exportProgress.id === context.id;
  
  const handleExport = async (format: ExportFormat) => {
    await exportItem('context', context.id, format);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          <Package size={20} />
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardTitle}>{context.name}</h3>
          <p className={styles.cardDesc}>{context.description}</p>
        </div>
      </div>
      
      <div className={styles.cardMeta}>
        <span>节点: {context.nodeCount}</span>
        <span>关系: {context.relationCount}</span>
      </div>
      
      {isCurrentExport && exportProgress.status === 'exporting' && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${exportProgress.progress}%` }}
          />
        </div>
      )}
      
      <div className={styles.cardActions}>
        <button 
          className={styles.previewBtn}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? '收起' : '预览'}
        </button>
        <button 
          className={styles.exportBtn}
          onClick={() => handleExport('json')}
          disabled={isExporting}
        >
          JSON
        </button>
        <button 
          className={styles.exportBtn}
          onClick={() => handleExport('markdown')}
          disabled={isExporting}
        >
          Markdown
        </button>
        <button 
          className={styles.exportBtn}
          onClick={() => handleExport('plantuml')}
          disabled={isExporting}
        >
          PlantUML
        </button>
      </div>
      
      {showPreview && (
        <div className={styles.preview}>
          <pre className={styles.previewCode}>
{`{
  "id": "${context.id}",
  "name": "${context.name}",
  "description": "${context.description}",
  "nodes": ${context.nodeCount},
  "relationships": ${context.relationCount}
}`}
          </pre>
        </div>
      )}
    </div>
  );
}

export function ContextTab() {
  const { contexts, searchQuery, exportAll, isExporting } = useDeliveryStore();
  
  const filteredContexts = contexts.filter(
    (ctx) =>
      ctx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ctx.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (contexts.length === 0) {
    return (
      <div className={styles.empty}>
        <Package size={48} className={styles.emptyIcon} />
        <p>暂无限界上下文</p>
        <p className={styles.emptyHint}>请先在画布中创建上下文</p>
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <span className={styles.count}>{filteredContexts.length} 个上下文</span>
        <button 
          className={styles.exportAllBtn}
          onClick={() => exportAll('contexts')}
          disabled={isExporting}
        >
          导出全部上下文为 ZIP
        </button>
      </div>
      
      <div className={styles.cardList}>
        {filteredContexts.map((context) => (
          <ContextCard key={context.id} context={context} />
        ))}
      </div>
    </div>
  );
}
