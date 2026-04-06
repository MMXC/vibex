/**
 * Real-time Preview Service
 * 
 * This module provides real-time preview capabilities for the VibeX AI Prototype Builder.
 * It enables live updates, hot reloading, and preview synchronization between the editor
 * and the rendered output.
 * 
 * @module prototypes/preview-service
 */

import type { UISchema, UIPage, UIComponent, UITheme } from './ui-schema';
import type { RenderContext, RenderResult, InteractionEvent } from './renderer';
import { createRenderer, createDefaultRenderContext } from './renderer';
import { HistoryService, type HistoryEntry, type HistoryMetadata } from './history';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

// ==================== Types ====================

/**
 * Preview service configuration
 */
export interface PreviewServiceConfig {
  /** Enable hot module replacement */
  enableHMR?: boolean;
  /** Debounce delay for updates (ms) */
  debounceDelay?: number;
  /** Maximum retry attempts for reconnection */
  maxRetries?: number;
  /** Reconnection interval (ms) */
  reconnectInterval?: number;
  /** Enable preview persistence */
  enablePersistence?: boolean;
  /** Storage key for persistence */
  persistenceKey?: string;
  /** Callback when preview updates */
  onPreviewUpdate?: (result: PreviewResult) => void;
  /** Callback when errors occur */
  onError?: (error: Error) => void;
  /** Callback when connection state changes */
  onConnectionChange?: (connected: boolean) => void;
  /** Custom render context */
  renderContext?: Partial<RenderContext>;
}

/**
 * Preview result
 */
export interface PreviewResult {
  /** Unique preview ID */
  id: string;
  /** Rendered HTML content */
  html: string;
  /** CSS styles */
  styles: string[];
  /** JavaScript scripts */
  scripts: string[];
  /** Preview metadata */
  meta: PreviewMeta;
  /** Timestamp of generation */
  timestamp: number;
  /** Schema version used */
  schemaVersion: string;
}

/**
 * Preview metadata
 */
export interface PreviewMeta {
  /** Number of components rendered */
  componentCount: number;
  /** Maximum depth of component tree */
  depth: number;
  /** Whether interactions are present */
  hasInteractions: boolean;
  /** Component types used */
  usedComponents: string[];
  /** Page being previewed */
  activePage: string;
  /** Total pages in schema */
  totalPages: number;
  /** Render duration in ms */
  renderDuration: number;
}

/**
 * Preview state
 */
export interface PreviewState {
  /** Current schema being previewed */
  schema: UISchema | null;
  /** Active page ID */
  activePageId: string | null;
  /** Selected component ID */
  selectedComponentId: string | null;
  /** Preview mode */
  mode: PreviewMode;
  /** Viewport settings */
  viewport: ViewportSettings;
  /** Zoom level */
  zoom: number;
  /** Grid visibility */
  showGrid: boolean;
  /** Ruler visibility */
  showRulers: boolean;
  /** Device preview */
  device: DevicePreset | null;
}

/**
 * Preview mode
 */
export type PreviewMode = 'edit' | 'preview' | 'device' | 'responsive';

/**
 * Viewport settings
 */
export interface ViewportSettings {
  width: number;
  height: number;
  scale: number;
}

/**
 * Device preset for responsive preview
 */
export interface DevicePreset {
  name: string;
  width: number;
  height: number;
  userAgent?: string;
  pixelRatio?: number;
  type: 'phone' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
}

/**
 * Preview event types
 */
export type PreviewEventType = 
  | 'schema-update'
  | 'page-change'
  | 'component-select'
  | 'component-update'
  | 'viewport-change'
  | 'mode-change'
  | 'interaction'
  | 'error'
  | 'sync';

/**
 * Preview event listener
 */
export type PreviewEventListener = (event: PreviewEvent) => void;

/**
 * Preview event
 */
export interface PreviewEvent {
  type: PreviewEventType;
  payload: unknown;
  timestamp: number;
  source: 'local' | 'remote' | 'system';
}

