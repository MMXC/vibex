'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './domain.module.css'
import { apiService, DomainEntity, EntityRelation, Project } from '@/services/api'

// 模拟领域数据（实际项目中会从 API 获取）
const mockDomains: DomainEntity[] = [
  {
    id: '1',
    requirementId: '1',
    name: 'User',
    type: 'user',
    description: '系统用户实体',
    attributes: [
      { name: 'id', type: 'string', required: true, description: '用户唯一标识' },
      { name: 'username', type: 'string', required: true, description: '用户名' },
      { name: 'email', type: 'string', required: true, description: '邮箱地址' },
      { name: 'password', type: 'string', required: true, description: '密码哈希' },
      { name: 'createdAt', type: 'datetime', required: true, description: '创建时间' },
    ],
    position: { x: 100, y: 100 },
  },
  {
    id: '2',
    requirementId: '1',
    name: 'Product',
    type: 'business',
    description: '产品实体',
    attributes: [
      { name: 'id', type: 'string', required: true, description: '产品唯一标识' },
      { name: 'name', type: 'string', required: true, description: '产品名称' },
      { name: 'price', type: 'number', required: true, description: '产品价格' },
      { name: 'description', type: 'string', required: false, description: '产品描述' },
    ],
    position: { x: 400, y: 100 },
  },
  {
    id: '3',
    requirementId: '1',
    name: 'Order',
    type: 'business',
    description: '订单实体',
    attributes: [
      { name: 'id', type: 'string', required: true, description: '订单唯一标识' },
      { name: 'userId', type: 'string', required: true, description: '用户ID' },
      { name: 'productId', type: 'string', required: true, description: '产品ID' },
      { name: 'quantity', type: 'number', required: true, description: '数量' },
      { name: 'totalPrice', type: 'number', required: true, description: '总价' },
    ],
    position: { x: 250, y: 300 },
  },
]

const mockRelations: EntityRelation[] = [
  { id: '1', fromEntityId: '3', toEntityId: '1', relationType: 'association', description: '下单用户' },
  { id: '2', fromEntityId: '3', toEntityId: '2', relationType: 'association', description: '包含产品' },
]

const entityTypeStyles: Record<string, { color: string; label: string }> = {
  user: { color: '#3b82f6', label: '用户' },
  business: { color: '#10b981', label: '业务' },
  system: { color: '#f59e0b', label: '系统' },
  data: { color: '#8b5cf6', label: '数据' },
}

const relationTypeStyles: Record<string, { color: string; label: string }> = {
  inheritance: { color: '#8b5cf6', label: '继承' },
  composition: { color: '#00ff88', label: '组合' },
  aggregation: { color: '#00d4ff', label: '聚合' },
  association: { color: '#ffa500', label: '关联' },
  dependency: { color: '#ff6b6b', label: '依赖' },
  realization: { color: '#ff69b4', label: '实现' },
}

export default function DomainPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  
  const [project, setProject] = useState<Project | null>(null)
  const [domains, setDomains] = useState<DomainEntity[]>([])
  const [relations, setRelations] = useState<EntityRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedEntity, setSelectedEntity] = useState<DomainEntity | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/auth')
      return
    }

    const fetchData = async () => {
      try {
        if (projectId) {
          const projectData = await apiService.getProject(projectId)
          setProject(projectData)
        }
        
        setDomains(mockDomains)
        setRelations(mockRelations)
      } catch (err: any) {
        setError(err.message || '加载数据失败')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId, router])

  const filteredDomains = filterType === 'all' 
    ? domains 
    : domains.filter(d => d.type === filterType)

  const getRelationLabel = (relation: EntityRelation) => {
    const source = domains.find(d => d.id === relation.fromEntityId)
    const target = domains.find(d => d.id === relation.toEntityId)
    return `${source?.name} → ${target?.name} (${relation.relationType})`
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>重试</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>领域模型</h1>
          {project && <span className={styles.projectName}>{project.name}</span>}
        </div>
        <div className={styles.headerRight}>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className={styles.filter}
          >
            <option value="all">全部类型</option>
            <option value="user">用户</option>
            <option value="business">业务</option>
            <option value="system">系统</option>
            <option value="data">数据</option>
          </select>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
            >
              网格
            </button>
            <button 
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              列表
            </button>
          </div>
          <Link href={`/requirements${projectId ? `?projectId=${projectId}` : ''}`} className={styles.backLink}>
            返回需求
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.entityList}>
          <h2>实体列表 ({filteredDomains.length})</h2>
          {filteredDomains.map(entity => (
            <div 
              key={entity.id}
              className={`${styles.entityCard} ${selectedEntity?.id === entity.id ? styles.selected : ''}`}
              onClick={() => setSelectedEntity(entity)}
            >
              <div className={styles.entityHeader}>
                <span 
                  className={styles.entityType}
                  style={{ backgroundColor: entityTypeStyles[entity.type]?.color || '#666' }}
                >
                  {entityTypeStyles[entity.type]?.label || entity.type}
                </span>
                <h3>{entity.name}</h3>
              </div>
              <p className={styles.entityDesc}>{entity.description}</p>
              <div className={styles.entityAttrs}>
                {entity.attributes.slice(0, 3).map(attr => (
                  <span key={attr.name} className={styles.attrTag}>
                    {attr.name}
                    {attr.required && <span className={styles.required}>*</span>}
                  </span>
                ))}
                {entity.attributes.length > 3 && (
                  <span className={styles.moreAttrs}>+{entity.attributes.length - 3}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.relationList}>
          <h2>关系列表 ({relations.length})</h2>
          {relations.map(relation => (
            <div key={relation.id} className={styles.relationCard}>
              <span 
                className={styles.relationType}
                style={{ backgroundColor: relationTypeStyles[relation.relationType]?.color || '#666' }}
              >
                {relationTypeStyles[relation.relationType]?.label || relation.relationType}
              </span>
              <span className={styles.relationLabel}>{relation.description}</span>
            </div>
          ))}
        </div>
      </main>

      {selectedEntity && (
        <div className={styles.entityDetail}>
          <div className={styles.detailHeader}>
            <h2>{selectedEntity.name}</h2>
            <button onClick={() => setSelectedEntity(null)} className={styles.closeBtn}>×</button>
          </div>
          <p>{selectedEntity.description}</p>
          <h3>属性</h3>
          <table className={styles.attrTable}>
            <thead>
              <tr>
                <th>名称</th>
                <th>类型</th>
                <th>必填</th>
                <th>描述</th>
              </tr>
            </thead>
            <tbody>
              {selectedEntity.attributes.map(attr => (
                <tr key={attr.name}>
                  <td>{attr.name}</td>
                  <td><code>{attr.type}</code></td>
                  <td>{attr.required ? '是' : '否'}</td>
                  <td>{attr.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
