'use client';

import { getAuthToken } from '@/lib/auth-token';
import { Suspense, useCallback, useEffect, useState, useMemo } from 'react';

/** Dev-only logger */
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args);
};
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './domain.module.css';
import {
  apiService,
  DomainEntity,
  EntityRelation,
  Project,
  EntityType,
  BoundedContext,
} from '@/services/api';
const { generateBoundedContext } = apiService;

import { useConfirmationStore, DomainModel } from '@/stores/confirmationStore';
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
  Handle,
  Position,
  MarkerType,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';

// 领域类型样式映射
const entityTypeStyles: Record<string, { color: string; label: string }> = {
  user: { color: '#3b82f6', label: '用户' },
  business: { color: '#10b981', label: '业务' },
  system: { color: '#f59e0b', label: '系统' },
  data: { color: '#8b5cf6', label: '数据' },
  external: { color: '#ec4899', label: '外部' },
  abstract: { color: '#6366f1', label: '抽象' },
};

const relationTypeStyles: Record<
  string,
  { color: string; label: string; strokeDasharray?: string }
> = {
  inheritance: { color: '#8b5cf6', label: '继承', strokeDasharray: '5 5' },
  composition: { color: '#00ff88', label: '组合' },
  aggregation: { color: '#00d4ff', label: '聚合' },
  association: { color: '#ffa500', label: '关联' },
  dependency: { color: '#ff6b6b', label: '依赖', strokeDasharray: '5 5' },
  realization: { color: '#ff69b4', label: '实现', strokeDasharray: '5 5' },
};

type TabType = 'graph' | 'list';

// 自定义节点组件
function EntityNode({
  data,
}: {
  data: {
    entity: DomainEntity;
    selected: boolean;
    onSelect: (e: unknown) => void;
  };
}) {
  const { entity, selected, onSelect } = data;
  const typeStyle = entityTypeStyles[entity.type] || {
    color: '#666',
    label: entity.type,
  };

  return (
    <div
      className={styles.flowNode}
      style={{
        borderColor: selected ? typeStyle.color : '#3f3f46',
        boxShadow: selected ? `0 0 20px ${typeStyle.color}40` : 'none',
      }}
      onClick={onSelect}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={styles.nodeHandle}
      />
      <div
        className={styles.nodeHeader}
        style={{ backgroundColor: `${typeStyle.color}20` }}
      >
        <span className={styles.nodeType} style={{ color: typeStyle.color }}>
          {typeStyle.label}
        </span>
      </div>
      <div className={styles.nodeContent}>
        <div className={styles.nodeName}>{entity.name}</div>
        <div className={styles.nodeDesc}>
          {entity.description || '暂无描述'}
        </div>
        <div className={styles.nodeAttrs}>
          {(entity.attributes || []).slice(0, 2).map((attr) => (
            <span key={attr.name} className={styles.nodeAttr}>
              {attr.name}
            </span>
          ))}
          {(entity.attributes || []).length > 2 && (
            <span className={styles.nodeAttrMore}>
              +{(entity.attributes || []).length - 2}
            </span>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className={styles.nodeHandle}
      />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  entity: EntityNode,
};

// 工具栏组件
function Toolbar({
  onAddEntity,
  onAddRelation,
  onSave,
  onGenerate,
  onOpenChat,
  hasChanges,
  hasRequirementText,
  generating,
}: {
  onAddEntity: () => void;
  onAddRelation: () => void;
  onSave: () => void;
  onGenerate: () => void;
  onOpenChat: () => void;
  hasChanges: boolean;
  hasRequirementText: boolean;
  generating: boolean;
}) {
  return (
    <div className={styles.toolbar}>
      <button
        onClick={onGenerate}
        className={styles.toolbarBtn}
        disabled={!hasRequirementText || generating}
        title={
          hasRequirementText ? '从需求生成限界上下文图' : '需要需求文本才能生成'
        }
      >
        <span>🤖</span> {generating ? '生成中...' : 'AI生成'}
      </button>
      <button onClick={onOpenChat} className={styles.toolbarBtn}>
        <span>💬</span> 对话修改
      </button>
      <button onClick={onAddEntity} className={styles.toolbarBtn}>
        <span>+</span> 添加实体
      </button>
      <button onClick={onAddRelation} className={styles.toolbarBtn}>
        <span>↔</span> 添加关系
      </button>
      <button
        onClick={onSave}
        className={`${styles.toolbarBtn} ${styles.saveBtn} ${hasChanges ? styles.hasChanges : ''}`}
      >
        <span>💾</span> 保存
      </button>
    </div>
  );
}

// 添加实体对话框
function AddEntityDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (entity: Partial<DomainEntity>) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<EntityType>('business');
  const [description, setDescription] = useState('');

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3>添加实体</h3>
        <div className={styles.formGroup}>
          <label>名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入实体名称"
          />
        </div>
        <div className={styles.formGroup}>
          <label>类型</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as EntityType)}
          >
            <option value="user">用户</option>
            <option value="business">业务</option>
            <option value="system">系统</option>
            <option value="data">数据</option>
            <option value="external">外部</option>
            <option value="abstract">抽象</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="输入实体描述"
          />
        </div>
        <div className={styles.dialogActions}>
          <button onClick={onClose} className={styles.cancelBtn}>
            取消
          </button>
          <button
            onClick={() => onSave({ name, type, description, attributes: [] })}
            className={styles.confirmBtn}
            disabled={!name.trim()}
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}

