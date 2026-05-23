/**
 * Recent Projects List Component
 * 展示最近项目卡片，点击跳转项目详情
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';

interface Project {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  thumbnail?: string;
}

interface RecentProjectsProps {
  limit?: number;
  className?: string;
}

export function RecentProjects({ limit = 6, className = '' }: RecentProjectsProps) {
  const router = useRouter();
  const t = useTranslations('dashboard')();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 获取最近项目
    const stored = localStorage.getItem('recent_projects');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProjects(parsed.slice(0, limit));
      } catch {
        setProjects([]);
      }
    }
    setLoading(false);
  }, [limit]);

  const handleProjectClick = (projectId: string) => {
    router.push(`/project?id=${projectId}`);
  };

  if (loading) {
    return (
      <div className={`recent-projects ${className}`}>
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className={`recent-projects ${className}`}>
        <div className="empty-state">
          <p>{t('noRecentProjects')}</p>
          <p className="hint">{t('recentProjectsHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`recent-projects ${className}`}>
      <div className="projects-grid">
        {projects.map((project) => (
          <button
            key={project.id}
            className="project-card"
            onClick={() => handleProjectClick(project.id)}
            aria-label={`${t('openProject')} ${project.name}`}
          >
            <div className="project-thumbnail">
              {project.thumbnail ? (
                <img src={project.thumbnail} alt={project.name} />
              ) : (
                <div className="placeholder">
                  {project.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="project-info">
              <h3 className="project-name">{project.name}</h3>
              {project.description && (
                <p className="project-description">{project.description}</p>
              )}
              <span className="project-date">
                {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default RecentProjects;
