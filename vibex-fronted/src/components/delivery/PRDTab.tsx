/**
 * PRDTab - PRD 导出 Tab
 *
 * E4-U2: Replaced hardcoded "电商系统" with generatePRDMarkdown from delivery store data.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useDeliveryStore } from '@/stores/deliveryStore';
import { generatePRDMarkdown } from '@/lib/delivery/PRDGenerator';
import { FileText } from 'lucide-react';
import styles from './delivery.module.css';

export function PRDTab() {
  const { contexts, flows, components, exportItem, isExporting, exportProgress } =
    useDeliveryStore();
  const [showFullPRD, setShowFullPRD] = useState(false);

  const isCurrentExport = exportProgress?.type === 'prd';
  const isExportingPRD = isCurrentExport && exportProgress?.status === 'exporting';

  // Build PRD sections from store data (E4-U2)
  const prdSections = useMemo(() => {
    const md = generatePRDMarkdown({
      projectName: 'Vibex DDD 项目',
      domain: '领域驱动设计',
      goal: '通过 DDS 画布构建完整的系统架构文档',
      contexts,
      flows,
      components,
    });

    // Parse markdown into sections
    const sections = [
      {
        id: 'overview',
        title: '项目概述',
        preview: 'Vibex DDD 项目 / 领域驱动设计 / 系统架构文档',
      },
    ];

    if (contexts.length > 0) {
      sections.push({
        id: 'contexts',
        title: '限界上下文',
        preview: `共 ${contexts.length} 个限界上下文`,
      });
    }

    if (flows.length > 0) {
      sections.push({
        id: 'flows',
        title: '业务流程',
        preview: `共 ${flows.length} 个业务流程`,
      });
    }

    if (components.length > 0) {
      sections.push({
        id: 'components',
        title: '组件架构',
        preview: `共 ${components.length} 个组件`,
      });
    }

    return { sections, fullMarkdown: md };
  }, [contexts, flows, components]);

  const handleExport = async (format: 'markdown' | 'pdf') => {
    await exportItem('prd', 'prd-main', format);
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <span className={styles.count}>PRD 大纲</span>
        <div className={styles.prdExportActions}>
          <button
            className={styles.exportBtn}
            onClick={() => handleExport('markdown')}
            disabled={isExporting}
          >
            Markdown
          </button>
          <button
            className={styles.exportBtn}
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
          >
            PDF
          </button>
          <button className={styles.exportBtn}>
            飞书文档
          </button>
        </div>
      </div>

      {isExportingPRD && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${exportProgress?.progress || 0}%` }}
          />
        </div>
      )}

      <div className={styles.prdOutline}>
        {prdSections.sections.map((section) => (
          <div key={section.id} className={styles.prdSection}>
            <h3 className={styles.prdSectionTitle}>
              <FileText size={16} />
              {section.title}
            </h3>
            {showFullPRD && (
              <pre className={styles.prdSectionContent}>{section.preview}</pre>
            )}
          </div>
        ))}
      </div>

      <button
        className={styles.previewBtn}
        onClick={() => setShowFullPRD(!showFullPRD)}
        style={{ marginTop: '16px' }}
      >
        {showFullPRD ? '收起完整 PRD' : '展开完整 PRD'}
      </button>
    </div>
  );
}
