/**
 * Version Diff Visualization Component
 * 
 * Displays differences between two versions with add/remove/modify highlighting.
 */

'use client';

import React, { useMemo } from 'react';
import * as jsondiffpatch from 'jsondiffpatch';
import styles from './VersionDiff.module.css';

// Configure jsondiffpatch
const diffpatcher = jsondiffpatch.create({
  objectHash: (obj: object): string => {
    const o = obj as Record<string, unknown>;
    return String(o.id || o.name || JSON.stringify(obj));
  },
  arrays: {
    detectMove: true,
    includeValueOnMove: false,
  },
});

export interface VersionDiffProps {
  oldVersion: unknown;
  newVersion: unknown;
  /** Show side-by-side view */
  sideBySide?: boolean;
  /** Custom labels */
  labels?: {
    old?: string;
    new?: string;
    added?: string;
    removed?: string;
    modified?: string;
    unchanged?: string;
  };
}

export function VersionDiff({
  oldVersion,
  newVersion,
  sideBySide = true,
  labels = {
    old: '旧版本',
    new: '新版本',
    added: '新增',
    removed: '删除',
    modified: '修改',
    unchanged: '未变更',
  },
}: VersionDiffProps) {
  const diff = useMemo(() => {
    if (!oldVersion && !newVersion) return null;
    return diffpatcher.diff(oldVersion, newVersion);
  }, [oldVersion, newVersion]);

  if (!diff) {
    return (
      <div className={styles.noDiff}>
        <span className={styles.icon}>✅</span>
        <span>{labels.unchanged}</span>
      </div>
    );
  }

  const renderDiff = (delta: jsondiffpatch.Delta, depth = 0): React.ReactNode => {
    if (!delta) return null;
    const entries = Object.entries(delta as object);
    
    return entries.map(([key, value], index) => {
      // Skip internal jsondiffpatch keys
      if (key === '_t') return null;

      const type = Array.isArray(value) ? value[0] : typeof value;
      const isAdded = type === 0 || type === '+';
      const isRemoved = type === 1 || type === '-';
      const isModified = type === 2 || type === '#';
      const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);

      let content: React.ReactNode;
      
      if (isObject) {
        // Recursively render nested object
        content = renderDiff(value as jsondiffpatch.Delta, depth + 1);
      } else if (isAdded) {
        const addedValue = Array.isArray(value) ? value[1] : value;
        content = (
          <span className={styles.addedValue}>
            {typeof addedValue === 'object' 
              ? JSON.stringify(addedValue) 
              : String(addedValue)}
          </span>
        );
      } else if (isRemoved) {
        const removedValue = Array.isArray(value) ? value[1] : value;
        content = (
          <span className={styles.removedValue}>
            {typeof removedValue === 'object' 
              ? JSON.stringify(removedValue) 
              : String(removedValue)}
          </span>
        );
      } else if (isModified) {
        const [oldVal, newVal] = Array.isArray(value) ? value : [value, value];
        content = (
          <span className={styles.modified}>
            <span className={styles.removedValue}>{String(oldVal)}</span>
            {' → '}
            <span className={styles.addedValue}>{String(newVal)}</span>
          </span>
        );
      } else {
        content = <span>{String(value)}</span>;
      }

      const getLabel = () => {
        if (isAdded) return labels.added;
        if (isRemoved) return labels.removed;
        if (isModified) return labels.modified;
        return '';
      };

      return (
        <div
          key={`${key}-${index}`}
          className={`${styles.diffItem} ${isAdded ? styles.added : ''} ${isRemoved ? styles.removed : ''} ${isModified ? styles.modified : ''}`}
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          <span className={styles.key}>{key}</span>
          {getLabel() && <span className={styles.badge}>{getLabel()}</span>}
          <span className={styles.value}>{content}</span>
        </div>
      );
    });
  };

  if (sideBySide) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerCell}>{labels.old}</div>
          <div className={styles.headerCell}>{labels.new}</div>
        </div>
        <div className={styles.content}>
          <div className={styles.pane}>
            <pre className={styles.code}>
              {JSON.stringify(oldVersion, null, 2)}
            </pre>
          </div>
          <div className={styles.pane}>
            <pre className={styles.code}>
              {JSON.stringify(newVersion, null, 2)}
            </pre>
          </div>
        </div>
        <div className={styles.diffSection}>
          {renderDiff(diff)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.diffSection}>
        {renderDiff(diff)}
      </div>
    </div>
  );
}

/**
 * Hook for computing diff between two versions
 */
export function useVersionDiff(oldVersion: unknown, newVersion: unknown) {
  return useMemo(() => {
    if (!oldVersion && !newVersion) return null;
    return diffpatcher.diff(oldVersion, newVersion);
  }, [oldVersion, newVersion]);
}

/**
 * Check if there are any changes
 */
export function hasChanges(diff: jsondiffpatch.Delta | null | undefined): boolean {
  if (!diff) return false;
  return Object.keys(diff).some(key => key !== '_t');
}