/**
 * Sync message for collaborative preview
 */
export interface PreviewSyncMessage {
  type: 'full-sync' | 'delta-sync' | 'cursor' | 'selection';
  payload: unknown;
  sender: string;
  timestamp: number;
}

/**
 * Delta update for efficient synchronization
 */
export interface DeltaUpdate {
  path: string;
  operation: 'add' | 'remove' | 'update' | 'move';
  value?: unknown;
  oldValue?: unknown;
}

/**
 * Preview connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// ==================== Default Device Presets ====================

/**
 * Predefined device presets for responsive preview
 */
export const DEVICE_PRESETS: DevicePreset[] = [
  // Phones
  { name: 'iPhone SE', width: 375, height: 667, type: 'phone', orientation: 'portrait', pixelRatio: 2 },
  { name: 'iPhone 14', width: 390, height: 844, type: 'phone', orientation: 'portrait', pixelRatio: 3 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932, type: 'phone', orientation: 'portrait', pixelRatio: 3 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800, type: 'phone', orientation: 'portrait', pixelRatio: 3 },
  { name: 'Google Pixel 7', width: 412, height: 915, type: 'phone', orientation: 'portrait', pixelRatio: 2.625 },
  
  // Tablets
  { name: 'iPad Mini', width: 768, height: 1024, type: 'tablet', orientation: 'portrait', pixelRatio: 2 },
  { name: 'iPad Pro 11"', width: 834, height: 1194, type: 'tablet', orientation: 'portrait', pixelRatio: 2 },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366, type: 'tablet', orientation: 'portrait', pixelRatio: 2 },
  { name: 'Samsung Galaxy Tab S8', width: 800, height: 1280, type: 'tablet', orientation: 'portrait', pixelRatio: 1.5 },
  
  // Desktops
  { name: 'MacBook Air', width: 1280, height: 800, type: 'desktop', orientation: 'landscape', pixelRatio: 2 },
  { name: 'MacBook Pro 14"', width: 1512, height: 982, type: 'desktop', orientation: 'landscape', pixelRatio: 2 },
  { name: 'Desktop 1080p', width: 1920, height: 1080, type: 'desktop', orientation: 'landscape', pixelRatio: 1 },
  { name: 'Desktop 4K', width: 3840, height: 2160, type: 'desktop', orientation: 'landscape', pixelRatio: 1 },
];

// ==================== Preview Service Class ====================

/**
 * Real-time Preview Service
 * 
 * Manages live preview generation, synchronization, and state management.
 * 
 * @example
 * ```typescript
 * const preview = new PreviewService({
 *   onPreviewUpdate: (result) => {
 *     document.getElementById('preview').innerHTML = result.html;
 *   }
 * });
 * 
 * preview.setSchema(mySchema);
 * preview.setActivePage('page-1');
 * 
 * // Subscribe to events
 * preview.on('component-select', (event) => {
 *   canvasLogger.default.debug('Selected:', event.payload);
 * });
 * ```
 */
export class PreviewService {
  private config: Required<PreviewServiceConfig>;
  private state: PreviewState;
  private renderer: ReturnType<typeof createRenderer>;
  private history: HistoryService<UISchema>;
  private listeners: Map<PreviewEventType, Set<PreviewEventListener>> = new Map();
  private updateTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private websocket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private pendingUpdates: DeltaUpdate[] = [];

  /**
   * Create a new PreviewService instance
   */
  constructor(config: PreviewServiceConfig = {}) {
    this.config = {
      enableHMR: config.enableHMR ?? true,
      debounceDelay: config.debounceDelay ?? 100,
      maxRetries: config.maxRetries ?? 5,
      reconnectInterval: config.reconnectInterval ?? 3000,
      enablePersistence: config.enablePersistence ?? true,
      persistenceKey: config.persistenceKey ?? 'vibex-preview-state',
      onPreviewUpdate: config.onPreviewUpdate ?? (() => {}),
      onError: config.onError ?? (() => {}),
      onConnectionChange: config.onConnectionChange ?? (() => {}),
      renderContext: config.renderContext ?? {},
    };

    this.renderer = createRenderer();
    this.history = new HistoryService<UISchema>({ maxEntries: 100 });

    this.state = this.loadPersistedState() || this.getDefaultState();
    
    if (this.config.enablePersistence) {
      this.setupAutoPersist();
    }
  }

