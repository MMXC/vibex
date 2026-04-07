/**
 * Homepage Types
 * Type definitions for the homepage modular refactor
 */

/** 步骤定义 */
export interface Step {
  id: number;
  label: string;
  description: string;
}

/** 限界上下文 */
export interface BoundedContext {
  id: string;
  name: string;
  description: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  keyResponsibilities?: string[];
  relationships: ContextRelationship[];
}

/** 上下文关系 */
export interface ContextRelationship {
  id: string;
  fromContextId: string;
  toContextId: string;
  type: 'upstream' | 'downstream' | 'symmetric';
  description: string;
}

/** 领域模型 */
export interface DomainModel {
  id: string;
  name: string;
  type: 'aggregate_root' | 'entity' | 'value_object' | 'service';
  contextId: string;
  attributes?: ModelAttribute[];
  methods?: string[];
}

/** 模型属性 */
export interface ModelAttribute {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

/** 业务流程 */
export interface BusinessFlow {
  id: string;
  name: string;
  steps: FlowStep[];
  actors?: string[];
}

/** 流程步骤 */
export interface FlowStep {
  id: string;
  order: number;
  description: string;
  actor?: string;
  preconditions?: string[];
  postconditions?: string[];
}

/** 页面结构 */
export interface PageStructure {
  id: string;
  name: string;
  pages: PageDefinition[];
  routes: RouteDefinition[];
}

/** 页面定义 */
export interface PageDefinition {
  id: string;
  name: string;
  path: string;
  components: string[];
}

/** 路由定义 */
export interface RouteDefinition {
  path: string;
  pageId: string;
  layout?: string;
}

/** 按钮类型 */
export type ButtonType = 'context' | 'flow' | 'page' | 'project';

/** 按钮状态 */
export interface ButtonState {
  enabled: boolean;
  tooltip?: string;
}

/** 按钮状态映射 */
export interface ButtonStates {
  context: ButtonState;
  flow: ButtonState;
  page: ButtonState;
  project: ButtonState;
}

/** 面板状态 */
export type PanelState = 'normal' | 'maximized' | 'minimized';

/** 生成结果类型 */
export type GenerationType = 'contexts' | 'models' | 'flows' | 'project';

/** 生成结果 */
export interface GenerationResult {
  type: GenerationType;
  data: unknown;
}

/** Mermaid 代码映射 */
export interface MermaidCodes {
  contexts?: string;
  models?: string;
  flows?: string;
}

/** AI 消息 */
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/** 思考消息 (AI 思考过程) */
export interface ThinkingMessage {
  id: string;
  content: string;
  timestamp: string;
}

/** 流状态 */
export type StreamStatus = 'idle' | 'streaming' | 'complete' | 'error';

/** 持久化的首页状态 */
export interface PersistedHomeState {
  panelSizes: number[];
  selectedNodes: string[];
  lastRequirementText?: string;
  savedAt: string;
}

/** 组件 Props 接口 */

// Navbar Props
export interface NavbarComponentProps {
  /** 是否已认证 */
  isAuthenticated: boolean;
  /** 登录点击回调 */
  onLoginClick: () => void;
  /** 自定义类名 */
  className?: string;
  /** 标题 */
  title?: string;
  /** 菜单切换回调 */
  onMenuToggle?: () => void;
  /** 设置点击回调 */
  onSettingsClick?: () => void;
}

// Sidebar Props
export interface SidebarComponentProps {
  /** 步骤列表 */
  steps: Step[];
  /** 当前步骤 */
  currentStep: number;
  /** 已完成的步骤 */
  completedStep: number;
  /** 步骤点击回调 */
  onStepClick: (step: number) => void;
  /** 判断步骤是否可点击 */
  isStepClickable?: (step: number) => boolean;
  /** 是否折叠 */
  isCollapsed?: boolean;
  /** 折叠变化回调 */
  onCollapse?: (collapsed: boolean) => void;
  /** 自定义类名 */
  className?: string;
}

// PreviewCanvas Props
export interface PreviewCanvasProps {
  /** 当前步骤 */
  currentStep: number;
  /** Mermaid 代码映射 */
  mermaidCodes: MermaidCodes;
  /** 限界上下文列表 */
  boundedContexts: BoundedContext[];
  /** 领域模型列表 */
  domainModels: DomainModel[];
  /** 业务流程 */
  businessFlow: BusinessFlow | null;
  /** 选中的节点 */
  selectedNodes: Set<string>;
  /** 节点切换回调 */
  onNodeToggle: (nodeId: string) => void;
  /** 面板尺寸 */
  panelSizes: number[];
  /** 面板尺寸变化回调 */
  onPanelResize: (sizes: number[]) => void;
  /** 最大化面板 */
  maximizedPanel: string | null;
  /** 最小化面板 */
  minimizedPanel: string | null;
  /** 最大化回调 */
  onMaximize: (panelId: string) => void;
  /** 最小化回调 */
  onMinimize: (panelId: string) => void;
  /** 自定义类名 */
  className?: string;
}

// InputArea Props
export interface InputAreaComponentProps {
  /** 当前步骤 */
  currentStep: number;
  /** 需求文本 */
  requirementText: string;
  /** 需求变化回调 */
  onRequirementChange: (text: string) => void;
  /** 生成回调 */
  onGenerate: () => void;
  /** 生成领域模型回调 */
  onGenerateDomainModel?: () => void;
  /** 生成业务流程回调 */
  onGenerateBusinessFlow?: () => void;
  /** 创建项目回调 */
  onCreateProject?: () => void;
  /** 是否正在生成 */
  isGenerating: boolean;
  /** 限界上下文 (用于 Step 2+) */
  boundedContexts?: BoundedContext[];
  /** 领域模型 (用于 Step 3+) */
  domainModels?: DomainModel[];
  /** 业务流程 (用于 Step 4+) */
  businessFlow?: BusinessFlow | null;
  /** 自定义类名 */
  className?: string;
}

// AIPanel Props
export interface AIPanelComponentProps {
  /** 消息列表 */
  messages: AIMessage[];
  /** 发送消息回调 */
  onSendMessage: (message: string) => void;
  /** 思考消息列表 (ThinkingPanel) */
  thinkingMessages?: string[];
  /** 流状态 */
  streamStatus?: StreamStatus;
  /** 中止回调 */
  onAbort?: () => void;
  /** 重试回调 */
  onRetry?: () => void;
  /** 是否折叠 */
  collapsed?: boolean;
  /** 折叠变化回调 */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** 自定义类名 */
  className?: string;
}

/** Hooks 返回类型 */

// useHomeState 返回类型
export interface HomeState {
  // 步骤状态
  currentStep: number;
  completedStep: number;
  setCurrentStep: (step: number) => void;
  setCompletedStep: (step: number) => void;

