/**
 * FlowTab - 流程文档导出 Tab
 */
// @ts-nocheck


'use client';

import React, { useState } from 'react';
import { useDeliveryStore, type BusinessFlow, type ExportFormat } from '@/stores/deliveryStore';
import { GitBranch } from 'lucide-react';
import styles from './delivery.module.css';

interface FlowCardProps {
  flow: BusinessFlow;
}

function FlowCard({ flow }: FlowCardProps) {
  const { exportItem, isExporting, exportProgress } = useDeliveryStore();
  const [showPreview, setShowPreview] = useState(false);
  
  const isCurrentExport = exportProgress?.type === 'flow' && exportProgress.id === flow.id;
  
  const handleExport = async (format: ExportFormat) => {
    await exportItem('flow', flow.id, format);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          <GitBranch size={20} />
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardTitle}>{flow.name}</h3>
          <p className={styles.cardDesc}>{flow.contextName}</p>
        </div>
      </div>
      
      <div className={styles.cardMeta}>
        <span>步骤: {flow.stepCount}</span>
        <span>决策点: {flow.decisionCount}</span>
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
          onClick={() => handleExport('bpmn')}
          disabled={isExporting}
        >
          BPMN JSON
        </button>
        <button 
          className={styles.exportBtn}
          onClick={() => handleExport('markdown')}
          disabled={isExporting}
        >
          Markdown
        </button>
      </div>
      
      {showPreview && (
        <div className={styles.preview}>
          <pre className={styles.previewCode}>
{`# ${flow.name}

## 基本信息
- 所属上下文: ${flow.contextName}
- 步骤数: ${flow.stepCount}
- 决策点数: ${flow.decisionCount}

## 流程说明
1. 步骤1
2. 步骤2
...
`}
          </pre>
        </div>
      )}
    </div>
  );
}

export function FlowTab() {
  const { flows, searchQuery, exportAll, isExporting } = useDeliveryStore();
  
  const filteredFlows = flows.filter(
    (flow) =>
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.contextName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (flows.length === 0) {
    return (
      <div className={styles.empty}>
        <GitBranch size={48} className={styles.emptyIcon} />
        <p>暂无流程文档</p>
        <p className={styles.emptyHint}>请先在流程编辑器中创建流程</p>
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <span className={styles.count}>{filteredFlows.length} 个流程</span>
        <button 
          className={styles.exportAllBtn}
          onClick={() => exportAll('flows')}
          disabled={isExporting}
        >
          导出全部流程为 ZIP
        </button>
      </div>
      
      <div className={styles.cardList}>
        {filteredFlows.map((flow) => (
          <FlowCard key={flow.id} flow={flow} />
        ))}
      </div>
    </div>
  );
}
