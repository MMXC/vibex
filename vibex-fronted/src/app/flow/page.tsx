'use client'

import { useState } from 'react'

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
  category: string
}

const nodeTemplates: NodeTemplate[] = [
  { type: 'input', label: '用户输入', category: '输入节点' },
  { type: 'llm', label: 'LLM 调用', category: '处理节点' },
  { type: 'condition', label: '条件判断', category: '处理节点' },
  { type: 'output', label: '输出结果', category: '输出节点' },
]

export default function FlowEditor() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('输入节点')

  const categories = ['输入节点', '处理节点', '输出节点']

  const handleDragStart = (e: React.DragEvent, template: NodeTemplate) => {
    e.dataTransfer.setData('nodeType', template.type)
    e.dataTransfer.setData('nodeLabel', template.label)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('nodeType')
    const label = e.dataTransfer.getData('nodeLabel')
    if (!type) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newNode: Node = {
      id: Date.now().toString(),
      type,
      label,
      x,
      y,
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

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  const filteredTemplates = nodeTemplates.filter(
    (t) => t.category === selectedCategory
  )

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Node Library */}
      <aside
        style={{
          width: '240px',
          borderRight: '1px solid #e5e5e5',
          padding: '16px',
          backgroundColor: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>节点库</h2>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: '12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor:
                  selectedCategory === cat ? '#0070f3' : '#e5e5e5',
                color: selectedCategory === cat ? 'white' : '#333',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Node Templates */}
        <div style={{ flex: 1 }}>
          {filteredTemplates.map((template) => (
            <div
              key={template.type}
              draggable
              onDragStart={(e) => handleDragStart(e, template)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'grab',
              }}
            >
              {template.label}
            </div>
          ))}
        </div>
      </aside>

      {/* Canvas */}
      <main
        style={{ flex: 1, position: 'relative', backgroundColor: '#f5f5f5' }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '16px',
            fontSize: '20px',
            fontWeight: '600',
          }}
        >
          流程图编辑
        </div>

        {/* Canvas Area */}
        <div
          style={{
            position: 'absolute',
            top: '60px',
            left: '16px',
            right: '16px',
            bottom: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {nodes.length === 0 && (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
              }}
            >
              从左侧拖拽节点到画布
            </div>
          )}
          {nodes.map((node) => (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node.id)}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                padding: '16px 24px',
                backgroundColor:
                  selectedNodeId === node.id ? '#0070f3' : 'white',
                color: selectedNodeId === node.id ? 'white' : '#333',
                border: `2px solid ${selectedNodeId === node.id ? '#0050d3' : '#ddd'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              {node.label}
            </div>
          ))}
        </div>
      </main>

      {/* Properties Panel */}
      <aside
        style={{
          width: '280px',
          borderLeft: '1px solid #e5e5e5',
          padding: '16px',
          backgroundColor: '#fafafa',
        }}
      >
        <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>属性面板</h2>

        {selectedNode ? (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666' }}>
                节点类型
              </label>
              <div style={{ fontSize: '14px' }}>{selectedNode.type}</div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666' }}>
                节点名称
              </label>
              <input
                type="text"
                value={selectedNode.properties.name}
                onChange={(e) => {
                  setNodes((prev) =>
                    prev.map((n) =>
                      n.id === selectedNodeId
                        ? {
                            ...n,
                            properties: {
                              ...n.properties,
                              name: e.target.value,
                            },
                          }
                        : n
                    )
                  )
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                }}
              />
            </div>
            <button
              onClick={() => {
                setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId))
                setSelectedNodeId(null)
              }}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              删除节点
            </button>
          </div>
        ) : (
          <div style={{ color: '#999', fontSize: '14px' }}>请选择节点</div>
        )}
      </aside>
    </div>
  )
}
