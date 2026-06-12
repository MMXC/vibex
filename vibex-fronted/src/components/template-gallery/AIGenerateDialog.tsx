/**
 * AIGenerateDialog — S91 E1: AI Template Generation
 *
 * Modal dialog for AI-powered template generation.
 * Users enter a natural language prompt and see the generated result.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useAIGenerateStore, pollJobUntilDone } from '@/stores/aiGenerateStore';
import { AIGeneratedPreview } from './AIGeneratedPreview';
import styles from './AIGenerateDialog.module.css';

interface AIGenerateDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
}

export function AIGenerateDialog({ open, onClose }: AIGenerateDialogProps) {
  const [prompt, setPrompt] = useState('');
  const { isGenerating, setGenerating, activeJob, setActiveJob, addToHistory, setError, error } =
    useAIGenerateStore();

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || trimmed.length < 5) {
      setError('请输入至少5个字符的描述');
      return;
    }
    setError(null);
    setGenerating(true);

    try {
      const res = await fetch('/api/templates/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = await res.json() as { ok: boolean; jobId?: string; error?: string };
      if (!data.ok || !data.jobId) {
        throw new Error(data.error ?? '创建生成任务失败');
      }

      const job = await pollJobUntilDone(
        data.jobId,
        (updatedJob) => setActiveJob(updatedJob),
        30000
      );
      addToHistory(job);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setGenerating(false);
    }
  }, [prompt, setGenerating, setActiveJob, addToHistory, setError]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  if (!open) return null;

  const status = activeJob?.status;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal aria-label="AI 模板生成">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2 className={styles.title}>✨ AI 生成模板</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">×</button>
        </header>

        <div className={styles.body}>
          {!activeJob || status === 'pending' ? (
            <>
              <p className={styles.hint}>
                描述你想要创建的页面，例如：
                <em>&ldquo;一个电商落地页，包含导航、产品展示、客户评价和底部 CTA&rdquo;</em>
              </p>
              <textarea
                className={styles.textarea}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入页面描述..."
                rows={5}
                maxLength={2000}
                disabled={isGenerating}
                aria-label="页面描述"
              />
              <div className={styles.charCount}>{prompt.length}/2000</div>
              {error && <p className={styles.error}>{error}</p>}
              <button
                className={styles.generateBtn}
                onClick={handleGenerate}
                disabled={isGenerating || prompt.trim().length < 5}
              >
                {isGenerating ? '🤖 生成中...' : '✨ 开始生成'}
              </button>
              {isGenerating && (
                <p className={styles.waiting}>AI 正在生成中，预计 10 秒内完成...</p>
              )}
            </>
          ) : status === 'processing' ? (
            <div className={styles.processing}>
              <div className={styles.spinner} />
              <p>AI 正在生成中，请稍候...</p>
            </div>
          ) : status === 'completed' && activeJob.result ? (
            <AIGeneratedPreview
              result={activeJob.result}
              onClose={onClose}
            />
          ) : status === 'failed' ? (
            <div className={styles.failed}>
              <p>❌ 生成失败: {activeJob.error ?? '未知错误'}</p>
              <button className={styles.retryBtn} onClick={() => setActiveJob(null)}>
                重新尝试
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