  // ==================== Core Methods ====================

  /**
   * Set the schema to preview
   */
  setSchema(schema: UISchema, action?: string): void {
    const oldSchema = this.state.schema;
    this.state.schema = schema;
    
    // Push to history
    if (oldSchema) {
      const metadata: HistoryMetadata = {
        source: 'user',
        description: action || 'Schema updated',
      };
      this.history.push(schema, action, metadata);
    }

    // Emit event
    this.emit('schema-update', { schema, oldSchema });

    // Trigger preview update
    this.schedulePreviewUpdate();
  }

  /**
   * Get current schema
   */
  getSchema(): UISchema | null {
    return this.state.schema;
  }

  /**
   * Set active page for preview
   */
  setActivePage(pageId: string): void {
    if (!this.state.schema) return;
    
    const page = this.state.schema.pages.find(p => p.id === pageId);
    if (!page) {
      this.config.onError(new Error(`Page not found: ${pageId}`));
      return;
    }

    this.state.activePageId = pageId;
    this.emit('page-change', { pageId, page });

    if (this.config.enablePersistence) {
      this.persistState();
    }

    this.schedulePreviewUpdate();
  }

  /**
   * Get active page ID
   */
  getActivePageId(): string | null {
    return this.state.activePageId;
  }

  /**
   * Select a component in the preview
   */
  selectComponent(componentId: string | null): void {
    this.state.selectedComponentId = componentId;
    this.emit('component-select', { componentId });

    if (this.config.enablePersistence) {
      this.persistState();
    }
  }

  /**
   * Get selected component ID
   */
  getSelectedComponentId(): string | null {
    return this.state.selectedComponentId;
  }

  /**
   * Update a component in the schema
   */
  updateComponent(
    pageId: string,
    componentId: string,
    updates: Partial<UIComponent>
  ): void {
    if (!this.state.schema) return;

    const schema = JSON.parse(JSON.stringify(this.state.schema)) as UISchema;
    const page = schema.pages.find(p => p.id === pageId);
    if (!page) return;

    const component = this.findComponent(page.components, componentId);
    if (!component) return;

    // Apply updates
    Object.assign(component, updates);

    // Create delta for sync
    const delta: DeltaUpdate = {
      path: `pages[${pageId}].components[${componentId}]`,
      operation: 'update',
      value: updates,
      oldValue: component,
    };
    this.pendingUpdates.push(delta);

    // Update schema
    this.setSchema(schema, `Update component: ${componentId}`);
  }

  /**
   * Add a component to the schema
   */
  addComponent(
    pageId: string,
    component: UIComponent,
    parentId?: string,
    index?: number
  ): void {
    if (!this.state.schema) return;

    const schema = JSON.parse(JSON.stringify(this.state.schema)) as UISchema;
    const page = schema.pages.find(p => p.id === pageId);
    if (!page) return;

    if (parentId) {
      const parent = this.findComponent(page.components, parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        if (index !== undefined) {
          parent.children.splice(index, 0, component);
        } else {
          parent.children.push(component);
        }
      }
    } else {
      if (index !== undefined) {
        page.components.splice(index, 0, component);
      } else {
        page.components.push(component);
      }
    }

    const delta: DeltaUpdate = {
      path: `pages[${pageId}].components`,
      operation: 'add',
      value: component,
    };
    this.pendingUpdates.push(delta);

    this.setSchema(schema, `Add component: ${component.type}`);
  }

