'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './dashboard.module.css'
import { apiService, Project } from '@/services/api'

export default function Dashboard() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('auth_token')
    const storedUserId = localStorage.getItem('user_id')
    
    if (!token) {
      router.push('/auth')
      return
    }
    
    setUserId(storedUserId)
    
    // 加载项目列表
    const fetchProjects = async () => {
      if (!storedUserId) {
        setLoading(false)
        return
      }
      
      try {
        const data = await apiService.getProjects(storedUserId)
        setProjects(data)
      } catch (err: any) {
        setError(err.message || '加载项目失败')
      } finally {
        setLoading(false)
      }
    }
    
    fetchProjects()
  }, [router])

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
          <button className={styles.createButton}>
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
                href="/chat"
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
                  <div className={styles.projectActions}>
                    <button className={styles.actionBtn} title="编辑">✎</button>
                    <button className={styles.actionBtn} title="更多">⋯</button>
                  </div>
                </div>
                <div className={styles.cardGlow} />
              </Link>
            ))}
            
            {/* 创建新项目卡片 */}
            <div className={styles.newProjectCard}>
              <span className={styles.plusIcon}>+</span>
              <span className={styles.newProjectText}>创建新项目</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
