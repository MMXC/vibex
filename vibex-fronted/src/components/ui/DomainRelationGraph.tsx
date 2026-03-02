'use client'

import { useCallback, useState, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import { toPng, toSvg } from 'html-to-image'
import 'reactflow/dist/style.css'
import styles from './DomainRelationGraph.module.css'

// Entity node types
const entityNodeTypes = {
  user: { color: '#3b82f6', label: '用户' },
  system: { color: '#8b5cf6', label: '系统' },
  business: { color: '#10b981', label: '业务' },
  data: { color: '#f59e0b', label: '数据' },
  external: { color: '#ef4444', label: '外部' },
  abstract: { color: '#6b7280', label: '抽象' },
}

export type DomainEntity = {
  id: string
  name: string
  type: keyof typeof entityNodeTypes
  description?: string
  position?: { x: number; y: number }
}

export type EntityRelation = {
  id: string
  sourceId: string
  targetId: string
  relationType: string
  requirementId?: string
  description?: string
}

export type DomainRelationGraphProps = {
  entities: DomainEntity[]
  relations: EntityRelation[]
  onEntityClick?: (entity: DomainEntity) => void
  onEntityDrag?: (entityId: string, position: { x: number; y: number }) => void
  readonly?: boolean
  showExportButton?: boolean
}

// Convert entities to React Flow nodes
function entitiesToNodes(entities: DomainEntity[]): Node[] {
  return entities.map((entity) => ({
    id: entity.id,
    position: entity.position || { 
      x: Math.random() * 500, 
      y: Math.random() * 400 
    },
    data: { 
      label: entity.name,
      type: entity.type,
      description: entity.description 
    },
    style: {
      background: entityNodeTypes[entity.type]?.color || '#6b7280',
      color: '#fff',
      border: '2px solid rgba(255,255,255,0.3)',
      borderRadius: '8px',
      padding: '10px 15px',
      fontSize: '14px',
      fontWeight: 500,
      minWidth: '120px',
      textAlign: 'center' as const,
    },
  }))
}

// Convert relations to React Flow edges
function relationsToEdges(relations: EntityRelation[]): Edge[] {
  const edgeStyles: Record<string, { dash?: string; color?: string }> = {
    inheritance: { dash: '5,5', color: '#3b82f6' },
    composition: { color: '#10b981' },
    aggregation: { color: '#8b5cf6' },
    association: { dash: '3,3', color: '#6b7280' },
    dependency: { dash: '5,5', color: '#f59e0b' },
    realization: { color: '#ef4444' },
  }

  return relations.map((relation) => ({
    id: relation.id,
    source: relation.sourceId,
    target: relation.targetId,
    label: relation.description || relation.relationType,
    type: 'smoothstep',
    animated: relation.relationType === 'dependency',
    style: { 
      stroke: edgeStyles[relation.relationType]?.color || '#6b7280',
      strokeWidth: 2,
    },
    dashArray: edgeStyles[relation.relationType]?.dash,
    markerEnd: {
      type: MarkerType.ArrowClosed as const,
      color: edgeStyles[relation.relationType]?.color || '#6b7280',
    },
  }))
}

export default function DomainRelationGraph({
  entities,
  relations,
  onEntityClick,
  onEntityDrag,
  readonly = false,
  showExportButton = true,
}: DomainRelationGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(entitiesToNodes(entities))
  const [edges, setEdges, onEdgesChange] = useEdgesState(relationsToEdges(relations))
  const [isExporting, setIsExporting] = useState(false)
  const reactFlowInstance = useReactFlow()
  const containerRef = useRef<HTMLDivElement>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onEntityDrag && !readonly) {
        onEntityDrag(node.id, node.position)
      }
    },
    [onEntityDrag, readonly]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onEntityClick) {
        const entity = entities.find((e) => e.id === node.id)
        if (entity) {
          onEntityClick(entity)
        }
      }
    },
    [entities, onEntityClick]
  )

  // Export to PNG
  const exportToPng = useCallback(async () => {
    if (!containerRef.current) return
    
    setIsExporting(true)
    try {
      const dataUrl = await toPng(containerRef.current, {
        backgroundColor: '#1a1a2e',
        quality: 0.95,
      })
      
      const link = document.createElement('a')
      link.download = `domain-model-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Failed to export as PNG:', error)
    } finally {
      setIsExporting(false)
    }
  }, [])

  // Export to SVG
  const exportToSvg = useCallback(async () => {
    if (!containerRef.current) return
    
    setIsExporting(true)
    try {
      const dataUrl = await toSvg(containerRef.current)
      
      const link = document.createElement('a')
      link.download = `domain-model-${Date.now()}.svg`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Failed to export as SVG:', error)
    } finally {
      setIsExporting(false)
    }
  }, [])

  return (
    <div className={styles.container} ref={containerRef}>
      {showExportButton && (
        <div className={styles.exportButtons}>
          <button 
            onClick={exportToPng} 
            disabled={isExporting}
            className={styles.exportBtn}
            title="导出为 PNG 图片"
          >
            📷 PNG
          </button>
          <button 
            onClick={exportToSvg} 
            disabled={isExporting}
            className={styles.exportBtn}
            title="导出为 SVG 矢量图"
          >
            📊 SVG
          </button>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
        nodesDraggable={!readonly}
        nodesConnectable={!readonly}
        elementsSelectable={!readonly}
      >
        <Controls className={styles.controls} />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="rgba(255,255,255,0.1)"
        />
      </ReactFlow>
      
      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendTitle}>实体类型</div>
        {Object.entries(entityNodeTypes).map(([type, config]) => (
          <div key={type} className={styles.legendItem}>
            <span 
              className={styles.legendColor} 
              style={{ background: config.color }}
            />
            <span>{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Wrap with ReactFlowProvider for useReactFlow hook
export function DomainRelationGraphWrapper(props: DomainRelationGraphProps) {
  return (
    <ReactFlowProvider>
      <DomainRelationGraph {...props} />
    </ReactFlowProvider>
  )
}
