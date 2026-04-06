/**
 * Prototype History Service
 * 
 * This module provides history management for the VibeX AI Prototype Builder.
 * It supports undo/redo operations, state snapshots, and serialization.
 * 
 * @module prototypes/history
 */

import type { UISchema, UIPage, UIComponent } from './ui-schema';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

// ==================== Types ====================

/**
 * History entry representing a single state snapshot
 */
export interface HistoryEntry<T = unknown> {
  id: string;
  timestamp: number;
  state: T;
  action?: string;
  metadata?: HistoryMetadata;
}

/**
 * Metadata for history entries
 */
export interface HistoryMetadata {
  source?: 'user' | 'ai' | 'system' | 'import';
  description?: string;
  changedComponents?: string[];
  changedPages?: string[];
  tags?: string[];
}

/**
 * History service configuration
 */
export interface HistoryConfig {
  maxEntries?: number;
  enableAutoSave?: boolean;
  autoSaveInterval?: number;
  enableCompression?: boolean;
  onStateChange?: (state: unknown, entry: HistoryEntry) => void;
  onUndo?: (state: unknown, entry: HistoryEntry) => void;
  onRedo?: (state: unknown, entry: HistoryEntry) => void;
  onPush?: (entry: HistoryEntry) => void;
}

/**
 * History statistics
 */
export interface HistoryStats {
  totalEntries: number;
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  oldestTimestamp?: number;
  newestTimestamp?: number;
  memoryUsage?: number;
}

/**
 * Serialized history data for persistence
 */
export interface SerializedHistory<T = unknown> {
  version: string;
  entries: HistoryEntry<T>[];
  currentIndex: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * History event types
 */
export type HistoryEventType = 'push' | 'undo' | 'redo' | 'clear' | 'restore';

/**
 * History event listener
 */
export type HistoryEventListener<T = unknown> = (
  event: HistoryEventType,
  state: T,
  entry: HistoryEntry<T> | null,
  history: HistoryService<T>
) => void;

// ==================== History Service Class ====================

/**
 * Generic History Service
 * 
 * Provides undo/redo functionality with configurable limits and event handling.
 * 
 * @example
 * ```typescript
 * const history = new HistoryService<UISchema>({
 *   maxEntries: 50,
 *   onStateChange: (state) => canvasLogger.default.debug('State changed:', state)
 * });
 * 
 * history.push(initialSchema, 'Initial state');
 * history.push(updatedSchema, 'Added component');
 * 
 * if (history.canUndo()) {
 *   const previousState = history.undo();
 * }
 * ```
 */
export class HistoryService<T = unknown> {
  private entries: HistoryEntry<T>[] = [];
  private currentIndex: number = -1;
  private config: Required<HistoryConfig>;
  private listeners: Map<HistoryEventType, Set<HistoryEventListener<T>>> = new Map();
  private autoSaveTimer?: ReturnType<typeof setInterval>;

  /**
   * Create a new HistoryService instance
   */
  constructor(config: HistoryConfig = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? 50,
      enableAutoSave: config.enableAutoSave ?? false,
      autoSaveInterval: config.autoSaveInterval ?? 30000,
      enableCompression: config.enableCompression ?? false,
      onStateChange: config.onStateChange ?? (() => {}),
      onUndo: config.onUndo ?? (() => {}),
      onRedo: config.onRedo ?? (() => {}),
      onPush: config.onPush ?? (() => {}),
    };
  }

  // ==================== Core Methods ====================

  /**
   * Push a new state onto the history stack
   * 
   * @param state - The state to save
   * @param action - Optional action description
   * @param metadata - Optional metadata
   * @returns The created history entry
   */
  push(state: T, action?: string, metadata?: HistoryMetadata): HistoryEntry<T> {
    // Create new entry
    const entry: HistoryEntry<T> = {
      id: this.generateId(),
      timestamp: Date.now(),
      state: this.cloneState(state),
      action,
      metadata,
    };

    // Remove any future entries (we're branching from current position)
    if (this.currentIndex < this.entries.length - 1) {
      this.entries = this.entries.slice(0, this.currentIndex + 1);
    }

    // Add the new entry
    this.entries.push(entry);

    // Enforce max entries limit
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(-this.config.maxEntries);
    }

