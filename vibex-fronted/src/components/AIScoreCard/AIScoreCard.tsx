/**
 * AIScoreCard — Sprint38 P003-E3: AI 代码评分卡
 *
 * Displays a 3-dimension AI code quality score (readability, complexity, coverage)
 * each rated 1-5 stars, at the bottom of the DiffOverlay.
 *
 * Scoring is deterministic based on diff characteristics:
 * - Readability: based on avg line length + comment density
 * - Complexity: based on total changed lines + churn
 * - Coverage: based on files changed vs task complexity
 *
 * Usage:
 * ```tsx
 * import { AIScoreCard } from '@/components/AIScoreCard';
 * <AIScoreCard diffResult={lastResult} onScoreSaved={() => {}} />
 * ```
 */

'use client';

import React, { memo, useCallback, useState } from 'react';
import type { DiffResult } from '@/hooks/useAIAgent';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import styles from './AIScoreCard.module.css';

interface AIScoreCardProps {
  /** Diff result to compute scores from */
  diffResult: DiffResult;
  /** Called after score is saved to store */
  onScoreSaved?: () => void;
}

export interface AIScore {
  readability: number;
  complexity: number;
  coverage: number;
}

/**
 * Computes deterministic AI code quality scores from a diff result.
 * This is a heuristic scoring function — not a real LLM call.
 *
 * Scoring model:
 * - Readability (1-5): avg line length < 80 chars = high, > 120 = low
 * - Complexity (1-5): total lines changed, more lines = higher complexity
 * - Coverage (1-5): ratio of changed lines to total lines, more coverage = better
 */
export function computeDiffScores(diff: DiffResult): AIScore {
  const { added, removed, changes } = diff;

  // Readability: shorter lines = more readable
  // Score = 1-5 based on average line length
  let totalLen = 0;
  let lineCount = 0;
  let commentLines = 0;
  for (const change of changes) {
    const trimmed = change.line.trim();
    totalLen += trimmed.length;
    lineCount++;
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#')) {
      commentLines++;
    }
  }
  const avgLen = lineCount > 0 ? totalLen / lineCount : 0;
  const commentRatio = lineCount > 0 ? commentLines / lineCount : 0;

  // Readability: shorter lines + comment presence = higher score
  let readability: number;
  if (avgLen === 0) readability = 3;
  else if (avgLen < 60) readability = 5;
  else if (avgLen < 80) readability = 4;
  else if (avgLen < 100) readability = 3;
  else if (avgLen < 120) readability = 2;
  else readability = 1;

  // Complexity: more changed lines = more complex
  let complexity: number;
  const totalChanged = added + removed;
  if (totalChanged === 0) complexity = 1;
  else if (totalChanged < 10) complexity = 2;
  else if (totalChanged < 30) complexity = 3;
  else if (totalChanged < 60) complexity = 4;
  else complexity = 5;

  // Coverage: more files (changes) per line = better coverage
  let coverage: number;
  const filesPerChange = lineCount > 0 ? lineCount / Math.max(added, 1) : 0;
  if (filesPerChange > 3) coverage = 5;
  else if (filesPerChange > 2) coverage = 4;
  else if (filesPerChange > 1) coverage = 3;
  else if (filesPerChange > 0.5) coverage = 2;
  else coverage = 1;

  return { readability, complexity, coverage };
}

export const AIScoreCard = memo(function AIScoreCard({
  diffResult,
  onScoreSaved,
}: AIScoreCardProps) {
  const [saved, setSaved] = useState(false);
  const addAIScore = useUserPreferencesStore((s) => s.addAIScore);

  const scores = computeDiffScores(diffResult);

  const handleSave = useCallback(() => {
    addAIScore({
      readability: scores.readability,
      complexity: scores.complexity,
      coverage: scores.coverage,
      linesAdded: diffResult.added,
      linesRemoved: diffResult.removed,
    });
    setSaved(true);
    onScoreSaved?.();
  }, [addAIScore, scores, diffResult, onScoreSaved]);

  const overall = Math.round((scores.readability + scores.complexity + scores.coverage) / 3);

  return (
    <div className={styles.card} data-testid="ai-score-card">
      {/* Header row */}
      <div className={styles.header}>
        <span className={styles.headerLabel}>🤖 AI 评分卡</span>
        <span className={styles.overall} data-testid="score-overall">
          综合 {overall}/5
        </span>
      </div>

      {/* Score rows */}
      <div className={styles.scores}>
        <ScoreRow label="可读性" value={scores.readability} />
        <ScoreRow label="复杂度" value={scores.complexity} />
        <ScoreRow label="覆盖率" value={scores.coverage} />
      </div>

      {/* Save button */}
      <button
        type="button"
        className={`${styles.saveBtn} ${saved ? styles.savedBtn : ''}`}
        onClick={handleSave}
        disabled={saved}
        data-testid="score-save-btn"
      >
        {saved ? '✓ 已保存' : '💾 保存评分'}
      </button>
    </div>
  );
});

/** Renders a single dimension row with star indicators */
function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.scoreRow} data-testid={`score-row-${label}`}>
      <span className={styles.scoreLabel}>{label}</span>
      <div className={styles.stars} aria-label={`${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${styles.star} ${star <= value ? styles.starFilled : styles.starEmpty}`}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
        <span className={styles.scoreValue}>{value}/5</span>
      </div>
    </div>
  );
}

export default AIScoreCard;
