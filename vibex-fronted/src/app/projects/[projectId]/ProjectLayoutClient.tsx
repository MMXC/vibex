'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProjectNav } from '@/components/navigation/ProjectNav'

export function ProjectLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const projectId = params?.projectId as string
  const [projectName, setProjectName] = useState<string>('项目')

  useEffect(() => {
    if (projectId) {
      setProjectName(`项目 ${projectId.slice(0, 8)}`)
    }
  }, [projectId])

  if (!projectId) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        color: '#fff'
      }}>
        加载中...
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
    }}>
      {/* Project Navigation Sidebar */}
      <ProjectNav 
        projectId={projectId}
        projectName={projectName}
      />
      
      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: '240px',
        padding: '24px',
        overflow: 'auto',
      }}>
        {children}
      </main>
    </div>
  )
}