  // 需求状态
  requirementText: string;
  setRequirementText: (text: string) => void;

  // Mermaid 代码
  mermaidCodes: MermaidCodes;
  setMermaidCodes: (codes: MermaidCodes) => void;

  // 生成结果
  boundedContexts: BoundedContext[];
  domainModels: DomainModel[];
  businessFlow: BusinessFlow | null;
  setBoundedContexts: (contexts: BoundedContext[]) => void;
  setDomainModels: (models: DomainModel[]) => void;
  setBusinessFlow: (flow: BusinessFlow | null) => void;

  // 节点选择
  selectedNodes: Set<string>;
  toggleNode: (nodeId: string) => void;

  // AI 消息
  messages: AIMessage[];
  addMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // 思考消息
  thinkingMessages: string[];
  addThinkingMessage: (message: string) => void;
  clearThinkingMessages: () => void;

  // 重置
  reset: () => void;
}

// useHomeGeneration 返回类型
export interface HomeGeneration {
  // 生成状态
  isGenerating: boolean;
  generationError: Error | null;
  streamStatus: StreamStatus;

  // 生成方法
  generateContexts: (requirement: string) => Promise<void>;
  generateDomainModels: (contexts: BoundedContext[]) => Promise<void>;
  generateBusinessFlow: (models: DomainModel[]) => Promise<void>;
  createProject: (projectName: string, projectDescription: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;

  // 控制
  abort: () => void;
  retry: () => void;
  clearError: () => void;
}

// useHomePanel 返回类型
export interface HomePanel {
  // 面板尺寸
  panelSizes: number[];
  setPanelSizes: (sizes: number[]) => void;

  // 最大化
  maximizedPanel: string | null;
  setMaximizedPanel: (panelId: string | null) => void;
  toggleMaximize: (panelId: string) => void;

  // 最小化
  minimizedPanel: string | null;
  setMinimizedPanel: (panelId: string | null) => void;
  toggleMinimize: (panelId: string) => void;

  // 重置
  reset: () => void;
}