// 对话修改面板
function ChatModifyPanel({
  entities,
  onAddEntity,
  onDeleteEntity,
  onUpdateEntity,
  onClose,
}: {
  entities: DomainEntity[];
  onAddEntity: (entity: Partial<DomainEntity>) => void;
  onDeleteEntity: (entityId: string) => void;
  onUpdateEntity: (entityId: string, data: Partial<DomainEntity>) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [processing, setProcessing] = useState(false);

  const parseIntent = (text: string): { action: string; entityName?: string; params?: Record<string, unknown> } | null => {
    const lowerText = text.toLowerCase();
    
    // 添加实体意图
    if (lowerText.includes('添加') || lowerText.includes('创建') || lowerText.includes('新增')) {
      const entityMatch = text.match(/(?:添加|创建|新增)\s*(?:一个\s*)?(?:名为\s*)?["']?([^"'\s，。]+)["']?\s*(?:实体)?/);
      if (entityMatch) {
        return { action: 'add', entityName: entityMatch[1] };
      }
      // 简单匹配：添加XXX
      const simpleMatch = text.match(/添加\s*(\S+)/);
      if (simpleMatch) {
        return { action: 'add', entityName: simpleMatch[1] };
      }
    }
    
    // 删除实体意图
    if (lowerText.includes('删除') || lowerText.includes('移除')) {
      const entityMatch = text.match(/(?:删除|移除)\s*(?:名为\s*)?["']?([^"'\s，。]+)["']?\s*(?:实体)?/);
      if (entityMatch) {
        return { action: 'delete', entityName: entityMatch[1] };
      }
    }
    
    // 修改实体意图
    if (lowerText.includes('修改') || lowerText.includes('更新') || lowerText.includes('编辑')) {
      const entityMatch = text.match(/(?:修改|更新|编辑)\s*(?:名为\s*)?["']?([^"'\s，。]+)["']?\s*(?:实体)?/);
      if (entityMatch) {
        return { action: 'update', entityName: entityMatch[1] };
      }
    }
    
    return null;
  };

  const findEntityByName = (name: string): DomainEntity | undefined => {
    return entities.find(e => e.name.toLowerCase() === name.toLowerCase() || e.name.includes(name));
  };

  const handleSubmit = async () => {
    if (!input.trim() || processing) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setProcessing(true);
    
    try {
      const intent = parseIntent(userMessage);
      
      if (!intent) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '抱歉，我无法理解您的指令。请尝试使用以下格式：\n• 添加 [实体名称] 实体\n• 删除 [实体名称] 实体\n• 修改 [实体名称] 实体' 
        }]);
        return;
      }
      
      switch (intent.action) {
        case 'add':
          if (intent.entityName) {
            onAddEntity({
              name: intent.entityName,
              type: 'business',
              description: `通过对话创建的实体：${intent.entityName}`,
              attributes: [],
            });
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: `✅ 已成功添加实体"${intent.entityName}"` 
            }]);
          }
          break;
          
        case 'delete':
          if (intent.entityName) {
            const entity = findEntityByName(intent.entityName);
            if (entity) {
              onDeleteEntity(entity.id);
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `✅ 已成功删除实体"${intent.entityName}"` 
              }]);
            } else {
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `❌ 未找到名为"${intent.entityName}"的实体` 
              }]);
            }
          }
          break;
          
        case 'update':
          if (intent.entityName) {
            const entity = findEntityByName(intent.entityName);
            if (entity) {
              onUpdateEntity(entity.id, { description: `${entity.description || ''} (已更新)` });
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `✅ 已成功修改实体"${intent.entityName}"` 
              }]);
            } else {
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `❌ 未找到名为"${intent.entityName}"的实体` 
              }]);
            }
          }
          break;
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.chatPanel} data-testid="chat-modify-panel">
      <div className={styles.chatPanelHeader}>
        <h3>💬 对话修改</h3>
        <button onClick={onClose} className={styles.closeBtn}>×</button>
      </div>
      <div className={styles.chatMessages}>
        <div className={styles.chatHint}>
          您可以对我说：<br/>
          • 添加用户实体<br/>
          • 删除订单实体<br/>
          • 修改商品实体
        </div>
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`${styles.chatMessage} ${styles[msg.role]}`}
            data-testid={`chat-message-${idx}`}
          >
            {msg.content}
          </div>
        ))}
      </div>
      <div className={styles.chatInput}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="输入指令，如：添加用户实体"
          data-testid="chat-input"
        />
        <button 
          onClick={handleSubmit} 
          disabled={processing || !input.trim()}
          data-testid="chat-submit-btn"
        >
          发送
        </button>
      </div>
    </div>
  );
}

