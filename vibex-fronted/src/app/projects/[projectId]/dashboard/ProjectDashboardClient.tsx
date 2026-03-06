'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export function ProjectDashboardClient() {
  const params = useParams()
  const projectId = params?.projectId as string
  const [projectName, setProjectName] = useState<string>('')

  useEffect(() => {
    if (projectId) {
      setProjectName(`项目 ${projectId.slice(0, 8)}`)
    }
  }, [projectId])

  return (
    <div style={{
      padding: '20px',
      color: '#fff',
    }}>
      <h1 style={{ 
        fontSize: '28px', 
        fontWeight: '700',
        marginBottom: '8px',
      }}>
        {projectName}
      </h1>
      <p style={{ 
        color: 'var(--color-text-secondary)', 
        marginBottom: '32px' 
      }}>
        项目控制台
      </p>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div style={{
          padding: '20px',
          background: 'var(--color-bg-glass)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>0</div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            需求数量
          </div>
        </div>
        <div style={{
          padding: '20px',
          background: 'var(--color-bg-glass)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>0</div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            对话数量
          </div>
        </div>
        <div style={{
          padding: '20px',
          background: 'var(--color-bg-glass)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>0</div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            页面数量
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>快速操作</h2>
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <a 
          href={`/projects/${projectId}/requirements`}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, rgba(0, 255, 255, 0.8) 100%)',
            color: 'var(--color-bg-primary)',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
          }}
        >
          + 添加需求
        </a>
        <a 
          href={`/projects/${projectId}/chat`}
          style={{
            padding: '12px 24px',
            background: 'var(--color-bg-glass)',
            border: '1px solid var(--color-border)',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
          }}
        >
          开始对话
        </a>
      </div>
    </div>
  )
}
