/**
 * TemplateStats.tsx — S85-E5: 显示模板统计信息
 *
 * 在模板详情页和 Gallery 卡片中显示评分星级、评分人数、使用量等统计。
 */
'use client';

import React from 'react';

export interface TemplateStatsProps {
  avgRating?: number;
  ratingCount?: number;
  downloads?: number;
  /** 紧凑模式：用于卡片内嵌小尺寸 */
  compact?: boolean;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill={filled ? '#F59E0B' : 'none'}
      stroke="#F59E0B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="starRating" aria-label={`${rating.toFixed(1)} / ${max}`} style={{ display: 'inline-flex', gap: '2px' }}>
      {Array.from({ length: max }, (_, i) => (
        <StarIcon key={i} filled={i < rounded} />
      ))}
    </span>
  );
}

export function TemplateStats({ avgRating, ratingCount, downloads, compact = false }: TemplateStatsProps) {
  if (!avgRating && !ratingCount && !downloads) return null;

  const statsItems = [
    avgRating != null && {
      label: compact ? `${avgRating.toFixed(1)}` : `评分`,
      value: compact ? undefined : `${avgRating.toFixed(1)} / 5`,
      icon: <StarRating rating={avgRating} />,
      raw: avgRating,
    },
    ratingCount != null && {
      label: compact ? `${ratingCount}` : `评分人数`,
      value: compact ? undefined : `${ratingCount.toLocaleString()} 人`,
      icon: null,
      raw: ratingCount,
    },
    downloads != null && {
      label: compact ? `${downloads >= 1000 ? (downloads / 1000).toFixed(1) + 'k' : downloads}` : `使用量`,
      value: compact ? undefined : `${downloads.toLocaleString()} 次`,
      icon: null,
      raw: downloads,
    },
  ].filter(Boolean) as Array<{ label: string; value?: string; icon: React.ReactNode; raw: number }>;

  if (statsItems.length === 0) return null;

  if (compact) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#6B7280' }}>
        {statsItems.map((item, i) => (
          <React.Fragment key={i}>
            {item.icon || null}
            <span>{item.label}</span>
          </React.Fragment>
        ))}
      </span>
    );
  }

  return (
    <div className="templateStats" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      {statsItems.map((item, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {item.icon}
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>{item.label}</span>
          </div>
          {item.value && (
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}
