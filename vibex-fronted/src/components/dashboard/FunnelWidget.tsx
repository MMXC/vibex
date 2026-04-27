'use client';

import styles from './FunnelWidget.module.css';

interface FunnelStep {
  name: string;
  count: number;
  rate: number; // 0.0–1.0, first step = 1.0
}

interface FunnelWidgetProps {
  steps: FunnelStep[];
  isLoading?: boolean;
}

export function FunnelWidget({ steps, isLoading }: FunnelWidgetProps) {
  if (isLoading) {
    return <div className={styles.skeleton} data-testid="funnel-skeleton" />;
  }

  // Empty state: any step has < 3 records
  const hasEmptyData = steps.some((s) => s.count < 3);
  if (hasEmptyData) {
    return (
      <div className={styles.empty} data-testid="funnel-empty-state">
        <span className={styles.emptyText}>数据不足以计算漏斗</span>
      </div>
    );
  }

  const maxCount = steps[0]?.count ?? 0;

  return (
    <svg viewBox="0 0 800 400" className={styles.funnelSvg} data-testid="funnel-widget">
      {steps.map((step, i) => {
        const widthPercent = maxCount > 0 ? step.count / maxCount : 0;
        const topWidth = Math.max(widthPercent * 700, 80);
        const bottomWidth =
          i < steps.length - 1
            ? Math.max((steps[i + 1].count / maxCount) * 700, 80)
            : Math.max(widthPercent * 700 * 0.5, 40);
        const y = 50 + i * 80;

        const topLeft = 400 - topWidth / 2;
        const topRight = 400 + topWidth / 2;
        const bottomLeft = 400 - bottomWidth / 2;
        const bottomRight = 400 + bottomWidth / 2;

        const points = `${topLeft},${y} ${topRight},${y} ${bottomRight},${y + 65} ${bottomLeft},${y + 65}`;
        const fillColor = `hsl(${200 - i * 30}, 70%, ${60 - i * 5}%)`;

        return (
          <g key={step.name} className={styles.funnelStage} data-stage={i}>
            <polygon points={points} fill={fillColor} className={styles.stagePolygon} />
            <text x="400" y={y + 25} textAnchor="middle" className={styles.stageName}>
              {step.name}
            </text>
            <text x="400" y={y + 48} textAnchor="middle" className={styles.stageCount}>
              {step.count.toLocaleString()} ({(step.rate * 100).toFixed(1)}%)
            </text>
          </g>
        );
      })}
    </svg>
  );
}
