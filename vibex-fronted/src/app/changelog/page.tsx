'use client'

import { useEffect, useState } from 'react'
import styles from './changelog.module.css'

interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
  commit?: string
}

interface VersionInfo {
  version: string
  commit: string
  timestamp: string
}

const mockChangelog: ChangelogEntry[] = [
  {
    version: '1.0.1',
    date: '2026-03-04',
    changes: [
      '🎨 风格统一优化：统一所有页面 UI 风格',
      '🔧 修复交互式确认流程',
      '📊 流程执行引擎实现',
      '🔐 用户角色权限检查 (RBAC)',
    ],
    commit: '8f533ea',
  },
  {
    version: '1.0.0',
    date: '2026-03-02',
    changes: [
      '🎉 全新 AI 原型设计工具上线',
      '✨ 支持需求输入 → 领域模型 → 原型生成完整流程',
      '📊 新增领域模型页面',
      '🎨 新增原型预览页面',
      '🚀 后端部署到 Cloudflare Workers',
      '📱 响应式设计，支持移动端',
    ],
  },
  {
    version: '0.9.0',
    date: '2026-02-15',
    changes: [
      '✨ 全新 UI/UX 设计',
      '🔐 用户认证系统',
      '📁 项目管理系统',
      '💬 AI 对话功能',
    ],
  },
  {
    version: '0.8.0',
    date: '2026-01-20',
    changes: [
      '🎨 初始版本发布',
      '📋 基础页面模板',
    ],
  },
]

export default function Changelog() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/version`)
        if (response.ok) {
          const data = await response.json()
          setVersionInfo(data)
        }
      } catch (error) {
        console.error('Failed to fetch version:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVersion()
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.bgEffect}>
        <div className={styles.gridOverlay} />
        <div className={styles.glowOrb} />
      </div>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>更新日志</h1>
          <p className={styles.subtitle}>VibeX 产品迭代记录</p>
          
          {versionInfo && (
            <div className={styles.versionInfo}>
              <span className={styles.versionBadge}>v{versionInfo.version}</span>
              <span className={styles.commitHash}>{versionInfo.commit}</span>
            </div>
          )}
        </header>

        <div className={styles.timeline}>
          {mockChangelog.map((entry, index) => (
            <div key={entry.version} className={styles.entry}>
              <div className={styles.entryHeader}>
                <span className={styles.version}>v{entry.version}</span>
                <span className={styles.date}>{entry.date}</span>
              </div>
              <ul className={styles.changes}>
                {entry.changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
              {entry.commit && (
                <div className={styles.commit}>Commit: {entry.commit}</div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
