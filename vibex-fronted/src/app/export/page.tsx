'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './export.module.css'

// PRD 导出格式选项
const prdFormats = [
  { id: 'markdown', name: 'Markdown (.md)', icon: '📝', description: '通用格式，便于版本控制和协作' },
  { id: 'pdf', name: 'PDF 文档', icon: '📄', description: '适合打印和正式文档' },
  { id: 'docx', name: 'Word 文档 (.docx)', icon: '📃', description: '适合编辑和协作审阅' },
  { id: 'html', name: 'HTML 网页', icon: '🌐', description: '适合在线展示和分享' },
]

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
  
  // PRD 导出相关状态
  const [activeTab, setActiveTab] = useState<'code' | 'prd'>('code')
  const [selectedPrdFormat, setSelectedPrdFormat] = useState('markdown')
  const [isPrdExporting, setIsPrdExporting] = useState(false)
  const [prdExportProgress, setPrdExportProgress] = useState(0)

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

  const handlePrdExport = () => {
    setIsPrdExporting(true)
    setPrdExportProgress(0)
    
    const interval = setInterval(() => {
      setPrdExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsPrdExporting(false)
          
          // 模拟下载触发
          const format = prdFormats.find(f => f.id === selectedPrdFormat)
          alert(`PRD 已导出为 ${format?.name || selectedPrdFormat} 格式！`)
          return 100
        }
        return prev + 20
      })
    }, 200)
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
            将您的项目或 PRD 导出为可用的格式
          </p>
        </div>

        {/* 标签页切换 */}
        <div className={styles.tabContainer}>
          <button 
            className={`${styles.tab} ${activeTab === 'code' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('code')}
          >
            💻 导出代码
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'prd' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('prd')}
          >
            📋 导出 PRD
          </button>
        </div>

        {/* 代码导出区域 */}
        {activeTab === 'code' && (
        <>
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
        </>
        )}

        {/* PRD 导出区域 */}
        {activeTab === 'prd' && (
        <>
        {/* PRD 导出格式选择 */}
        <div>
          <h2 className={styles.sectionTitle}>选择 PRD 导出格式</h2>
          <div className={styles.formatGrid}>
            {prdFormats.map(format => (
              <div
                key={format.id}
                onClick={() => setSelectedPrdFormat(format.id)}
                className={`${styles.formatCard} ${selectedPrdFormat === format.id ? styles.formatCardSelected : ''}`}
              >
                <div className={styles.formatIcon}>{format.icon}</div>
                <div className={styles.formatName}>{format.name}</div>
                <div className={styles.formatDesc}>{format.description}</div>
                {selectedPrdFormat === format.id && (
                  <div className={styles.selectedBadge}>
                    ✓ 已选择
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PRD 导出选项 */}
        <div>
          <h2 className={styles.sectionTitle}>PRD 导出选项</h2>
          <div className={styles.optionsCard}>
            <div className={styles.optionsGrid}>
              <label className={`${styles.optionItem} ${styles.optionItemEnabled}`}>
                <input type="checkbox" defaultChecked className={styles.checkbox} />
                <span className={styles.optionLabel}>需求概述</span>
              </label>
              <label className={`${styles.optionItem} ${styles.optionItemEnabled}`}>
                <input type="checkbox" defaultChecked className={styles.checkbox} />
                <span className={styles.optionLabel}>功能列表</span>
              </label>
              <label className={`${styles.optionItem} ${styles.optionItemEnabled}`}>
                <input type="checkbox" defaultChecked className={styles.checkbox} />
                <span className={styles.optionLabel}>用户故事</span>
              </label>
              <label className={`${styles.optionItem} ${styles.optionItemEnabled}`}>
                <input type="checkbox" defaultChecked className={styles.checkbox} />
                <span className={styles.optionLabel}>领域模型</span>
              </label>
              <label className={`${styles.optionItem} ${styles.optionItemEnabled}`}>
                <input type="checkbox" defaultChecked className={styles.checkbox} />
                <span className={styles.optionLabel}>技术规格</span>
              </label>
              <label className={styles.optionItem}>
                <input type="checkbox" className={styles.checkbox} />
                <span className={styles.optionLabel}>UI 原型截图</span>
              </label>
            </div>
          </div>
        </div>

        {/* PRD 导出预览 */}
        <div>
          <h2 className={styles.sectionTitle}>PRD 文档预览</h2>
          <div className={styles.previewCard}>
            <div className={styles.previewFolder}>📁 PRD 文档/</div>
            <div className={`${styles.previewFile} ${styles.previewIndent1}`}>📄 README.md</div>
            <div className={`${styles.previewFile} ${styles.previewIndent1}`}>📄 1.需求概述.md</div>
            <div className={`${styles.previewFile} ${styles.previewIndent1}`}>📄 2.功能列表.md</div>
            <div className={`${styles.previewFile} ${styles.previewIndent1}`}>📄 3.用户故事.md</div>
            <div className={`${styles.previewFile} ${styles.previewIndent1}`}>📄 4.领域模型.md</div>
            <div className={`${styles.previewFile} ${styles.previewIndent1}`}>📄 5.技术规格.md</div>
            <div className={`${styles.previewFile} ${styles.previewIndent1}`}>📁 assets/</div>
            <div className={`${styles.previewFile} ${styles.previewIndent2}`}>📁 images/</div>
          </div>
        </div>

        {/* PRD 导出按钮和进度 */}
        <div className={styles.actionCard}>
          {isPrdExporting ? (
            <div className={styles.progressContainer}>
              <div className={styles.progressHeader}>
                <span>正在导出 PRD...</span>
                <span>{prdExportProgress}%</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${prdExportProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className={styles.actionRow}>
              <div className={styles.actionInfo}>
                <div className={styles.actionTitle}>
                  准备导出 {prdFormats.find(f => f.id === selectedPrdFormat)?.name} 格式
                </div>
                <div className={styles.actionDesc}>
                  导出完整的 PRD 文档，包含需求分析、功能规格和领域模型
                </div>
              </div>
              <button onClick={handlePrdExport} className={styles.exportButton}>
                📋 导出 PRD
              </button>
            </div>
          )}
        </div>

        {/* PRD 使用说明 */}
        <div className={styles.guideCard}>
          <div className={styles.guideTitle}>📖 PRD 使用指南</div>
          <div className={styles.guideContent}>
            <p className={styles.guideStep}>
              <span className={styles.guideStepTitle}>Markdown 格式：</span><br/>
              适合版本控制和团队协作，可使用 Git 进行追踪
            </p>
            <p className={styles.guideStep}>
              <span className={styles.guideStepTitle}>PDF 格式：</span><br/>
              适合正式交付和打印，可直接发送给 stakeholders
            </p>
            <p className={styles.guideStep}>
              <span className={styles.guideStepTitle}>Word 格式：</span><br/>
              适合团队审阅和修改，支持多人协作编辑
            </p>
          </div>
        </div>
        </>
        )}
      </main>
    </div>
  )
}