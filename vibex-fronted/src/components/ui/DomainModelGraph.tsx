'use client'

import { useCallback, useMemo, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  BackgroundVariant,
  Panel,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'

export interface DomainProperty {
  name: string
  type: string
  required: boolean
}

export interface DomainModelNodeData {
  label: string
  type: 'aggregate_root' | 'entity' | 'value_object'
  properties: DomainProperty[]
  methods: string[]
}

const typeStyles = {
  aggregate_root: { background: '#4ade80', border: '#22c55e', label: '聚合根' },
  entity: { background: '#60a5fa', border: '#3b82f6', label: '实体' },
  value_object: { background: '#a78bfa', border: '#8b5cf6', label: '值对象' },
}

function DomainModelNode({ data, selected }: { data: DomainModelNodeData; selected: boolean }) {
  const style = typeStyles[data.type] || typeStyles.entity
  const hasMethods = data.methods && data.methods.length > 0
  
  return (
    <div
      style={{
        background: 'rgba(30, 30, 46, 0.95)',
        border: `2px solid ${selected ? '#fff' : style.border}`,
        borderRadius: '8px',
        minWidth: '180px',
        boxShadow: selected 
          ? '0 0 0 2px #fff, 0 4px 20px rgba(0,0,0,0.4)' 
          : '0 2px 10px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: style.background,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '13px', color: '#1a1a2e' }}>
          {data.label}
        </span>
        <span
          style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(0,0,0,0.2)',
            color: '#1a1a2e',
          }}
        >
          {style.label}
        </span>
      </div>
      
      {/* Properties */}
      <div style={{ padding: '8px 12px', borderBottom: hasMethods ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
        {data.properties?.map((prop, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.8)',
              fontFamily: 'monospace',
              padding: '2px 0',
            }}
          >
            <span>
              {prop.required && <span style={{ color: '#f87171' }}>*</span>}
              {prop.name}
            </span>
            <span style={{ color: '#60a5fa' }}>{prop.type}</span>
          </div>
        ))}
      </div>
      
      {/* Methods */}
      {hasMethods && (
        <div style={{ padding: '8px 12px' }}>
          {data.methods.map((method, idx) => (
            <div
              key={idx}
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.6)',
                fontFamily: 'monospace',
                padding: '2px 0',
              }}
            >
              +{method}()
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const nodeTypes: NodeTypes = {
  domainModel: DomainModelNode,
}

export interface DomainModelGraphProps {
  models: Array<{
    id: string
    name: string
    type: 'aggregate_root' | 'entity' | 'value_object'
    properties: DomainProperty[]
    methods: string[]
  }>
  relationships?: Array<{
    id: string
    fromModelId: string
    toModelId: string
    type: 'association' | 'aggregation' | 'composition' | 'inheritance'
    label?: string
  }>
  onModelsChange?: (models: Array<{
    id: string
    name: string
    type: 'aggregate_root' | 'entity' | 'value_object'
    properties: DomainProperty[]
    position: { x: number; y: number }
  }>) => void
  readOnly?: boolean
}

export default function DomainModelGraph({
  models,
  relationships = [],
  onModelsChange,
  readOnly = false,
}: DomainModelGraphProps) {
  const initialNodes: Node[] = useMemo(() => {
    return models.map((model, index) => ({
      id: model.id,
      type: 'domainModel',
      position: {
        x: (index % 3) * 280 + 50,
        y: Math.floor(index / 3) * 250 + 50,
      },
      data: {
        label: model.name,
        type: model.type,
        properties: model.properties || [],
        methods: model.methods || [],
      },
    }))
  }, [models])

  const relationshipStyles = {
    association: { stroke: '#60a5fa', label: '关联' },
    aggregation: { stroke: '#4ade80', label: '聚合' },
    composition: { stroke: '#a78bfa', label: '组合' },
    inheritance: { stroke: '#f59e0b', label: '继承' },
  }

  const initialEdges: Edge[] = useMemo(() => {
    return relationships.map((rel) => {
      const style = relationshipStyles[rel.type] || relationshipStyles.association
      return {
        id: rel.id,
        source: rel.fromModelId,
        target: rel.toModelId,
        label: rel.label || style.label,
        type: 'default',
        animated: rel.type === 'aggregation' || rel.type === 'composition',
        style: { stroke: style.stroke, strokeWidth: 2 },
        labelStyle: { fill: '#fff', fontSize: 11 },
        labelBgStyle: { fill: '#1e1e2e', fillOpacity: 0.9 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: style.stroke,
        },
      }
    })
  }, [relationships])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#60a5fa' } }, eds))
    },
    [setEdges, readOnly]
  )

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (readOnly || !onModelsChange) return
      const updatedModels = nodes.map((n) => ({
        id: n.id,
        name: n.data.label,
        type: n.data.type,
        properties: n.data.properties || [],
        position: n.position,
      }))
      onModelsChange(updatedModels)
    },
    [nodes, onModelsChange, readOnly]
  )

  // Update nodes when models change
  useMemo(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  useMemo(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  return (
    <div style={{ width: '100%', height: '600px', borderRadius: '12px', overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.1)" />
        <Controls style={{ background: '#1e1e2e', borderRadius: '8px' }} />
        <MiniMap
          style={{ background: '#1e1e2e', borderRadius: '8px' }}
          nodeColor={(node) => {
            const type = node.data?.type as keyof typeof typeStyles
            return typeStyles[type]?.background || '#60a5fa'
          }}
        />
        {models.length === 0 && (
          <Panel position="top-center">
            <div style={{ color: 'rgba(255,255,255,0.5)', padding: '20px' }}>
              暂无领域模型，请先确认限界上下文
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}
