/**
 * Variable Manager
 */
// @ts-nocheck


import type { VariableManager as IVariableManager } from './handlers/types';

export class VariableManager implements IVariableManager {
  private variables: Map<string, unknown> = new Map();
  private scopes: VariableManager[] = [];
  private snapshots: Map<number, Map<string, unknown>> = new Map();
  private snapshotCounter = 0;
  
  constructor(initialVars?: Record<string, unknown>) {
    if (initialVars) {
      for (const [key, value] of Object.entries(initialVars)) {
        this.variables.set(key, value);
      }
    }
  }
  
  get(name: string): unknown {
    // Check current scope first, then parent scopes
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const value = this.scopes[i].variables.get(name);
      if (value !== undefined) return value;
    }
    return this.variables.get(name);
  }
  
  set(name: string, value: unknown): void {
    this.variables.set(name, value);
  }
  
  resolve(value: string | unknown): unknown {
    if (typeof value !== 'string') return value;
    
    // Handle variable references like ${variableName}
    const matches = value.match(/\$\{(\w+)\}/g);
    if (!matches) return value;
    
    let resolved = value;
    for (const match of matches) {
      const varName = match.slice(2, -1);
      const varValue = this.get(varName);
      resolved = resolved.replace(match, String(varValue ?? ''));
    }
    
    return resolved;
  }
  
  getAll(): Record<string, unknown> {
    return Object.fromEntries(this.variables);
  }
  
  snapshot(): Record<string, unknown> {
    const snapId = ++this.snapshotCounter;
    this.snapshots.set(snapId, new Map(this.variables));
    return this.getAll();
  }
  
  restore(snapshot: Record<string, unknown>): void {
    this.variables = new Map(Object.entries(snapshot));
  }
  
  createScope(parent?: VariableManager): VariableManager {
    const scope = new VariableManager();
    if (parent) {
      scope.scopes = [...parent.scopes, parent];
    }
    return scope;
  }
  
  clear(): void {
    this.variables.clear();
  }
}
