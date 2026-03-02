'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './requirements.module.css'
import { apiService, Requirement, RequirementCreate } from '@/services/api'

export default function NewRequirement() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [templateId, setTemplateId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const storedUserId = localStorage.getItem('user_id')
    
    if (!token) {
      router.push('/auth')
      return
    }
    
    setUserId(storedUserId)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError('请输入需求描述')
      return
    }

    if (!userId) {
      setError('请先登录')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const requirementData: RequirementCreate = {
        content: content.trim(),
        templateId: templateId || undefined,
        userId,
      }

      // 调用 API 创建需求
      // 注意：后端 API 尚未实现，这里模拟创建
      const newRequirement: Requirement = {
        id: `req-${Date.now()}`,
        userId,
        content: requirementData.content,
        templateId: requirementData.templateId,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      console.log('Created requirement:', newRequirement)
      
      // 跳转到需求详情页或领域模型页
      router.push(`/requirements/${newRequirement.id}`)
    } catch (err: any) {
      setError(err.message || '创建需求失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 模板选项
  const templates = [
    { id: 'ecommerce', name: '电商系统', description: '商品展示、购物车、订单管理' },
    { id: 'crm', name: 'CRM 系统', description: '客户管理、销售跟踪、数据分析' },
    { id: 'cms', name: '内容管理系统', description: '文章发布、用户管理、权限控制' },
    { id: 'saas', name: 'SaaS 平台', description: '多租户、订阅管理、计费系统' },
    { id: 'custom', name: '自定义', description: '根据您的具体需求定制' },
  ]

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
          <Link href="/dashboard" className={styles.logoLink}>
            <span className={styles.logoIcon}>◈</span>
            <span>VibeX</span>
          </Link>
        </div>
        
        <nav className={styles.sidebarNav}>
          <Link href="/dashboard" className={styles.navItem}>
            <span className={styles.navIcon}>⊞</span>
            <span>项目</span>
          </Link>
          <Link href="/templates" className={styles.navItem}>
            <span className={styles.navIcon}>◫</span>
            <span>模板</span>
          </Link>
          <Link href="/requirements/new" className={`${styles.navItem} ${styles.active}`}>
            <span className={styles.navIcon}>📝</span>
            <span>新需求</span>
          </Link>
        </nav>
      </aside>

      {/* 主内容 */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>创建新需求</h1>
            <p className={styles.subtitle}>描述您的 AI 应用需求，AI 将自动分析并生成原型</p>
          </div>
        </header>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 模板选择 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>选择模板 (可选)</h2>
            <div className={styles.templateGrid}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`${styles.templateCard} ${
                    templateId === template.id ? styles.selected : ''
                  }`}
                  onClick={() => setTemplateId(template.id)}
                >
                  <div className={styles.templateName}>{template.name}</div>
                  <div className={styles.templateDesc}>{template.description}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 需求描述 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>需求描述</h2>
            <textarea
              className={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请详细描述您的需求，例如：&#10;我想开发一个在线教育平台，包含以下功能：&#10;1. 用户注册和登录&#10;2. 课程浏览和购买&#10;3. 视频播放和进度追踪&#10;4. 作业提交和批改&#10;5. 讨论区和答疑系统"
              rows={12}
            />
            <div className={styles.hint}>
              描述越详细，AI 生成的原型越准确
            </div>
          </section>

          {/* 提交按钮 */}
          <div className={styles.actions}>
            <Link href="/dashboard" className={styles.cancelBtn}>
              取消
            </Link>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? '提交中...' : '开始生成原型'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
