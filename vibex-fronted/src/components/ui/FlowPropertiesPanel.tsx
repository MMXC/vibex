'use client';

import { useCallback, useMemo } from 'react';
import { Node, Edge } from 'reactflow';
import styles from './FlowPropertiesPanel.module.css';

// Node type labels in Chinese
const NODE_TYPE_LABELS: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  input: { label: '用户输入', icon: '📥', color: '#06b6d4' },
  llm: { label: 'LLM 调用', icon: '🤖', color: '#a855f7' },
  condition: { label: '条件判断', icon: '🔀', color: '#eab308' },
  transform: { label: '数据转换', icon: '⚡', color: '#ec4899' },
  output: { label: '输出结果', icon: '📤', color: '#22c55e' },
  storage: { label: '数据存储', icon: '💾', color: '#3b82f6' },
  default: { label: '节点', icon: '◉', color: '#6b7280' },
};

// Property field labels
const NODE_PROPERTY_LABELS: Record<string, string> = {
  label: '节点名称',
  description: '描述',
  model: '模型',
  prompt: '提示词',
  condition: '条件',
  transform: '转换规则',
  format: '输出格式',
  collection: '存储集合',
  temperature: '温度',
  maxTokens: '最大 Token',
  systemPrompt: '系统提示',
};

const EDGE_PROPERTY_LABELS: Record<string, string> = {
  label: '标签',
  sourceHandle: '源端口',
  targetHandle: '目标端口',
  type: '边类型',
  animated: '动画',
};

export interface FlowPropertiesPanelProps {
  // Selected node
  selectedNode?: Node | null;
  selectedEdge?: Edge | null;
  // Update handlers
  onNodeChange?: (nodeId: string, data: Record<string, any>) => void;
  onEdgeChange?: (edgeId: string, data: Record<string, any>) => void;
  // Delete handlers
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  // ClassName for custom styling
  className?: string;
}

// Get node type info
function getNodeTypeInfo(node: Node) {
  const nodeType = node.data?.type || node.data?.label?.type || 'default';
  return NODE_TYPE_LABELS[nodeType] || NODE_TYPE_LABELS.default;
}

