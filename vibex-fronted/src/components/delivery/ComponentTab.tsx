/**
 * ComponentTab - 组件清单导出 Tab
 */

'use client';

import React, { useState } from 'react';
import { useDeliveryStore, type Component, type ExportFormat } from '@/stores/deliveryStore';
import { Code2 } from 'lucide-react';
import styles from './delivery.module.css';

interface ComponentCardProps {
  component: Component;
}

function ComponentCard({ component }: ComponentCardProps) {
  const { exportItem, isExporting, exportProgress } = useDeliveryStore();
  const [showPreview, setShowPreview] = useState(false);
  
  const isCurrentExport = exportProgress?.type === 'component' && exportProgress.id === component.id;
  
  const handleExport = async (format: ExportFormat) => {
    await exportItem('component', component.id, format);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          <Code2 size={20} />
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardTitle}>{component.name}</h3>
          <span className={styles.typeBadge}>{component.type}</span>
        </div>
      </div>
      
      <p className={styles.cardDesc}>{component.description}</p>
      
      <div className={styles.cardMeta}>
        <span>引用: {component.referenceCount}</span>
        <span>方法: {component.methodCount}</span>
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
          onClick={() => handleExport('typescript')}
          disabled={isExporting}
        >
          TypeScript
        </button>
        <button 
          className={styles.exportBtn}
          onClick={() => handleExport('schema')}
          disabled={isExporting}
        >
          JSON Schema
        </button>
      </div>
      
      {showPreview && (
        <div className={styles.preview}>
          <pre className={styles.previewCode}>
{`// ${component.name}
// Type: ${component.type}
// Description: ${component.description}

interface ${component.name.replace(/\s/g, '')} {
  // TODO: Add interface members
  id: string;
}

// Export format: TypeScript interface`}
          </pre>
        </div>
      )}
    </div>
  );
}

export function ComponentTab() {
  const { components, searchQuery, typeFilter, exportAll, isExporting } = useDeliveryStore();
  
  const filteredComponents = components.filter(
    (comp) =>
      (comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (typeFilter === 'all' || comp.type === typeFilter)
  );

  if (components.length === 0) {
    return (
      <div className={styles.empty}>
        <Code2 size={48} className={styles.emptyIcon} />
        <p>暂无组件清单</p>
        <p className={styles.emptyHint}>请先在组件编辑器中创建组件</p>
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <span className={styles.count}>{filteredComponents.length} 个组件</span>
        <button 
          className={styles.exportAllBtn}
          onClick={() => exportAll('components')}
          disabled={isExporting}
        >
          导出全部组件为 ZIP
        </button>
      </div>
      
      <div className={styles.cardList}>
        {filteredComponents.map((comp) => (
          <ComponentCard key={comp.id} component={comp} />
        ))}
      </div>
    </div>
  );
}
