'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useNavigationStore } from '@/stores/navigationStore'
import styles from './ProjectNav.module.css'

interface ProjectNavProps {
  projectId?: string
  projectName?: string
  className?: string
}

export function ProjectNav({ projectId, projectName, className }: ProjectNavProps) {
  const pathname = usePathname()
  const { 
    currentProject,
    projectNavItems, 
    currentProjectNav, 
    setProjectNav,
  } = useNavigationStore()
  
  // Use props if provided, otherwise use store
  const effectiveProjectId = projectId || currentProject?.id
  const effectiveProjectName = projectName || currentProject?.name
  
  // If no project is selected and no props provided, don't render
  if (!effectiveProjectId) {
    return null
  }
  
  // Build href for each nav item based on project ID
  const getNavHref = (item: typeof projectNavItems[0]) => {
    return `/projects/${effectiveProjectId}${item.href || ''}`
  }
  
  return (
    <aside className={`${styles.aside} ${className || ''}`}>
      {/* Project Info */}
      <div className={styles.projectInfo}>
        <h2 className={styles.projectName}>{effectiveProjectName}</h2>
        <span className={styles.projectRole}>
          {currentProject?.role === 'owner' && '所有者'}
          {currentProject?.role === 'editor' && '编辑者'}
          {currentProject?.role === 'viewer' && '查看者'}
        </span>
      </div>
      
      {/* Navigation */}
      <nav className={styles.nav}>
        {projectNavItems.map((item) => {
          const href = getNavHref(item)
          const isActive = pathname === href || 
            (item.id !== 'dashboard' && pathname?.startsWith(href))
          
          return (
            <Link
              key={item.id}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => setProjectNav(item.id)}
            >
              <span className={styles.navIcon}>{getIcon(item.id)}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className={styles.badge}>{item.badge}</span>
              )}
            </Link>
          )
        })}
      </nav>
      
      {/* Bottom Actions */}
      <div className={styles.bottom}>
        <Link 
          href={`/projects/${effectiveProjectId}/settings`}
          className={styles.settingsLink}
        >
          <span className={styles.navIcon}>⚙️</span>
          <span>项目设置</span>
        </Link>
      </div>
    </aside>
  )
}

// Icon mapping
function getIcon(id: string): string {
  const icons: Record<string, string> = {
    dashboard: '📊',
    chat: '💬',
    requirements: '📝',
    domain: '🏗️',
    flow: '🔀',
    pages: '📄',
    settings: '⚙️',
  }
  return icons[id] || '•'
}
