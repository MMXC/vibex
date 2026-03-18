/**
 * BusinessFlowStep - Epic 4: Business Flow Generation
 * 
 * Flow diagram display, node editing, add/delete, regeneration
 */

'use client';

import { useState, useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { flowMachine, FlowNode } from '../flow-container/flowMachine';
import styles from './BusinessFlowStep.module.css';

const NODE_TYPES = [
  { type: 'start', label: 'Start', color: '#10b981' },
  { type: 'end', label: 'End', color: '#ef4444' },
  { type: 'process', label: 'Process', color: '#3b82f6' },
  { type: 'decision', label: 'Decision', color: '#f59e0b' },
  { type: 'subprocess', label: 'Subprocess', color: '#8b5cf6' },
];

// Initial flow template
const INITIAL_NODES: FlowNode[] = [
  { id: 'node-1', type: 'start', label: 'User Request', position: { x: 250, y: 50 }, connections: ['node-2'] },
  { id: 'node-2', type: 'process', label: 'Process Request', position: { x: 250, y: 150 }, connections: ['node-3'] },
  { id: 'node-3', type: 'decision', label: 'Valid?', position: { x: 250, y: 250 }, connections: ['node-4', 'node-5'] },
  { id: 'node-4', type: 'process', label: 'Process Data', position: { x: 150, y: 350 }, connections: ['node-6'] },
  { id: 'node-5', type: 'process', label: 'Return Error', position: { x: 350, y: 350 }, connections: ['node-6'] },
  { id: 'node-6', type: 'end', label: 'Response', position: { x: 250, y: 450 }, connections: [] },
];

export function BusinessFlowStep() {
  const [state, send] = useMachine(flowMachine);
  const [nodes, setNodes] = useState<FlowNode[]>(state.context.businessFlow.length > 0 ? state.context.businessFlow : INITIAL_NODES);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const handleAddNode = (type: string) => {
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type: type as FlowNode['type'],
      label: `New ${type}`,
      position: { x: 250 + Math.random() * 100, y: 100 + Math.random() * 50 },
      connections: [],
    };
    setNodes([...nodes, newNode]);
    send({ type: 'ADD_NODE', node: newNode } as any);
    setSelectedNode(newNode.id);
  };

  const handleRemoveNode = (nodeId: string) => {
    // Don't allow removing start/end
    const node = nodes.find(n => n.id === nodeId);
    if (node?.type === 'start' || node?.type === 'end') return;
    
    const updated = nodes.filter(n => n.id !== nodeId).map(n => ({
      ...n,
      connections: n.connections.filter(c => c !== nodeId),
    }));
    setNodes(updated);
    send({ type: 'REMOVE_NODE', id: nodeId } as any);
    setSelectedNode(null);
  };

  const handleUpdateNodeLabel = (nodeId: string, label: string) => {
    const updated = nodes.map(n => n.id === nodeId ? { ...n, label } : n);
    setNodes(updated);
    send({ type: 'UPDATE_NODE', node: updated.find(n => n.id === nodeId)! } as any);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    // Simulate AI regeneration
    await new Promise(resolve => setTimeout(resolve, 1500));
    const regeneratedNodes = INITIAL_NODES.map(n => ({
      ...n,
      id: `node-${Date.now()}-${n.id}`,
    }));
    setNodes(regeneratedNodes);
    send({ type: 'SET_BUSINESS_FLOW', nodes: regeneratedNodes } as any);
    setIsRegenerating(false);
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Design Your Business Flow</h2>
        <p className={styles.subtitle}>
          Visualize the process steps. Click a node to edit, or use the toolbar to add new nodes.
        </p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.nodeButtons}>
          {NODE_TYPES.filter(n => n.type !== 'start' && n.type !== 'end').map(({ type, label }) => (
            <button
              key={type}
              className={styles.addNodeBtn}
              onClick={() => handleAddNode(type)}
            >
              + {label}
            </button>
          ))}
        </div>
        <button
          className={styles.regenerateBtn}
          onClick={handleRegenerate}
          disabled={isRegenerating}
        >
          {isRegenerating ? '⟳ Generating...' : '↻ Regenerate Flow'}
        </button>
      </div>

      <div className={styles.canvasContainer}>
        <div className={styles.canvas}>
          {/* Draw connections */}
          <svg className={styles.connections}>
            {nodes.map(node => 
              node.connections.map(targetId => {
                const target = nodes.find(n => n.id === targetId);
                if (!target) return null;
                const x1 = node.position.x + 60;
                const y1 = node.position.y + 20;
                const x2 = target.position.x + 60;
                const y2 = target.position.y;
                return (
                  <path
                    key={`${node.id}-${targetId}`}
                    d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`}
                    className={styles.connection}
                  />
                );
              })
            )}
          </svg>

          {/* Draw nodes */}
          {nodes.map(node => {
            const nodeType = NODE_TYPES.find(t => t.type === node.type);
            return (
              <div
                key={node.id}
                className={`${styles.node} ${selectedNode === node.id ? styles.selected : ''}`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  borderColor: nodeType?.color,
                }}
                onClick={() => handleNodeClick(node.id)}
              >
                <div className={styles.nodeIcon} style={{ backgroundColor: nodeType?.color }}>
                  {node.type === 'start' ? '▶' : node.type === 'end' ? '■' : '●'}
                </div>
                <span className={styles.nodeLabel}>{node.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Node editor panel */}
      {selectedNodeData && (
        <div className={styles.editor}>
          <h3 className={styles.editorTitle}>Edit Node</h3>
          <div className={styles.editorField}>
            <label>Label</label>
            <input
              type="text"
              value={selectedNodeData.label}
              onChange={(e) => handleUpdateNodeLabel(selectedNodeData.id, e.target.value)}
            />
          </div>
          <div className={styles.editorField}>
            <label>Type</label>
            <span className={styles.nodeType}>{selectedNodeData.type}</span>
          </div>
          {selectedNodeData.type !== 'start' && selectedNodeData.type !== 'end' && (
            <button
              className={styles.deleteBtn}
              onClick={() => handleRemoveNode(selectedNodeData.id)}
            >
              Delete Node
            </button>
          )}
        </div>
      )}

      <div className={styles.stats}>
        {nodes.length} nodes · {nodes.reduce((acc, n) => acc + n.connections.length, 0)} connections
      </div>
    </div>
  );
}
