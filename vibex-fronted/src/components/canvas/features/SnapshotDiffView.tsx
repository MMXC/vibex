'use client';
import React from 'react';
import type { SnapshotDiffResult } from '@/lib/canvas/snapshotDiff';
import styles from './SnapshotDiffView.module.css';

interface SnapshotDiffViewProps {
  diff: SnapshotDiffResult;
  labelA: string;
  labelB: string;
  onBack: () => void;
}

export function SnapshotDiffView({ diff, labelA, labelB, onBack }: SnapshotDiffViewProps) {
  const { contextDiff, flowDiff, componentDiff, summary } = diff;
  const totalChanges =
    summary.contextsAdded + summary.contextsRemoved +
    summary.flowsAdded + summary.flowsRemoved +
    summary.componentsAdded + summary.componentsRemoved;

  const allEmpty = totalChanges === 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={onBack} aria-label="返回列表">
          ← 返回
        </button>
        <span className={styles.title}>📊 对比结果</span>
      </div>

      {/* Comparison header */}
      <div className={styles.compareHeader}>
        <div className={styles.snapLabel}>
          <span className={styles.snapMarker}>A</span>
          <span>{labelA}</span>
        </div>
        <div className={styles.snapLabel}>
          <span className={styles.snapMarker}>B</span>
          <span>{labelB}</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className={styles.summary}>
        <span className={styles.stat}>
          <span className={styles.added}>+{summary.contextsAdded}</span>
          <span className={styles.removed}>-{summary.contextsRemoved}</span>
          限界上下文
        </span>
        <span className={styles.stat}>
          <span className={styles.added}>+{summary.flowsAdded}</span>
          <span className={styles.removed}>-{summary.flowsRemoved}</span>
          业务流程
        </span>
        <span className={styles.stat}>
          <span className={styles.added}>+{summary.componentsAdded}</span>
          <span className={styles.removed}>-{summary.componentsRemoved}</span>
          组件
        </span>
      </div>

      {/* No changes */}
      {allEmpty && (
        <div className={styles.noChanges}>
          <span>✓</span>
          <span>两个版本完全相同</span>
        </div>
      )}

      {/* Tree diff sections */}
      {!allEmpty && (
        <div className={styles.diffSections}>
          {/* Contexts */}
          {contextDiff.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>◇ 限界上下文 ({contextDiff.length})</h4>
              <div className={styles.diffList}>
                {contextDiff.map((d) => (
                  <div key={d.id ?? d.name} className={`${styles.diffItem} ${styles[d.type]}`}>
                    <span className={styles.diffIcon}>
                      {d.type === 'added' ? '+' : d.type === 'removed' ? '−' : '~'}
                    </span>
                    <span className={styles.diffName}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flows */}
          {flowDiff.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>→ 业务流程 ({flowDiff.length})</h4>
              <div className={styles.diffList}>
                {flowDiff.map((d) => (
                  <div key={d.id ?? d.name} className={`${styles.diffItem} ${styles[d.type]}`}>
                    <span className={styles.diffIcon}>
                      {d.type === 'added' ? '+' : d.type === 'removed' ? '−' : '~'}
                    </span>
                    <span className={styles.diffName}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Components */}
          {componentDiff.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>▣ 组件 ({componentDiff.length})</h4>
              <div className={styles.diffList}>
                {componentDiff.map((d) => (
                  <div key={d.id ?? d.name} className={`${styles.diffItem} ${styles[d.type]}`}>
                    <span className={styles.diffIcon}>
                      {d.type === 'added' ? '+' : d.type === 'removed' ? '−' : '~'}
                    </span>
                    <span className={styles.diffName}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
