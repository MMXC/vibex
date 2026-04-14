/**
 * BoundedContextCard — Bounded Context Card Component
 *
 * Renders a bounded-context card with:
 * - Context name & description
 * - Responsibility description
 * - Relations visualization (upstream/downstream/anticorruption/shared-kernel)
 *
 * Epic 1: F7
 */

'use client';

import React, { memo } from 'react';
import type { BoundedContextCard as BoundedContextCardType } from '@/types/dds';
import styles from './BoundedContextCard.module.css';

export interface BoundedContextCardProps {
  card: BoundedContextCardType;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

const RELATION_CLASS: Record<string, string> = {
  upstream: styles.relationUpstream,
  downstream: styles.relationDownstream,
  anticorruption: styles.relationAnticorruption,
  'shared-kernel': styles.relationSharedKernel,
};

const RELATION_LABEL: Record<string, string> = {
  upstream: '上游',
  downstream: '下游',
  anticorruption: '防腐层',
  'shared-kernel': '共享内核',
};

const RELATION_ARROW: Record<string, string> = {
  upstream: '→',
  downstream: '←',
  anticorruption: '⇄',
  'shared-kernel': '◈',
};

export const BoundedContextCard = memo(function BoundedContextCard({
  card,
  selected = false,
  onSelect,
}: BoundedContextCardProps) {
  const handleClick = () => {
    onSelect?.(card.id);
  };

  return (
    <div
      className={`${styles.container} ${selected ? styles.selected : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Bounded Context: ${card.name}`}
    >
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.badge}>限界上下文</span>
      </div>
      <h3 className={styles.title}>{card.name}</h3>

      {/* Body */}
      <div className={styles.body}>
        {card.description && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>描述</span>
            <span className={styles.fieldValue}>{card.description}</span>
          </div>
        )}

        {card.responsibility && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>职责</span>
            <span className={styles.fieldValue}>{card.responsibility}</span>
          </div>
        )}
      </div>

      {/* Relations */}
      {card.relations && card.relations.length > 0 && (
        <div className={styles.relationsSection}>
          <p className={styles.relationsTitle}>关联关系</p>
          <ul className={styles.relationsList}>
            {card.relations.map((rel, i) => (
              <li
                key={i}
                className={`${styles.relationTag} ${RELATION_CLASS[rel.type] ?? ''}`}
                title={rel.label ?? rel.type}
              >
                <span className={styles.relationArrow}>
                  {RELATION_ARROW[rel.type] ?? '○'}
                </span>
                <span>{rel.label ?? RELATION_LABEL[rel.type] ?? rel.type}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
