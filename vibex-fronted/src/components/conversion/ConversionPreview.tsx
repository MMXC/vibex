/**
 * Conversion Preview Component
 * 需求转换预览组件
 */

'use client';

import { useState, useMemo } from 'react';
import { convertGitHubToRequirement, convertFigmaToRequirement } from '@/services/conversion/import-conversion';
import type { GitHubRepoInfo, PackageJsonInfo, DirectoryTreeNode } from '@/services/github/github-import';
import type { FigmaFileData } from '@/services/figma/figma-import';
import styles from './ConversionPreview.module.css';

interface ConversionPreviewProps {
  source: 'github' | 'figma';
  repoInfo?: GitHubRepoInfo | null;
  packageJson?: PackageJsonInfo | null;
  figmaData?: FigmaFileData | null;
  readme?: string;
  onApply?: (requirementText: string) => void;
  className?: string;
}

export function ConversionPreview({
  source,
  repoInfo,
  packageJson,
  figmaData,
  readme,
  onApply,
  className,
}: ConversionPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [editedText, setEditedText] = useState('');

  const conversionResult = useMemo(() => {
    if (source === 'github' && repoInfo) {
      return convertGitHubToRequirement(repoInfo, {
        includeReadme: true,
        includeDependencies: true,
        includeDirectoryStructure: true,
      });
    }
    if (source === 'figma' && figmaData) {
      return convertFigmaToRequirement(figmaData, {
        includeComponents: true,
      });
    }
    return null;
  }, [source, repoInfo, figmaData]);

  const handleApply = () => {
    const text = activeTab === 'edit' ? editedText : conversionResult?.requirementText;
    if (text && onApply) {
      onApply(text);
    }
  };

  if (!conversionResult) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <span className={styles.title}>📝 需求转换预览</span>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'preview' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            预览
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'edit' ? styles.tabActive : ''}`}
            onClick={() => {
              setActiveTab('edit');
              setEditedText(conversionResult.requirementText);
            }}
          >
            编辑
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'preview' ? (
          <div className={styles.preview}>
            <pre className={styles.text}>
              {conversionResult.requirementText}
            </pre>
          </div>
        ) : (
          <textarea
            className={styles.editor}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder="编辑需求文本..."
          />
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.metadata}>
          <span className={styles.badge}>
            来源: {source === 'github' ? '🐙 GitHub' : '🎨 Figma'}
          </span>
          <span className={styles.badge}>
            功能点: {conversionResult.metadata.features.length}
          </span>
        </div>
        <button className={styles.applyButton} onClick={handleApply}>
          ✅ 应用需求
        </button>
      </div>
    </div>
  );
}

export default ConversionPreview;
