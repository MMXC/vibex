/**
 * TemplateStats - 模板统计和评分组件
 * 
 * 显示模板使用次数和用户评分，支持评分功能
 */

import { useState } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import styles from './TemplateSelector.module.css';

interface TemplateStatsProps {
  templateId: string;
  compact?: boolean;
}

export function TemplateStats({ templateId, compact = false }: TemplateStatsProps) {
  const { getTemplateStats, rateTemplate } = useTemplateStore();
  const stats = getTemplateStats(templateId);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState(false);
  
  const handleRate = (rating: number) => {
    if (hasRated) return;
    rateTemplate(templateId, rating);
    setUserRating(rating);
    setHasRated(true);
  };
  
  if (compact) {
    return (
      <div className={styles.statsCompact}>
        {stats.usageCount > 0 && (
          <span className={styles.usageCount}>
            👁 {stats.usageCount}
          </span>
        )}
        {stats.ratingCount > 0 && (
          <span className={styles.ratingCompact}>
            ⭐ {stats.avgRating.toFixed(1)} ({stats.ratingCount})
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className={styles.statsContainer}>
      {/* 使用统计 */}
      <div className={styles.statsSection}>
        <h4 className={styles.statsTitle}>使用统计</h4>
        <div className={styles.statsGrid}>
          <div className={styles.statsItem}>
            <span className={styles.statsValue}>{stats.usageCount}</span>
            <span className={styles.statsLabel}>使用次数</span>
          </div>
        </div>
      </div>
      
      {/* 评分区域 */}
      <div className={styles.statsSection}>
        <h4 className={styles.statsTitle}>用户评分</h4>
        <div className={styles.ratingDisplay}>
          {stats.ratingCount > 0 ? (
            <>
              <span className={styles.ratingValue}>{stats.avgRating.toFixed(1)}</span>
              <span className={styles.ratingStars}>
                {'★'.repeat(Math.round(stats.avgRating))}
                {'☆'.repeat(5 - Math.round(stats.avgRating))}
              </span>
              <span className={styles.ratingCount}>({stats.ratingCount} 人评分)</span>
            </>
          ) : (
            <span className={styles.noRating}>暂无评分</span>
          )}
        </div>
        
        {/* 评分按钮 */}
        <div className={styles.ratingButtons}>
          <span className={styles.ratingPrompt}>给我评分:</span>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              className={`${styles.starButton} ${(userRating || 0) >= star ? styles.starActive : ''} ${hasRated ? styles.starDisabled : ''}`}
              onClick={() => handleRate(star)}
              disabled={hasRated}
              aria-label={`评分 ${star} 星`}
            >
              {star <= (userRating || 0) ? '★' : '☆'}
            </button>
          ))}
        </div>
        {hasRated && (
          <span className={styles.ratingThanks}>感谢您的评分！</span>
        )}
      </div>
    </div>
  );
}

export default TemplateStats;
