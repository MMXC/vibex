'use client'

import { useState } from 'react'
import styles from './flow.module.css'

interface Node {
  id: string
  type: string
  label: string
  x: number
  y: number
  properties: Record<string, string>
}

interface NodeTemplate {
  type: string
  label: string
  icon: string
  category: string
  color: string
}

const nodeTemplates: NodeTemplate[] = [
  { type: 'input', label: '用户输入', icon: '📥', category: '输入节点', color: 'cyan' },
  { type: 'llm', label: 'LLM 调用', icon: '🤖', category: '处理节点', color: 'purple' },
  { type: 'condition', label: '条件判断', icon: '🔀', category: '处理节点', color: 'yellow' },
  { type: 'transform', label: '数据转换', icon: '⚡', category: '处理节点', color: 'pink' },
  { type: 'output', label: '输出结果', icon: '📤', category: '输出节点', color: 'green' },
  { type: 'storage', label: '数据存储', icon: '💾', category: '输出节点', color: 'blue' },
]

export default function FlowEditor() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', type: 'input', label: '用户输入', x: 100, y: 150, properties: { name: '输入节点', description: '' } },
    { id: '2', type: 'llm', label: 'LLM 调用', x: 350, y: 150, properties: { name: 'LLM', model: 'gpt-4' } },
    { id: '3', type: 'output', label: '输出结果', x: 600, y: 150, properties: { name: '输出', format: 'text' } },
  ])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('输入节点')

  const categories = ['输入节点', '处理节点', '输出节点']

  const handleDragStart = (e: React.DragEvent, template: NodeTemplate) => {
    e.dataTransfer.setData('nodeType', template.type)
    e.dataTransfer.setData('nodeLabel', template.label)
    e.dataTransfer.setData('nodeColor', template.color)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('nodeType')
    const label = e.dataTransfer.getData('nodeLabel')
    const color = e.dataTransfer.getData('nodeColor')
    if (!type) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - 60
    const y = e.clientY - rect.top - 25

    const newNode: Node = {
      id: Date.now().toString(),
      type,
      label,
      x: Math.max(0, x),
      y: Math.max(0, y),
      properties: { name: label, description: '' },
    }

    setNodes((prev) => [...prev, newNode])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId)
  }

  const handleNodeDrag = (e: React.MouseEvent, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    const startX = e.clientX
    const startY = e.clientY
    const nodeX = node.x
    const nodeY = node.y

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY
      setNodes(prev => prev.map(n => 
        n.id === nodeId 
          ? { ...n, x: Math.max(0, nodeX + dx), y: Math.max(0, nodeY + dy) }
          : n
      ))
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const deleteNode = () => {
    if (selectedNodeId) {
      setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId))
      setSelectedNodeId(null)
    }
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const filteredTemplates = nodeTemplates.filter(t => t.category === selectedCategory)

  const getNodeColor = (type: string) => {
    const template = nodeTemplates.find(t => t.type === type)
    return template?.color || 'cyan'
  }

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
          <span className={styles.pageTitle}>流程图编辑</span>
        </div>
        <div className={styles.toolbarRight}>
          <button className={styles.toolbarBtn}>⟲ 撤销</button>
          <button className={styles.toolbarBtn}>↩ 重做</button>
          <button className={styles.primaryBtn}>💾 保存</button>
        </div>
      </header>

      <div className={styles.workspace}>
        {/* Node Library */}
        <aside className={styles.nodePanel}>
          <h2 className={styles.panelTitle}>节点库</h2>

          {/* Category Tabs */}
          <div className={styles.categoryTabs}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`${styles.categoryTab} ${selectedCategory === cat ? styles.active : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Node Templates */}
          <div className={styles.nodeList}>
            {filteredTemplates.map((template) => (
              <div
                key={template.type}
                draggable
                onDragStart={(e) => handleDragStart(e, template)}
                className={`${styles.nodeTemplate} ${styles[template.color]}`}
              >
                <span className={styles.nodeIcon}>{template.icon}</span>
                <span className={styles.nodeLabel}>{template.label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <main 
          className={styles.canvas}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className={styles.canvasInner}>
            {/* 连接线 (简化版) */}
            {nodes.length > 1 && (
              <svg className={styles.connections}>
                {nodes.slice(0, -1).map((node, i) => (
                  <line
                    key={i}
                    x1={node.x + 60}
                    y1={node.y + 25}
                    x2={nodes[i + 1].x}
                    y2={nodes[i + 1].y + 25}
                    className={styles.connectionLine}
                  />
                ))}
              </svg>
            )}

            {/* Nodes */}
            {nodes.map((node) => {
              const color = getNodeColor(node.type)
              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node.id)}
                  onMouseDown={(e) => handleNodeDrag(e, node.id)}
                  className={`${styles.node} ${styles[color]} ${selectedNodeId === node.id ? styles.selected : ''}`}
                  style={{ left: node.x, top: node.y }}
                >
                  <span className={styles.nodeIcon}>{nodeTemplates.find(t => t.type === node.type)?.icon}</span>
                  <span className={styles.nodeLabel}>{node.label}</span>
                  {selectedNodeId === node.id && <span className={styles.selectedRing} />}
                </div>
              )
            })}

            {nodes.length === 0 && (
              <div className={styles.emptyCanvas}>
                <span className={styles.emptyIcon}>◈</span>
                <p>从左侧拖拽节点到画布</p>
              </div>
            )}
          </div>
        </main>

        {/* Properties Panel */}
        <aside className={styles.propsPanel}>
          <h2 className={styles.panelTitle}>属性面板</h2>

          {selectedNode ? (
            <div className={styles.propsContent}>
              <div className={styles.propGroup}>
                <label className={styles.propLabel}>节点类型</label>
                <div className={`${styles.typeTag} ${styles[getNodeColor(selectedNode.type)]}`}>
                  {nodeTemplates.find(t => t.type === selectedNode.type)?.icon} {selectedNode.type}
                </div>
              </div>

              <div className={styles.propGroup}>
                <label className={styles.propLabel}>节点名称</label>
                <input
                  type="text"
                  value={selectedNode.properties.name}
                  onChange={(e) => {
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNodeId
                          ? { ...n, properties: { ...n.properties, name: e.target.value } }
                          : n
                      )
                    )
                  }}
                  className={styles.propInput}
                />
              </div>

              <div className={styles.propGroup}>
                <label className={styles.propLabel}>描述</label>
                <textarea
                  value={selectedNode.properties.description || ''}
                  onChange={(e) => {
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNodeId
                          ? { ...n, properties: { ...n.properties, description: e.target.value } }
                          : n
                      )
                    )
                  }}
                  className={styles.propTextarea}
                  rows={3}
                  placeholder="添加节点描述..."
                />
              </div>

              <button className={styles.deleteBtn} onClick={deleteNode}>
                🗑️ 删除节点
              </button>
            </div>
          ) : (
            <div className={styles.emptyProps}>
              <span className={styles.emptyIcon}>◉</span>
              <p>请选择节点</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