// Property field component
function PropertyField({
  label,
  value,
  onChange,
  type = 'text',
  options,
  rows = 3,
}: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  type?: 'text' | 'textarea' | 'select' | 'boolean' | 'number';
  options?: { value: string; label: string }[];
  rows?: number;
}) {
  if (type === 'boolean') {
    return (
      <div className={styles.propGroup}>
        <label className={styles.propLabel}>{label}</label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className={styles.toggleSlider}></span>
          <span className={styles.toggleText}>{value ? '是' : '否'}</span>
        </label>
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <div className={styles.propGroup}>
        <label className={styles.propLabel}>{label}</label>
        <select
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className={styles.propSelect}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'textarea' || (typeof value === 'string' && value.length > 50)) {
    return (
      <div className={styles.propGroup}>
        <label className={styles.propLabel}>{label}</label>
        <textarea
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className={styles.propTextarea}
          rows={rows}
        />
      </div>
    );
  }

  if (type === 'number') {
    return (
      <div className={styles.propGroup}>
        <label className={styles.propLabel}>{label}</label>
        <input
          type="number"
          value={value as number}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={styles.propInput}
        />
      </div>
    );
  }

  return (
    <div className={styles.propGroup}>
      <label className={styles.propLabel}>{label}</label>
      <input
        type="text"
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        className={styles.propInput}
      />
    </div>
  );
}

/**
 * FlowPropertiesPanel - 属性面板组件
 *
 * 用于编辑流程图中选中的节点或边的属性
 *
 * @example
 * ```tsx
 * <FlowPropertiesPanel
 *   selectedNode={selectedNode}
 *   onNodeChange={(id, data) => updateNode(id, data)}
 *   onDeleteNode={(id) => deleteNode(id)}
 * />
 * ```
 */
export default function FlowPropertiesPanel({
  selectedNode,
  selectedEdge,
  onNodeChange,
  onEdgeChange,
  onDeleteNode,
  onDeleteEdge,
  className,
}: FlowPropertiesPanelProps) {
  // Determine what's selected
  const hasSelection = selectedNode || selectedEdge;
  const selectionType = selectedNode ? 'node' : selectedEdge ? 'edge' : null;

  // Node type info
  const nodeTypeInfo = useMemo(() => {
    if (!selectedNode) return null;
    return getNodeTypeInfo(selectedNode);
  }, [selectedNode]);

  // Handle node data change
  const handleNodeDataChange = useCallback(
    (key: string, value: unknown) => {
      if (selectedNode && onNodeChange) {
        onNodeChange(selectedNode.id, { [key]: value });
      }
    },
    [selectedNode, onNodeChange]
  );

  // Handle edge data change
  const handleEdgeDataChange = useCallback(
    (key: string, value: unknown) => {
      if (selectedEdge && onEdgeChange) {
        onEdgeChange(selectedEdge.id, { [key]: value });
      }
    },
    [selectedEdge, onEdgeChange]
  );

  // Handle delete
  const handleDelete = useCallback(() => {
    if (selectedNode && onDeleteNode) {
      onDeleteNode(selectedNode.id);
    } else if (selectedEdge && onDeleteEdge) {
      onDeleteEdge(selectedEdge.id);
    }
  }, [selectedNode, selectedEdge, onDeleteNode, onDeleteEdge]);

  // Render node properties
  const renderNodeProperties = () => {
    if (!selectedNode) return null;

    const nodeData = selectedNode.data || {};

    return (
      <div className={styles.propsContent}>
        {/* Node Type Header */}
        <div className={styles.propGroup}>
          <label className={styles.propLabel}>节点类型</label>
          <div
            className={styles.typeTag}
            style={{
              borderColor: nodeTypeInfo?.color,
              color: nodeTypeInfo?.color,
            }}
          >
            <span>{nodeTypeInfo?.icon}</span>
            <span>{nodeTypeInfo?.label}</span>
          </div>
        </div>

        {/* Node ID (readonly) */}
        <div className={styles.propGroup}>
          <label className={styles.propLabel}>节点 ID</label>
          <input
            type="text"
            value={selectedNode.id}
            readOnly
            className={`${styles.propInput} ${styles.propInputReadonly}`}
          />
        </div>

        {/* Position (readonly) */}
        <div className={styles.propGroup}>
          <label className={styles.propLabel}>位置</label>
          <div className={styles.positionDisplay}>
            <span>X: {Math.round(selectedNode.position.x)}</span>
            <span>Y: {Math.round(selectedNode.position.y)}</span>
          </div>
        </div>

        {/* Dynamic properties */}
        {Object.entries(nodeData)
          .filter(([key]) => !['type'].includes(key))
          .map(([key, value]) => (
            <PropertyField
              key={key}
              label={NODE_PROPERTY_LABELS[key] || key}
              value={value}
              onChange={(newValue) => handleNodeDataChange(key, newValue)}
            />
          ))}

        {/* Delete button */}
        <button className={styles.deleteBtn} onClick={handleDelete}>
          <span>🗑️</span>
          <span>删除节点</span>
        </button>
      </div>
    );
  };

  // Render edge properties
  const renderEdgeProperties = () => {
    if (!selectedEdge) return null;

    const edgeData = selectedEdge;

    return (
      <div className={styles.propsContent}>
        {/* Edge Type Header */}
        <div className={styles.propGroup}>
          <label className={styles.propLabel}>边类型</label>
          <div
            className={styles.typeTag}
            style={{ borderColor: '#6b7280', color: '#6b7280' }}
          >
            <span>🔗</span>
            <span>{edgeData.type || '默认边'}</span>
          </div>
        </div>

        {/* Edge ID (readonly) */}
        <div className={styles.propGroup}>
          <label className={styles.propLabel}>边 ID</label>
          <input
            type="text"
            value={selectedEdge.id}
            readOnly
            className={`${styles.propInput} ${styles.propInputReadonly}`}
          />
        </div>

        {/* Connection Info */}
        <div className={styles.propGroup}>
          <label className={styles.propLabel}>连接信息</label>
          <div className={styles.connectionInfo}>
            <div className={styles.connectionItem}>
              <span className={styles.connectionLabel}>源节点</span>
              <span className={styles.connectionValue}>{edgeData.source}</span>
            </div>
            <div className={styles.connectionItem}>
              <span className={styles.connectionLabel}>目标节点</span>
              <span className={styles.connectionValue}>{edgeData.target}</span>
            </div>
            {edgeData.sourceHandle && (
              <div className={styles.connectionItem}>
                <span className={styles.connectionLabel}>源端口</span>
                <span className={styles.connectionValue}>
                  {edgeData.sourceHandle}
                </span>
              </div>
            )}
            {edgeData.targetHandle && (
              <div className={styles.connectionItem}>
                <span className={styles.connectionLabel}>目标端口</span>
                <span className={styles.connectionValue}>
                  {edgeData.targetHandle}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Edge label */}
        <PropertyField
          label={EDGE_PROPERTY_LABELS.label}
          value={edgeData.label || ''}
          onChange={(newValue) => handleEdgeDataChange('label', newValue)}
        />

        {/* Edge type select */}
        <PropertyField
          label={EDGE_PROPERTY_LABELS.type}
          value={edgeData.type || 'smoothstep'}
          onChange={(newValue) => handleEdgeDataChange('type', newValue)}
          type="select"
          options={[
            { value: 'default', label: '默认' },
            { value: 'smoothstep', label: '平滑阶梯' },
            { value: 'step', label: '阶梯' },
            { value: 'straight', label: '直线' },
          ]}
        />

        {/* Animated toggle */}
        <PropertyField
          label={EDGE_PROPERTY_LABELS.animated}
          value={edgeData.animated || false}
          onChange={(newValue) => handleEdgeDataChange('animated', newValue)}
          type="boolean"
        />

        {/* Delete button */}
        <button className={styles.deleteBtn} onClick={handleDelete}>
          <span>🗑️</span>
          <span>删除边</span>
        </button>
      </div>
    );
  };

  return (
    <aside className={`${styles.panel} ${className || ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>属性面板</h2>
        {hasSelection && (
          <span className={styles.selectionBadge}>
            {selectionType === 'node' ? '节点' : '边'}
          </span>
        )}
      </div>

      {hasSelection ? (
        selectionType === 'node' ? (
          renderNodeProperties()
        ) : (
          renderEdgeProperties()
        )
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◉</div>
          <p className={styles.emptyTitle}>未选中元素</p>
          <p className={styles.emptyHint}>点击节点或边查看其属性</p>
        </div>
      )}
    </aside>
  );
}
