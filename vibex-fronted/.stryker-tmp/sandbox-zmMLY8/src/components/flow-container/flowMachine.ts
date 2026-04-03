/**
 * Flow Process XState Machine
 * 
 * Manages the 5-step flow: Requirements → Context → Business Flow → Components → Project
 */
// @ts-nocheck


import { setup, assign, fromPromise } from 'xstate';

export type FlowStep = 'requirements' | 'context' | 'businessFlow' | 'components' | 'project';

export interface FlowContext {
  requirements: string;
  examples: string[];
  boundedContexts: BoundedContext[];
  businessFlow: FlowNode[];
  selectedComponents: Component[];
  projectMeta: ProjectMeta;
  errors: string[];
}

export interface BoundedContext {
  id: string;
  name: string;
  description: string;
  dependencies: string[];
  selected: boolean;
}

export interface FlowNode {
  id: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'subprocess';
  label: string;
  position: { x: number; y: number };
  connections: string[];
  metadata?: Record<string, string>;
}

export interface Component {
  id: string;
  name: string;
  category: string;
  selected: boolean;
}

export interface ProjectMeta {
  name: string;
  description: string;
  techStack: string[];
  createdAt?: string;
}

export const STEP_ORDER: FlowStep[] = [
  'requirements',
  'context',
  'businessFlow',
  'components',
  'project',
];

export const STEP_LABELS: Record<FlowStep, string> = {
  requirements: 'Requirements',
  context: 'Bounded Context',
  businessFlow: 'Business Flow',
  components: 'Components',
  project: 'Project',
};

export const STEP_ICONS: Record<FlowStep, string> = {
  requirements: '📝',
  context: '🎯',
  businessFlow: '🔄',
  components: '🧩',
  project: '🚀',
};

