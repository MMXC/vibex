'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiService } from '@/services/api'

// 协作者类型定义
export interface Collaborator {
  id: string
  userId: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer'
  status: 'active' | 'pending'
  joinedAt?: string
  invitedAt?: string
}

// 协作者权限
const ROLE_PERMISSIONS = {
  owner: { label: '所有者', description: '完全控制，包括删除项目', color: '#7c3aed' },
  editor: { label: '编辑者', description: '可以编辑项目内容', color: '#0ea5e9' },
  viewer: { label: '查看者', description: '只能查看，不能编辑', color: '#6b7280' },
}

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
  
  // 协作者相关状态
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [inviting, setInviting] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'collaborators'>('general')

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

  // 加载协作者列表
  useEffect(() => {
    if (!projectId) return
    
    const fetchCollaborators = async () => {
      setCollaboratorsLoading(true)
      try {
        // TODO: 后端 API 支持后替换为真实 API 调用
        // const response = await apiService.getCollaborators(projectId)
        
        // 模拟数据 - 实际项目中应该从 API 获取
        const mockCollaborators: Collaborator[] = [
          {
            id: '1',
            userId: 'user-1',
            name: '张三',
            email: 'zhangsan@example.com',
            avatar: undefined,
            role: 'owner',
            status: 'active',
            joinedAt: '2024-01-15T10:00:00Z',
          },
          {
            id: '2',
            userId: 'user-2',
            name: '李四',
            email: 'lisi@example.com',
            avatar: undefined,
            role: 'editor',
            status: 'active',
            joinedAt: '2024-02-20T14:30:00Z',
          },
          {
            id: '3',
            userId: 'user-3',
            name: '王五',
            email: 'wangwu@example.com',
            avatar: undefined,
            role: 'viewer',
            status: 'pending',
            invitedAt: '2024-03-01T09:00:00Z',
          },
        ]
        
        setCollaborators(mockCollaborators)
      } catch (err: any) {
        console.error('加载协作者失败:', err)
      } finally {
        setCollaboratorsLoading(false)
      }
    }
    
    fetchCollaborators()
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

  // 邀请协作者
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setError('请输入邮箱地址')
      return
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setError('请输入有效的邮箱地址')
      return
    }
    
    setInviting(true)
    setError('')
    
    try {
      // TODO: 后端 API 支持后替换为真实 API 调用
      // await apiService.inviteCollaborator(projectId, { email: inviteEmail, role: inviteRole })
      
      // 模拟添加协作者
      const newCollaborator: Collaborator = {
        id: Date.now().toString(),
        userId: `user-${Date.now()}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'pending',
        invitedAt: new Date().toISOString(),
      }
      
      setCollaborators([...collaborators, newCollaborator])
      setInviteEmail('')
      setInviteRole('editor')
      alert('邀请已发送')
    } catch (err: any) {
      setError(err.message || '邀请失败')
    } finally {
      setInviting(false)
    }
  }

  // 移除协作者
  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm('确定要移除该协作者吗？')) return
    
    try {
      // TODO: 后端 API 支持后替换为真实 API 调用
      // await apiService.removeCollaborator(projectId, collaboratorId)
      
      setCollaborators(collaborators.filter(c => c.id !== collaboratorId))
      alert('已移除协作者')
    } catch (err: any) {
      setError(err.message || '移除失败')
    }
  }

  // 更新协作者权限
  const handleUpdateRole = async (collaboratorId: string, newRole: 'editor' | 'viewer') => {
    try {
      // TODO: 后端 API 支持后替换为真实 API 调用
      // await apiService.updateCollaboratorRole(projectId, collaboratorId, { role: newRole })
      
      setCollaborators(
        collaborators.map(c =>
          c.id === collaboratorId ? { ...c, role: newRole } : c
        )
      )
      alert('权限已更新')
    } catch (err: any) {
      setError(err.message || '更新权限失败')
    }
  }

  // 取消邀请
  const handleCancelInvite = async (collaboratorId: string) => {
    if (!confirm('确定要取消该邀请吗？')) return
    
    try {
      // TODO: 后端 API 支持后替换为真实 API 调用
      // await apiService.cancelInvite(projectId, collaboratorId)
      
      setCollaborators(collaborators.filter(c => c.id !== collaboratorId))
      alert('邀请已取消')
    } catch (err: any) {
      setError(err.message || '取消邀请失败')
    }
  }

  // 渲染协作者标签
  const renderCollaboratorStatus = (status: Collaborator['status']) => {
    if (status === 'active') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 8px',
          fontSize: '12px',
          borderRadius: '12px',
          backgroundColor: '#dcfce7',
          color: '#16a34a',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a', marginRight: '4px' }}></span>
          已加入
        </span>
      )
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: '12px',
        borderRadius: '12px',
        backgroundColor: '#fef3c7',
        color: '#d97706',
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d97706', marginRight: '4px' }}></span>
        等待中
      </span>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '32px' }}>项目设置</h1>
      
      {/* 标签页导航 */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '1px solid #e5e5e5',
        paddingBottom: '8px',
      }}>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'general' ? '#0070f3' : 'transparent',
            color: activeTab === 'general' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          常规设置
        </button>
        <button
          onClick={() => setActiveTab('collaborators')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'collaborators' ? '#0070f3' : 'transparent',
            color: activeTab === 'collaborators' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            position: 'relative',
          }}
        >
          协作者管理
          {collaborators.filter(c => c.status === 'pending').length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '18px',
              height: '18px',
              padding: '0 4px',
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '11px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {collaborators.filter(c => c.status === 'pending').length}
            </span>
          )}
        </button>
      </div>
      
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

      {/* 常规设置标签页 */}
      {activeTab === 'general' && (
        <>
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
        </>
      )}

      {/* 协作者管理标签页 */}
      {activeTab === 'collaborators' && (
        <div>
          {/* 邀请新协作者 */}
          <div style={{ 
            marginBottom: '32px', 
            padding: '20px', 
            backgroundColor: '#f9fafb', 
            borderRadius: '12px',
            border: '1px solid #e5e5e5',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>邀请协作者</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input 
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="输入邮箱地址"
                style={{ 
                  flex: '1', 
                  minWidth: '200px',
                  padding: '12px', 
                  border: '1px solid #e5e5e5', 
                  borderRadius: '8px' 
                }} 
              />
              <select 
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as 'editor' | 'viewer')}
                style={{ 
                  padding: '12px', 
                  border: '1px solid #e5e5e5', 
                  borderRadius: '8px',
                  minWidth: '120px',
                }}
              >
                <option value="editor">编辑者</option>
                <option value="viewer">查看者</option>
              </select>
              <button 
                onClick={handleInvite}
                disabled={inviting}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: inviting ? '#93c5fd' : '#0070f3', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: inviting ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {inviting ? '发送中...' : '发送邀请'}
              </button>
            </div>
            <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '13px', color: '#6b7280' }}>
              邀请后，对方将收到邮件通知，可选择接受或拒绝邀请
            </p>
          </div>

          {/* 协作者列表 */}
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
              协作者列表 ({collaborators.length})
            </h3>
            
            {collaboratorsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                加载中...
              </div>
            ) : collaborators.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#6b7280',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
              }}>
                暂无协作者
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {collaborators.map((collaborator) => (
                  <div 
                    key={collaborator.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px',
                      backgroundColor: 'white',
                      border: '1px solid #e5e5e5',
                      borderRadius: '12px',
                      gap: '16px',
                    }}
                  >
                    {/* 头像 */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: collaborator.avatar ? 'transparent' : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#374151',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}>
                      {collaborator.avatar ? (
                        <img src={collaborator.avatar} alt={collaborator.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        collaborator.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    {/* 信息 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600', color: '#111827' }}>{collaborator.name}</span>
                        {renderCollaboratorStatus(collaborator.status)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>{collaborator.email}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {collaborator.status === 'active' 
                          ? `加入于 ${new Date(collaborator.joinedAt!).toLocaleDateString('zh-CN')}`
                          : `邀请于 ${new Date(collaborator.invitedAt!).toLocaleDateString('zh-CN')}`
                        }
                      </div>
                    </div>
                    
                    {/* 权限选择 */}
                    {collaborator.role !== 'owner' && (
                      <select
                        value={collaborator.role}
                        onChange={(e) => handleUpdateRole(collaborator.id, e.target.value as 'editor' | 'viewer')}
                        disabled={collaborator.status === 'pending'}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px',
                          backgroundColor: collaborator.status === 'pending' ? '#f3f4f6' : 'white',
                          cursor: collaborator.status === 'pending' ? 'not-allowed' : 'pointer',
                          minWidth: '100px',
                        }}
                      >
                        <option value="editor">编辑者</option>
                        <option value="viewer">查看者</option>
                      </select>
                    )}
                    
                    {/* 权限标签 - 所有者 */}
                    {collaborator.role === 'owner' && (
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#f3e8ff',
                        color: '#7c3aed',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}>
                        所有者
                      </div>
                    )}
                    
                    {/* 操作按钮 */}
                    {collaborator.role !== 'owner' && (
                      <button
                        onClick={() => collaborator.status === 'pending' 
                          ? handleCancelInvite(collaborator.id)
                          : handleRemoveCollaborator(collaborator.id)
                        }
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'white',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'white'
                        }}
                      >
                        {collaborator.status === 'pending' ? '取消邀请' : '移除'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 权限说明 */}
          <div style={{ 
            marginTop: '32px', 
            padding: '20px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '12px',
            border: '1px solid #bae6fd',
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>
              权限说明
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(ROLE_PERMISSIONS).map(([role, info]) => (
                <div key={role} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: info.color,
                    marginTop: '6px',
                    flexShrink: 0,
                  }}></div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{info.label}</span>
                    <span style={{ color: '#6b7280', marginLeft: '8px' }}>{info.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setActiveTab('general')}
              style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid #e5e5e5', borderRadius: '8px', cursor: 'pointer' }}
            >
              返回常规设置
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 动态导出以禁用 SSR
export default dynamic(() => Promise.resolve(ProjectSettingsPage), { ssr: false })
