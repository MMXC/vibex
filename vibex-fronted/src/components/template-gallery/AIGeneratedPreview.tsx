/**
 * AIGeneratedPreview — S91 E1: AI Template Generation
 *
 * Shows the AI-generated template result as a component tree.
 * Allows collapsing/expanding individual components and saving.
 */

'use client';

import React, { useState } from 'react';
import type { GeneratedComponent, TemplateGenerationResult } from '@/stores/aiGenerateStore';
import styles from './AIGeneratedPreview.module.css';

interface AIGeneratedPreviewProps {
  result: TemplateGenerationResult;
  onClose: () => void;
}

const COMPONENT_ICONS: Record<string, string> = {
  header: '📌', hero: '🎯', features: '⭐', testimonials: '💬',
  pricing: '💰', cta: '🚀', footer: '📋', navigation: '🧭',
  grid: '⊞', text: '📝', image: '🖼️', button: '🔘',
  form: '📋', carousel: '🎠', default: '📦',
};

function ComponentNode({ comp, depth = 0 }: { comp: GeneratedComponent; depth?: number }) {
  const [expanded, setExpanded] = useState(depth === 0);
  const icon = COMPONENT_ICONS[comp.type] ?? COMPONENT_ICONS.default;
  const hasChildren = comp.children && comp.children.length > 0;

  return (
    <div className={styles.node} style={{ marginLeft: depth * 16 }}>
      <div className={styles.nodeHeader} onClick={() => hasChildren && setExpanded(!expanded)}>
        <span className={styles.nodeIcon}>{icon}</span>
        <span className={styles.nodeType}>{comp.type}</span>
        {comp.props?.title && (
          <span className={styles.nodeTitle}>{String(comp.props.title)}</span>
        )}
        {hasChildren && (
          <span className={styles.expandBtn}>{expanded ? '▼' : '▶'}</span>
        )}
      </div>
      {expanded && hasChildren && (
        <div className={styles.nodeChildren}>
          {comp.children!.map((child, i) => (
            <ComponentNode key={i} comp={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AIGeneratedPreview({ result, onClose }: AIGeneratedPreviewProps) {
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(true);

  const handleSave = async () => {
    setSaveLoading(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/projects/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.name,
          description: result.description,
          tags: result.tags,
          contentJson: JSON.stringify({ components: result.components }),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? '保存失败');
      }
      const data = await res.json() as { projectId: string };
      window.location.href = `/canvas/${data.projectId}`;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className={styles.preview}>
      <div className={styles.resultHeader}>
        <div>
          <h3 className={styles.resultName}>{result.name}</h3>
          <p className={styles.resultDesc}>{result.description}</p>
          <div className={styles.tags}>
            {result.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
            <span className={styles.category}>{result.category}</span>
          </div>
        </div>
      </div>

      <div className={styles.treeHeader}>
        <span className={styles.treeTitle}>组件树</span>
        <button
          className={styles.expandAllBtn}
          onClick={() => setAllExpanded(!allExpanded)}
        >
          {allExpanded ? '全部折叠' : '全部展开'}
        </button>
      </div>

      <div className={styles.tree}>
        {result.components.map((comp, i) => (
          <ComponentNode key={i} comp={comp} />
        ))}
      </div>

      {saveError && <p className={styles.saveError}>{saveError}</p>}

      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={onClose}>取消</button>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saveLoading}
        >
          {saveLoading ? '💾 保存中...' : '💾 保存到我的模板'}
        </button>
      </div>
    </div>
  );
}