// Persist to localStorage
const loadPersistedState = (): Partial<FlowContext> => {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem('vibex-flow-state');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export type FlowEvent = 
  | { type: 'SET_REQUIREMENTS'; requirements: string }
  | { type: 'SET_EXAMPLES'; examples: string[] }
  | { type: 'ADD_CONTEXT'; context: BoundedContext }
  | { type: 'UPDATE_CONTEXT'; context: BoundedContext }
  | { type: 'REMOVE_CONTEXT'; id: string }
  | { type: 'TOGGLE_CONTEXT'; id: string }
  | { type: 'SET_BUSINESS_FLOW'; nodes: FlowNode[] }
  | { type: 'UPDATE_NODE'; node: FlowNode }
  | { type: 'ADD_NODE'; node: FlowNode }
  | { type: 'REMOVE_NODE'; id: string }
  | { type: 'TOGGLE_COMPONENT'; id: string }
  | { type: 'SET_PROJECT_META'; meta: Partial<ProjectMeta> }
  | { type: 'GO_NEXT' }
  | { type: 'GO_PREV' }
  | { type: 'GO_TO_STEP'; step: FlowStep }
  | { type: 'RESET' }
  | { type: 'SAVE' };

export const flowMachine = setup({
  types: {
    context: {} as FlowContext,
    events: {} as FlowEvent,
  },
  actions: {
    persistState: assign(({ context }: { context: FlowContext }) => {
      if (typeof window === 'undefined') return {};
      try {
        localStorage.setItem('vibex-flow-state', JSON.stringify(context));
      } catch { /* ignore */ }
      return {};
    }),
  },
  guards: {
    hasRequirements: ({ context }: { context: FlowContext }) => {
      return context.requirements.trim().length > 0;
    },
  },
}).createMachine({
  id: 'flowProcess',
  initial: 'requirements',
  context: {
    requirements: '',
    examples: [],
    boundedContexts: [],
    businessFlow: [],
    selectedComponents: [],
    projectMeta: { name: '', description: '', techStack: [] },
    errors: [],
    ...loadPersistedState(),
  },
  states: {
    requirements: {
      on: {
        SET_REQUIREMENTS: {
          actions: assign({
            requirements: ({ event }) => (event as FlowEvent & { requirements: string }).requirements,
          }),
        },
        SET_EXAMPLES: {
          actions: assign({
            examples: ({ event }) => (event as FlowEvent & { examples: string[] }).examples,
          }),
        },
        GO_NEXT: { target: 'context', guard: 'hasRequirements' },
        SAVE: { actions: 'persistState' },
      },
    },
    context: {
      on: {
        ADD_CONTEXT: {
          actions: assign({
            boundedContexts: ({ context, event }) => [
              ...context.boundedContexts,
              (event as FlowEvent & { context: BoundedContext }).context,
            ],
          }),
        },
        UPDATE_CONTEXT: {
          actions: assign({
            boundedContexts: ({ context, event }) => {
              const evt = event as FlowEvent & { context: BoundedContext };
              return context.boundedContexts.map((c) =>
                c.id === evt.context.id ? evt.context : c
              );
            },
          }),
        },
        REMOVE_CONTEXT: {
          actions: assign({
            boundedContexts: ({ context, event }) =>
              context.boundedContexts.filter((c) => c.id !== (event as FlowEvent & { id: string }).id),
          }),
        },
        TOGGLE_CONTEXT: {
          actions: assign({
            boundedContexts: ({ context, event }) => {
              const id = (event as FlowEvent & { id: string }).id;
              return context.boundedContexts.map((c) =>
                c.id === id ? { ...c, selected: !c.selected } : c
              );
            },
          }),
        },
        GO_NEXT: { target: 'businessFlow' },
        GO_PREV: { target: 'requirements' },
        SAVE: { actions: 'persistState' },
      },
    },
    businessFlow: {
      on: {
        SET_BUSINESS_FLOW: {
          actions: assign({
            businessFlow: ({ event }) => (event as FlowEvent & { nodes: FlowNode[] }).nodes,
          }),
        },
        UPDATE_NODE: {
          actions: assign({
            businessFlow: ({ context, event }) => {
              const node = (event as FlowEvent & { node: FlowNode }).node;
              return context.businessFlow.map((n) =>
                n.id === node.id ? node : n
              );
            },
          }),
        },
        ADD_NODE: {
          actions: assign({
            businessFlow: ({ context, event }) => [
              ...context.businessFlow,
              (event as FlowEvent & { node: FlowNode }).node,
            ],
          }),
        },
        REMOVE_NODE: {
          actions: assign({
            businessFlow: ({ context, event }) =>
              context.businessFlow.filter((n) => n.id !== (event as FlowEvent & { id: string }).id),
          }),
        },
        GO_NEXT: { target: 'components' },
        GO_PREV: { target: 'context' },
        SAVE: { actions: 'persistState' },
      },
    },
    components: {
      on: {
        TOGGLE_COMPONENT: {
          actions: assign({
            selectedComponents: ({ context, event }) => {
              const id = (event as FlowEvent & { id: string }).id;
              const exists = context.selectedComponents.find((c) => c.id === id);
              if (exists) {
                return context.selectedComponents.filter((c) => c.id !== id);
              }
              return [
                ...context.selectedComponents,
                { id, name: id, category: 'custom', selected: true },
              ];
            },
          }),
        },
        GO_NEXT: { target: 'project' },
        GO_PREV: { target: 'businessFlow' },
        SAVE: { actions: 'persistState' },
      },
    },
    project: {
      on: {
        SET_PROJECT_META: {
          actions: assign({
            projectMeta: ({ context, event }) => ({
              ...context.projectMeta,
              ...(event as FlowEvent & { meta: Partial<ProjectMeta> }).meta,
            }),
          }),
        },
        GO_PREV: { target: 'components' },
        SAVE: { target: 'completed' },
        RESET: {
          target: 'requirements',
          actions: assign({
            requirements: '',
            examples: [],
            boundedContexts: [],
            businessFlow: [],
            selectedComponents: [],
            projectMeta: { name: '', description: '', techStack: [] },
            errors: [],
          }),
        },
      },
    },
    completed: { type: 'final' },
  },
  on: {
    RESET: {
      target: '.requirements',
      actions: assign({
        requirements: '',
        examples: [],
        boundedContexts: [],
        businessFlow: [],
        selectedComponents: [],
        projectMeta: { name: '', description: '', techStack: [] },
        errors: [],
      }),
    },
  },
});
