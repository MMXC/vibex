'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useNavigationStore, BreadcrumbItem } from '@/stores/navigationStore'
import styles from './Breadcrumb.module.css'

interface BreadcrumbProps {
  className?: string
}

// Map pathname to breadcrumbs
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (!pathname) return []
  
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []
  
  // Always start with home
  breadcrumbs.push({ label: '首页', href: '/', isCurrent: segments.length === 0 })
  
  let currentPath = ''
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`
    
    // Skip dynamic segments like [id]
    if (segment.startsWith('[') && segment.endsWith(']')) {
      continue
    }
    
    const label = formatLabel(segment)
    const isLast = i === segments.length - 1
    
    breadcrumbs.push({
      label,
      href: currentPath,
      isCurrent: isLast,
    })
  }
  
  return breadcrumbs
}

function formatLabel(segment: string): string {
  const labels: Record<string, string> = {
    'dashboard': '控制台',
    'projects': '项目',
    'templates': '模板',
    'settings': '设置',
    'profile': '个人资料',
    'user-settings': '用户设置',
    'project-settings': '项目设置',
    'chat': '对话',
    'requirements': '需求',
    'domain': '领域模型',
    'flow': '流程图',
    'pages': '页面',
    'confirm': '确认流程',
    'context': '限界上下文',
    'model': '领域模型',
    'success': '完成',
    'prototype': '原型',
    'editor': '编辑器',
    'new': '新建',
    'export': '导出',
  }
  
  return labels[segment] || segment
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const pathname = usePathname()
  const { breadcrumbs: storeBreadcrumbs } = useNavigationStore()
  
  // Use store breadcrumbs if available, otherwise generate from pathname
  const breadcrumbs = storeBreadcrumbs.length > 0 
    ? storeBreadcrumbs 
    : generateBreadcrumbs(pathname || '')
  
  if (breadcrumbs.length <= 1) {
    return null
  }
  
  return (
    <nav className={`${styles.breadcrumb} ${className || ''}`}>
      {breadcrumbs.map((item, index) => (
        <span key={item.href || index} className={styles.item}>
          {!item.isCurrent && item.href ? (
            <Link href={item.href} className={styles.link}>
              {item.label}
            </Link>
          ) : (
            <span className={styles.current}>{item.label}</span>
          )}
          {index < breadcrumbs.length - 1 && (
            <span className={styles.separator}>/</span>
          )}
        </span>
      ))}
    </nav>
  )
}
