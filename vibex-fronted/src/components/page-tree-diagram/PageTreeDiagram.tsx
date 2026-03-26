/**
 * PageTreeDiagram - 页面树节点组件图
 * 基于 ReactFlow 实现可视化页面结构展示
 */

'use client';

import { useCallback, useMemo } from 'react';
import { ReactFlow, 
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  NodeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PageNode } from './nodes/PageNode';
import { ComponentNode } from './nodes/ComponentNode';
import { SectionNode } from './nodes/SectionNode';
import styles from './PageTreeDiagram.module.css';

// 节点类型定义
export interface PageTreeNode {
  id: string;
  type: 'page' | 'component' | 'section';
  name: string;
  children?: PageTreeNode[];
}

// 节点类型映射
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = {
  page: PageNode,
  component: ComponentNode,
  section: SectionNode,
};

interface PageTreeDiagramProps {
  data: PageTreeNode[];
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string;
  direction?: 'TB' | 'LR';
  showControls?: boolean;
  showBackground?: boolean;
}

// 默认节点样式
const defaultNodeStyle = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
  backgroundColor: '#fff',
  fontSize: '12px',
};

export function PageTreeDiagram({
  data,
  onNodeClick,
  selectedNodeId,
  direction = 'TB',
  showControls = true,
  showBackground = true,
}: PageTreeDiagramProps) {
  // F1.1: ReactFlow 节点渲染
  // F1.4: 节点类型区分 (page/component/section)
  
  // 将树形数据转换为 ReactFlow 节点
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    let nodeIndex = 0;

    // 计算节点位置
    const calculatePosition = (
      node: PageTreeNode,
      parentX: number,
      parentY: number,
      depth: number
    ): { x: number; y: number; width: number } => {
      const horizontalSpacing = direction === 'LR' ? 200 : 180;
      const verticalSpacing = direction === 'TB' ? 100 : 80;
      
      const x = parentX + (direction === 'LR' ? horizontalSpacing : 0);
      const y = parentY + (direction === 'TB' ? verticalSpacing : 0);
      
      // 计算子树的宽度
      let subtreeWidth = 0;
      if (node.children && node.children.length > 0) {
        subtreeWidth = node.children.reduce((sum, child) => {
          const childResult = calculatePosition(child, x, y, depth + 1);
          return sum + childResult.width;
        }, 0);
      }
      
      return { x, y, width: Math.max(subtreeWidth, horizontalSpacing) };
    };

    // 递归构建节点和边
    const buildNodes = (nodes: PageTreeNode[], parentId: string | null = null, y = 0) => {
      nodes.forEach((node) => {
        const pos = calculatePosition(node, 0, y, 0);
        
        const colors = {
          page: { bg: '#e3f2fd', border: '#1976d2', icon: '📄' },
          component: { bg: '#e8f5e9', border: '#388e3c', icon: '🧩' },
          section: { bg: '#fff3e0', border: '#f57c00', icon: '📦' },
        };
        
        const colorScheme = colors[node.type];
        
        const flowNode: Node = {
          id: node.id,
          type: node.type,
          position: { x: pos.x, y: pos.y },
          data: { 
            label: node.name,
            icon: colorScheme.icon,
            nodeType: node.type,
          },
          style: {
            ...defaultNodeStyle,
            backgroundColor: colorScheme.bg,
            borderColor: selectedNodeId === node.id ? colorScheme.border : '#e0e0e0',
            borderWidth: selectedNodeId === node.id ? '2px' : '1px',
          },
        };
        
        flowNodes.push(flowNode);
        
        // 创建连线
        if (parentId) {
          flowEdges.push({
            id: `${parentId}-${node.id}`,
            source: parentId,
            target: node.id,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#bdbdbd', strokeWidth: 1.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#bdbdbd',
            },
          });
        }
        
        // 递归处理子节点
        if (node.children && node.children.length > 0) {
          buildNodes(node.children, node.id, pos.y);
        }
        
        nodeIndex++;
      });
    };

    buildNodes(data);
    
    return { nodes: flowNodes, edges: flowEdges };
  }, [data, selectedNodeId, direction]);

  // F2.1: 点击事件回调
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  // F3.1, F3.2: 缩放和平移由 ReactFlow 默认支持

  return (
    <div className={styles.container}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        {showControls && <Controls />}
        {showBackground && <Background variant={BackgroundVariant.Dots} gap={12} size={1} />}
      </ReactFlow>
    </div>
  );
}

export default PageTreeDiagram;
