import React, { useState } from 'react';
import styles from './ConversationBranchSelector.module.css';

export interface Branch {
  id: string;
  name: string;
  messageCount: number;
  isActive?: boolean;
}

export interface ConversationBranchSelectorProps {
  branches: Branch[];
  activeBranchId?: string;
  onBranchSelect?: (branchId: string) => void;
  onBranchCreate?: (name: string) => void;
  onBranchDelete?: (branchId: string) => void;
}

export default function ConversationBranchSelector({
  branches,
  activeBranchId,
  onBranchSelect,
  onBranchCreate,
  onBranchDelete,
}: ConversationBranchSelectorProps) {
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  const handleCreateBranch = () => {
    if (newBranchName.trim() && onBranchCreate) {
      onBranchCreate(newBranchName.trim());
      setNewBranchName('');
      setShowNewBranch(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>对话分支</span>
        <button
          className={styles.addBtn}
          onClick={() => setShowNewBranch(!showNewBranch)}
          title="新建分支"
        >
          +
        </button>
      </div>

      {showNewBranch && (
        <div className={styles.newBranchForm}>
          <input
            type="text"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="分支名称"
            className={styles.input}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateBranch();
              if (e.key === 'Escape') setShowNewBranch(false);
            }}
          />
          <button onClick={handleCreateBranch} className={styles.confirmBtn}>
            ✓
          </button>
        </div>
      )}

      <div className={styles.branchList}>
        {branches.map((branch) => (
          <div
            key={branch.id}
            className={`${styles.branchItem} ${
              branch.id === activeBranchId ? styles.active : ''
            }`}
            onClick={() => onBranchSelect?.(branch.id)}
          >
            <span className={styles.branchIcon}>⑂</span>
            <span className={styles.branchName}>{branch.name}</span>
            <span className={styles.branchCount}>{branch.messageCount}</span>
            {branches.length > 1 && (
              <button
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onBranchDelete?.(branch.id);
                }}
                title="删除分支"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
