'use client';

import { getAuthToken, getUserId } from '@/lib/auth-token';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import styles from './dashboard.module.css';
import { apiService, Project } from '@/services/api';
import { useProjects, useDeletedProjects, queryKeys } from '@/hooks/queries';

/** 排序方式 */
type SortOption = 'name' | 'createdAt' | 'updatedAt';

// RBAC 类型
type UserRole = 'admin' | 'editor' | 'viewer';
type Permission = 'read' | 'create' | 'update' | 'delete';
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['read', 'create', 'update', 'delete'],
  editor: ['read', 'create', 'update'],
  viewer: ['read'],
};

// 简单 JWT 解码
function parseJWT(token: string): { role?: UserRole } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const json = decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // 使用 React Query 获取项目列表
  const { 
    data: projects = [], 
    isLoading: loading, 
    error 
  } = useProjects({ 
    userId: userId || '',
    options: {
      // 过滤未删除的项目
      select: (data) => data.filter((p) => !p.deletedAt),
    }
  });

  // 使用 React Query 获取已删除项目
  const {
    data: deletedProjects = [],
    refetch: refetchDeleted
  } = useDeletedProjects({
    enabled: showTrash
  });

  // 权限检查 - inline hook
  const user = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const token = getAuthToken();
    if (!token) return null;
    const storedRole = localStorage.getItem('user_role');
    if (storedRole) return { role: storedRole as UserRole };
    return parseJWT(token);
  }, []);
  const role: UserRole = user?.role || 'viewer';
  const hasPermission = (perm: Permission) =>
    ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
  const canAccess = (_resource: string, perm: Permission) =>
    role === 'admin' || hasPermission(perm);

  // 初始化用户 ID
  useEffect(() => {
    const token = getAuthToken();
    const storedUserId = getUserId();

    if (!token) {
      router.push('/auth');
      return;
    }

    setUserId(storedUserId);
  }, [router]);

  // 错误状态
  const errorMessage = error instanceof Error ? error.message : '';

  // E4: 搜索 + 排序后的项目列表
  const displayProjects = useMemo(() => {
    let result = [...projects];

    // 搜索过滤
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      );
    }

    // 排序
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'createdAt') {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }
      // updatedAt
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });

    return result;
  }, [projects, searchQuery, sortBy]);

  // 点击外部关闭排序菜单
  useEffect(() => {
    const handleClickOutside = () => setShowSortMenu(false);
    if (showSortMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSortMenu]);

  const sortLabels: Record<SortOption, string> = {
    name: '名称',
    createdAt: '创建时间',
    updatedAt: '最近编辑',
  };

  // 拖拽处理
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggingId(projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  // 拖拽到垃圾桶删除
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingId) return;

    try {
      await apiService.softDeleteProject(draggingId);
      // 刷新项目列表和回收站
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.deleted() });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : '删除失败');
    }
    setDraggingId(null);
  };

  // 恢复项目
  const handleRestore = async (projectId: string) => {
    try {
      await apiService.restoreProject(projectId);
      // 刷新项目列表和回收站
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.deleted() });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : '恢复失败');
    }
  };

  // 永久删除
  const handlePermanentDelete = async (projectId: string) => {
    if (!confirm('确定要永久删除此项目吗？此操作不可恢复！')) return;

    try {
      await apiService.permanentDeleteProject(projectId);
      // 刷新回收站
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.deleted() });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : '删除失败');
    }
  };

  // 清空回收站
  const handleClearAll = async () => {
    if (!confirm('确定要清空回收站吗？所有项目将被永久删除！')) return;

    try {
      await apiService.clearDeletedProjects();
      // 刷新回收站
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.deleted() });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : '清空失败');
    }
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (e) {
      // 忽略登出错误
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    router.push('/auth');
  };

  // 创建新项目 - 跳转到需求输入页面
  const handleCreateProject = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.bgEffect}>
          <div className={styles.gridOverlay} />
          <div className={styles.glowOrb} />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            color: '#fff',
          }}
        >
          加载中...
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
          <span className={styles.logoIcon}>◈</span>
          <span>VibeX</span>
        </div>

        <nav className={styles.sidebarNav}>
          <Link
            href="/dashboard"
            className={`${styles.navItem} ${styles.active}`}
          >
            <span className={styles.navIcon}>⊞</span>
            <span>项目</span>
          </Link>
          <Link href="/confirm" className={styles.navItem}>
            <span className={styles.navIcon}>🤖</span>
            <span>AI 原型设计</span>
          </Link>
          <Link href="/domain" className={styles.navItem}>
            <span className={styles.navIcon}>📊</span>
            <span>领域模型</span>
          </Link>
          <Link href="/prototype" className={styles.navItem}>
            <span className={styles.navIcon}>🎨</span>
            <span>原型预览</span>
          </Link>
          <Link href="/templates" className={styles.navItem}>
            <span className={styles.navIcon}>◫</span>
            <span>模板</span>
          </Link>
          <Link href="/export" className={styles.navItem}>
            <span className={styles.navIcon}>↗</span>
            <span>导出</span>
          </Link>
          <Link href="/" className={styles.navItem}>
            <span className={styles.navIcon}>📝</span>
            <span>需求列表</span>
          </Link>
          <Link href="/flow" className={styles.navItem}>
            <span className={styles.navIcon}>🔀</span>
            <span>流程图</span>
          </Link>
          <Link href="/pagelist" className={styles.navItem}>
            <span className={styles.navIcon}>📄</span>
            <span>页面管理</span>
          </Link>
          <Link href="/changelog" className={styles.navItem}>
            <span className={styles.navIcon}>📋</span>
            <span>更新日志</span>
          </Link>
          <Link href="/user-settings" className={styles.navItem}>
            <span className={styles.navIcon}>👤</span>
            <span>用户设置</span>
          </Link>
          <Link href="/project-settings" className={styles.navItem}>
            <span className={styles.navIcon}>⚙</span>
            <span>设置</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            onClick={handleLogout}
            className={styles.userItem}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <div className={styles.avatar}>U</div>
            <span>登出</span>
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>我的项目</h1>
            <p className={styles.subtitle}>管理你的 AI 应用项目</p>
          </div>
          {hasPermission('create') && (
            <button
              className={styles.createButton}
              onClick={handleCreateProject}
            >
              <span>+</span>
              <span>创建新项目</span>
            </button>
          )}
        </header>

        {error && (
          <div
            style={{
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px',
            }}
          >
            {actionError}
          </div>
        )}

        {/* 统计卡片 */}
        <section className={styles.stats}>
          {[
            {
              label: '项目总数',
              value: projects.length.toString(),
              icon: '◈',
              color: 'cyan',
            },
            {
              label: '活跃项目',
              value: projects.length.toString(),
              icon: '◉',
              color: 'green',
            },
            { label: '导出次数', value: '0', icon: '↗', color: 'purple' },
            { label: 'API 调用', value: '0', icon: '⚡', color: 'pink' },
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

        {/* 项目列表 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>项目列表</h2>
            <div className={styles.controls}>
              {/* 搜索框 */}
              <div className={styles.searchBox}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="搜索项目..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button
                    className={styles.clearBtn}
                    onClick={() => setSearchQuery('')}
                    title="清除搜索"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* 排序 */}
              <div className={styles.sortWrapper} onClick={(e) => e.stopPropagation()}>
                <button
                  className={styles.sortButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSortMenu(!showSortMenu);
                  }}
                  title="排序"
                >
                  <span>↕</span>
                  <span>{sortLabels[sortBy]}</span>
                </button>
                {showSortMenu && (
                  <div className={styles.sortMenu}>
                    {(['name', 'createdAt', 'updatedAt'] as SortOption[]).map(opt => (
                      <button
                        key={opt}
                        className={`${styles.sortMenuItem} ${sortBy === opt ? styles.active : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSortBy(opt);
                          setShowSortMenu(false);
                        }}
                      >
                        {sortLabels[opt]}
                        {sortBy === opt && <span className={styles.sortCheck}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.projectGrid}>
            {displayProjects.map((project) => (
              <Link
                key={project.id}
                href={`/project?id=${project.id}`}
                className={`${styles.projectCard} ${styles.active}`}
              >
                <div className={styles.projectHeader}>
                  <h3 className={styles.projectName}>{project.name}</h3>
                  <span className={`${styles.statusBadge} ${styles.active}`}>
                    活跃
                  </span>
                </div>
                <p className={styles.projectDesc}>
                  {project.description || '暂无描述'}
                </p>
                <div className={styles.projectFooter}>
                  <div className={styles.projectMeta}>
                    {/* 创建时间 */}
                    <span className={styles.metaItem} title="创建时间">
                      <span className={styles.metaIcon}>◈</span>
                      {project.createdAt
                        ? new Date(project.createdAt).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })
                        : '-'}
                    </span>
                    {/* 最后编辑时间 */}
                    <span className={styles.metaItem} title="最后编辑">
                      <span className={styles.metaIcon}>◷</span>
                      {project.updatedAt
                        ? new Date(project.updatedAt).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })
                        : '-'}
                    </span>
                  </div>
                  <div
                    className={styles.projectActions}
                    style={{ position: 'relative' }}
                  >
                    {hasPermission('update') && (
                      <button
                        className={styles.actionBtn}
                        title="编辑"
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/project-settings?id=${project.id}`);
                        }}
                      >
                        ✎
                      </button>
                    )}
                    <button
                      className={styles.actionBtn}
                      title="导出"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('导出功能开发中');
                      }}
                    >
                      📤
                    </button>
                    {hasPermission('delete') && (
                      <button
                        className={styles.actionBtn}
                        title="删除"
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm('确定删除该项目吗？')) {
                            apiService.deleteProject(project.id).then(() => {
                              queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
                            });
                          }
                        }}
                      >
                        🗑️
                      </button>
                    )}
                    <button
                      className={styles.actionBtn}
                      title="更多"
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenMenuId(
                          openMenuId === project.id ? null : project.id
                        );
                      }}
                    >
                      ⋯
                    </button>
                    {openMenuId === project.id && (
                      <div
                        style={{
                          position: 'absolute',
                          right: '0',
                          top: '100%',
                          background: '#1e1e2e',
                          border: '1px solid #3b3b5c',
                          borderRadius: '8px',
                          padding: '8px 0',
                          minWidth: '120px',
                          zIndex: 100,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        }}
                      >
                        <button
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '8px 16px',
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            setOpenMenuId(null);
                            alert('导出功能开发中');
                          }}
                        >
                          📤 导出
                        </button>
                        <button
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '8px 16px',
                            background: 'none',
                            border: 'none',
                            color: '#ff6b6b',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            setOpenMenuId(null);
                            if (confirm('确定删除该项目吗？')) {
                              apiService.deleteProject(project.id).then(() => {
                                queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
                              });
                            }
                          }}
                        >
                          🗑️ 删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.cardGlow} />
              </Link>
            ))}

            {/* 空状态 - 搜索无结果 */}
            {!loading && displayProjects.length === 0 && searchQuery && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🔍</span>
                <p className={styles.emptyTitle}>没有找到匹配的项目</p>
                <p className={styles.emptyDesc}>
                  没有名称包含「{searchQuery}」的项目
                </p>
                <button
                  className={styles.emptyClearBtn}
                  onClick={() => setSearchQuery('')}
                >
                  清除搜索
                </button>
              </div>
            )}

            {/* 创建新项目卡片 - 需要 create 权限 */}
            {hasPermission('create') && (
              <div
                className={styles.newProjectCard}
                onClick={handleCreateProject}
                style={{ cursor: 'pointer' }}
              >
                <span className={styles.plusIcon}>+</span>
                <span className={styles.newProjectText}>创建新项目</span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 垃圾桶图标 - 需要 delete 权限 */}
      {hasPermission('delete') && (
        <button
          className={styles.trashButton}
          onClick={() => {
            setShowTrash(!showTrash);
            if (!showTrash) refetchDeleted();
          }}
          title="回收站"
        >
          🗑️
          {deletedProjects.length > 0 && (
            <span className={styles.trashBadge}>{deletedProjects.length}</span>
          )}
        </button>
      )}

      {/* 回收站弹窗 */}
      {showTrash && (
        <div className={styles.trashPopup}>
          <div className={styles.trashHeader}>
            <h3>回收站</h3>
            {deletedProjects.length > 0 && (
              <button className={styles.clearAllBtn} onClick={handleClearAll}>
                清空
              </button>
            )}
          </div>
          <div className={styles.trashList}>
            {deletedProjects.length === 0 ? (
              <p className={styles.emptyTrash}>回收站为空</p>
            ) : (
              deletedProjects.map((project) => (
                <div key={project.id} className={styles.trashItem}>
                  <div className={styles.trashItemInfo}>
                    <span className={styles.trashItemName}>{project.name}</span>
                    <span className={styles.trashItemDate}>
                      删除于{' '}
                      {project.deletedAt
                        ? new Date(project.deletedAt).toLocaleDateString()
                        : '-'}
                    </span>
                  </div>
                  <div className={styles.trashItemActions}>
                    <button
                      className={styles.restoreBtn}
                      onClick={() => handleRestore(project.id)}
                    >
                      恢复
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handlePermanentDelete(project.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 垃圾桶拖放区域 */}
      <div
        className={`${styles.trashDropZone} ${draggingId ? styles.active : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {draggingId && <span>拖放到此处删除</span>}
      </div>
    </div>
  );
}
