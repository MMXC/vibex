'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function ProjectPageClient() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.projectId as string

  useEffect(() => {
    // Redirect to project dashboard on client side
    if (projectId) {
      router.replace(`/projects/${projectId}/dashboard`)
    }
  }, [projectId, router])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      color: '#fff',
    }}>
      正在跳转到项目控制台...
    </div>
  )
}