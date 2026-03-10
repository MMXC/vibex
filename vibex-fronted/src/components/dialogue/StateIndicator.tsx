/**
 * Dialogue State Indicator Component
 * 显示对话状态和完整度评分
 */

'use client';

import styles from './StateIndicator.module.css';

export type DialoguePhase = 
  | 'clarification' 
  | 'gathering' 
  | 'refining' 
  | 'complete';

export interface StateIndicatorProps {
  phase: DialoguePhase;
  completeness: number; // 0-100
  topic?: string;
}

const phaseLabels: Record<DialoguePhase, string> = {
  clarification: '需求澄清',
  gathering: '信息收集',
  refining: '细节确认',
  complete: '已完成',
};

const phaseDescriptions: Record<DialoguePhase, string> = {
  clarification: 'AI 正在理解你的需求...',
  gathering: '请补充更多项目细节',
  refining: '我们正在确认具体需求',
  complete: '需求已收集完毕',
};

export function StateIndicator({ phase, completeness, topic }: StateIndicatorProps) {
  const getProgressColor = () => {
    if (completeness >= 85) return '#10b981'; // green
    if (completeness >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.phase}>{phaseLabels[phase]}</span>
        {topic && <span className={styles.topic}>{topic}</span>}
      </div>
      
      <div className={styles.progressWrapper}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ 
              width: `${completeness}%`,
              backgroundColor: getProgressColor()
            }}
          />
        </div>
        <span className={styles.percentage} style={{ color: getProgressColor() }}>
          {completeness}%
        </span>
      </div>
      
      <p className={styles.description}>{phaseDescriptions[phase]}</p>
    </div>
  );
}

export default StateIndicator;
