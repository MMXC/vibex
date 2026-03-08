'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactFlow, {
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import FlowEditor, { FlowNode, FlowEdge } from '@/components/ui/FlowEditor';
import FlowPropertiesPanel from '@/components/ui/FlowPropertiesPanel';
import { apiService } from '@/services/api';
import styles from './flow.module.css';

// Node templates for the library
interface NodeTemplate {
  type: string;
  label: string;
  icon: string;
  category: string;
  color: string;
  defaultData: Record<string, unknown>;
}

const nodeTemplates: NodeTemplate[] = [
  {
    type: 'input',
    label: '用户输入',
    icon: '📥',
    category: '输入节点',
    color: '#06b6d4',
    defaultData: { label: '用户输入', description: '' },
  },
  {
    type: 'llm',
    label: 'LLM 调用',
    icon: '🤖',
    category: '处理节点',
    color: '#a855f7',
    defaultData: { label: 'LLM 调用', model: 'gpt-4', prompt: '' },
  },
  {
    type: 'condition',
    label: '条件判断',
    icon: '🔀',
    category: '处理节点',
    color: '#eab308',
    defaultData: { label: '条件判断', condition: '' },
  },
  {
    type: 'transform',
    label: '数据转换',
    icon: '⚡',
    category: '处理节点',
    color: '#ec4899',
    defaultData: { label: '数据转换', transform: '' },
  },
  {
    type: 'output',
    label: '输出结果',
    icon: '📤',
    category: '输出节点',
    color: '#22c55e',
    defaultData: { label: '输出结果', format: 'text' },
  },
  {
    type: 'storage',
    label: '数据存储',
    icon: '💾',
    category: '输出节点',
    color: '#3b82f6',
    defaultData: { label: '数据存储', collection: '' },
  },
];

// Default initial nodes when no flow exists
const defaultNodes: FlowNode[] = [
  {
    id: '1',
    position: { x: 100, y: 150 },
    data: { label: '用户输入', description: '' },
    style: {
      background: '#06b6d4',
      color: '#fff',
      border: '2px solid rgba(255,255,255,0.3)',
      borderRadius: '8px',
      padding: '12px 20px',
    },
  },
  {
    id: '2',
    position: { x: 350, y: 150 },
    data: { label: 'LLM 调用', model: 'gpt-4' },
    style: {
      background: '#a855f7',
      color: '#fff',
      border: '2px solid rgba(255,255,255,0.3)',
      borderRadius: '8px',
      padding: '12px 20px',
    },
  },
  {
    id: '3',
    position: { x: 600, y: 150 },
    data: { label: '输出结果', format: 'text' },
    style: {
      background: '#22c55e',
      color: '#fff',
      border: '2px solid rgba(255,255,255,0.3)',
      borderRadius: '8px',
      padding: '12px 20px',
    },
  },
];

const defaultEdges: FlowEdge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: false },
  { id: 'e2-3', source: '2', target: '3', animated: false },
];

