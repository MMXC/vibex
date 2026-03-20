'use client';

/**
 * @deprecated This page is deprecated since 2026-03-21.
 * 
 * This route is being deprecated as part of the page structure consolidation.
 * All functionality has been migrated to the homepage step flow at /.
 * 
 * Note: Individual requirement pages at /requirements/new and /requirements/[id] may still be in use.
 * Only this list page is deprecated.
 * 
 * @deprecated Use the homepage at / instead
 * @see docs/vibex-page-structure-consolidation/IMPLEMENTATION_PLAN.md
 */

import { getAuthToken, getUserId } from '@/lib/auth-token';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './requirements.module.css';
import { apiService, Requirement, RequirementStatus } from '@/services/api';

// 模拟需求数据（API 调用失败时的后备）
const mockRequirements: Requirement[] = [
  {
    id: 'req-1',
    userId: 'user-1',
    content: '开发一个在线教育平台，包含课程浏览、视频播放、作业提交等功能',
    status: 'completed',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'req-2',
    userId: 'user-1',
    content: '创建一个企业内部员工管理系统，支持考勤、审批、通讯录等功能',
    status: 'analyzing',
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T09:15:00Z',
  },
  {
    id: 'req-3',
    userId: 'user-1',
    content: '设计一个智能客服系统，能够自动回答常见问题',
    status: 'clarifying',
    createdAt: '2024-01-17T11:00:00Z',
    updatedAt: '2024-01-17T11:20:00Z',
  },
  {
    id: 'req-4',
    userId: 'user-1',
    content: '搭建一个数据分析仪表盘，展示销售数据、用户增长等指标',
    status: 'draft',
    createdAt: '2024-01-18T15:00:00Z',
    updatedAt: '2024-01-18T15:00:00Z',
  },
];

const statusMap: Record<RequirementStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: '#6b7280' },
  analyzing: { label: '分析中', color: '#3b82f6' },
  clarifying: { label: '待澄清', color: '#f59e0b' },
  completed: { label: '已完成', color: '#10b981' },
  failed: { label: '失败', color: '#ef4444' },
};