  /**
   * Remove a component from the schema
   */
  removeComponent(pageId: string, componentId: string): void {
    if (!this.state.schema) return;

    const schema = JSON.parse(JSON.stringify(this.state.schema)) as UISchema;
    const page = schema.pages.find(p => p.id === pageId);
    if (!page) return;

    const removed = this.removeComponentRecursive(page.components, componentId);
    if (removed) {
      const delta: DeltaUpdate = {
        path: `pages[${pageId}].components[${componentId}]`,
        operation: 'remove',
        oldValue: removed,
      };
      this.pendingUpdates.push(delta);

      this.setSchema(schema, `Remove component: ${componentId}`);
    }
  }

  /**
   * Set preview mode
   */
  setMode(mode: PreviewMode): void {
    this.state.mode = mode;
    this.emit('mode-change', { mode });

    if (this.config.enablePersistence) {
      this.persistState();
    }
  }

  /**
   * Get preview mode
   */
  getMode(): PreviewMode {
    return this.state.mode;
  }

  /**
   * Set viewport settings
   */
  setViewport(viewport: Partial<ViewportSettings>): void {
    this.state.viewport = { ...this.state.viewport, ...viewport };
    this.emit('viewport-change', { viewport: this.state.viewport });

    if (this.config.enablePersistence) {
      this.persistState();
    }
  }

  /**
   * Get viewport settings
   */
  getViewport(): ViewportSettings {
    return { ...this.state.viewport };
  }

  /**
   * Set device preset
   */
  setDevice(device: DevicePreset | null): void {
    this.state.device = device;
    
    if (device) {
      this.state.mode = 'device';
      this.state.viewport = {
        width: device.width,
        height: device.height,
        scale: device.pixelRatio || 1,
      };
    } else {
      this.state.mode = 'edit';
    }

    this.emit('viewport-change', { viewport: this.state.viewport, device });
  }

  /**
   * Set zoom level
   */
  setZoom(zoom: number): void {
    this.state.zoom = Math.max(0.1, Math.min(3, zoom));
    this.emit('viewport-change', { zoom: this.state.zoom });
  }

  /**
   * Get current state
   */
  getState(): PreviewState {
    return { ...this.state };
  }

  // ==================== Preview Generation ====================

  /**
   * Generate preview result
   */
  generatePreview(): PreviewResult | null {
    if (!this.state.schema) return null;

    const startTime = performance.now();
    const activePage = this.state.activePageId
      ? this.state.schema.pages.find(p => p.id === this.state.activePageId)
      : this.state.schema.pages[0];

    if (!activePage) return null;

    const context = createDefaultRenderContext(
      this.state.schema.theme,
      {
        ...this.config.renderContext,
        currentPageId: activePage.id,
        onInteraction: (event: InteractionEvent) => {
          this.handleInteraction(event);
        },
        onStateChange: (key: string, value: unknown) => {
          this.handleStateChange(key, value);
        },
      }
    );

    const renderResult = this.renderer.renderSchema(this.state.schema, {
      pageId: activePage.id,
      context,
    });

    const html = this.renderToString(renderResult);
    const renderDuration = performance.now() - startTime;

    const result: PreviewResult = {
      id: `preview_${Date.now()}`,
      html,
      styles: renderResult.styles,
      scripts: renderResult.scripts,
      meta: {
        componentCount: renderResult.meta.componentCount,
        depth: renderResult.meta.depth,
        hasInteractions: renderResult.meta.hasInteractions,
        usedComponents: renderResult.meta.usedComponents,
        activePage: activePage.id,
        totalPages: this.state.schema.pages.length,
        renderDuration,
      },
      timestamp: Date.now(),
      schemaVersion: this.state.schema.version,
    };

    return result;
  }

  /**
   * Schedule a debounced preview update
   */
  private schedulePreviewUpdate(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = setTimeout(() => {
      const result = this.generatePreview();
      if (result) {
        this.config.onPreviewUpdate(result);
      }
      this.updateTimer = null;
    }, this.config.debounceDelay);
  }

