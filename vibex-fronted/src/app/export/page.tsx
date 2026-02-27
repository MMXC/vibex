'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './export.module.css'

// 导出格式选项
const exportFormats = [
  { id: 'react-next', name: 'React + Next.js', icon: '⚛️', description: '现代 React 框架，适合构建复杂 Web 应用' },
  { id: 'react-vite', name: 'React + Vite', icon: '⚡', description: '轻量级 React 项目构建工具' },
  { id: 'vue', name: 'Vue 3', icon: '💚', description: '渐进式 JavaScript 框架' },
  { id: 'html', name: '原生 HTML/CSS/JS', icon: '🌐', description: '纯静态页面，无需构建工具' },
]

// 导出选项
const exportOptions = [
  { id: 'typescript', name: 'TypeScript', enabled: true },
  { id: 'styling', name: 'CSS Modules', enabled: true },
  { id: 'components', name: '组件化代码', enabled: true },
  { id: 'assets', name: '包含资源文件', enabled: true },
]

export default function Export() {
  const [selectedFormat, setSelectedFormat] = useState('react-next')
  const [options, setOptions] = useState<{[key: string]: boolean}>(exportOptions.reduce((acc, opt) => ({ ...acc, [opt.id]: opt.enabled }), {}))
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const handleExport = () => {
    setIsExporting(true)
    setExportProgress(0)
    
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsExporting(false)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const toggleOption = (id: string) => {
    setOptions(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className={styles.page}>
      {/* 背景特效 */}
      <div className={styles.bgEffect}>
        <div className={styles.gridOverlay} />
        <div className={styles.glowOrb1} />
        <div className={styles.glowOrb2} />
      </div>

      {/* 顶部导航 */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◈</span>
          <span className={styles.logoText}>VibeX</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/dashboard" className={styles.navLink}>控制台</Link>
          <Link href="/editor" className={styles.navLink}>编辑器</Link>
          <Link href="/export" className={`${styles.navLink} ${styles.navLinkActive}`}>导出</Link>
        </div>
      </nav>

      <main className={styles.main}>
        {/* 页面标题 */}
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>
            导出
            <span className={styles.titleGradient}>项目</span>
          </h1>
          <p className={styles.subtitle}>
            将您的项目导出为可部署的代码
          </p>
        </div>

        {/* 导出格式选择 */}
        <div>
          <h2 className={styles.sectionTitle}>选择导出格式</h2>
          <div className={styles.formatGrid}>
            {exportFormats.map(format => (
              <div
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`${styles.formatCard} ${selectedFormat === format.id ? styles.formatCardSelected : ''}`}
              >
                <div className={styles.formatIcon}>{format.icon}</div>
                <div className={styles.formatName}>{format.name}</div>
                <div className={styles.formatDesc}>{format.description}</div>
                {selectedFormat === format.id && (
                  <div className={styles.selectedBadge}>
                    ✓ 已选择
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 导出选项 */}
        <div>
          <h2 className={styles.sectionTitle}>导出选项</h2>
          <div className={styles.optionsCard}>
            <div className={styles.optionsGrid}>
              {exportOptions.map(option => (
                <label
                  key={option.id}
                  className={`${styles.optionItem} ${options[option.id] ? styles.optionItemEnabled : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={options[option.id]}
                    onChange={() => toggleOption(option.id)}
                    className={styles.checkbox}
                  />
                  <span className={styles.optionLabel}>{option.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 导出预览 */}
        <div>
          <h2 className={styles.sectionTitle}>导出内容预览</h2>
          <div className={styles.previewCard}>
            <div className={styles.previewFolder}>📁 my-vibex-project/</div>
            <div className={`${styles.previewFile} ${styles.previewIndent1}`}>📄 package.json</div>
            <div className={`${styles.previewFile} ${styles.previewIndent1}`}>📄 next.config.js</div>
            <div className={`${styles.previewFile} ${styles.previewIndent1}`}>📄 tsconfig.json</div>
            <div className={`${styles.previewFile} ${styles.previewIndent1}`}>📁 src/</div>
            <div className={`${styles.previewFile} ${styles.previewIndent2}`}>📁 app/</div>
            <div className={`${styles.previewFile} ${styles.previewIndent3}`}>📄 page.tsx</div>
            <div className={`${styles.previewFile} ${styles.previewIndent3}`}>📄 layout.tsx</div>
            <div className={`${styles.previewFile} ${styles.previewIndent3}`}>📄 globals.css</div>
            <div className={`${styles.previewFile} ${styles.previewIndent2}`}>📁 components/</div>
            <div className={`${styles.previewFile} ${styles.previewIndent3}`}>📁 ui/</div>
            <div className={`${styles.previewFile} ${styles.previewIndent2}`}>📁 public/</div>
            <div className={`${styles.previewFile} ${styles.previewIndent1}`}>📁 ...</div>
          </div>
        </div>

        {/* 导出按钮和进度 */}
        <div className={styles.actionCard}>
          {isExporting ? (
            <div className={styles.progressContainer}>
              <div className={styles.progressHeader}>
                <span>正在导出...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className={styles.actionRow}>
              <div className={styles.actionInfo}>
                <div className={styles.actionTitle}>
                  准备导出 {exportFormats.find(f => f.id === selectedFormat)?.name} 项目
                </div>
                <div className={styles.actionDesc}>
                  导出后可以本地运行或部署到 Vercel、Cloudflare 等平台
                </div>
              </div>
              <button onClick={handleExport} className={styles.exportButton}>
                🚀 开始导出
              </button>
            </div>
          )}
        </div>

        {/* 部署说明 */}
        <div className={styles.guideCard}>
          <div className={styles.guideTitle}>📤 部署指南</div>
          <div className={styles.guideContent}>
            <p className={styles.guideStep}>
              <span className={styles.guideStepTitle}>1. 本地运行：</span><br/>
              <code className={styles.code}>npm install && npm run dev</code>
            </p>
            <p className={styles.guideStep}>
              <span className={styles.guideStepTitle}>2. 构建生产版本：</span><br/>
              <code className={styles.code}>npm run build</code>
            </p>
            <p className={styles.guideStep}>
              <span className={styles.guideStepTitle}>3. 部署到 Cloudflare：</span><br/>
              推送代码到 GitHub，导入 Cloudflare Pages 即可自动部署
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}