function FlowContent() {
  const searchParams = useSearchParams();
  const flowId = searchParams.get('id');

  const [nodes, setNodes] = useState<FlowNode[]>(defaultNodes);
  const [edges, setEdges] = useState<FlowEdge[]>(defaultEdges);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<FlowEdge | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('输入节点');
  const [error, setError] = useState<string | null>(null);

  // AI Generation states
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const categories = ['输入节点', '处理节点', '输出节点'];

  // Load flow data
  useEffect(() => {
    async function loadFlow() {
      if (!flowId) {
        // No flow ID - use default
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const flow = await apiService.getFlow(flowId);

        if (flow.nodes && flow.nodes.length > 0) {
          setNodes(flow.nodes);
        }
        if (flow.edges && flow.edges.length > 0) {
          setEdges(flow.edges);
        }
      } catch (err) {
        console.error('Failed to load flow:', err);
        setError('加载流程图失败');
      } finally {
        setLoading(false);
      }
    }

    loadFlow();
  }, [flowId]);

  // Handle node changes
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const newNodes = [...nds];
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          const node = newNodes.find((n) => n.id === change.id);
          if (node) {
            node.position = change.position;
          }
        } else if (change.type === 'remove') {
          const index = newNodes.findIndex((n) => n.id === change.id);
          if (index !== -1) {
            newNodes.splice(index, 1);
          }
        }
      });
      return newNodes;
    });
  }, []);

  // Handle edge changes
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => {
      const newEdges = [...eds];
      changes.forEach((change) => {
        if (change.type === 'remove') {
          const index = newEdges.findIndex((e) => e.id === change.id);
          if (index !== -1) {
            newEdges.splice(index, 1);
          }
        }
      });
      return newEdges;
    });
  }, []);

  // Handle connection
  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const source = connection.source as string;
    const target = connection.target as string;
    setEdges((eds) => [
      ...eds,
      {
        id: `e${source}-${target}`,
        source,
        target,
        animated: false,
        style: { stroke: '#6b7280', strokeWidth: 2 },
      },
    ]);
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((node: FlowNode) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  // Handle edge click
  const handleEdgeClick = useCallback((edge: FlowEdge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  // Handle node drag stop - save position
  const handleNodesDragStop = useCallback((node: FlowNode) => {
    setNodes((nds) => nds.map((n) => (n.id === node.id ? node : n)));
  }, []);

  // Update node data
  const updateNodeData = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
        )
      );
      setSelectedNode((prev) =>
        prev?.id === nodeId
          ? { ...prev, data: { ...prev.data, ...data } }
          : prev
      );
    },
    []
  );

  // Update edge data
  const updateEdgeData = useCallback(
    (edgeId: string, data: Record<string, unknown>) => {
      setEdges((eds) =>
        eds.map((e) => (e.id === edgeId ? { ...e, ...data } : e))
      );
      setSelectedEdge((prev) =>
        prev?.id === edgeId ? { ...prev, ...data } : prev
      );
    },
    []
  );

  // Auto-layout function - arranges nodes in a hierarchical layout
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;

    // Build adjacency list for topological sorting
    const inDegree: Record<string, number> = {};
    const outEdges: Record<string, string[]> = {};

    nodes.forEach((node) => {
      inDegree[node.id] = 0;
      outEdges[node.id] = [];
    });

    edges.forEach((edge) => {
      if (inDegree[edge.target] !== undefined) {
        inDegree[edge.target]++;
      }
      if (outEdges[edge.source]) {
        outEdges[edge.source].push(edge.target);
      }
    });

    // Find root nodes (no incoming edges)
    const roots = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);

    // BFS to assign levels
    const levels: Record<string, number> = {};
    const queue = [...roots];
    roots.forEach((id) => (levels[id] = 0));

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levels[current];

      outEdges[current].forEach((target) => {
        if (levels[target] === undefined) {
          levels[target] = currentLevel + 1;
          queue.push(target);
        } else {
          levels[target] = Math.max(levels[target], currentLevel + 1);
        }
      });
    }

    // Handle disconnected nodes
    nodes.forEach((node) => {
      if (levels[node.id] === undefined) {
        levels[node.id] = 0;
      }
    });

    // Group nodes by level
    const levelGroups: Record<number, string[]> = {};
    Object.entries(levels).forEach(([nodeId, level]) => {
      if (!levelGroups[level]) levelGroups[level] = [];
      levelGroups[level].push(nodeId);
    });

    // Calculate new positions with animation
    const horizontalSpacing = 250;
    const verticalSpacing = 120;
    const startX = 100;
    const startY = 150;

    const newNodes = nodes.map((node) => {
      const level = levels[node.id];
      const levelNodes = levelGroups[level];
      const indexInLevel = levelNodes.indexOf(node.id);
      const nodesInLevel = levelNodes.length;

      const newX = startX + level * horizontalSpacing;
      const newY =
        startY + (indexInLevel - (nodesInLevel - 1) / 2) * verticalSpacing;

      return {
        ...node,
        position: { x: newX, y: newY },
        style: {
          ...node.style,
          transition: 'all 0.5s ease-in-out',
        },
      };
    });

    setNodes(newNodes);

    // Clear transition after animation completes
    setTimeout(() => {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          style: {
            ...n.style,
            transition: undefined,
          },
        }))
      );
    }, 500);
  }, [nodes, edges]);

  // Save flow
  const handleSave = useCallback(async () => {
    if (!flowId) {
      // In a real app, create a new flow first
      console.log('No flow ID - would create new flow');
      return;
    }

    try {
      setSaving(true);
      await apiService.updateFlow(flowId, { nodes, edges });
    } catch (err) {
      console.error('Failed to save flow:', err);
      setError('保存失败');
    } finally {
      setSaving(false);
    }
  }, [flowId, nodes, edges]);

  // AI Generate flow
  const handleAIGenerate = useCallback(async () => {
    if (!aiDescription.trim()) {
      setError('请输入流程描述');
      return;
    }

    try {
      setAiGenerating(true);
      setError(null);

      const result = await apiService.generateFlow(aiDescription);

      if (result.nodes && result.nodes.length > 0) {
        setNodes(result.nodes);
        setEdges(result.edges || []);
        setShowAIGenerate(false);
        setAiDescription('');
      } else {
        setError('AI 生成的流程为空');
      }
    } catch (err: unknown) {
      console.error('AI generation failed:', err);
      setError(err instanceof Error ? err.message : 'AI 生成失败，请稍后重试');
    } finally {
      setAiGenerating(false);
    }
  }, [aiDescription]);

  // Get filtered templates
  const filteredTemplates = nodeTemplates.filter(
    (t) => t.category === selectedCategory
  );

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <span className={styles.loadingIcon}>◈</span>
          <p>加载中...</p>
        </div>
      </div>
    );
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
          {flowId && <span className={styles.flowId}>#{flowId}</span>}
        </div>
        <div className={styles.toolbarRight}>
          <button
            className={styles.aiGenerateBtn}
            onClick={() => setShowAIGenerate(true)}
            title="AI 生成流程"
          >
            ✨ AI 生成
          </button>
          <button
            className={styles.toolbarBtn}
            onClick={handleAutoLayout}
            title="自动布局"
          >
            ⊞ 自动布局
          </button>
          <button className={styles.toolbarBtn}>⟲ 撤销</button>
          <button className={styles.toolbarBtn}>↩ 重做</button>
          <button
            className={styles.primaryBtn}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '💾 保存'}
          </button>
        </div>
      </header>

      {/* Error toast */}
      {error && (
        <div className={styles.errorToast}>
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAIGenerate && (
        <div
          className={styles.modalOverlay}
          onClick={() => !aiGenerating && setShowAIGenerate(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>✨ AI 生成流程</h2>
              <button
                className={styles.modalClose}
                onClick={() => !aiGenerating && setShowAIGenerate(false)}
                disabled={aiGenerating}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.inputLabel}>
                描述你想要创建的流程：
              </label>
              <textarea
                className={styles.aiInput}
                placeholder="例如：创建一个用户登录流程，包含输入用户名密码、验证身份、返回登录结果..."
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                disabled={aiGenerating}
                rows={5}
              />
              <div className={styles.aiHint}>💡 描述越详细，生成结果越准确</div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowAIGenerate(false)}
                disabled={aiGenerating}
              >
                取消
              </button>
              <button
                className={styles.generateBtn}
                onClick={handleAIGenerate}
                disabled={aiGenerating || !aiDescription.trim()}
              >
                {aiGenerating ? (
                  <>
                    <span className={styles.spinner}></span>
                    生成中...
                  </>
                ) : (
                  '✨ 开始生成'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'application/reactflow',
                    JSON.stringify({
                      type: template.type,
                      data: template.defaultData,
                      color: template.color,
                    })
                  );
                }}
                className={styles.nodeTemplate}
                style={{ borderColor: template.color }}
              >
                <span className={styles.nodeIcon}>{template.icon}</span>
                <span className={styles.nodeLabel}>{template.label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Flow Editor Canvas */}
        <main className={styles.canvas}>
          <FlowEditor
            initialNodes={nodes}
            initialEdges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onNodesDragStop={handleNodesDragStop}
            showControls
            showMiniMap={false}
            showBackground
            backgroundColor="rgba(255,255,255,0.05)"
            fitView
            fitViewOptions={{ padding: 0.2 }}
          />
        </main>

        {/* Properties Panel */}
        <FlowPropertiesPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onNodeChange={updateNodeData}
          onEdgeChange={updateEdgeData}
          onDeleteNode={(nodeId) => {
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) =>
              eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
            );
            setSelectedNode(null);
          }}
          onDeleteEdge={(edgeId) => {
            setEdges((eds) => eds.filter((e) => e.id !== edgeId));
            setSelectedEdge(null);
          }}
        />
      </div>
    </div>
  );
}

// Loading fallback
function FlowLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.loading}>
        <span className={styles.loadingIcon}>◈</span>
        <p>加载中...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function FlowPage() {
  return (
    <Suspense fallback={<FlowLoading />}>
      <FlowContent />
    </Suspense>
  );
}
