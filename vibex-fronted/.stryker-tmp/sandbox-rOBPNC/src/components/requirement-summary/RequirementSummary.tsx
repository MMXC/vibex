/**
 * Requirement Summary Component
 * 需求摘要确认组件
 */
// @ts-nocheck


'use client';

import { useMemo } from 'react';
import styles from './RequirementSummary.module.css';

export interface SummarySection {
  id: string;
  title: string;
  content: string;
}

export interface RequirementSummaryProps {
  requirementText: string;
  sections?: SummarySection[];
  onConfirm?: () => void;
  onModify?: () => void;
  confirmLabel?: string;
  modifyLabel?: string;
  isConfirming?: boolean;
}

export function RequirementSummary({
  requirementText,
  sections = [],
  onConfirm,
  onModify,
  confirmLabel = '确认',
  modifyLabel = '修改',
  isConfirming = false,
}: RequirementSummaryProps) {
  const wordCount = useMemo(() => {
    return requirementText.trim().split(/\s+/).length;
  }, [requirementText]);

  const charCount = useMemo(() => {
    return requirementText.length;
  }, [requirementText]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>需求摘要</h2>
        <span className={styles.meta}>
          {wordCount} 字 / {charCount} 字符
        </span>
      </div>

      <div className={styles.content}>
        <div className={styles.mainText}>
          <h3 className={styles.sectionTitle}>需求描述</h3>
          <p className={styles.text}>{requirementText}</p>
        </div>

        {sections.length > 0 && (
          <div className={styles.sections}>
            {sections.map((section) => (
              <div key={section.id} className={styles.section}>
                <h4 className={styles.subsectionTitle}>{section.title}</h4>
                <p className={styles.sectionContent}>{section.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.modifyButton}
          onClick={onModify}
        >
          {modifyLabel}
        </button>
        <button
          type="button"
          className={styles.confirmButton}
          onClick={onConfirm}
          disabled={isConfirming}
        >
          {isConfirming ? '确认中...' : confirmLabel}
        </button>
      </div>
    </div>
  );
}

export default RequirementSummary;
