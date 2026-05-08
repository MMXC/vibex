'use client';

import { getAuthToken, getUserId } from '@/lib/auth-token';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { canPerform } from '@/lib/rbac/RBACService';
import type { TeamRole, ProjectPermission } from '@/lib/rbac/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import styles from './dashboard.module.css';
import { apiService, Project } from '@/services/api';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { ImportModal } from '@/components/dashboard/ImportModal';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { highlightSearchMatch } from '@/components/chat/SearchFilter';
import { useProjects, useDeletedProjects, queryKeys } from '@/hooks/queries';
import { canvasShareApi } from '@/lib/api/canvas-share';
import type { Team } from '@/lib/api/teams';
import { AnalyticsWidget } from '@/components/dashboard/AnalyticsWidget';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';

import { useProjectSearch, FILTER_LABELS, SORT_LABELS, FilterOption, SortOption } from '@/hooks/useProjectSearch';

/** 排序方式 (E4: 兼容原有选项) */
type LocalSortOption = 'name' | 'createdAt' | 'updatedAt';

// RBAC 类型 — 来自 @/lib/rbac (E04)
// TeamRole: 'owner' | 'admin' | 'member' | 'viewer'
// ProjectPermission: 'view' | 'edit' | 'delete' | 'manageMembers'
// 简单 JWT 解码
function parseJWT(token: string): { role?: TeamRole } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob((payload ?? "").replace(/-/g, '+').replace(/_/g, '/'));
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
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmOnConfirm, setConfirmOnConfirm] = useState<() => void>(() => {});
  const [confirmDestructive, setConfirmDestructive] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // E4: 视图模式 (Grid/List)
  type ViewMode = 'grid' | 'list';
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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

  // E4: useProjectSearch hook — 搜索/过滤/排序统一管理（projects 在此处才定义）
  const {
    filtered: displayProjects,
    searching,
    searchQuery,
    filter,
    sort,
    setSearch,
    setFilter,
    setSort,
  } = useProjectSearch(projects, userId ?? undefined);

  // E5: Fetch team-project shares to determine which projects have team badges
  const { data: allTeamShares = [] } = useQuery({
    queryKey: ['e5-all-team-shares'],
    queryFn: async () => {
      if (!userId) return [];
      // Get all teams user belongs to, then fetch their shared canvases
      const teamsRes = await fetch('/v1/teams', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}` },
      });
      if (!teamsRes.ok) return [];
      const { teams } = await teamsRes.json() as { teams: Team[] };
      const allShares: { projectId: string; teamId: string; teamName: string }[] = [];
      await Promise.all(
        teams.map(async (team) => {
          try {
            const res = await canvasShareApi.listCanvases(team.id);
            res.canvases.forEach((s) => {
              allShares.push({ projectId: s.canvasId, teamId: team.id, teamName: team.name });
            });
          } catch {
            // Ignore errors for individual teams
          }
        })
      );
      return allShares;
    },
    enabled: !!userId,
  });

  // E5: Build a map of projectId -> team info for quick lookup
  const projectTeamMap = useMemo(() => {
    const map = new Map<string, { teamId: string; teamName: string }>();
    allTeamShares.forEach((share) => {
      if (!map.has(share.projectId)) {
        map.set(share.projectId, { teamId: share.teamId, teamName: share.teamName });
      }
    });
    return map;
  }, [allTeamShares]);

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
    const storedRole = localStorage.getItem('user_role') as TeamRole | null;
    if (storedRole) return { role: storedRole };
    return parseJWT(token);
  }, []);
  const role: TeamRole = user?.role || 'viewer';
  const hasPermission = (perm: ProjectPermission) => canPerform(role, perm);

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

  // E4: 最近项目 (最近更新的 5 个)
  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [projects]);

  // displayProjects now comes from useProjectSearch hook (see line ~59)

  // 点击外部关闭排序/过滤菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSortMenu(false);
      setShowFilterMenu(false);
    };
    if (showSortMenu || showFilterMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSortMenu, showFilterMenu]);

  // E4: map local sort option ↔ hook sort option
  const localToHookSort = (local: LocalSortOption): SortOption => {
    if (local === 'name') return 'name-asc';
    if (local === 'createdAt') return 'updatedAt-asc';
    return 'updatedAt-desc';
  };
  const hookToLocalSort = (hookSort: SortOption): LocalSortOption => {
    if (hookSort === 'name-asc' || hookSort === 'name-desc') return 'name';
    if (hookSort === 'updatedAt-asc') return 'createdAt';
    return 'updatedAt';
  };
  const currentLocalSort = hookToLocalSort(sort);

  const sortLabels: Record<LocalSortOption, string> = {
    name: SORT_LABELS['name-asc'],
    createdAt: SORT_LABELS['updatedAt-asc'],
    updatedAt: SORT_LABELS['updatedAt-desc'],
  };
  const filterLabels = FILTER_LABELS;

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

  const openConfirm = (title: string, message: string, onConfirm: () => void, destructive = false) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmOnConfirm(() => onConfirm);
    setConfirmDestructive(destructive);
    setConfirmOpen(true);
  };

  // E3: 批量选择状态
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const bulkActionBarVisible = selectedProjectIds.size > 0;
  const toggleSelect = useCallback((projectId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedProjectIds(prev => { const n = new Set(prev); if (n.has(projectId)) n.delete(projectId); else n.add(projectId); return n; });
  }, []);
  const toggleSelectAll = useCallback(() => {
    setSelectedProjectIds(prev => prev.size === displayProjects.length ? new Set() : new Set(displayProjects.map(p => p.id)));
  }, [displayProjects]);
  const clearSelection = useCallback(() => setSelectedProjectIds(new Set()), []);
  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedProjectIds);
    openConfirm('批量删除', '确定要删除选中的 ' + ids.length + ' 个项目吗？', async () => {
      try { await Promise.all(ids.map(id => apiService.softDeleteProject(id))); queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() }); clearSelection(); }
      catch (err) { setActionError(err instanceof Error ? err.message : '删除失败'); }
    }, true);
  }, [selectedProjectIds, queryClient, clearSelection, openConfirm]);
  const handleBulkExport = useCallback(() => {
    const selected = displayProjects.filter(p => selectedProjectIds.has(p.id));
    const json = JSON.stringify(selected.map(p => ({ id: p.id, name: p.name, description: p.description, createdAt: p.createdAt, updatedAt: p.updatedAt })), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vibex-projects-export-' + Date.now() + '.json'; a.click();
    URL.revokeObjectURL(url);
  }, [selectedProjectIds, displayProjects]);
  const handleBulkArchive = useCallback(async () => {
    const ids = Array.from(selectedProjectIds);
    openConfirm('批量归档', '确定要归档选中的 ' + ids.length + ' 个项目吗？', async () => {
      try { await Promise.all(ids.map(id => apiService.softDeleteProject(id))); queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() }); clearSelection(); }
      catch (err) { setActionError(err instanceof Error ? err.message : '归档失败'); }
    }, false);
  }, [selectedProjectIds, queryClient, clearSelection, openConfirm]);

  // 永久删除
  const handlePermanentDelete = async (projectId: string) => {
    openConfirm('永久删除', '确定要永久删除此项目吗？此操作不可恢复！', async () => {
      try {
        await apiService.permanentDeleteProject(projectId);
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.deleted() });
      } catch (err: unknown) {
        setActionError(err instanceof Error ? err.message : '删除失败');
      }
    }, true);
  };

  // 清空回收站
  const handleClearAll = async () => {
    openConfirm('清空回收站', '确定要清空回收站吗？所有项目将被永久删除！', async () => {
      try {
        await apiService.clearDeletedProjects();
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.deleted() });
      } catch (err: unknown) {
        setActionError(err instanceof Error ? err.message : '清空失败');
      }
    }, true);
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
      {/* 新手指引 Provider */}
      <OnboardingProvider />
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
          <Link href="/prd-editor" className={styles.navItem}>
            <span className={styles.navIcon}>📋</span>
            <span>PRD 编辑器</span>
          </Link>
          <Link href="/export" className={styles.navItem}>
            <span className={styles.navIcon}>↗</span>
            <span>导出</span>
          </Link>
          <Link href="/canvas/delivery" className={styles.navItem}>
            <span className={styles.navIcon}>📦</span>
            <span>交付中心</span>
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
          {canPerform(role, 'edit') && (
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

        {/* E4: Hero 快速开始区域 */}
        <section className={styles.heroSection}>
          <div className={styles.heroLeft}>
            <h2 className={styles.heroTitle}>快速开始</h2>
            <p className={styles.heroSubtitle}>创建新项目或从模板开始</p>
            <div className={styles.heroButtons}>
              <button
                className={styles.heroPrimaryBtn}
                onClick={() => router.push('/projects/new')}
              >
                <span>+</span>
                <span>创建新项目</span>
              </button>
              <button
                className={styles.heroSecondaryBtn}
                onClick={() => router.push('/templates')}
              >
                <span>◫</span>
                <span>从模板创建</span>
              </button>
            </div>
          </div>
          {recentProjects.length > 0 && (
            <div className={styles.heroRight}>
              <h3 className={styles.recentTitle}>最近项目</h3>
              <div className={styles.recentScroll}>
                {recentProjects.map(project => (
                  <Link
                    key={project.id}
                    href={`/project?id=${project.id}`}
                    className={styles.recentCard}
                  >
                    <div className={styles.recentCardThumb}>
                      <span className={styles.recentCardIcon}>◈</span>
                    </div>
                    <div className={styles.recentCardInfo}>
                      <span className={styles.recentCardName} dangerouslySetInnerHTML={{ __html: highlightSearchMatch(project.name, searchQuery) }} />
                      <span className={styles.recentCardTime}>
                        {project.updatedAt
                          ? new Date(project.updatedAt).toLocaleDateString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : ''}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

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

        {/* 数据分析 Widget */}
        <section>
          <AnalyticsWidget />
        </section>

        {/* 项目列表 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.selectAllRow}>
              <input type="checkbox" className={styles.selectAllCheckbox}
                checked={displayProjects.length > 0 && selectedProjectIds.size === displayProjects.length}
                ref={el => { if (el) el.indeterminate = selectedProjectIds.size > 0 && selectedProjectIds.size < displayProjects.length; }}
                onChange={toggleSelectAll}
                data-testid="select-all-projects"
                aria-label="全选/取消全选所有项目" />
              <h2 className={styles.sectionTitle}>项目列表</h2>
            </div>
            <div className={styles.controls}>
              {/* 搜索框 — E3: 提取为 SearchBar 组件，内置 debounce 300ms */}
              <SearchBar
                placeholder="搜索项目..."
                onSearch={setSearch}
                defaultValue={searchQuery}
              />
              {/* E4: 搜索 loading 状态 */}
              {searching && (
                <span className={styles.searchLoading} aria-label="搜索中" />
              )}

              {/* E4: 视图切换 */}
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleActive : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="网格视图"
                >
                  ⊞
                </button>
                <button
                  className={`${styles.viewToggleBtn} ${viewMode === 'list' ? styles.viewToggleActive : ''}`}
                  onClick={() => setViewMode('list')}
                  title="列表视图"
                >
                  ☰
                </button>
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
                  <span>{sortLabels[currentLocalSort]}</span>
                </button>
                {showSortMenu && (
                  <div className={styles.sortMenu} data-testid="filter-dropdown">
                    {(['name', 'createdAt', 'updatedAt'] as LocalSortOption[]).map(opt => (
                      <button
                        key={opt}
                        className={`${styles.sortMenuItem} ${currentLocalSort === opt ? styles.active : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSort(localToHookSort(opt));
                          setShowSortMenu(false);
                        }}
                      >
                        {sortLabels[opt]}
                        {currentLocalSort === opt && <span className={styles.sortCheck}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* E4: 过滤器下拉 */}
              <div className={styles.sortWrapper} onClick={(e) => e.stopPropagation()}>
                <button
                  className={`${styles.sortButton} ${filter !== 'all' ? styles.statusFilterActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFilterMenu(!showFilterMenu);
                  }}
                  title="过滤"
                  data-testid="project-filter-btn"
                >
                  <span>⚙</span>
                  <span>{filterLabels[filter]}</span>
                </button>
                {showFilterMenu && (
                  <div className={styles.sortMenu} data-testid="filter-dropdown">
                    {(Object.keys(FILTER_LABELS) as FilterOption[]).map(opt => (
                      <button
                        key={opt}
                        className={`${styles.sortMenuItem} ${filter === opt ? styles.active : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilter(opt);
                          setShowFilterMenu(false);
                        }}
                      >
                        {filterLabels[opt]}
                        {filter === opt && <span className={styles.sortCheck}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`${styles.projectGrid} ${viewMode === 'list' ? styles.projectList : ''}`}>
            <div>
            {displayProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/project?id=${project.id}`)}
                className={`${styles.projectCard} ${styles.active} ${viewMode === 'list' ? styles.projectCardList : ''} ${selectedProjectIds.has(project.id) ? styles.projectCardSelected : ''}`}
              >
                <div className={styles.projectHeader}>
                  <input type="checkbox" className={styles.projectCheckbox}
                    checked={selectedProjectIds.has(project.id)}
                    onChange={(e) => toggleSelect(project.id, e)}
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`project-checkbox-${project.id}`}
                    aria-label={`选择项目 ${project.name}`} />
                  <h3 className={styles.projectName} dangerouslySetInnerHTML={{ __html: highlightSearchMatch(project.name, searchQuery) }} />
                  {/* E5: Team badge for shared canvases */}
                  {(() => {
                    const teamInfo = projectTeamMap.get(project.id);
                    if (!teamInfo) return (
                      <span className={`${styles.statusBadge} ${styles.active}`}>
                        活跃
                      </span>
                    );
                    return (
                      <span
                        className={`${styles.statusBadge} ${styles.teamBadge}`}
                        data-testid="team-project-badge"
                        title={`团队: ${teamInfo.teamName}`}
                      >
                        <span className={styles.teamBadgeIcon}>👥</span>
                        {teamInfo.teamName}
                      </span>
                    );
                  })()}
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
                    {canPerform(role, 'edit') && (
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
                    {canPerform(role, 'delete') ? (
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
                    ) : (
                      <button
                        className={styles.actionBtn}
                        style={{ opacity: 0.4, cursor: 'not-allowed' }}
                        title="需要管理员权限"
                        onClick={(e) => e.preventDefault()}
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
              </div>
            ))}
            {bulkActionBarVisible && (
              <div className={styles.bulkActionBar} data-testid="bulk-action-bar">
                <div className={styles.bulkActionInfo}>已选择 {selectedProjectIds.size} 个项目</div>
                <div className={styles.bulkActionButtons}>
                  <button type="button" className={styles.bulkArchiveBtn} onClick={handleBulkArchive} data-testid="bulk-archive-btn">📁 归档</button>
                  <button type="button" className={styles.bulkDeleteBtn} onClick={handleBulkDelete} data-testid="bulk-delete-btn">🗑️ 删除</button>
                  <button type="button" className={styles.bulkExportBtn} onClick={handleBulkExport} data-testid="bulk-export-btn">📤 导出</button>
                  <button type="button" className={styles.bulkCloseBtn} onClick={clearSelection} data-testid="bulk-close-btn" aria-label="取消选择">✕</button>
                </div>
              </div>
            )}
            </div>

            {/* E4: 空状态 - 无项目 */}
            {!loading && projects.length === 0 && !searchQuery && !showTrash && (
              <div className={styles.zeroEmptyState}>
                <span className={styles.zeroEmptyIcon}>📋</span>
                <h3 className={styles.zeroEmptyTitle}>还没有项目</h3>
                <p className={styles.zeroEmptyDesc}>创建一个新项目，开始你的 DDD 建模之旅</p>
                <button
                  className={styles.zeroEmptyBtn}
                  onClick={() => router.push('/projects/new')}
                >
                  + 创建第一个项目
                </button>
              </div>
            )}

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
                  onClick={() => setSearch('')}
                >
                  清除搜索
                </button>
              </div>
            )}

            {/* 创建新项目卡片 - 需要 edit 权限 */}
            {canPerform(role, 'edit') && (
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
      {canPerform(role, 'delete') && (
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

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        destructive={confirmDestructive}
        onConfirm={() => {
          confirmOnConfirm();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
