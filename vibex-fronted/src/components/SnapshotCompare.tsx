/**
 * SnapshotCompare — 快照对比组件
 *
 * Epic 5 实现: S5.5 (快照对比基础)
 * 显示两个快照之间的差异
 */
'use client';

import { useState, useMemo } from 'react';
import { computeSnapshotDiff, type CanvasSnapshot, type SnapshotDiff } from '@/hooks/useCanvasSnapshot';
import styles from './SnapshotCompare.module.css';

interface SnapshotCompareProps {
  /** 快照 A */
  snapshotA: CanvasSnapshot;
  /** 快照 B */
  snapshotB: CanvasSnapshot;
  /** 自定义类名 */
  className?: string;
}

/** 差异视图模式 */
type DiffViewMode = 'summary' | 'detailed' | 'json';

/**
 * 快照对比组件
 *
 * @example
 * ```tsx
 * <SnapshotCompare snapshotA={snapshot1} snapshotB={snapshot2} />
 * ```
 */
export function SnapshotCompare({
  snapshotA,
  snapshotB,
  className = '',
}: SnapshotCompareProps) {
  const [viewMode, setViewMode] = useState<DiffViewMode>('summary');
  const [showDetails, setShowDetails] = useState(false);

  // 计算差异
  const diffs = useMemo(
    () => computeSnapshotDiff(snapshotA, snapshotB),
    [snapshotA, snapshotB]
  );

  // JSON 差异
  const jsonDiff = useMemo(() => {
    const before = JSON.stringify(snapshotA.data, null, 2);
    const after = JSON.stringify(snapshotB.data, null, 2);
    return { before, after };
  }, [snapshotA, snapshotB]);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取差异类型标签
  const getDiffTypeLabel = (type: SnapshotDiff['type']) => {
    switch (type) {
      case 'count':
        return '数量变化';
      case 'phase':
        return '阶段变更';
      case 'content':
        return '内容变更';
      default:
        return '变更';
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* 头部：快照信息 */}
      <div className={styles.header}>
        <div className={styles.snapshotInfo}>
          <span className={styles.snapshotLabel}>快照 A</span>
          <span className={styles.snapshotName}>{snapshotA.name}</span>
          <span className={styles.snapshotTime}>
            {formatTime(snapshotA.timestamp)}
          </span>
        </div>
        <div className={styles.diffIcon}>
          <span>⇄</span>
        </div>
        <div className={styles.snapshotInfo}>
          <span className={styles.snapshotLabel}>快照 B</span>
          <span className={styles.snapshotName}>{snapshotB.name}</span>
          <span className={styles.snapshotTime}>
            {formatTime(snapshotB.timestamp)}
          </span>
        </div>
      </div>

      {/* 视图模式切换 */}
      <div className={styles.viewModes}>
        <button
          className={`${styles.modeBtn} ${viewMode === 'summary' ? styles.active : ''}`}
          onClick={() => setViewMode('summary')}
        >
          摘要
        </button>
        <button
          className={`${styles.modeBtn} ${viewMode === 'detailed' ? styles.active : ''}`}
          onClick={() => setViewMode('detailed')}
        >
          详细
        </button>
        <button
          className={`${styles.modeBtn} ${viewMode === 'json' ? styles.active : ''}`}
          onClick={() => setViewMode('json')}
        >
          JSON
        </button>
      </div>

      {/* 差异内容 */}
      <div className={styles.content}>
        {viewMode === 'summary' && (
          <div className={styles.summaryView}>
            {diffs.length === 0 ? (
              <div className={styles.noDiff}>
                <span className={styles.noDiffIcon}>✓</span>
                <p>两个快照完全相同</p>
              </div>
            ) : (
              <ul className={styles.diffList}>
                {diffs.map((diff, index) => (
                  <li key={index} className={styles.diffItem}>
                    <span className={styles.diffType}>
                      {getDiffTypeLabel(diff.type)}
                    </span>
                    <span className={styles.diffPath}>{diff.path}</span>
                    <span className={styles.diffValues}>
                      <span className={styles.valueBefore}>{String(diff.before)}</span>
                      <span className={styles.arrow}>→</span>
                      <span className={styles.valueAfter}>{String(diff.after)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {viewMode === 'detailed' && (
          <div className={styles.detailedView}>
            <button
              className={styles.toggleBtn}
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? '隐藏详情' : '显示详情'}
            </button>
            {showDetails && (
              <div className={styles.detailsGrid}>
                <div className={styles.detailColumn}>
                  <h4>上下文节点</h4>
                  <p>
                    {snapshotA.data.contextNodes.length} → {snapshotB.data.contextNodes.length}
                  </p>
                </div>
                <div className={styles.detailColumn}>
                  <h4>流程节点</h4>
                  <p>
                    {snapshotA.data.flowNodes.length} → {snapshotB.data.flowNodes.length}
                  </p>
                </div>
                <div className={styles.detailColumn}>
                  <h4>组件节点</h4>
                  <p>
                    {snapshotA.data.componentNodes.length} → {snapshotB.data.componentNodes.length}
                  </p>
                </div>
                <div className={styles.detailColumn}>
                  <h4>当前阶段</h4>
                  <p>
                    {snapshotA.data.phase} → {snapshotB.data.phase}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'json' && (
          <div className={styles.jsonView}>
            <div className={styles.jsonColumn}>
              <h4>快照 A</h4>
              <pre className={styles.jsonCode}>{jsonDiff.before}</pre>
            </div>
            <div className={styles.jsonColumn}>
              <h4>快照 B</h4>
              <pre className={styles.jsonCode}>{jsonDiff.after}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SnapshotCompare;