// 添加关系对话框
function AddRelationDialog({
  entities,
  onClose,
  onSave,
}: {
  entities: DomainEntity[];
  onClose: () => void;
  onSave: (relation: Partial<EntityRelation>) => void;
}) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [relationType, setRelationType] = useState('association');
  const [description, setDescription] = useState('');

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3>添加关系</h3>
        <div className={styles.formGroup}>
          <label>源实体</label>
          <select value={fromId} onChange={(e) => setFromId(e.target.value)}>
            <option value="">选择源实体</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>目标实体</label>
          <select value={toId} onChange={(e) => setToId(e.target.value)}>
            <option value="">选择目标实体</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>关系类型</label>
          <select
            value={relationType}
            onChange={(e) => setRelationType(e.target.value)}
          >
            <option value="inheritance">继承</option>
            <option value="composition">组合</option>
            <option value="aggregation">聚合</option>
            <option value="association">关联</option>
            <option value="dependency">依赖</option>
            <option value="realization">实现</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>描述</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="输入关系描述"
          />
        </div>
        <div className={styles.dialogActions}>
          <button onClick={onClose} className={styles.cancelBtn}>
            取消
          </button>
          <button
            onClick={() =>
              onSave({
                fromEntityId: fromId,
                toEntityId: toId,
                relationType,
                description,
              })
            }
            className={styles.confirmBtn}
            disabled={!fromId || !toId}
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}

