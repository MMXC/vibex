'use client'

import { useState } from 'react'
import styles from './editor.module.css'

// 模拟组件库
const components = [
  { id: 'text', name: '文本', icon: 'T', category: '基础' },
  { id: 'image', name: '图片', icon: '🖼️', category: '基础' },
  { id: 'button', name: '按钮', icon: '▢', category: '基础' },
  { id: 'input', name: '输入框', icon: '✎', category: '表单' },
  { id: 'textarea', name: '文本域', icon: '📝', category: '表单' },
  { id: 'select', name: '下拉选择', icon: '▼', category: '表单' },
  { id: 'card', name: '卡片', icon: '▭', category: '布局' },
  { id: 'grid', name: '网格', icon: '⊞', category: '布局' },
  { id: 'navbar', name: '导航栏', icon: '☰', category: '导航' },
  { id: 'modal', name: '弹窗', icon: '◻', category: '反馈' },
  { id: 'toast', name: '提示', icon: '💬', category: '反馈' },
]

// 编辑器组件
interface EditorComponent {
  id: string
  type: string
  name: string
  props: Record<string, any>
}

export default function Editor() {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [editorComponents, setEditorComponents] = useState<EditorComponent[]>([
    { id: '1', type: 'navbar', name: '导航栏', props: { title: 'VibeX', links: ['首页', '关于', '产品', '联系'] } },
    { id: '2', type: 'text', name: '标题文本', props: { content: '欢迎来到 VibeX', level: 1 } },
    { id: '3', type: 'text', name: '正文文本', props: { content: '使用 AI 快速构建现代 Web 应用', level: 'body' } },
    { id: '4', type: 'button', name: '按钮', props: { text: '立即开始', variant: 'primary' } },
  ])
  const [activeTab, setActiveTab] = useState<'components' | 'layers' | 'settings'>('components')
  const [isSaved, setIsSaved] = useState(true)
  const [saving, setSaving] = useState(false)

  const addComponent = (type: string, name: string) => {
    const newComponent: EditorComponent = {
      id: String(Date.now()),
      type,
      name,
      props: getDefaultProps(type),
    }
    setEditorComponents(prev => [...prev, newComponent])
  }

  // 保存页面
  const handleSave = async () => {
    setSaving(true)
    try {
      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 500))
      setIsSaved(true)
      alert('保存成功')
    } catch (err) {
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const getDefaultProps = (type: string) => {
    const defaults: Record<string, any> = {
      text: { content: '新文本', level: 'body' },
      image: { src: '/placeholder.jpg', alt: '图片' },
      button: { text: '按钮', variant: 'primary' },
      input: { placeholder: '请输入...', label: '标签' },
      card: { title: '卡片标题', content: '卡片内容' },
    }
    return defaults[type] || {}
  }

  const deleteComponent = (id: string) => {
    setEditorComponents(prev => prev.filter(c => c.id !== id))
    if (selectedComponent === id) setSelectedComponent(null)
  }

  const updateComponentProps = (id: string, props: Record<string, any>) => {
    setEditorComponents(prev => prev.map(c => 
      c.id === id ? { ...c, props: { ...c.props, ...props } } : c
    ))
  }

  const renderComponent = (comp: EditorComponent) => {
    switch (comp.type) {
      case 'text':
        const Tag = comp.props.level === 1 ? 'h1' : comp.props.level === 2 ? 'h2' : 'p'
        const style = comp.props.level === 1 
          ? { fontSize: '32px', fontWeight: 'bold', background: 'linear-gradient(135deg, #00ffff 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
          : { color: '#a0a0b0' }
        return <Tag style={style}>{comp.props.content}</Tag>
      case 'button':
        return (
          <button className={styles.previewButton}>
            {comp.props.text}
          </button>
        )
      case 'card':
        return (
          <div className={styles.previewCard}>
            <h3>{comp.props.title}</h3>
            <p>{comp.props.content}</p>
          </div>
        )
      case 'navbar':
        return (
          <nav className={styles.previewNav}>
            <span className={styles.logo}>{comp.props.title}</span>
            <div className={styles.navLinks}>
              {comp.props.links?.map((link: string, i: number) => (
                <span key={i}>{link}</span>
              ))}
            </div>
          </nav>
        )
      default:
        return <div className={styles.previewPlaceholder}>[{comp.name}]</div>
    }
  }

  const selectedComp = editorComponents.find(c => c.id === selectedComponent)

  return (
    <div className={styles.page}>
      {/* 背景特效 */}
      <div className={styles.bgEffect}>
        <div className={styles.gridOverlay} />
      </div>

      {/* 顶部工具栏 */}
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <a href="/" className={styles.logo}>
            <span>◈</span> VibeX
          </a>
          <span className={styles.divider}>/</span>
          <span className={styles.pageTitle}>页面编辑器</span>
          <span className={`${styles.statusBadge} ${isSaved ? styles.saved : styles.unsaved}`}>
            {isSaved ? '✓ 已保存' : '未保存'}
          </span>
        </div>
        <div className={styles.toolbarRight}>
          <button className={styles.toolbarBtn}>
            👁️ 预览
          </button>
          <button 
            className={styles.primaryBtn}
            onClick={() => handleSave()}
            disabled={saving}
          >
            {saving ? '保存中...' : '💾 保存'}
          </button>
        </div>
      </header>

      <div className={styles.workspace}>
        {/* 左侧组件面板 */}
        <aside className={styles.leftPanel}>
          {/* Tab 切换 */}
          <div className={styles.tabs}>
            {([
              { key: 'components', label: '组件' },
              { key: 'layers', label: '图层' },
              { key: 'settings', label: '设置' }
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 组件列表 */}
          {activeTab === 'components' && (
            <div className={styles.componentList}>
              {['基础', '表单', '布局', '导航', '反馈'].map(category => (
                <div key={category} className={styles.componentCategory}>
                  <h4 className={styles.categoryTitle}>{category}</h4>
                  <div className={styles.componentGrid}>
                    {components
                      .filter(c => c.category === category)
                      .map(comp => (
                        <button
                          key={comp.id}
                          onClick={() => addComponent(comp.id, comp.name)}
                          className={styles.componentItem}
                        >
                          <span className={styles.componentIcon}>{comp.icon}</span>
                          <span className={styles.componentName}>{comp.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 图层列表 */}
          {activeTab === 'layers' && (
            <div className={styles.layersList}>
              {editorComponents.map((comp, index) => (
                <div
                  key={comp.id}
                  onClick={() => setSelectedComponent(comp.id)}
                  className={`${styles.layerItem} ${selectedComponent === comp.id ? styles.active : ''}`}
                >
                  <span className={styles.layerIndex}>{index + 1}</span>
                  <span className={styles.layerName}>{comp.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteComponent(comp.id); }}
                    className={styles.deleteBtn}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 设置面板 */}
          {activeTab === 'settings' && (
            <div className={styles.settingsPanel}>
              <h4 className={styles.settingsTitle}>页面设置</h4>
              <div className={styles.formGroup}>
                <label>页面标题</label>
                <input type="text" defaultValue="我的页面" className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label>页面描述</label>
                <textarea rows={3} defaultValue="VibeX 构建的页面" className={styles.textarea} />
              </div>
            </div>
          )}
        </aside>

        {/* 中间画布 */}
        <main className={styles.canvas}>
          <div className={styles.canvasInner}>
            {editorComponents.map(comp => (
              <div
                key={comp.id}
                onClick={() => setSelectedComponent(comp.id)}
                className={`${styles.componentWrapper} ${selectedComponent === comp.id ? styles.selected : ''}`}
              >
                {renderComponent(comp)}
              </div>
            ))}
            {editorComponents.length === 0 && (
              <div className={styles.emptyCanvas}>
                <span className={styles.emptyIcon}>◈</span>
                <p>从左侧添加组件到画布</p>
              </div>
            )}
          </div>
        </main>

        {/* 右侧属性面板 */}
        <aside className={styles.rightPanel}>
          <h3 className={styles.panelTitle}>属性</h3>
          
          {selectedComp ? (
            <div className={styles.propsPanel}>
              <div className={styles.formGroup}>
                <label>组件名称</label>
                <input
                  type="text"
                  value={selectedComp.name}
                  onChange={(e) => {
                    setEditorComponents(prev => prev.map(c => 
                      c.id === selectedComponent ? { ...c, name: e.target.value } : c
                    ))
                  }}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>组件类型</label>
                <div className={styles.typeTag}>{selectedComp.type}</div>
              </div>

              <div className={styles.propsList}>
                <h4 className={styles.propsTitle}>属性</h4>
                {Object.entries(selectedComp.props).map(([key, value]) => (
                  <div key={key} className={styles.formGroup}>
                    <label>{key}</label>
                    {typeof value === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => updateComponentProps(selectedComponent!, { [key]: e.target.checked })}
                        className={styles.checkbox}
                      />
                    ) : (
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => updateComponentProps(selectedComponent!, { [key]: e.target.value })}
                        className={styles.input}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyProps}>
              选择一个组件查看属性
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
