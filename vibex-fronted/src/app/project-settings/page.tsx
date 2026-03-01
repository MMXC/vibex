'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiService } from '@/services/api'

// 动态导入组件以禁用 SSR
const ProjectSettingsPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 加载项目数据
  useEffect(() => {
    if (!projectId) return
    
    const fetchProject = async () => {
      try {
        // 暂时使用默认值，项目详情需要后端支持
        setName('新项目')
        setDescription('')
      } catch (err: any) {
        setError(err.message || '加载项目失败')
      }
    }
    
    fetchProject()
  }, [projectId])

  // 保存设置
  const handleSave = async () => {
    if (!projectId) {
      setError('缺少项目ID')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await apiService.updateProject(projectId, {
        name,
        description,
      })
      alert('保存成功')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 取消
  const handleCancel = () => {
    router.back()
  }

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '32px' }}>项目设置</h1>
      
      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
        }}>
          {error}
        </div>
      )}
      
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>项目名称</label>
        <input 
          value={name} 
          onChange={e => setName(e.target.value)} 
          style={{ width: '100%', padding: '12px', border: '1px solid #e5e5e5', borderRadius: '8px' }} 
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>项目描述</label>
        <textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          rows={4} 
          style={{ width: '100%', padding: '12px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical' }} 
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>可见性</label>
        <select 
          value={visibility} 
          onChange={e => setVisibility(e.target.value)} 
          style={{ width: '100%', padding: '12px', border: '1px solid #e5e5e5', borderRadius: '8px' }}
        >
          <option value="private">私有</option>
          <option value="public">公开</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={handleSave}
          disabled={loading}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: loading ? '#93c5fd' : '#0070f3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '保存中...' : '保存'}
        </button>
        <button 
          onClick={handleCancel}
          style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid #e5e5e5', borderRadius: '8px', cursor: 'pointer' }}
        >
          取消
        </button>
      </div>
    </div>
  )
}

// 动态导出以禁用 SSR
export default dynamic(() => Promise.resolve(ProjectSettingsPage), { ssr: false })
