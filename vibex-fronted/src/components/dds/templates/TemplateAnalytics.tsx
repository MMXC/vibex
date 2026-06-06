/**
 * TemplateAnalytics.tsx — Template Usage Analytics Panel
 * Sprint67 E3: 模板画廊使用分析 + AI推荐
 *
 * Displays template usage leaderboard, category statistics,
 * and AI-powered recommendations based on weighted scoring.
 */
'use client';

import React, { useMemo } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import type { TemplateCategory } from '@/data/templates';
import styles from './TemplateAnalytics.module.css';

interface TemplateAnalyticsProps {
  /** Called when user clicks on a template in the leaderboard */
  onTemplateSelect?: (templateId: string) => void;
}

const CATEGORY_LABELS: Record<TemplateCategory | 'all', string> = {
  all: '全部',
  flowchart: '流程图',
  mindmap: '思维导图',
  uml: 'UML图',
  other: '其他',
};

const CATEGORY_COLORS: Record<TemplateCategory | 'all', string> = {
  all: '#6366f1',
  flowchart: '#3b82f6',
  mindmap: '#8b5cf6',
  uml: '#f59e0b',
  other: '#6b7280',
};

export function TemplateAnalytics({ onTemplateSelect }: TemplateAnalyticsProps) {
  const { topTemplates, getCategoryStats, calcRecommendScore, templates, stats } = useTemplateStore();

  const leaderboard = useMemo(() => {
    return topTemplates(10).map((t, idx) => {
      const usageCount = stats.usageCount[t.id] || 0;
      const score = calcRecommendScore(t.id);
      return { template: t, usageCount, score, rank: idx + 1 };
    });
  }, [topTemplates, stats, calcRecommendScore]);

  const categoryStats = useMemo(() => {
    return getCategoryStats();
  }, [getCategoryStats]);

  const maxUsage = useMemo(() => {
    return Math.max(1, ...leaderboard.map(l => l.usageCount));
  }, [leaderboard]);

  const categoryEntries = Object.entries(categoryStats) as [TemplateCategory | 'all', { count: number; avgUsage: number }][];
  const maxCount = Math.max(1, ...categoryEntries.map(([, v]) => v.count));

  return (
    <div className={styles.container}>
      {/* Leaderboard */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>🔥 使用排行榜</h3>
        {leaderboard.length === 0 ? (
          <p className={styles.empty}>暂无使用数据</p>
        ) : (
          <ol className={styles.leaderboard}>
            {leaderboard.map(({ template, usageCount, rank }) => (
              <li
                key={template.id}
                className={styles.leaderboardItem}
                onClick={() => onTemplateSelect?.(template.id)}
                title={`${template.name} - ${usageCount}次使用`}
              >
                <span className={styles.rank}>{rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}</span>
                <div className={styles.leaderboardContent}>
                  <span className={styles.templateName}>{template.name}</span>
                  <div className={styles.usageBar}>
                    <div
                      className={styles.usageFill}
                      style={{
                        width: `${(usageCount / maxUsage) * 100}%`,
                        backgroundColor: rank <= 3 ? CATEGORY_COLORS[template.category || 'other'] : undefined,
                      }}
                    />
                  </div>
                </div>
                <span className={styles.usageCount}>{usageCount}次</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Category Stats Bar Chart */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>📊 分类统计</h3>
        <div className={styles.categoryChart}>
          {categoryEntries.map(([cat, { count, avgUsage }]) => (
            <div key={cat} className={styles.categoryRow}>
              <span className={styles.categoryLabel}>{CATEGORY_LABELS[cat]}</span>
              <div className={styles.categoryBarWrapper}>
                <div
                  className={styles.categoryBar}
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    backgroundColor: CATEGORY_COLORS[cat],
                  }}
                />
              </div>
              <span className={styles.categoryCount}>{count}</span>
              <span className={styles.categoryAvg} title="平均使用次数">
                ⌀{avgUsage.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* AI Recommendations */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>✨ 为你推荐</h3>
        <p className={styles.recommendSubtitle}>
          基于使用频率、标签匹配和新鲜度综合评分
        </p>
        <ol className={styles.recommendList}>
          {[...templates]
            .map(t => ({ template: t, score: calcRecommendScore(t.id) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(({ template, score }, idx) => (
              <li
                key={template.id}
                className={styles.recommendItem}
                onClick={() => onTemplateSelect?.(template.id)}
              >
                <span className={styles.recommendRank}>{idx + 1}</span>
                <div className={styles.recommendContent}>
                  <span className={styles.templateName}>{template.name}</span>
                  <span className={styles.categoryBadge} style={{ color: CATEGORY_COLORS[template.category || 'other'] }}>
                    {CATEGORY_LABELS[template.category || 'other']}
                  </span>
                </div>
                <div className={styles.scoreBar}>
                  <div
                    className={styles.scoreFill}
                    style={{ width: `${Math.round(score * 100)}%` }}
                  />
                </div>
                <span className={styles.scoreLabel}>{(score * 100).toFixed(0)}</span>
              </li>
            ))}
        </ol>
      </section>
    </div>
  );
}