  /**
   * Render result to HTML string
   */
  private renderToString(renderResult: RenderResult): string {
    // Simple HTML rendering - in production, use ReactDOMServer
    const { element } = renderResult;
    
    // For now, return a placeholder that can be hydrated
    return `
      <div class="vibex-preview-root" data-ssr="true">
        ${this.renderElementToString(element)}
      </div>
    `;
  }

  /**
   * Render React element to string (simplified)
   */
  private renderElementToString(element: unknown): string {
    if (element === null || element === undefined) {
      return '';
    }

    if (typeof element === 'string' || typeof element === 'number') {
      return String(element);
    }

    if (Array.isArray(element)) {
      return element.map(el => this.renderElementToString(el)).join('');
    }

    // For React elements, we'd use ReactDOMServer in production
    // This is a simplified version for demonstration
    if (typeof element === 'object' && element !== null && 'type' in element) {
      const el = element as { type: string | unknown; props?: Record<string, unknown> };
      const type = el.type;
      const props = el.props || {};

      if (typeof type === 'function') {
        // Function component
        return this.renderElementToString((type as Function)(props));
      }

      if (typeof type === 'string') {
        const tagName = type;
        const children = props.children as unknown;
        const attrStr = Object.entries(props)
          .filter(([key]) => key !== 'children')
          .map(([key, value]) => {
            if (key === 'className') return `class="${value}"`;
            if (key === 'style' && typeof value === 'object') {
              const styleStr = Object.entries(value as Record<string, string | number>)
                .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
                .join('; ');
              return `style="${styleStr}"`;
            }
            if (typeof value === 'string') return `${key}="${value}"`;
            if (typeof value === 'number') return `${key}="${value}"`;
            if (typeof value === 'boolean') return value ? key : '';
            return '';
          })
          .filter(Boolean)
          .join(' ');

        const childrenStr = this.renderElementToString(children);
        
        // Self-closing tags
        const selfClosing = ['img', 'input', 'br', 'hr', 'meta', 'link'];
        if (selfClosing.includes(tagName)) {
          return `<${tagName} ${attrStr} />`;
        }
        
        return `<${tagName} ${attrStr}>${childrenStr}</${tagName}>`;
      }
    }

    return '';
  }

  // ==================== History ====================

  /**
   * Undo last change
   */
  undo(): boolean {
    const schema = this.history.undo();
    if (schema) {
      this.state.schema = schema;
      this.emit('schema-update', { schema, source: 'undo' });
      this.schedulePreviewUpdate();
      return true;
    }
    return false;
  }

  /**
   * Redo last undone change
   */
  redo(): boolean {
    const schema = this.history.redo();
    if (schema) {
      this.state.schema = schema;
      this.emit('schema-update', { schema, source: 'redo' });
      this.schedulePreviewUpdate();
      return true;
    }
    return false;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.history.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.history.canRedo();
  }

  /**
   * Get history entries
   */
  getHistory(): HistoryEntry<UISchema>[] {
    return this.history.getEntries();
  }

  // ==================== Event Handling ====================

