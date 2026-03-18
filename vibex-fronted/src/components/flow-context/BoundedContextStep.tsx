/**
 * BoundedContextStep - Epic 3: Bounded Context Identification
 * 
 * Display bounded contexts, checkbox selection, manual add, dependency detection
 */

'use client';

import { useState, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import { flowMachine, BoundedContext } from '../flow-container/flowMachine';
import styles from './BoundedContextStep.module.css';

// AI-detected bounded context templates
const TEMPLATE_CONTEXTS: Omit<BoundedContext, 'id'>[] = [
  { name: 'Authentication', description: 'User auth, sessions, tokens', dependencies: [], selected: false },
  { name: 'User Management', description: 'Profiles, roles, permissions', dependencies: ['Authentication'], selected: false },
  { name: 'Product Catalog', description: 'Products, categories, inventory', dependencies: [], selected: false },
  { name: 'Order Management', description: 'Orders, payments, fulfillment', dependencies: ['Product Catalog', 'User Management'], selected: false },
  { name: 'Notifications', description: 'Emails, push, in-app alerts', dependencies: ['User Management'], selected: false },
];

export function BoundedContextStep() {
  const [state, send] = useMachine(flowMachine);
  const [newContextName, setNewContextName] = useState('');
  const [newContextDesc, setNewContextDesc] = useState('');

  // Initialize from requirements (mock AI detection)
  const contexts = state.context.boundedContexts.length > 0
    ? state.context.boundedContexts
    : TEMPLATE_CONTEXTS.map((t, i) => ({ ...t, id: `ctx-${i}` }));

  const handleToggle = (id: string) => {
    send({ type: 'TOGGLE_CONTEXT', id } as any);
  };

  const handleAddContext = () => {
    if (!newContextName.trim()) return;
    
    const newContext: BoundedContext = {
      id: `ctx-${Date.now()}`,
      name: newContextName.trim(),
      description: newContextDesc.trim(),
      dependencies: [],
      selected: false,
    };
    
    send({ type: 'ADD_CONTEXT', context: newContext } as any);
    setNewContextName('');
    setNewContextDesc('');
  };

  const handleRemove = (id: string) => {
    send({ type: 'REMOVE_CONTEXT', id } as any);
  };

  // Dependency visualization
  const dependencyGraph = useMemo(() => {
    const selected = contexts.filter(c => c.selected || state.context.boundedContexts.find(bc => bc.id === c.id && bc.selected));
    const graph: Record<string, string[]> = {};
    
    selected.forEach(ctx => {
      graph[ctx.name] = ctx.dependencies || [];
    });
    
    return graph;
  }, [contexts, state.context.boundedContexts]);

  const hasCircularDeps = useMemo(() => {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (node: string, graph: Record<string, string[]>): boolean => {
      visited.add(node);
      recursionStack.add(node);
      
      for (const dep of graph[node] || []) {
        if (!visited.has(dep)) {
          if (hasCycle(dep, graph)) return true;
        } else if (recursionStack.has(dep)) {
          return true;
        }
      }
      
      recursionStack.delete(node);
      return false;
    };
    
    for (const node of Object.keys(dependencyGraph)) {
      if (!visited.has(node)) {
        if (hasCycle(node, dependencyGraph)) return true;
      }
    }
    
    return false;
  }, [dependencyGraph]);

  const selectedCount = contexts.filter(c => c.selected).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Define Bounded Contexts</h2>
        <p className={styles.subtitle}>
          Select or create the domain boundaries for your system.
          These represent distinct business capabilities.
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.contextList}>
          {contexts.map((ctx) => (
            <div key={ctx.id} className={styles.contextCard}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={state.context.boundedContexts.find(bc => bc.id === ctx.id)?.selected ?? false}
                  onChange={() => handleToggle(ctx.id)}
                />
                <span className={styles.checkmark} />
              </label>
              
              <div className={styles.contextInfo}>
                <h3 className={styles.contextName}>{ctx.name}</h3>
                <p className={styles.contextDesc}>{ctx.description}</p>
                {ctx.dependencies && ctx.dependencies.length > 0 && (
                  <div className={styles.dependencies}>
                    <span className={styles.depLabel}>Depends on:</span>
                    {ctx.dependencies.map((dep, i) => (
                      <span key={i} className={styles.depBadge}>{dep}</span>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(ctx.id)}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add new context */}
        <div className={styles.addContext}>
          <h3 className={styles.addTitle}>Add Custom Context</h3>
          <div className={styles.addForm}>
            <input
              type="text"
              className={styles.input}
              placeholder="Context name (e.g., Billing)"
              value={newContextName}
              onChange={(e) => setNewContextName(e.target.value)}
            />
            <input
              type="text"
              className={styles.input}
              placeholder="Description"
              value={newContextDesc}
              onChange={(e) => setNewContextDesc(e.target.value)}
            />
            <button
              className={styles.addBtn}
              onClick={handleAddContext}
              disabled={!newContextName.trim()}
            >
              + Add
            </button>
          </div>
        </div>

        {/* Dependency warning */}
        {hasCircularDeps && (
          <div className={styles.warning}>
            ⚠️ Circular dependency detected! Please review your context relationships.
          </div>
        )}

        {/* Progress */}
        <div className={styles.progress}>
          {selectedCount} / {contexts.length} contexts selected
        </div>
      </div>
    </div>
  );
}
