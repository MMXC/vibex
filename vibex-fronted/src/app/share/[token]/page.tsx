/**
 * Share Page — 只读分享页面
 *
 * Epic 5 实现: S5.1 (只读分享链接)
 * 接收 token 参数，获取项目数据，以只读模式渲染画布
 */
'use client';

import { useEffect, useState } from 'react';
import { CanvasPage } from '@/components/canvas/CanvasPage';
import styles from './share.module.css';

interface ShareProject {
  id: string;
  name: string;
  description?: string;
  contextNodes: unknown[];
  flowNodes: unknown[];
  componentNodes: unknown[];
  phase: string;
}

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default function SharePage({ params }: SharePageProps) {
  const [project, setProject] = useState<ShareProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      fetchProject(t);
    });
  }, [params]);

  const fetchProject = async (shareToken: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/share/${shareToken}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('分享链接无效或已过期');
        } else {
          setError('加载失败，请稍后重试');
        }
        return;
      }

      const data: ShareProject = await response.json();
      setProject(data);
    } catch (err) {
      console.error('Failed to fetch share project:', err);
      setError('网络错误，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <span className={styles.spinnerIcon}>◈</span>
          <p>正在加载分享项目...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <span className={styles.errorIcon}>!</span>
          <h2>无法访问此项目</h2>
          <p>{error}</p>
          <a href="/" className={styles.homeLink}>
            返回首页
          </a>
        </div>
      </div>
    );
  }

  // 正常显示只读画布
  return (
    <div className={styles.sharePage}>
      {/* 只读标识 */}
      <div className={styles.shareBanner}>
        <span className={styles.shareIcon}>◈</span>
        <span className={styles.shareText}>
          只读分享视图 — {project?.name}
        </span>
        <a href="/" className={styles.createBtn}>
          创建新项目
        </a>
      </div>

      {/* 只读画布 */}
      {/* TODO: S5.1 后续集成：CanvasPage 支持 mode="readonly" + shareToken props */}
      <CanvasPage useTabMode={false} />
    </div>
  );
}