  /**
   * Subscribe to preview events
   */
  on(event: PreviewEventType, listener: PreviewEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * Subscribe to preview events (one-time)
   */
  once(event: PreviewEventType, listener: PreviewEventListener): () => void {
    const wrappedListener: PreviewEventListener = (e) => {
      listener(e);
      this.listeners.get(event)?.delete(wrappedListener);
    };
    return this.on(event, wrappedListener);
  }

  /**
   * Emit an event
   */
  private emit(type: PreviewEventType, payload: unknown): void {
    const event: PreviewEvent = {
      type,
      payload,
      timestamp: Date.now(),
      source: 'local',
    };

    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          this.config.onError(error as Error);
        }
      });
    }
  }

  /**
   * Handle component interaction
   */
  private handleInteraction(event: InteractionEvent): void {
    this.emit('interaction', event);
  }

  /**
   * Handle state change
   */
  private handleStateChange(key: string, value: unknown): void {
    // Handle state changes from rendered components
    canvasLogger.default.debug('[PreviewService] State change:', key, value);
  }

  // ==================== Persistence ====================

  /**
   * Load persisted state from storage
   */
  private loadPersistedState(): PreviewState | null {
    if (!this.config.enablePersistence) return null;

    try {
      const stored = localStorage.getItem(this.config.persistenceKey);
      if (stored) {
        return JSON.parse(stored) as PreviewState;
      }
    } catch (error) {
      canvasLogger.default.warn('[PreviewService] Failed to load persisted state:', error);
    }
    return null;
  }

  /**
   * Persist current state to storage
   */
  private persistState(): void {
    if (!this.config.enablePersistence) return;

    try {
      localStorage.setItem(this.config.persistenceKey, JSON.stringify(this.state));
    } catch (error) {
      canvasLogger.default.warn('[PreviewService] Failed to persist state:', error);
    }
  }

  /**
   * Setup auto-persist on state changes
   */
  private setupAutoPersist(): void {
    this.on('schema-update', () => this.persistState());
    this.on('page-change', () => this.persistState());
    this.on('mode-change', () => this.persistState());
  }

  /**
   * Get default state
   */
  private getDefaultState(): PreviewState {
    return {
      schema: null,
      activePageId: null,
      selectedComponentId: null,
      mode: 'edit',
      viewport: {
        width: 1280,
        height: 720,
        scale: 1,
      },
      zoom: 1,
      showGrid: true,
      showRulers: true,
      device: null,
    };
  }

  // ==================== Utility Methods ====================

  /**
   * Find a component by ID in a component tree
   */
  private findComponent(components: UIComponent[], id: string): UIComponent | null {
    for (const component of components) {
      if (component.id === id) return component;
      if (component.children) {
        const found = this.findComponent(component.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Remove a component recursively
   */
  private removeComponentRecursive(
    components: UIComponent[],
    id: string
  ): UIComponent | null {
    for (let i = 0; i < components.length; i++) {
      if (components[i].id === id) {
        return components.splice(i, 1)[0];
      }
      if (components[i].children) {
        const removed = this.removeComponentRecursive(components[i].children!, id);
        if (removed) return removed;
      }
    }
    return null;
  }

  // ==================== Sync Methods ====================

  /**
   * Connect to sync server (WebSocket)
   */
  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.websocket) {
        this.websocket.close();
      }

      this.connectionStatus = 'connecting';
      this.config.onConnectionChange(false);

      try {
        this.websocket = new WebSocket(url);

        this.websocket.onopen = () => {
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
          this.config.onConnectionChange(true);
          
          // Send pending updates
          this.flushPendingUpdates();
          
          resolve();
        };

        this.websocket.onclose = () => {
          this.connectionStatus = 'disconnected';
          this.config.onConnectionChange(false);
          
          // Attempt reconnection
          if (this.reconnectAttempts < this.config.maxRetries) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(url), this.config.reconnectInterval);
          }
        };

        this.websocket.onerror = (error) => {
          this.connectionStatus = 'error';
          this.config.onError(new Error('WebSocket connection error'));
          reject(error);
        };

        this.websocket.onmessage = (event) => {
          this.handleSyncMessage(JSON.parse(event.data));
        };
      } catch (error) {
        this.connectionStatus = 'error';
        reject(error);
      }
    });
  }

  /**
   * Disconnect from sync server
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.connectionStatus = 'disconnected';
    this.config.onConnectionChange(false);
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Handle incoming sync message
   */
  private handleSyncMessage(message: PreviewSyncMessage): void {
    switch (message.type) {
      case 'full-sync':
        if (message.payload && typeof message.payload === 'object') {
          this.state.schema = message.payload as UISchema;
          this.emit('sync', { type: 'full-sync', schema: this.state.schema });
          this.schedulePreviewUpdate();
        }
        break;
      
      case 'delta-sync':
        this.applyDeltas(message.payload as DeltaUpdate[]);
        break;
      
      case 'cursor':
        // Handle cursor position from collaborators
        break;
      
      case 'selection':
        // Handle selection from collaborators
        break;
    }
  }

  /**
   * Apply delta updates
   */
  private applyDeltas(deltas: DeltaUpdate[]): void {
    if (!this.state.schema) return;

    // Apply deltas to the schema
    // This is a simplified implementation
    for (const delta of deltas) {
      this.emit('schema-update', { delta, source: 'remote' });
    }

    this.schedulePreviewUpdate();
  }

  /**
   * Flush pending updates to server
   */
  private flushPendingUpdates(): void {
    if (!this.websocket || this.pendingUpdates.length === 0) return;

    const message: PreviewSyncMessage = {
      type: 'delta-sync',
      payload: [...this.pendingUpdates],
      sender: 'local',
      timestamp: Date.now(),
    };

    this.websocket.send(JSON.stringify(message));
    this.pendingUpdates = [];
  }

  /**
   * Broadcast current schema to collaborators
   */
  broadcastSchema(): void {
    if (!this.websocket || !this.state.schema) return;

    const message: PreviewSyncMessage = {
      type: 'full-sync',
      payload: this.state.schema,
      sender: 'local',
      timestamp: Date.now(),
    };

    this.websocket.send(JSON.stringify(message));
  }

  // ==================== Cleanup ====================

  /**
   * Dispose the preview service
   */
  dispose(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.disconnect();
    this.listeners.clear();
    this.pendingUpdates = [];
  }
}

