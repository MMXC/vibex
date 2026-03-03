'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './dashboard.module.css'
import { apiService, Project } from '@/services/api'

export default function Dashboard() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showTrash, setShowTrash] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // 加载项目列表
  const fetchProjects = async (userId: string) => {
    try {
      const data = await apiService.getProjects(userId)
      // 过滤未删除的项目
      setProjects(data.filter(p => !p.deletedAt))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载项目失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载回收站项目
  const fetchDeletedProjects = async () => {
    try {
      const data = await apiService.getDeletedProjects()
      setDeletedProjects(data)
    } catch (err: unknown) {
      console.error('加载回收站失败:', err)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const storedUserId = localStorage.getItem('user_id')
    
    if (!token) {
      router.push('/auth')
      return
    }
    
    setUserId(storedUserId)
    if (storedUserId) {
      fetchProjects(storedUserId)
    } else {
      setLoading(false)
    }
  }, [router])

  // 拖拽处理
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggingId(projectId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggingId(null)
  }

  // 拖拽到垃圾桶删除
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggingId) return
    
    try {
      await apiService.softDeleteProject(draggingId)
      // 从列表移除
      setProjects(projects.filter(p => p.id !== draggingId))
      // 刷新回收站
      await fetchDeletedProjects()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
    setDraggingId(null)
  }

  // 恢复项目
  const handleRestore = async (projectId: string) => {
    try {
      await apiService.restoreProject(projectId)
      // 刷新列表
      if (userId) fetchProjects(userId)
      await fetchDeletedProjects()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '恢复失败')
    }
  }

  // 永久删除
  const handlePermanentDelete = async (projectId: string) => {
    if (!confirm('确定要永久删除此项目吗？此操作不可恢复！')) return
    
    try {
      await apiService.permanentDeleteProject(projectId)
      await fetchDeletedProjects()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  // 清空回收站
  const handleClearAll = async () => {
    if (!confirm('确定要清空回收站吗？所有项目将被永久删除！')) return
    
    try {
      await apiService.clearDeletedProjects()
      setDeletedProjects([])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '清空失败')
    }
  }

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

  const handleLogout = async () => {
    try {
      await apiService.logout()
    } catch (e) {
      // 忽略登出错误
    }
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_id')
    router.push('/auth')
  }

  // 创建新项目 - 跳转到需求输入页面
  const handleCreateProject = () => {
    router.push('/requirements/new')
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.bgEffect}>
          <div className={styles.gridOverlay} />
          <div className={styles.glowOrb} />
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          color: '#fff'
        }}>
          加载中...
        </div>
      </div>
    )
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
          <Link href="/dashboard" className={`${styles.navItem} ${styles.active}`}>
            <span className={styles.navIcon}>⊞</span>
            <span>项目</span>
          </Link>
          <Link href="/requirements/new" className={styles.navItem}>
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
          <Link href="/project-settings" className={styles.navItem}>
            <span className={styles.navIcon}>⚙</span>
            <span>设置</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.userItem} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
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
          <button className={styles.createButton} onClick={handleCreateProject}>
            <span>+</span>
            <span>创建新项目</span>
          </button>
        </header>

        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* 统计卡片 */}
        <section className={styles.stats}>
          {[
            { label: '项目总数', value: projects.length.toString(), icon: '◈', color: 'cyan' },
            { label: '活跃项目', value: projects.length.toString(), icon: '◉', color: 'green' },
            { label: '导出次数', value: '0', icon: '↗', color: 'purple' },
            { label: 'API 调用', value: '0', icon: '⚡', color: 'pink' },
          ].map((stat, i) => (
            <div key={i} className={`${styles.statCard} ${styles[`stat${stat.color}`]}`}>
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
          </div>

          <div className={styles.projectGrid}>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className={`${styles.projectCard} ${styles.active}`}
              >
                <div className={styles.projectHeader}>
                  <h3 className={styles.projectName}>{project.name}</h3>
                  <span className={`${styles.statusBadge} ${styles.active}`}>
                    活跃
                  </span>
                </div>
                <p className={styles.projectDesc}>{project.description || '暂无描述'}</p>
                <div className={styles.projectFooter}>
                  <span className={styles.projectDate}>
                    <span className={styles.dateIcon}>◷</span>
                    更新于 {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '-'}
                  </span>
                  <div className={styles.projectActions} style={{ position: 'relative' }}>
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
                    <button 
                      className={styles.actionBtn} 
                      title="删除"
                      onClick={(e) => { 
                        e.preventDefault();
                        if (confirm('确定删除该项目吗？')) {
                          apiService.deleteProject(project.id).then(() => {
                            setProjects(projects.filter(p => p.id !== project.id));
                          });
                        }
                      }}
                    >
                      🗑️
                    </button>
                    <button 
                      className={styles.actionBtn} 
                      title="更多"
                      onClick={(e) => { 
                        e.preventDefault();
                        setOpenMenuId(openMenuId === project.id ? null : project.id);
                      }}
                    >
                      ⋯
                    </button>
                    {openMenuId === project.id && (
                      <div style={{
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
                      }}>
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
                            // 导出功能
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
                                setProjects(projects.filter(p => p.id !== project.id));
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
            
            {/* 创建新项目卡片 */}
            <div className={styles.newProjectCard} onClick={handleCreateProject} style={{ cursor: 'pointer' }}>
              <span className={styles.plusIcon}>+</span>
              <span className={styles.newProjectText}>创建新项目</span>
            </div>
          </div>
        </section>
      </main>

      {/* 垃圾桶图标 */}
      <button 
        className={styles.trashButton}
        onClick={() => { setShowTrash(!showTrash); if (!showTrash) fetchDeletedProjects(); }}
        title="回收站"
      >
        🗑️
        {deletedProjects.length > 0 && (
          <span className={styles.trashBadge}>{deletedProjects.length}</span>
        )}
      </button>

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
              deletedProjects.map(project => (
                <div key={project.id} className={styles.trashItem}>
                  <div className={styles.trashItemInfo}>
                    <span className={styles.trashItemName}>{project.name}</span>
                    <span className={styles.trashItemDate}>
                      删除于 {project.deletedAt ? new Date(project.deletedAt).toLocaleDateString() : '-'}
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
  )
}
