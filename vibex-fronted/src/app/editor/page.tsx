'use client'

import { useState } from 'react'

// 模拟组件库
const components = [
  { id: 'text', name: '文本', icon: 'T', category: '基础' },
  { id: 'image', name: '图片', icon: '🖼️', category: '基础' },
  { id: 'button', name: '按钮', icon: '▢', category: '基础' },
  { id: 'input', name: '输入框', icon: '✎', category: '表单' },
  { id: 'textarea', name: '文本域', icon: '📝', category: '表单' },
  { id: 'select', name: '下拉选择', icon: '▼', category: '表单' },
  { id: 'checkbox', name: '复选框', icon: '☑', category: '表单' },
  { id: 'card', name: '卡片', icon: '▭', category: '布局' },
  { id: 'grid', name: '网格', icon: '⊞', category: '布局' },
  { id: 'flex', name: '弹性盒', icon: '⬜', category: '布局' },
  { id: 'navbar', name: '导航栏', icon: '☰', category: '导航' },
  { id: 'footer', name: '页脚', icon: '━', category: '导航' },
  { id: 'tabs', name: '标签页', icon: '⊔', category: '导航' },
  { id: 'modal', name: '弹窗', icon: '◻', category: '反馈' },
  { id: 'toast', name: '提示', icon: '💬', category: '反馈' },
  { id: 'accordion', name: '折叠面板', icon: '▼', category: '反馈' },
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
    { id: '1', type: 'navbar', name: '导航栏', props: { title: '我的网站', links: ['首页', '关于', '产品', '联系'] } },
    { id: '2', type: 'text', name: '标题文本', props: { content: '欢迎来到我的网站', level: 1 } },
    { id: '3', type: 'text', name: '正文文本', props: { content: '这是一个使用 VibeX 构建的现代网站。', level: 'body' } },
    { id: '4', type: 'button', name: '按钮', props: { text: '立即开始', variant: 'primary' } },
    { id: '5', type: 'card', name: '卡片', props: { title: '特性一', content: '快速构建您的 Web 应用' } },
  ])
  const [activeTab, setActiveTab] = useState<'components' | 'layers' | 'settings'>('components')

  const addComponent = (type: string, name: string) => {
    const newComponent: EditorComponent = {
      id: String(Date.now()),
      type,
      name,
      props: getDefaultProps(type),
    }
    setEditorComponents(prev => [...prev, newComponent])
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
        return <Tag style={comp.props.level === 1 ? { fontSize: '32px', fontWeight: 'bold' } : {}}>{comp.props.content}</Tag>
      case 'button':
        return (
          <button style={{
            padding: '10px 20px',
            backgroundColor: comp.props.variant === 'primary' ? '#0070f3' : '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}>
            {comp.props.text}
          </button>
        )
      case 'card':
        return (
          <div style={{
            padding: '20px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            backgroundColor: 'white',
          }}>
            <h3 style={{ marginBottom: '8px' }}>{comp.props.title}</h3>
            <p style={{ color: '#64748b', margin: 0 }}>{comp.props.content}</p>
          </div>
        )
      case 'navbar':
        return (
          <nav style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontWeight: 'bold' }}>{comp.props.title}</span>
            <div style={{ display: 'flex', gap: '16px' }}>
              {comp.props.links?.map((link: string, i: number) => (
                <span key={i} style={{ color: '#64748b' }}>{link}</span>
              ))}
            </div>
          </nav>
        )
      default:
        return <div style={{ padding: '20px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>[{comp.name}]</div>
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部工具栏 */}
      <div style={{
        padding: '12px 24px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{ fontSize: '20px', fontWeight: 'bold', color: '#0070f3', textDecoration: 'none' }}>
            VibeX
          </a>
          <span style={{ color: '#94a3b8' }}>/</span>
          <span style={{ fontWeight: 500 }}>页面编辑器</span>
          <span style={{ 
            padding: '4px 8px', 
            backgroundColor: '#fef3c7', 
            color: '#92400e', 
            borderRadius: '4px', 
            fontSize: '12px' 
          }}>
            未保存
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}>
            👁️ 预览
          </button>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}>
            💾 保存
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex' }}>
        {/* 左侧组件面板 */}
        <div style={{
          width: '260px',
          backgroundColor: 'white',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Tab 切换 */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
          }}>
            {(['components', 'layers', 'settings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #0070f3' : '2px solid transparent',
                  color: activeTab === tab ? '#0070f3' : '#64748b',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {tab === 'components' ? '组件' : tab === 'layers' ? '图层' : '设置'}
              </button>
            ))}
          </div>

          {/* 组件列表 */}
          {activeTab === 'components' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {['基础', '表单', '布局', '导航', '反馈'].map(category => (
                <div key={category} style={{ marginBottom: '16px' }}>
                  <h4 style={{ 
                    fontSize: '12px', 
                    color: '#94a3b8', 
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}>
                    {category}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {components
                      .filter(c => c.category === category)
                      .map(comp => (
                        <button
                          key={comp.id}
                          onClick={() => addComponent(comp.id, comp.name)}
                          style={{
                            padding: '10px 8px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span style={{ fontSize: '18px' }}>{comp.icon}</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{comp.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 图层列表 */}
          {activeTab === 'layers' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {editorComponents.map((comp, index) => (
                <div
                  key={comp.id}
                  onClick={() => setSelectedComponent(comp.id)}
                  style={{
                    padding: '10px 12px',
                    marginBottom: '4px',
                    backgroundColor: selectedComponent === comp.id ? '#eff6ff' : '#f8fafc',
                    border: selectedComponent === comp.id ? '1px solid #0070f3' : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '13px' }}>{comp.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteComponent(comp.id); }}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 设置面板 */}
          {activeTab === 'settings' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>页面设置</h4>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  页面标题
                </label>
                <input
                  type="text"
                  defaultValue="我的页面"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  页面描述
                </label>
                <textarea
                  rows={3}
                  defaultValue="这是一个使用 VibeX 构建的页面"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 中间画布 */}
        <div style={{
          flex: 1,
          backgroundColor: '#f1f5f9',
          padding: '32px',
          overflow: 'auto',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '800px',
            minHeight: '600px',
            margin: '0 auto',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            {editorComponents.map(comp => (
              <div
                key={comp.id}
                onClick={() => setSelectedComponent(comp.id)}
                style={{
                  padding: selectedComponent === comp.id ? '8px' : '0',
                  margin: selectedComponent === comp.id ? '-8px' : '0',
                  border: selectedComponent === comp.id ? '2px solid #0070f3' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {renderComponent(comp)}
              </div>
            ))}
            {editorComponents.length === 0 && (
              <div style={{ 
                padding: '80px', 
                textAlign: 'center', 
                color: '#94a3b8',
              }}>
                <p style={{ fontSize: '18px', marginBottom: '8px' }}>👈</p>
                <p>从左侧拖拽或点击组件添加到画布</p>
              </div>
            )}
          </div>
        </div>

        {/* 右侧属性面板 */}
        <div style={{
          width: '280px',
          backgroundColor: 'white',
          borderLeft: '1px solid #e2e8f0',
          padding: '16px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#64748b' }}>
            属性
          </h3>
          
          {selectedComponent ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  组件名称
                </label>
                <input
                  type="text"
                  value={editorComponents.find(c => c.id === selectedComponent)?.name || ''}
                  onChange={(e) => {
                    const name = e.target.value
                    setEditorComponents(prev => prev.map(c => 
                      c.id === selectedComponent ? { ...c, name } : c
                    ))
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  组件类型
                </label>
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}>
                  {editorComponents.find(c => c.id === selectedComponent)?.type}
                </div>
              </div>

              {/* 根据不同组件类型显示不同属性 */}
              {selectedComponent && (
                <div>
                  {Object.entries(editorComponents.find(c => c.id === selectedComponent)?.props || {}).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                        {key}
                      </label>
                      {typeof value === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateComponentProps(selectedComponent, { [key]: e.target.checked })}
                        />
                      ) : typeof value === 'object' ? (
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{JSON.stringify(value)}</div>
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateComponentProps(selectedComponent, { [key]: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '14px',
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
              选择一个组件查看属性
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
