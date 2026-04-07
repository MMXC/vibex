/**
 * Test Data Factories for Vibex
 * 
 * Provides factory functions for creating mock data objects.
 * Each factory creates a valid object with sensible defaults
 * that can be overridden as needed.
 * 
 * @example
 * ```typescript
 * import { mockBoundedContext, mockDomainModel } from '@/test-utils/factories';
 * 
 * const context = mockBoundedContext({ name: 'Custom Name' });
 * const models = mockDomainModel.list(3); // Create 3 models
 * ```
 */
// @ts-nocheck


// ==================== Types ====================

export interface BoundedContext {
  id: string;
  name: string;
  description: string;
  entities: DomainEntity[];
  services?: string[];
  repositories?: string[];
}

export interface DomainEntity {
  id: string;
  name: string;
  type: 'aggregate_root' | 'entity' | 'value_object';
  attributes: Attribute[];
  methods?: string[];
}

export interface Attribute {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface DomainModel {
  id: string;
  name: string;
  contextId: string;
  type: 'aggregate_root' | 'entity' | 'value_object';
  properties: Attribute[];
  methods: string[];
}

export interface BusinessFlow {
  id: string;
  name: string;
  states: State[];
  transitions: Transition[];
}

export interface State {
  id: string;
  name: string;
  type: 'initial' | 'intermediate' | 'final';
  description: string;
}

export interface Transition {
  id: string;
  fromStateId: string;
  toStateId: string;
  event: string;
  condition?: string;
}

export interface ThinkingStep {
  step: string;
  message: string;
}

// ==================== Factory Helper ====================

type FactoryFunction<T> = (overrides?: Partial<T>) => T;

interface FactoryWithList<T> extends FactoryFunction<T> {
  list: (count?: number, overrides?: Partial<T>) => T[];
}

function createFactory<T>(defaults: T): FactoryWithList<T> {
  const factory = (overrides?: Partial<T>): T => ({
    ...defaults,
    ...overrides,
  });

  factory.list = (count = 1, overrides?: Partial<T>): T[] => {
    const defaultId = (defaults as Record<string, unknown>).id;
    const overrideId = (overrides as Record<string, unknown>)?.id;
    return Array.from({ length: count }, (_, i) => ({
      ...defaults,
      ...overrides,
      ...(defaultId !== undefined ? { id: overrideId ?? `${defaultId}-${i + 1}` } : {}),
    }));
  };

  return factory as FactoryWithList<T>;
}

// ==================== Bounded Context Factory ====================

export const mockBoundedContext = createFactory<BoundedContext>({
  id: 'ctx-1',
  name: 'UserManagement',
  description: '用户管理上下文',
  entities: [],
  services: ['UserService', 'AuthService'],
  repositories: ['UserRepository'],
});

// ==================== Domain Entity Factory ====================

export const mockDomainEntity = createFactory<DomainEntity>({
  id: 'entity-1',
  name: 'User',
  type: 'aggregate_root',
  attributes: [
    { name: 'id', type: 'string', required: true, description: '用户ID' },
    { name: 'name', type: 'string', required: true, description: '用户名' },
    { name: 'email', type: 'string', required: true, description: '邮箱' },
  ],
  methods: ['create', 'update', 'delete'],
});

// ==================== Domain Model Factory ====================

export const mockDomainModel = createFactory<DomainModel>({
  id: 'model-1',
  name: 'User',
  contextId: 'ctx-1',
  type: 'aggregate_root',
  properties: [
    { name: 'id', type: 'string', required: true, description: '唯一标识' },
    { name: 'name', type: 'string', required: true, description: '名称' },
  ],
  methods: ['create', 'update'],
});

// ==================== Business Flow Factory ====================

export const mockBusinessFlow = createFactory<BusinessFlow>({
  id: 'flow-1',
  name: 'User Registration',
  states: [
    { id: 'state-1', name: 'Initial', type: 'initial', description: '开始注册' },
    { id: 'state-2', name: 'Verified', type: 'intermediate', description: '已验证' },
    { id: 'state-3', name: 'Completed', type: 'final', description: '注册完成' },
  ],
  transitions: [
    { id: 'trans-1', fromStateId: 'state-1', toStateId: 'state-2', event: 'verify' },
    { id: 'trans-2', fromStateId: 'state-2', toStateId: 'state-3', event: 'complete' },
  ],
});

// ==================== State Factory ====================

export const mockState = createFactory<State>({
  id: 'state-1',
  name: 'InitialState',
  type: 'initial',
  description: '初始状态',
});

// ==================== Transition Factory ====================

export const mockTransition = createFactory<Transition>({
  id: 'trans-1',
  fromStateId: 'state-1',
  toStateId: 'state-2',
  event: 'proceed',
  condition: undefined,
});

// ==================== Thinking Step Factory ====================

export const mockThinkingStep = createFactory<ThinkingStep>({
  step: 'analyze',
  message: '正在分析需求...',
});

// ==================== Attribute Factory ====================

export const mockAttribute = createFactory<Attribute>({
  name: 'id',
  type: 'string',
  required: true,
  description: '唯一标识',
});

// ==================== Composite Factories ====================

/**
 * Creates a complete DDD analysis result with contexts, models, and flow
 */
export function mockDDDAnalysisResult(overrides?: {
  contexts?: Partial<BoundedContext>[];
  domainModels?: Partial<DomainModel>[];
  businessFlow?: Partial<BusinessFlow>;
}) {
  const contexts = overrides?.contexts?.map(mockBoundedContext) ?? mockBoundedContext.list(2);
  const domainModels = overrides?.domainModels?.map(mockDomainModel) ?? mockDomainModel.list(3);
  const businessFlow = mockBusinessFlow(overrides?.businessFlow);

  return {
    contexts,
    domainModels,
    businessFlow,
    mermaidCode: `graph TD\n  A --> B`,
  };
}

/**
 * Creates a mock API response for SSE stream
 */
export function mockSSEResponse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ==================== Default Export ====================

export default {
  mockBoundedContext,
  mockDomainEntity,
  mockDomainModel,
  mockBusinessFlow,
  mockState,
  mockTransition,
  mockThinkingStep,
  mockAttribute,
  mockDDDAnalysisResult,
  mockSSEResponse,
};