    // Update current index
    this.currentIndex = this.entries.length - 1;

    // Emit events
    this.emit('push', state, entry);
    this.config.onPush(entry);
    this.config.onStateChange(state, entry);

    return entry;
  }

  /**
   * Undo the last action
   * 
   * @returns The previous state, or null if cannot undo
   */
  undo(): T | null {
    if (!this.canUndo()) {
      return null;
    }

    this.currentIndex--;
    const entry = this.entries[this.currentIndex];
    const state = this.cloneState(entry.state);

    this.emit('undo', state, entry);
    this.config.onUndo(state, entry);
    this.config.onStateChange(state, entry);

    return state;
  }

  /**
   * Redo a previously undone action
   * 
   * @returns The next state, or null if cannot redo
   */
  redo(): T | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    const entry = this.entries[this.currentIndex];
    const state = this.cloneState(entry.state);

    this.emit('redo', state, entry);
    this.config.onRedo(state, entry);
    this.config.onStateChange(state, entry);

    return state;
  }

  /**
   * Jump to a specific history entry by index
   * 
   * @param index - The target index
   * @returns The state at that index, or null if invalid
   */
  jumpTo(index: number): T | null {
    if (index < 0 || index >= this.entries.length) {
      return null;
    }

    this.currentIndex = index;
    const entry = this.entries[index];
    const state = this.cloneState(entry.state);

    const eventType: HistoryEventType = index < this.currentIndex ? 'undo' : 'redo';
    this.emit(eventType, state, entry);

    return state;
  }

  /**
   * Jump to a specific history entry by ID
   * 
   * @param id - The entry ID
   * @returns The state at that entry, or null if not found
   */
  jumpToId(id: string): T | null {
    const index = this.entries.findIndex(e => e.id === id);
    if (index === -1) {
      return null;
    }
    return this.jumpTo(index);
  }

  /**
   * Clear all history
   */
  clear(): void {
    const currentEntry = this.getCurrentEntry();
    this.entries = [];
    this.currentIndex = -1;
    this.emit('clear', null as T, null);
  }

  // ==================== Query Methods ====================

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.entries.length - 1;
  }

  /**
   * Get the current state
   */
  getCurrentState(): T | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.entries.length) {
      return null;
    }
    return this.cloneState(this.entries[this.currentIndex].state);
  }

  /**
   * Get the current history entry
   */
  getCurrentEntry(): HistoryEntry<T> | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.entries.length) {
      return null;
    }
    return this.entries[this.currentIndex];
  }

  /**
   * Get all history entries
   */
  getEntries(): HistoryEntry<T>[] {
    return [...this.entries];
  }

  /**
   * Get entries within a time range
   */
  getEntriesByTimeRange(start: number, end: number): HistoryEntry<T>[] {
    return this.entries.filter(e => e.timestamp >= start && e.timestamp <= end);
  }

  /**
   * Get entries by action name
   */
  getEntriesByAction(action: string): HistoryEntry<T>[] {
    return this.entries.filter(e => e.action === action);
  }

  /**
   * Get entries by source
   */
  getEntriesBySource(source: HistoryMetadata['source']): HistoryEntry<T>[] {
    return this.entries.filter(e => e.metadata?.source === source);
  }

  /**
   * Get the current index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get the total number of entries
   */
  getLength(): number {
    return this.entries.length;
  }

  /**
   * Get history statistics
   */
  getStats(): HistoryStats {
    return {
      totalEntries: this.entries.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      oldestTimestamp: this.entries[0]?.timestamp,
      newestTimestamp: this.entries[this.entries.length - 1]?.timestamp,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  // ==================== Serialization ====================

  /**
   * Serialize the history to JSON
   */
  serialize(): SerializedHistory<T> {
    return {
      version: '1.0.0',
      entries: this.entries.map(e => ({
        ...e,
        state: this.cloneState(e.state),
      })),
      currentIndex: this.currentIndex,
      createdAt: new Date(Math.min(...this.entries.map(e => e.timestamp))).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Restore history from serialized data
   */
  restore(data: SerializedHistory<T>): void {
    this.entries = data.entries.map(e => ({
      ...e,
      state: this.cloneState(e.state),
    }));
    this.currentIndex = data.currentIndex;
    this.emit('restore', this.getCurrentState() as T, this.getCurrentEntry());
  }

  /**
   * Export history as JSON string
   */
  toJSON(): string {
    return JSON.stringify(this.serialize());
  }

  /**
   * Import history from JSON string
   */
  fromJSON(json: string): void {
    const data = JSON.parse(json) as SerializedHistory<T>;
    this.restore(data);
  }

  // ==================== Event Handling ====================

  /**
   * Subscribe to history events
   */
  on(event: HistoryEventType, listener: HistoryEventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * Subscribe to history events (one-time)
   */
  once(event: HistoryEventType, listener: HistoryEventListener<T>): () => void {
    const wrappedListener: HistoryEventListener<T> = (...args) => {
      listener(...args);
      this.listeners.get(event)?.delete(wrappedListener);
    };
    return this.on(event, wrappedListener);
  }

  // ==================== Utility Methods ====================

  /**
   * Generate a unique ID for history entries
   */
  private generateId(): string {
    return `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Clone a state object (deep copy)
   */
  private cloneState(state: T): T {
    if (state === null || state === undefined) {
      return state;
    }

    // Use structured clone if available
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(state);
      } catch {
        // Fall back to JSON for non-cloneable objects
      }
    }

    // Fall back to JSON serialization
    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: HistoryEventType, state: T, entry: HistoryEntry<T> | null): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event, state, entry, this);
        } catch (error) {
          canvasLogger.default.error(`HistoryService: Error in listener for event "${event}":`, error);
        }
      });
    }
  }

  /**
   * Estimate memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    try {
      return new Blob([JSON.stringify(this.entries)]).size;
    } catch {
      return 0;
    }
  }
}

// ==================== Prototype-Specific History Types ====================

/**
 * Prototype history state
 */
export interface PrototypeHistoryState {
  pages: UIPage[];
  selectedPageId?: string;
  selectedComponentId?: string;
  zoom?: number;
  scrollPosition?: { x: number; y: number };
}

/**
 * Create a history service for prototype editing
 */
export function createPrototypeHistoryService(
  config: HistoryConfig = {}
): HistoryService<PrototypeHistoryState> {
  return new HistoryService<PrototypeHistoryState>({
    maxEntries: 50,
    ...config,
  });
}

// ==================== UI Schema History Helpers ====================

/**
 * Create a history entry from a UI Schema
 */
export function createSchemaHistoryEntry(
  schema: UISchema,
  action?: string,
  metadata?: HistoryMetadata
): HistoryEntry<UISchema> {
  return {
    id: `schema_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
    state: JSON.parse(JSON.stringify(schema)),
    action,
    metadata,
  };
}

/**
 * Compare two UI Schemas and get the differences
 */
export function compareSchemas(
  oldSchema: UISchema,
  newSchema: UISchema
): {
  addedPages: string[];
  removedPages: string[];
  modifiedPages: string[];
  addedComponents: string[];
  removedComponents: string[];
  modifiedComponents: string[];
} {
  const oldPageIds = new Set(oldSchema.pages.map(p => p.id));
  const newPageIds = new Set(newSchema.pages.map(p => p.id));

  const addedPages = Array.from(newPageIds).filter(id => !oldPageIds.has(id));
  const removedPages = Array.from(oldPageIds).filter(id => !newPageIds.has(id));

  const modifiedPages: string[] = [];
  const addedComponents: string[] = [];
  const removedComponents: string[] = [];
  const modifiedComponents: string[] = [];

  // Check for modified pages
  for (const newPage of newSchema.pages) {
    const oldPage = oldSchema.pages.find(p => p.id === newPage.id);
    if (oldPage) {
      if (JSON.stringify(oldPage) !== JSON.stringify(newPage)) {
        modifiedPages.push(newPage.id);
      }

      // Compare components
      const oldComponentIds = new Set(getAllComponentIds(oldPage.components));
      const newComponentIds = new Set(getAllComponentIds(newPage.components));

      addedComponents.push(...[...newComponentIds].filter(id => !oldComponentIds.has(id)));
      removedComponents.push(...[...oldComponentIds].filter(id => !newComponentIds.has(id)));

      // Check for modified components
      for (const newComponent of newPage.components) {
        const oldComponent = findComponentById(oldPage.components, newComponent.id);
        if (oldComponent && JSON.stringify(oldComponent) !== JSON.stringify(newComponent)) {
          modifiedComponents.push(newComponent.id);
        }
      }
    }
  }

  return {
    addedPages,
    removedPages,
    modifiedPages,
    addedComponents,
    removedComponents,
    modifiedComponents,
  };
}

/**
 * Get all component IDs from a component tree
 */
function getAllComponentIds(components: UIComponent[]): string[] {
  const ids: string[] = [];
  for (const component of components) {
    ids.push(component.id);
    if (component.children) {
      ids.push(...getAllComponentIds(component.children));
    }
  }
  return ids;
}

/**
 * Find a component by ID in a component tree
 */
function findComponentById(components: UIComponent[], id: string): UIComponent | null {
  for (const component of components) {
    if (component.id === id) return component;
    if (component.children) {
      const found = findComponentById(component.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Create metadata from schema comparison
 */
export function createChangeMetadata(
  oldSchema: UISchema,
  newSchema: UISchema
): HistoryMetadata {
  const diff = compareSchemas(oldSchema, newSchema);
  
  return {
    source: 'user',
    description: formatChangeDescription(diff),
    changedPages: [...diff.addedPages, ...diff.removedPages, ...diff.modifiedPages],
    changedComponents: [...diff.addedComponents, ...diff.removedComponents, ...diff.modifiedComponents],
  };
}

/**
 * Format a human-readable description of changes
 */
function formatChangeDescription(diff: ReturnType<typeof compareSchemas>): string {
  const parts: string[] = [];

  if (diff.addedPages.length > 0) {
    parts.push(`Added ${diff.addedPages.length} page(s)`);
  }
  if (diff.removedPages.length > 0) {
    parts.push(`Removed ${diff.removedPages.length} page(s)`);
  }
  if (diff.modifiedPages.length > 0) {
    parts.push(`Modified ${diff.modifiedPages.length} page(s)`);
  }
  if (diff.addedComponents.length > 0) {
    parts.push(`Added ${diff.addedComponents.length} component(s)`);
  }
  if (diff.removedComponents.length > 0) {
    parts.push(`Removed ${diff.removedComponents.length} component(s)`);
  }
  if (diff.modifiedComponents.length > 0) {
    parts.push(`Modified ${diff.modifiedComponents.length} component(s)`);
  }

  return parts.length > 0 ? parts.join(', ') : 'No changes';
}

// ==================== React Hook Integration ====================

/**
 * History hook return type
 */
export interface UseHistoryReturn<T> {
  state: T | null;
  push: (state: T, action?: string, metadata?: HistoryMetadata) => void;
  undo: () => T | null;
  redo: () => T | null;
  canUndo: boolean;
  canRedo: boolean;
  history: HistoryService<T>;
  entries: HistoryEntry<T>[];
  currentIndex: number;
  stats: HistoryStats;
}

// ==================== Default Export ====================

export default {
  HistoryService,
  createPrototypeHistoryService,
  createSchemaHistoryEntry,
  compareSchemas,
  createChangeMetadata,
};