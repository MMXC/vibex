'use client';

/**
 * PRD Editor — E05 S05.2 PRD → Canvas 自动生成
 *
 * PRD Editor 页面，支持：
 * - 创建 PRDDocument（chapters → steps → requirements）
 * - "生成 Canvas" 按钮 → 调用 POST /api/v1/canvas/from-prd
 * - 预览 Canvas 映射结果
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/auth-token';
import { generateCanvasFromPRD, type PRDDocument, type PRDChapter, type PRDStep, type PRDRequirement } from '@/services/api/modules/prd-canvas';
import styles from './prd-editor.module.css';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function PRDEditorPage() {
  const router = useRouter();
  const [title, setTitle] = useState('我的 PRD 文档');
  const [chapters, setChapters] = useState<PRDChapter[]>([]);
  const [generating, setGenerating] = useState(false);
  const [canvasResult, setCanvasResult] = useState<Awaited<ReturnType<typeof generateCanvasFromPRD>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Auth check
  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  if (!token) {
    router.push('/auth');
    return null;
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Add chapter
  const addChapter = () => {
    setChapters(prev => [
      ...prev,
      { id: generateId('ch'), title: `章节 ${prev.length + 1}`, steps: [] },
    ]);
  };

  // Remove chapter
  const removeChapter = (chId: string) => {
    setChapters(prev => prev.filter(c => c.id !== chId));
  };

  // Update chapter title
  const updateChapterTitle = (chId: string, title: string) => {
    setChapters(prev => prev.map(c => c.id === chId ? { ...c, title } : c));
  };

  // Add step to chapter
  const addStep = (chId: string) => {
    setChapters(prev => prev.map(c => {
      if (c.id !== chId) return c;
      return {
        ...c,
        steps: [...c.steps, { id: generateId('step'), title: `步骤 ${c.steps.length + 1}`, requirements: [] }],
      };
    }));
  };

  // Remove step
  const removeStep = (chId: string, stepId: string) => {
    setChapters(prev => prev.map(c => {
      if (c.id !== chId) return c;
      return { ...c, steps: c.steps.filter(s => s.id !== stepId) };
    }));
  };

  // Update step title
  const updateStepTitle = (chId: string, stepId: string, title: string) => {
    setChapters(prev => prev.map(c => {
      if (c.id !== chId) return c;
      return { ...c, steps: c.steps.map(s => s.id === stepId ? { ...s, title } : s) };
    }));
  };

  // Add requirement to step
  const addRequirement = (chId: string, stepId: string) => {
    setChapters(prev => prev.map(c => {
      if (c.id !== chId) return c;
      return {
        ...c,
        steps: c.steps.map(s => {
          if (s.id !== stepId) return s;
          return {
            ...s,
            requirements: [
              ...s.requirements,
              { id: generateId('req'), text: `需求 ${s.requirements.length + 1}`, priority: 'P1' },
            ],
          };
        }),
      };
    }));
  };

  // Remove requirement
  const removeRequirement = (chId: string, stepId: string, reqId: string) => {
    setChapters(prev => prev.map(c => {
      if (c.id !== chId) return c;
      return {
        ...c,
        steps: c.steps.map(s => {
          if (s.id !== stepId) return s;
          return { ...s, requirements: s.requirements.filter(r => r.id !== reqId) };
        }),
      };
    }));
  };

  // Update requirement
  const updateRequirement = (chId: string, stepId: string, reqId: string, field: 'text' | 'priority', value: string) => {
    setChapters(prev => prev.map(c => {
      if (c.id !== chId) return c;
      return {
        ...c,
        steps: c.steps.map(s => {
          if (s.id !== stepId) return s;
          return {
            ...s,
            requirements: s.requirements.map(r =>
              r.id === reqId ? { ...r, [field]: value } : r
            ),
          };
        }),
      };
    }));
  };

  // Generate Canvas
  const handleGenerateCanvas = async () => {
    if (chapters.length === 0) {
      showToast('请先添加至少一个章节');
      return;
    }
    const totalSteps = chapters.reduce((sum, ch) => sum + ch.steps.length, 0);
    if (totalSteps === 0) {
      showToast('请先添加至少一个步骤');
      return;
    }

    setGenerating(true);
    setError(null);
    setCanvasResult(null);

    try {
      const prd: PRDDocument = {
        id: generateId('prd'),
        title,
        chapters,
      };

      const result = await generateCanvasFromPRD(prd);
      setCanvasResult(result);
      showToast('Canvas 已生成');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '生成失败';
      setError(msg);
      showToast(`错误: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarTitle}>
          <input
            className={styles.titleInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="PRD 标题"
          />
        </div>
        <div className={styles.toolbarActions}>
          {/* E05 S05.2: 生成 Canvas 按钮 */}
          <button
            className={styles.generateBtn}
            onClick={handleGenerateCanvas}
            disabled={generating}
            data-testid="generate-canvas-btn"
          >
            {generating ? '生成中...' : '🎯 生成 Canvas'}
          </button>
          <button className={styles.addChapterBtn} onClick={addChapter} type="button">
            + 添加章节
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className={styles.statsBar}>
        <span>📑 {chapters.length} 章节</span>
        <span>📋 {chapters.reduce((s, c) => s + c.steps.length, 0)} 步骤</span>
        <span>✅ {chapters.reduce((s, c) => s + c.steps.reduce((ss, st) => ss + st.requirements.length, 0), 0)} 需求</span>
      </div>

      {/* Editor */}
      <div className={styles.editor}>
        {chapters.length === 0 && (
          <div className={styles.emptyHint}>
            <p>点击「添加章节」开始构建 PRD 文档</p>
          </div>
        )}

        {chapters.map((chapter, chIdx) => (
          <div key={chapter.id} className={styles.chapter}>
            <div className={styles.chapterHeader}>
              <input
                className={styles.chapterTitle}
                value={chapter.title}
                onChange={e => updateChapterTitle(chapter.id, e.target.value)}
                placeholder={`章节 ${chIdx + 1} 标题`}
              />
              <button
                className={styles.iconBtnDanger}
                onClick={() => removeChapter(chapter.id)}
                title="删除章节"
                type="button"
              >
                ✕
              </button>
            </div>

            {chapter.steps.map((step, stIdx) => (
              <div key={step.id} className={styles.step}>
                <div className={styles.stepHeader}>
                  <input
                    className={styles.stepTitle}
                    value={step.title}
                    onChange={e => updateStepTitle(chapter.id, step.id, e.target.value)}
                    placeholder={`步骤 ${stIdx + 1} 标题`}
                  />
                  <button
                    className={styles.iconBtnDanger}
                    onClick={() => removeStep(chapter.id, step.id)}
                    title="删除步骤"
                    type="button"
                  >
                    ✕
                  </button>
                </div>

                {step.requirements.map((req, reqIdx) => (
                  <div key={req.id} className={styles.requirement}>
                    <select
                      className={styles.prioritySelect}
                      value={req.priority}
                      onChange={e => updateRequirement(chapter.id, step.id, req.id, 'priority', e.target.value)}
                    >
                      <option value="P0">P0</option>
                      <option value="P1">P1</option>
                      <option value="P2">P2</option>
                    </select>
                    <input
                      className={styles.reqInput}
                      value={req.text}
                      onChange={e => updateRequirement(chapter.id, step.id, req.id, 'text', e.target.value)}
                      placeholder={`需求 ${reqIdx + 1}`}
                    />
                    <button
                      className={styles.iconBtnDanger}
                      onClick={() => removeRequirement(chapter.id, step.id, req.id)}
                      title="删除需求"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  className={styles.addReqBtn}
                  onClick={() => addRequirement(chapter.id, step.id)}
                  type="button"
                >
                  + 添加需求
                </button>
              </div>
            ))}

            <button
              className={styles.addStepBtn}
              onClick={() => addStep(chapter.id)}
              type="button"
            >
              + 添加步骤
            </button>
          </div>
        ))}
      </div>

      {/* Canvas Result Preview */}
      {canvasResult && (
        <div className={styles.result}>
          <h3 className={styles.resultTitle}>🎉 Canvas 生成结果</h3>
          <div className={styles.resultStats}>
            <span>左栏（章节）: {canvasResult.nodes.leftPanel.length}</span>
            <span>中栏（步骤）: {canvasResult.nodes.centerPanel.length}</span>
            <span>右栏（需求）: {canvasResult.nodes.rightPanel.length}</span>
            <span>边: {canvasResult.edges.length}</span>
          </div>
          <div className={styles.nodeList}>
            <div className={styles.nodeGroup}>
              <h4>📂 左栏（Context）</h4>
              {canvasResult.nodes.leftPanel.map(n => (
                <div key={n.id} className={styles.nodeItem}>{n.label}</div>
              ))}
            </div>
            <div className={styles.nodeGroup}>
              <h4>🔄 中栏（Flow）</h4>
              {canvasResult.nodes.centerPanel.map(n => (
                <div key={n.id} className={styles.nodeItem}>{n.label}</div>
              ))}
            </div>
            <div className={styles.nodeGroup}>
              <h4>🎨 右栏（Design）</h4>
              {canvasResult.nodes.rightPanel.map(n => (
                <div key={n.id} className={styles.nodeItem}>
                  <span className={`${styles.priority} ${styles[n.metadata.priority ?? 'P1']}`}>
                    {n.metadata.priority}
                  </span>
                  {n.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={styles.errorBox}>
          ⚠️ {error}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={styles.toast}>{toast}</div>
      )}
    </div>
  );
}