// 加载状态类型
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export default function Requirements() {
  const router = useRouter();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequirementStatus | 'all'>('all');
  const [retryCount, setRetryCount] = useState(0);

  // 获取需求列表的函数
  const fetchRequirements = useCallback(
    async (uid: string) => {
      setLoadingState('loading');
      setError('');

      try {
        // 调用 API 获取需求列表
        const data = await apiService.getRequirements(uid);
        setRequirements(data || []);
        setLoadingState('success');
      } catch (err: unknown) {
        console.error('获取需求列表失败:', err);
        setError(err instanceof Error ? err.message : '获取需求列表失败');

        // 如果有重试次数限制，可以使用模拟数据作为后备
        if (retryCount < 2) {
          setRequirements(mockRequirements);
          setLoadingState('success');
        } else {
          setLoadingState('error');
        }
      }
    },
    [retryCount]
  );

  // 初始化加载
  useEffect(() => {
    // 检查登录状态
    const token = getAuthToken();
    const storedUserId = getUserId();

    if (!token) {
      router.push('/auth');
      return;
    }

    setUserId(storedUserId);

    // 加载需求列表
    if (storedUserId) {
      fetchRequirements(storedUserId);
    } else {
      setLoadingState('loading');
      // 模拟加载延迟后显示空状态
      setTimeout(() => {
        setRequirements([]);
        setLoadingState('success');
      }, 500);
    }
  }, [router, fetchRequirements]);

  // 重试函数
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    if (userId) {
      fetchRequirements(userId);
    }
  };

  // 根据筛选条件过滤需求
  const filteredRequirements =
    filter === 'all'
      ? requirements
      : requirements.filter((r) => r.status === filter);

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个需求吗？')) return;

    try {
      if (userId) {
        await apiService.deleteRequirement(id, userId);
      }
      setRequirements(requirements.filter((r) => r.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  // 加载中状态
  if (loadingState === 'loading' || loadingState === 'idle') {
    return (
      <div className={styles.page}>
        <div className={styles.bgEffect}>
          <div className={styles.gridOverlay} />
          <div className={styles.glowOrb} />
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>正在加载需求列表...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (loadingState === 'error' && requirements.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.bgEffect}>
          <div className={styles.gridOverlay} />
          <div className={styles.glowOrb} />
        </div>
        <div className={styles.errorContainer}>
          <span className={styles.errorIcon}>⚠️</span>
          <h2 className={styles.errorTitle}>加载失败</h2>
          <p className={styles.errorMessage}>{error || '无法连接到服务器'}</p>
          <button className={styles.retryButton} onClick={handleRetry}>
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* 背景特效 */}
      <div className={styles.bgEffect}>
        <div className={styles.gridOverlay} />
        <div className={styles.glowOrb} />
      </div>

      {/* 侧边栏 */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <Link href="/dashboard" className={styles.logoLink}>
            <span className={styles.logoIcon}>◈</span>
            <span>VibeX</span>
          </Link>
        </div>

        <nav className={styles.sidebarNav}>
          <Link href="/dashboard" className={styles.navItem}>
            <span className={styles.navIcon}>⊞</span>
            <span>项目</span>
          </Link>
          <Link href="/templates" className={styles.navItem}>
            <span className={styles.navIcon}>◫</span>
            <span>模板</span>
          </Link>
          <Link
            href="/requirements"
            className={`${styles.navItem} ${styles.active}`}
          >
            <span className={styles.navIcon}>📋</span>
            <span>需求</span>
          </Link>
          <Link href="/requirements/new" className={styles.navItem}>
            <span className={styles.navIcon}>➕</span>
            <span>新建</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/project-settings" className={styles.navItem}>
            <span className={styles.navIcon}>⚙</span>
            <span>设置</span>
          </Link>
        </div>
      </aside>

      {/* 主内容 */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>需求管理</h1>
            <p className={styles.subtitle}>管理你的 AI 原型设计需求</p>
          </div>
          <Link href="/requirements/new" className={styles.createButton}>
            <span>+</span>
            <span>创建新需求</span>
          </Link>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        {/* 统计卡片 */}
        <section className={styles.stats}>
          {[
            {
              label: '需求总数',
              value: requirements.length.toString(),
              icon: '📋',
              color: 'cyan',
            },
            {
              label: '分析中',
              value: requirements
                .filter((r) => r.status === 'analyzing')
                .length.toString(),
              icon: '🔄',
              color: 'blue',
            },
            {
              label: '已完成',
              value: requirements
                .filter((r) => r.status === 'completed')
                .length.toString(),
              icon: '✅',
              color: 'green',
            },
            {
              label: '待澄清',
              value: requirements
                .filter((r) => r.status === 'clarifying')
                .length.toString(),
              icon: '❓',
              color: 'orange',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`${styles.statCard} ${styles[`stat${stat.color}`]}`}
            >
              <span className={styles.statIcon}>{stat.icon}</span>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            </div>
          ))}
        </section>

        {/* 筛选 */}
        <section className={styles.filterSection}>
          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
              onClick={() => setFilter('all')}
            >
              全部
            </button>
            {Object.entries(statusMap).map(([status, { label }]) => (
              <button
                key={status}
                className={`${styles.filterTab} ${filter === status ? styles.active : ''}`}
                onClick={() => setFilter(status as RequirementStatus)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* 需求列表 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {filter === 'all'
                ? '所有需求'
                : statusMap[filter as RequirementStatus]?.label + '的需求'}
            </h2>
            <span className={styles.count}>
              {filteredRequirements.length} 项
            </span>
          </div>

          {filteredRequirements.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📋</span>
              <p>暂无需求</p>
              <Link href="/requirements/new" className={styles.emptyBtn}>
                创建第一个需求
              </Link>
            </div>
          ) : (
            <div className={styles.list}>
              {filteredRequirements.map((req) => (
                <div key={req.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardId}>#{req.id.slice(-6)}</div>
                    <span
                      className={styles.statusBadge}
                      style={{
                        backgroundColor: statusMap[req.status]?.color + '20',
                        color: statusMap[req.status]?.color,
                      }}
                    >
                      {statusMap[req.status]?.label}
                    </span>
                  </div>

                  <div className={styles.cardContent}>
                    <p className={styles.cardText}>{req.content}</p>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardDate}>
                        创建于{' '}
                        {req.createdAt
                          ? new Date(req.createdAt).toLocaleDateString()
                          : '-'}
                      </span>
                      <span className={styles.cardDate}>
                        更新于{' '}
                        {req.updatedAt
                          ? new Date(req.updatedAt).toLocaleDateString()
                          : '-'}
                      </span>
                    </div>

                    <div className={styles.cardActions}>
                      <Link
                        href={`/requirements/${req.id}`}
                        className={styles.actionBtn}
                        title="查看详情"
                      >
                        查看
                      </Link>
                      <Link
                        href={`/domain?requirementId=${req.id}`}
                        className={styles.actionBtn}
                        title="领域模型"
                      >
                        领域模型
                      </Link>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete(req.id)}
                        title="删除"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
