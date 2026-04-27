/**
 * Version History Page
 * 
 * Displays the history of versions/snapshots for the current project.
 * Allows users to view, compare, and restore previous versions.
 * 
 * E15-P004: 
 * - U1: SnapshotSelector — two dropdowns for arbitrary snapshot compare
 * - U4: restore with mandatory backup snapshot before jump
 */

'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { VersionPreview, VersionInfo } from '@/components/version-preview/VersionPreview';
import { VersionDiff } from '@/components/version-diff/VersionDiff';
import styles from './version-history.module.css';

/**
 * VersionHistoryPage — E7: projectId=null boundary + diff view
 *
 * E7 goal: 修复 version history 的 projectId=null 边界
 * - projectId !== null: 显示版本历史列表
 * - projectId === null: 显示引导 UI "请先选择项目"
 */
export default function VersionHistoryPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  const history = useConfirmationStore(state => state.history);
  const jumpToSnapshot = useConfirmationStore(state => state.jumpToSnapshot);
  const setSnapshotNote = useConfirmationStore(state => state.setSnapshotNote);
  const currentStep = useConfirmationStore(state => state.currentStep);
  const addCustomSnapshot = useConfirmationStore(state => state.addCustomSnapshot);
  
  const [selectedVersion, setSelectedVersion] = useState<VersionInfo | null>(null);
  // E15-P004 U1: two selectors for arbitrary snapshot compare
  const [compareSelectA, setCompareSelectA] = useState<string>('');
  const [compareSelectB, setCompareSelectB] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  // E15-P004 U1: diff modal uses { idxA, idxB } directly
  const [compareIndices, setCompareIndices] = useState<{ idxA: number; idxB: number } | null>(null);

  // Convert store history to VersionInfo format
  const versions: VersionInfo[] = history.map((snapshot, index) => ({
    id: String(index), // use numeric index string as id
    version: history.length - index,
    timestamp: snapshot.timestamp,
    description: snapshot.note || snapshot.requirementText?.slice(0, 50) || `版本 ${history.length - index}`,
  })).reverse();

  const currentVersion = versions[versions.length - 1] || null;

  const handleViewVersion = (version: VersionInfo) => {
    setSelectedVersion(version);
    setShowPreview(true);
  };

  // E15-P004 U1: compare any two snapshots via dropdown selectors
  const handleCompare = () => {
    if (!compareSelectA || !compareSelectB) return;
    if (compareSelectA === compareSelectB) {
      alert('请选择两个不同的快照进行对比');
      return;
    }
    const idxA = parseInt(compareSelectA);
    const idxB = parseInt(compareSelectB);
    if (isNaN(idxA) || isNaN(idxB)) return;
    setCompareIndices({ idxA, idxB });
    setShowDiff(true);
  };

  // E15-P004 U4: restore with mandatory backup snapshot
  const handleRestore = async (version: VersionInfo) => {
    const restoreIndex = history.length - version.version;
    if (restoreIndex < 0 || restoreIndex >= history.length) return;

    // U4: 还原前强制创建 backup snapshot
    addCustomSnapshot({
      note: `自动备份 (还原前)`,
      timestamp: Date.now(),
    });

    jumpToSnapshot(restoreIndex);
  };

  const handleSaveNote = async (versionId: string, note: string) => {
    const index = parseInt(versionId);
    if (!isNaN(index)) {
      setSnapshotNote(index, note);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // E7: projectId=null boundary — show guide to create/select a project first
  if (projectId === null) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2>请先选择项目</h2>
          <p>在画布中创建或打开项目后，再从项目设置查看版本历史</p>
          <a href="/projects/new" className={styles.emptyAction}>
            创建新项目
          </a>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2>暂无版本历史</h2>
          <p>在确认流程中进行操作后，系统会自动保存版本快照</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>版本历史</h1>
        <p className={styles.subtitle}>
          共 {versions.length} 个版本 • 当前阶段: {currentStep}
        </p>
      </div>

      {/* E15-P004 U1: SnapshotSelector — two dropdowns for arbitrary compare */}
      <div className={styles.snapshotSelector}>
        <label htmlFor="compare-a">对比快照 A:</label>
        <select
          id="compare-a"
          value={compareSelectA}
          onChange={(e) => setCompareSelectA(e.target.value)}
          className={styles.selector}
        >
          <option value="">— 选择快照 A —</option>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.version} · {(v.description || '').slice(0, 30)}
            </option>
          ))}
        </select>
        <span className={styles.selectorVs}>VS</span>
        <label htmlFor="compare-b">对比快照 B:</label>
        <select
          id="compare-b"
          value={compareSelectB}
          onChange={(e) => setCompareSelectB(e.target.value)}
          className={styles.selector}
        >
          <option value="">— 选择快照 B —</option>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.version} · {(v.description || '').slice(0, 30)}
            </option>
          ))}
        </select>
        <button
          className={styles.compareButton}
          onClick={handleCompare}
          disabled={!compareSelectA || !compareSelectB}
        >
          对比
        </button>
      </div>

      <div className={styles.list}>
        {versions.map((version) => (
          <div 
            key={version.id} 
            className={`${styles.item} ${version.id === currentVersion?.id ? styles.current : ''}`}
          >
            <div className={styles.itemMain}>
              <div className={styles.versionBadge}>
                v{version.version}
              </div>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>
                  {version.description}
                </div>
                <div className={styles.itemMeta}>
                  {formatTimestamp(version.timestamp)}
                </div>
              </div>
            </div>
            <div className={styles.itemActions}>
              <button 
                className={styles.actionButton}
                onClick={() => handleViewVersion(version)}
              >
                预览
              </button>
              <button 
                className={styles.actionButton}
                onClick={() => {
                  // E15-P004 U1: pre-select this version in selector A for quick compare
                  setCompareSelectA(version.id);
                }}
              >
                对比
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Version Preview Modal */}
      <VersionPreview
        open={showPreview}
        version={selectedVersion}
        currentVersion={currentVersion || undefined}
        onClose={() => setShowPreview(false)}
        onRestore={handleRestore}
        onCompare={(v) => {
          setShowPreview(false);
          // E15-P004 U1: set selector A to the version from preview
          setCompareSelectA(v.id);
        }}
        onSaveNote={handleSaveNote}
      />

      {/* E15-P004 U1: Version Diff Modal — arbitrary two-snapshot compare */}
      {showDiff && compareIndices && (
        <div className={styles.diffModal}>
          <div className={styles.diffModalContent}>
            <div className={styles.diffModalHeader}>
              <h2>版本对比</h2>
              <button onClick={() => setShowDiff(false)}>关闭</button>
            </div>
            <div className={styles.diffContainer}>
              <VersionDiff
                oldVersion={history[compareIndices.idxA] || {}}
                newVersion={history[compareIndices.idxB] || {}}
                sideBySide={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}