// Flow 图表组件
function DomainFlow({
  entities,
  relations,
  onEntitySelect,
  selectedEntityId,
  onNodesChange,
  onEdgesChange,
  nodes,
  edges,
  onConnect,
}: {
  entities: DomainEntity[];
  relations: EntityRelation[];
  onEntitySelect: (entity: DomainEntity) => void;
  selectedEntityId: string | null;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  nodes: Node[];
  edges: Edge[];
  onConnect: (connection: Connection) => void;
}) {
  const defaultEdgeOptions = {
    type: 'smoothstep',
    style: { strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  };

  return (
    <div className={styles.flowContainer}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls className={styles.flowControls} />
        <MiniMap
          className={styles.flowMinimap}
          nodeColor={(node) => {
            const entity = node.data?.entity as DomainEntity;
            return entity
              ? entityTypeStyles[entity.type]?.color || '#666'
              : '#666';
          }}
        />
        <Background color="#3f3f46" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}

function DomainPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const requirementId = searchParams.get('requirementId');

  const [project, setProject] = useState<Project | null>(null);
  const [requirementText, setRequirementText] = useState('');
  const [domains, setDomains] = useState<DomainEntity[]>([]);
  const [relations, setRelations] = useState<EntityRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabType>('graph');
  const [selectedEntity, setSelectedEntity] = useState<DomainEntity | null>(
    null
  );
  const [filterType, setFilterType] = useState<string>('all');
  const [hasChanges, setHasChanges] = useState(false);
  const [collapsedEntities, setCollapsedEntities] = useState<Set<string>>(new Set());

  // React Flow 状态
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 对话框状态
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);

  // Confirmation flow store
  const { setDomainModels, currentStep, goToNextStep } = useConfirmationStore();

  // Handle confirmation and navigate to /confirm/model
  const handleConfirmAndProceed = () => {
    // Convert domain entities to domain models for the confirmation flow
    const domainModels: DomainModel[] = domains.map((entity) => ({
      id: entity.id,
      name: entity.name,
      contextId: 'default',
      type: 'entity' as const,
      description: entity.description || '',
      properties: (entity.attributes || []).map((attr) => ({
        name: attr.name,
        type: attr.type,
        required: attr.required,
        description: attr.description || '',
      })),
      methods: [],
    }));

    setDomainModels(domainModels);
    goToNextStep();
    router.push('/');
  };

  // 转换实体为 React Flow 节点
  const convertToNodes = useCallback(
    (entities: DomainEntity[]): Node[] => {
      return entities.map((entity, index) => {
        const typeStyle = entityTypeStyles[entity.type] || {
          color: '#666',
          label: entity.type,
        };
        // 使用存储的位置或自动计算
        const position = entity.position || {
          x: 100 + (index % 4) * 280,
          y: 100 + Math.floor(index / 4) * 200,
        };

        return {
          id: entity.id,
          type: 'entity',
          position,
          data: {
            entity,
            selected: selectedEntity?.id === entity.id,
            onSelect: (e: unknown) => {
              (e as React.MouseEvent).stopPropagation();
              setSelectedEntity(entity);
            },
          },
          draggable: true,
        };
      });
    },
    [selectedEntity]
  );

  // 转换关系为 React Flow 边
  const convertToEdges = useCallback(
    (rels: EntityRelation[], ents: DomainEntity[]): Edge[] => {
      const entityMap = new Map(ents.map((e) => [e.id, e]));

      return rels.map((relation) => {
        const relStyle = relationTypeStyles[relation.relationType] || {
          color: '#666',
          label: relation.relationType,
        };

        return {
          id: relation.id,
          source: relation.fromEntityId,
          target: relation.toEntityId,
          label: relation.description || relStyle.label,
          type: 'smoothstep',
          style: {
            stroke: relStyle.color,
            strokeWidth: 2,
            strokeDasharray: relStyle.strokeDasharray || undefined,
          },
          labelStyle: { fill: relStyle.color, fontWeight: 500 },
          labelBgStyle: { fill: '#1e1e2e', fillOpacity: 0.9 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: relStyle.color,
          },
          data: { relation },
        };
      });
    },
    []
  );

  // 当数据加载或更改时更新节点和边
  useEffect(() => {
    if (domains.length > 0) {
      const newNodes = convertToNodes(domains);
      setNodes(newNodes);
    }
  }, [domains, convertToNodes, setNodes]);

  useEffect(() => {
    if (domains.length > 0) {
      const newEdges = convertToEdges(relations, domains);
      setEdges(newEdges);
    }
  }, [relations, domains, convertToEdges, setEdges]);

  // 当选中实体更改时更新节点
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selected: node.data.entity?.id === selectedEntity?.id,
        },
      }))
    );
  }, [selectedEntity, setNodes]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/auth');
      return;
    }

    const fetchData = async () => {
      try {
        // Use requirementId if available, otherwise use projectId for backward compatibility
        const idToUse = requirementId || projectId;

        if (idToUse) {
          if (projectId) {
            const projectData = await apiService.getProject(projectId);
            setProject(projectData);
          }

          // Fetch requirement text for generating bounded contexts
          if (requirementId) {
            try {
              const reqData = await apiService.getRequirement(requirementId);
              setRequirementText(reqData.content);
            } catch (e) {
              // Requirement might not exist, ignore
              devLog('Could not fetch requirement:', e);
            }
          }

          // 从 API 获取领域数据
          const [domainData, relationData] = await Promise.all([
            apiService.getDomainEntities(idToUse),
            apiService.getEntityRelations(idToUse),
          ]);
          setDomains(domainData);
          setRelations(relationData);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, requirementId, router]);

  // 处理连接（添加新关系）
  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      const newRelation: EntityRelation = {
        id: `rel_${Date.now()}`,
        fromEntityId: connection.source,
        toEntityId: connection.target,
        relationType: 'association',
        description: '',
      };
      setRelations((prev) => [...prev, newRelation]);
      setHasChanges(true);
    }
  }, []);

  // 处理节点位置变化
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      // 保存位置变化
      changes.forEach((change) => {
        if (
          change.type === 'position' &&
          change.position &&
          change.dragging === false &&
          change.id
        ) {
          const newPosition = { x: change.position.x, y: change.position.y };
          setDomains((prev) =>
            prev.map((entity) =>
              entity.id === change.id
                ? { ...entity, position: newPosition }
                : entity
            )
          );
          setHasChanges(true);
        }
      });
    },
    [onNodesChange]
  );

  // 添加实体
  const handleAddEntity = useCallback(
    async (entityData: Partial<DomainEntity>) => {
      const idToUse = requirementId || projectId;
      if (!idToUse) return;

      const newEntity: DomainEntity = {
        id: `entity_${Date.now()}`,
        requirementId: idToUse,
        name: entityData.name || '',
        type: entityData.type || 'business',
        description: entityData.description || '',
        attributes: entityData.attributes || [],
        position: {
          x: 100 + Math.random() * 400,
          y: 100 + Math.random() * 300,
        },
      };

      setDomains((prev) => [...prev, newEntity]);
      setHasChanges(true);
      setShowAddEntity(false);
    },
    [projectId, requirementId]
  );

  // 添加关系
  const handleAddRelation = useCallback(
    (relationData: Partial<EntityRelation>) => {
      if (!relationData.fromEntityId || !relationData.toEntityId) return;

      const newRelation: EntityRelation = {
        id: `relation_${Date.now()}`,
        fromEntityId: relationData.fromEntityId,
        toEntityId: relationData.toEntityId,
        relationType: relationData.relationType || 'association',
        description: relationData.description || '',
      };

      setRelations((prev) => [...prev, newRelation]);
      setHasChanges(true);
      setShowAddRelation(false);
    },
    []
  );

  // 保存更改
  const handleSave = useCallback(async () => {
    try {
      const idToUse = requirementId || projectId;
      // 保存实体位置和更新
      for (const entity of domains) {
        await apiService.updateDomainEntity(entity.id, {
          name: entity.name,
          type: entity.type,
          description: entity.description,
          attributes: entity.attributes,
          position: entity.position,
        });
      }

      // 保存关系
      for (const relation of relations) {
        if (relation.id.startsWith('relation_')) {
          await apiService.createEntityRelation(relation, idToUse || undefined);
        } else {
          await apiService.updateEntityRelation(
            relation.id,
            {
              fromEntityId: relation.fromEntityId,
              toEntityId: relation.toEntityId,
              relationType: relation.relationType,
              description: relation.description,
            },
            idToUse || undefined
          );
        }
      }

      setHasChanges(false);
      alert('保存成功！');
    } catch (err: unknown) {
      console.error('保存失败:', err);
      alert('保存失败: ' + (err as Error).message);
    }
  }, [domains, relations, projectId, requirementId]);

  // 从需求生成限界上下文
  const handleGenerate = useCallback(async () => {
    if (!requirementText.trim()) {
      alert('请先输入需求内容');
      return;
    }

    setGenerating(true);
    try {
      const response = await generateBoundedContext(
        requirementText,
        projectId || undefined
      );

      if (
        response &&
        response.success &&
        response.boundedContexts &&
        response.boundedContexts.length > 0
      ) {
        // Convert bounded contexts to domain entities
        const newEntities: DomainEntity[] = response.boundedContexts.map(
          (ctx: BoundedContext, index: number) => ({
            id: `entity_gen_${Date.now()}_${index}`,
            requirementId: requirementId || projectId || '',
            name: ctx.name,
            type:
              ctx.type === 'core'
                ? ('business' as EntityType)
                : ctx.type === 'supporting'
                  ? ('system' as EntityType)
                  : ctx.type === 'generic'
                    ? ('abstract' as EntityType)
                    : ('external' as EntityType),
            description: ctx.description,
            attributes: [],
            position: {
              x: 100 + (index % 3) * 300,
              y: 100 + Math.floor(index / 3) * 200,
            },
          })
        );

        setDomains(newEntities);
        setHasChanges(true);
        alert(`成功生成 ${newEntities.length} 个限界上下文！`);
      } else {
        throw new Error(response.error || '生成失败');
      }
    } catch (err: unknown) {
      console.error('生成失败:', err);
      alert('生成失败: ' + (err as Error).message);
    } finally {
      setGenerating(false);
    }
  }, [requirementText, projectId, requirementId]);

  // 删除实体
  const handleDeleteEntity = useCallback(
    (entityId: string) => {
      setDomains((prev) => prev.filter((e) => e.id !== entityId));
      setRelations((prev) =>
        prev.filter(
          (r) => r.fromEntityId !== entityId && r.toEntityId !== entityId
        )
      );
      if (selectedEntity?.id === entityId) {
        setSelectedEntity(null);
      }
      setHasChanges(true);
    },
    [selectedEntity]
  );

  // 删除关系
  const handleDeleteRelation = useCallback((relationId: string) => {
    setRelations((prev) => prev.filter((r) => r.id !== relationId));
    setHasChanges(true);
  }, []);

  // 切换实体折叠状态
  const toggleEntityCollapse = useCallback((entityId: string) => {
    setCollapsedEntities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entityId)) {
        newSet.delete(entityId);
      } else {
        newSet.add(entityId);
      }
      return newSet;
    });
  }, []);

  const filteredDomains =
    filterType === 'all'
      ? domains
      : domains.filter((d) => d.type === filterType);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>重试</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.bgEffect}>
        <div className={styles.gridOverlay} />
        <div className={styles.glowOrb} />
      </div>

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>领域模型</h1>
          {project && (
            <span className={styles.projectName}>{project.name}</span>
          )}
        </div>
        <div className={styles.headerRight}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={styles.filter}
          >
            <option value="all">全部类型</option>
            <option value="user">用户</option>
            <option value="business">业务</option>
            <option value="system">系统</option>
            <option value="data">数据</option>
            <option value="external">外部</option>
            <option value="abstract">抽象</option>
          </select>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${tab === 'graph' ? styles.active : ''}`}
              onClick={() => setTab('graph')}
            >
              图谱
            </button>
            <button
              className={`${styles.viewBtn} ${tab === 'list' ? styles.active : ''}`}
              onClick={() => setTab('list')}
            >
              列表
            </button>
          </div>
          <Link
            href={`/?${projectId ? `projectId=${projectId}` : ''}`}
            className={styles.backLink}
          >
            返回首页
          </Link>
          <div className={styles.confirmActions}>
            <div className={styles.steps}><span>步骤: 领域模型</span></div>
            <button
              onClick={handleConfirmAndProceed}
              className={styles.confirmBtn}
              disabled={domains.length === 0}
            >
              确认并继续
            </button>
          </div>
        </div>
      </header>

      {tab === 'graph' ? (
        <div className={styles.graphWrapper}>
          <Toolbar
            onAddEntity={() => setShowAddEntity(true)}
            onAddRelation={() => setShowAddRelation(true)}
            onSave={handleSave}
            onGenerate={handleGenerate}
            onOpenChat={() => setShowChatPanel(true)}
            hasChanges={hasChanges}
            hasRequirementText={!!requirementText}
            generating={generating}
          />
          <DomainFlow
            entities={domains}
            relations={relations}
            onEntitySelect={setSelectedEntity}
            selectedEntityId={selectedEntity?.id || null}
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
          />

          {/* 实体详情面板 */}
          {selectedEntity && (
            <div className={styles.entityDetail}>
              <div className={styles.detailHeader}>
                <h2>{selectedEntity.name}</h2>
                <div className={styles.detailActions}>
                  <button
                    onClick={() => handleDeleteEntity(selectedEntity.id)}
                    className={styles.deleteBtn}
                  >
                    删除
                  </button>
                  <button
                    onClick={() => setSelectedEntity(null)}
                    className={styles.closeBtn}
                  >
                    ×
                  </button>
                </div>
              </div>
              <p>{selectedEntity.description}</p>
              <h3>属性</h3>
              <table className={styles.attrTable}>
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>类型</th>
                    <th>必填</th>
                    <th>描述</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedEntity.attributes || []).map((attr) => (
                    <tr key={attr.name}>
                      <td>{attr.name}</td>
                      <td>
                        <code>{attr.type}</code>
                      </td>
                      <td>{attr.required ? '是' : '否'}</td>
                      <td>{attr.description}</td>
                    </tr>
                  ))}
                  {(selectedEntity.attributes || []).length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{ textAlign: 'center', color: '#666' }}
                      >
                        暂无属性
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <main className={styles.main}>
          <div className={styles.entityList}>
            <h2>实体列表 ({filteredDomains.length})</h2>
            {filteredDomains.map((entity) => (
              <div
                key={entity.id}
                className={`${styles.entityCard} ${selectedEntity?.id === entity.id ? styles.selected : ''}`}
                onClick={() => setSelectedEntity(entity)}
              >
                <div className={styles.entityHeader}>
                  <span
                    className={styles.entityType}
                    style={{
                      backgroundColor:
                        entityTypeStyles[entity.type]?.color || '#666',
                    }}
                  >
                    {entityTypeStyles[entity.type]?.label || entity.type}
                  </span>
                  <h3>{entity.name}</h3>
                  {(entity.attributes || []).length > 0 && (
                    <button
                      data-testid={`collapse-btn-${entity.id}`}
                      className={styles.collapseBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEntityCollapse(entity.id);
                      }}
                    >
                      {collapsedEntities.has(entity.id) ? '▼' : '▲'}
                    </button>
                  )}
                </div>
                <p className={styles.entityDesc}>{entity.description}</p>
                {/* 折叠区域：显示所有属性 */}
                {(entity.attributes || []).length > 0 && !collapsedEntities.has(entity.id) && (
                  <div data-testid={`entity-attrs-${entity.id}`} className={styles.entityAttrs}>
                    {(entity.attributes || []).slice(0, 3).map((attr) => (
                      <span key={attr.name} className={styles.attrTag}>
                        {attr.name}
                        {attr.required && (
                          <span className={styles.required}>*</span>
                        )}
                      </span>
                    ))}
                    {(entity.attributes || []).length > 3 && (
                      <span className={styles.moreAttrs}>
                        +{(entity.attributes || []).length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.relationList}>
            <h2>关系列表 ({relations.length})</h2>
            {relations.map((relation) => {
              const fromEntity = domains.find(
                (d) => d.id === relation.fromEntityId
              );
              const toEntity = domains.find(
                (d) => d.id === relation.toEntityId
              );
              const relStyle = relationTypeStyles[relation.relationType] || {
                color: '#666',
                label: relation.relationType,
              };

              return (
                <div key={relation.id} className={styles.relationCard}>
                  <div className={styles.relationEndpoints}>
                    <span className={styles.relationEntity}>
                      {fromEntity?.name || relation.fromEntityId}
                    </span>
                    <span
                      className={styles.relationArrow}
                      style={{ color: relStyle.color }}
                    >
                      <span className={styles.arrowLine}></span>
                      <span className={styles.arrowLabel}>
                        {relStyle.label}
                      </span>
                      <span className={styles.arrowLine}></span>
                    </span>
                    <span className={styles.relationEntity}>
                      {toEntity?.name || relation.toEntityId}
                    </span>
                    <button
                      onClick={() => handleDeleteRelation(relation.id)}
                      className={styles.deleteBtn}
                      style={{ marginLeft: 'auto' }}
                    >
                      删除
                    </button>
                  </div>
                  {relation.description && (
                    <p className={styles.relationDesc}>
                      {relation.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* 对话框 */}
      {showAddEntity && (
        <AddEntityDialog
          onClose={() => setShowAddEntity(false)}
          onSave={handleAddEntity}
        />
      )}
      {showAddRelation && (
        <AddRelationDialog
          entities={domains}
          onClose={() => setShowAddRelation(false)}
          onSave={handleAddRelation}
        />
      )}
      {showChatPanel && (
        <ChatModifyPanel
          entities={domains}
          onAddEntity={handleAddEntity}
          onDeleteEntity={handleDeleteEntity}
          onUpdateEntity={(entityId, data) => {
            setDomains(prev => prev.map(e => e.id === entityId ? { ...e, ...data } : e));
            setHasChanges(true);
          }}
          onClose={() => setShowChatPanel(false)}
        />
      )}
    </div>
  );
}

export default function DomainPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
      <DomainPageContent />
    </Suspense>
  );
}
