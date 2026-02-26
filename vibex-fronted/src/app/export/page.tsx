'use client'

import { useState } from 'react'
import Link from 'next/link'

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
    
    // 模拟导出过程
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* 顶部导航 */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 32px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3', textDecoration: 'none' }}>
            VibeX
          </Link>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link href="/dashboard" style={{ color: '#64748b', textDecoration: 'none' }}>控制台</Link>
            <Link href="/editor" style={{ color: '#64748b', textDecoration: 'none' }}>编辑器</Link>
            <Link href="/export" style={{ color: '#0070f3', fontWeight: 500, textDecoration: 'none' }}>导出</Link>
          </div>
        </div>
      </nav>

      <main style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            导出项目
          </h1>
          <p style={{ color: '#64748b' }}>
            将您的项目导出为可部署的代码
          </p>
        </div>

        {/* 导出格式选择 */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            选择导出格式
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {exportFormats.map(format => (
              <div
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                style={{
                  padding: '24px',
                  backgroundColor: selectedFormat === format.id ? '#eff6ff' : 'white',
                  border: selectedFormat === format.id ? '2px solid #0070f3' : '2px solid #e2e8f0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '32px' }}>{format.icon}</span>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>{format.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                      {format.description}
                    </div>
                  </div>
                </div>
                {selectedFormat === format.id && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    color: '#0070f3',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}>
                    ✓ 已选择
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 导出选项 */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            导出选项
          </h2>
          <div style={{ 
            padding: '24px', 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {exportOptions.map(option => (
                <label
                  key={option.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '12px',
                    backgroundColor: options[option.id] ? '#f0fdf4' : '#f8fafc',
                    borderRadius: '8px',
                    border: options[option.id] ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={options[option.id]}
                    onChange={() => toggleOption(option.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{option.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 导出预览 */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            导出内容预览
          </h2>
          <div style={{ 
            padding: '24px', 
            backgroundColor: '#1e293b', 
            borderRadius: '12px',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#e2e8f0',
          }}>
            <div style={{ marginBottom: '8px', color: '#94a3b8' }}>📁 my-vibex-project/</div>
            <div style={{ marginLeft: '24px', marginBottom: '8px' }}>📄 package.json</div>
            <div style={{ marginLeft: '24px', marginBottom: '8px' }}>📄 next.config.js</div>
            <div style={{ marginLeft: '24px', marginBottom: '8px' }}>📄 tsconfig.json</div>
            <div style={{ marginLeft: '24px', marginBottom: '8px' }}>📁 src/</div>
            <div style={{ marginLeft: '48px', marginBottom: '8px' }}>📁 app/</div>
            <div style={{ marginLeft: '72px', marginBottom: '8px' }}>📄 page.tsx</div>
            <div style={{ marginLeft: '72px', marginBottom: '8px' }}>📄 layout.tsx</div>
            <div style={{ marginLeft: '72px', marginBottom: '8px' }}>📄 globals.css</div>
            <div style={{ marginLeft: '48px', marginBottom: '8px' }}>📁 components/</div>
            <div style={{ marginLeft: '72px', marginBottom: '8px' }}>📁 ui/</div>
            <div style={{ marginLeft: '48px', marginBottom: '8px' }}>📁 public/</div>
            <div style={{ marginLeft: '24px' }}>📁 ...</div>
          </div>
        </div>

        {/* 导出按钮和进度 */}
        <div style={{ 
          padding: '24px', 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          border: '1px solid #e2e8f0',
        }}>
          {isExporting ? (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '12px',
                fontSize: '14px',
              }}>
                <span>正在导出...</span>
                <span>{exportProgress}%</span>
              </div>
              <div style={{
                height: '8px',
                backgroundColor: '#e2e8f0',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${exportProgress}%`,
                  backgroundColor: '#0070f3',
                  borderRadius: '4px',
                  transition: 'width 0.3s',
                }}></div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                  准备导出 {exportFormats.find(f => f.id === selectedFormat)?.name} 项目
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  导出后可以本地运行或部署到 Vercel、Netlify 等平台
                </div>
              </div>
              <button
                onClick={handleExport}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 500,
                }}
              >
                🚀 开始导出
              </button>
            </div>
          )}
        </div>

        {/* 部署说明 */}
        <div style={{ 
          marginTop: '24px', 
          padding: '20px', 
          backgroundColor: '#f0f9ff', 
          borderRadius: '12px',
          border: '1px solid #bae6fd',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0369a1', marginBottom: '12px' }}>
            📤 部署指南
          </div>
          <div style={{ fontSize: '13px', color: '#075985', lineHeight: '1.8' }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>1. 本地运行：</strong><br/>
              <code style={{ backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>npm install && npm run dev</code>
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>2. 构建生产版本：</strong><br/>
              <code style={{ backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>npm run build</code>
            </p>
            <p>
              <strong>3. 部署到 Vercel：</strong><br/>
              推送代码到 GitHub，导入 Vercel 即可自动部署
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
