/**
 * Project Overview Component
 * 展示所有模块、状态指示
 */
// @ts-nocheck


'use client';

import { useState, useCallback } from 'react';
import styles from './ProjectOverview.module.css';

export type ModuleStatus = 'pending' | 'in-progress' | 'completed' | 'error';

export interface ProjectModule {
  id: string;
  name: string;
  description?: string;
  status: ModuleStatus;
  progress?: number;
  lastUpdated?: string;
}

export interface ProjectOverviewProps {
  modules: ProjectModule[];
  onModuleClick?: (moduleId: string) => void;
}

export function ProjectOverview({ modules, onModuleClick }: ProjectOverviewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((moduleId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }, []);

  const getStatusIcon = (status: ModuleStatus) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in-progress': return '⟳';
      case 'error': return '✗';
      default: return '○';
    }
  };

  const getStatusColor = (status: ModuleStatus) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#3b82f6';
      case 'error': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const completedCount = modules.filter(m => m.status === 'completed').length;
  const progressPercent = modules.length > 0 ? (completedCount / modules.length) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>项目全景</h2>
        <div className={styles.stats}>
          <span className={styles.progressText}>{completedCount}/{modules.length} 完成</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className={styles.moduleGrid}>
        {modules.map(module => (
          <div
            key={module.id}
            className={`${styles.moduleCard} ${styles[module.status]}`}
            onClick={() => onModuleClick?.(module.id)}
          >
            <div className={styles.moduleHeader}>
              <span
                className={styles.statusIcon}
                style={{ color: getStatusColor(module.status) }}
              >
                {getStatusIcon(module.status)}
              </span>
              <span className={styles.moduleName}>{module.name}</span>
              {module.progress !== undefined && (
                <span className={styles.moduleProgress}>{module.progress}%</span>
              )}
            </div>
            {module.description && (
              <p className={styles.moduleDescription}>{module.description}</p>
            )}
            {module.lastUpdated && (
              <span className={styles.moduleTime}>
                {new Date(module.lastUpdated).toLocaleString('zh-CN')}
              </span>
            )}
            {module.status === 'in-progress' && module.progress !== undefined && (
              <div className={styles.miniProgress}>
                <div className={styles.miniProgressFill} style={{ width: `${module.progress}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectOverview;
