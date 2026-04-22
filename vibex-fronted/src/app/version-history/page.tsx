/**
 * Version History Page
 * 
 * Displays the history of versions/snapshots for the current project.
 * Allows users to view, compare, and restore previous versions.
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
  
  const [selectedVersion, setSelectedVersion] = useState<VersionInfo | null>(null);
  const [compareVersion, setCompareVersion] = useState<VersionInfo | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  // Convert store history to VersionInfo format
  const versions: VersionInfo[] = history.map((snapshot, index) => ({
    id: `snapshot-${index}`,
    version: history.length - index,
    timestamp: snapshot.timestamp,
    description: snapshot.note || snapshot.requirementText?.slice(0, 50) || `版本 ${history.length - index}`,
  })).reverse();

  const currentVersion = versions[versions.length - 1] || null;

  const handleViewVersion = (version: VersionInfo) => {
    setSelectedVersion(version);
    setShowPreview(true);
  };

  const handleCompare = (version: VersionInfo) => {
    setCompareVersion(version);
    setShowDiff(true);
  };

  const handleRestore = async (version: VersionInfo) => {
    const index = history.length - version.version;
    if (index >= 0 && index < history.length) {
      jumpToSnapshot(index);
    }
  };

  const handleSaveNote = async (versionId: string, note: string) => {
    const index = parseInt(versionId.replace('snapshot-', ''));
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
                onClick={() => handleCompare(version)}
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
          handleCompare(v);
        }}
        onSaveNote={handleSaveNote}
      />

      {/* Version Diff Modal */}
      {showDiff && compareVersion && (
        <div className={styles.diffModal}>
          <div className={styles.diffModalContent}>
            <div className={styles.diffModalHeader}>
              <h2>版本对比</h2>
              <button onClick={() => setShowDiff(false)}>关闭</button>
            </div>
            <div className={styles.diffContainer}>
              <VersionDiff
                oldVersion={history[history.length - compareVersion.version] || {}}
                newVersion={history[history.length - 1] || {}}
                sideBySide={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