// ==================== Utility Functions ====================

/**
 * Create a preview service instance
 */
export function createPreviewService(config?: PreviewServiceConfig): PreviewService {
  return new PreviewService(config);
}

/**
 * Get device presets
 */
export function getDevicePresets(): DevicePreset[] {
  return [...DEVICE_PRESETS];
}

/**
 * Get device preset by name
 */
export function getDevicePresetByName(name: string): DevicePreset | undefined {
  return DEVICE_PRESETS.find(d => d.name === name);
}

/**
 * Get devices by type
 */
export function getDevicesByType(type: DevicePreset['type']): DevicePreset[] {
  return DEVICE_PRESETS.filter(d => d.type === type);
}

/**
 * Calculate responsive breakpoints for viewport
 */
export function calculateBreakpoint(width: number): string {
  if (width < 576) return 'xs';
  if (width < 768) return 'sm';
  if (width < 992) return 'md';
  if (width < 1200) return 'lg';
  if (width < 1400) return 'xl';
  return '2xl';
}

/**
 * Check if viewport is mobile
 */
export function isMobileViewport(width: number): boolean {
  return width < 768;
}

/**
 * Check if viewport is tablet
 */
export function isTabletViewport(width: number): boolean {
  return width >= 768 && width < 992;
}

/**
 * Check if viewport is desktop
 */
export function isDesktopViewport(width: number): boolean {
  return width >= 992;
}

// ==================== React Hook Integration ====================

/**
 * Hook result type for usePreview
 */
export interface UsePreviewResult {
  preview: PreviewResult | null;
  state: PreviewState;
  setSchema: (schema: UISchema) => void;
  setActivePage: (pageId: string) => void;
  selectComponent: (componentId: string | null) => void;
  setViewport: (viewport: Partial<ViewportSettings>) => void;
  setMode: (mode: PreviewMode) => void;
  setDevice: (device: DevicePreset | null) => void;
  setZoom: (zoom: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  connectionStatus: ConnectionStatus;
}

// ==================== Default Export ====================

export default {
  PreviewService,
  createPreviewService,
  getDevicePresets,
  getDevicePresetByName,
  getDevicesByType,
  calculateBreakpoint,
  isMobileViewport,
  isTabletViewport,
  isDesktopViewport,
  DEVICE_PRESETS,
};