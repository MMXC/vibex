'use client'

import Link from 'next/link'
import styles from './dashboard.module.css'

interface Project {
  id: string
  name: string
  description: string
  updatedAt: string
  status: 'active' | 'draft' | 'archived'
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'VibeX Playground',
    description: 'AI Agent Flow Builder',
    updatedAt: '2026-02-25',
    status: 'active',
  },
  {
    id: '2',
    name: '数据分析仪表盘',
    description: '企业级数据可视化平台',
    updatedAt: '2026-02-24',
    status: 'active',
  },
  {
    id: '3',
    name: '电商后台系统',
    description: '完整的电商管理后台',
    updatedAt: '2026-02-20',
    status: 'draft',
  },
  {
    id: '4',
    name: '客户关系管理',
    description: 'CRM 系统原型',
    updatedAt: '2026-02-15',
    status: 'archived',
  },
]

export default function Dashboard() {
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
          <Link href="/user-settings" className={styles.userItem}>
            <div className={styles.avatar}>U</div>
            <span>用户</span>
          </Link>
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

        {/* 统计卡片 */}
        <section className={styles.stats}>
          {[
            { label: '项目总数', value: '12', icon: '◈', color: 'cyan' },
            { label: '活跃项目', value: '8', icon: '◉', color: 'green' },
            { label: '导出次数', value: '24', icon: '↗', color: 'purple' },
            { label: 'API 调用', value: '1.2k', icon: '⚡', color: 'pink' },
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
            <div className={styles.filterTabs}>
              <button className={`${styles.filterTab} ${styles.active}`}>全部</button>
              <button className={styles.filterTab}>活跃</button>
              <button className={styles.filterTab}>草稿</button>
              <button className={styles.filterTab}>归档</button>
            </div>
          </div>

          <div className={styles.projectGrid}>
            {mockProjects.map((project) => (
              <Link
                key={project.id}
                href="/chat"
                className={`${styles.projectCard} ${styles[`status${project.status}`]}`}
              >
                <div className={styles.projectHeader}>
                  <h3 className={styles.projectName}>{project.name}</h3>
                  <span className={`${styles.statusBadge} ${styles[project.status]}`}>
                    {project.status === 'active' ? '活跃' : project.status === 'draft' ? '草稿' : '归档'}
                  </span>
                </div>
                <p className={styles.projectDesc}>{project.description}</p>
                <div className={styles.projectFooter}>
                  <span className={styles.projectDate}>
                    <span className={styles.dateIcon}>◷</span>
                    更新于 {project.updatedAt}
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
