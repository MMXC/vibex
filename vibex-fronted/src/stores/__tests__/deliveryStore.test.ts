/**
 * deliveryStore — Unit Tests
 * Covers: toComponent, toSchema, toDDL
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDeliveryStore } from '../deliveryStore';
import { usePrototypeStore } from '../prototypeStore';
import { useDDSCanvasStore } from '../dds/DDSCanvasStore';
import type { ComponentSpec, SchemaSpec } from '../deliveryStore';
import type { DDSContextCard, DDSFlowCard } from '@/types/dds';

describe('toComponent', () => {
  it('converts proto node to component spec', () => {
    const store = useDeliveryStore.getState();
    const node = {
      id: 'n1',
      type: 'protoNode',
      position: { x: 100, y: 200 },
      data: {
        component: { type: 'button', name: 'Submit', props: { label: 'Submit' } },
      },
    };
    const result = store.toComponent(node as Parameters<typeof store.toComponent>[0]);
    expect(result.id).toBe('n1');
    expect(result.type).toBe('button');
    expect(result.name).toBe('Submit');
  });

  it('handles missing component data gracefully', () => {
    const store = useDeliveryStore.getState();
    const node = {
      id: 'n2',
      type: 'protoNode',
      position: { x: 0, y: 0 },
      data: {},
    };
    const result = store.toComponent(node as Parameters<typeof store.toComponent>[0]);
    expect(result.id).toBe('n2');
    expect(result.type).toBe('unknown');
    expect(result.name).toBe('Unknown');
  });
});

describe('toSchema', () => {
  it('converts chapters to schema spec', () => {
    const store = useDeliveryStore.getState();
    const chapters = {
      context: {
        type: 'context' as const,
        cards: [
          { id: 'c1', type: 'bounded-context', title: 'User Management', data: {} },
        ],
        edges: [],
        loading: false,
        error: null,
      },
    };
    const result = store.toSchema(chapters as Parameters<typeof store.toSchema>[0]);
    expect(result.chapters['context']).toBeDefined();
    expect(result.chapters['context'].cards[0].id).toBe('c1');
    expect(result.chapters['context'].cards[0].title).toBe('User Management');
  });

  it('maps multiple chapters', () => {
    const store = useDeliveryStore.getState();
    const chapters = {
      context: {
        type: 'context' as const,
        cards: [{ id: 'c1', type: 'bounded-context', title: 'A', data: {} }],
        edges: [],
        loading: false,
        error: null,
      },
      flow: {
        type: 'flow' as const,
        cards: [{ id: 'c2', type: 'flow-step', title: 'Step 1', data: {} }],
        edges: [],
        loading: false,
        error: null,
      },
    };
    const result = store.toSchema(chapters as Parameters<typeof store.toSchema>[0]);
    expect(Object.keys(result.chapters)).toHaveLength(2);
    expect(result.chapters['context']).toBeDefined();
    expect(result.chapters['flow']).toBeDefined();
  });
});

describe('toDDL', () => {
  it('generates DDL from bounded context cards', () => {
    const store = useDeliveryStore.getState();
    const schema: SchemaSpec = {
      projectName: 'Test',
      chapters: {
        context: {
          type: 'context',
          cards: [
            { id: 'c1', type: 'bounded-context', title: 'User Table', data: {} },
          ],
        },
      },
    };
    const ddl = store.toDDL(schema);
    expect(ddl).toContain('CREATE TABLE');
    expect(ddl).toContain('user_table');
  });

  it('returns placeholder when no bounded-context cards found', () => {
    const store = useDeliveryStore.getState();
    const schema: SchemaSpec = {
      projectName: 'Test',
      chapters: {
        context: {
          type: 'context',
          cards: [
            { id: 'c1', type: 'other-type', title: 'Some Card', data: {} },
          ],
        },
      },
    };
    const ddl = store.toDDL(schema);
    expect(ddl).toBe('-- No tables defined');
  });

  it('handles multiple bounded-context cards', () => {
    const store = useDeliveryStore.getState();
    const schema: SchemaSpec = {
      projectName: 'Test',
      chapters: {
        context: {
          type: 'context',
          cards: [
            { id: 'c1', type: 'bounded-context', title: 'User', data: {} },
            { id: 'c2', type: 'bounded-context', title: 'Order', data: {} },
          ],
        },
      },
    };
    const ddl = store.toDDL(schema);
    expect(ddl).toContain('CREATE TABLE');
    expect(ddl).toContain('user');
    expect(ddl).toContain('order');
  });
});

// ============================================================
// T1: loadFromStores integration tests
// ============================================================

describe('deliveryStore — T1: loadFromStores', () => {
  beforeEach(() => {
    useDeliveryStore.setState({
      contexts: [],
      flows: [],
      components: [],
    });
    usePrototypeStore.setState({
      nodes: [],
      pages: [],
    });
    useDDSCanvasStore.setState({
      chapters: {
        requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: null },
        context: { type: 'context', cards: [], edges: [], loading: false, error: null },
        flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        api: { type: 'api', cards: [], edges: [], loading: false, error: null },
        'business-rules': { type: 'business-rules', cards: [], edges: [], loading: false, error: null },
      },
    });
  });

  it('T1: loadFromStores populates contexts from DDSCanvasStore.chapters.context', () => {
    useDDSCanvasStore.setState({
      chapters: {
        ...useDDSCanvasStore.getState().chapters,
        context: {
          type: 'context',
          cards: [
            { id: 'bc-1', type: 'bounded-context', title: 'User Context', description: 'User domain', edges: [] } as DDSContextCard,
            { id: 'bc-2', type: 'bounded-context', title: 'Order Context', description: 'Order domain', edges: [] } as DDSContextCard,
          ],
          edges: [],
          loading: false,
          error: null,
        },
      },
    });

    useDeliveryStore.getState().loadFromStores();

    const { contexts } = useDeliveryStore.getState();
    expect(contexts).toHaveLength(2);
    expect(contexts[0].name).toBe('User Context');
    expect(contexts[0].description).toBe('User domain');
    expect(contexts[1].name).toBe('Order Context');
  });

  it('T1: loadFromStores populates flows from DDSCanvasStore.chapters.flow', () => {
    useDDSCanvasStore.setState({
      chapters: {
        ...useDDSCanvasStore.getState().chapters,
        flow: {
          type: 'flow',
          cards: [
            { id: 'flow-1', type: 'user-task', title: 'Checkout Flow', description: '', edges: [] } as DDSFlowCard,
          ],
          edges: [],
          loading: false,
          error: null,
        },
      },
    });

    useDeliveryStore.getState().loadFromStores();

    const { flows } = useDeliveryStore.getState();
    expect(flows).toHaveLength(1);
    expect(flows[0].name).toBe('Checkout Flow');
    expect(flows[0].contextName).toBe('上下文');
  });

  it('T1: loadFromStores populates components from prototypeStore', () => {
    usePrototypeStore.setState({
      nodes: [
        { id: 'n1', type: 'screen', position: { x: 0, y: 0 }, data: { component: { type: 'screen', name: 'Home Screen' } } },
        { id: 'n2', type: 'screen', position: { x: 100, y: 0 }, data: { component: { type: 'screen', name: 'Detail Screen' } } },
      ],
      pages: [{ id: 'p1', name: 'Home', route: '/' }],
    });

    useDeliveryStore.getState().loadFromStores();

    const { components } = useDeliveryStore.getState();
    expect(components).toHaveLength(2);
    expect(components[0].name).toBe('Home Screen');
    expect(components[0].type).toBe('Service');
  });

  it('T1: loadFromStores does not throw when source stores are empty', () => {
    expect(() => useDeliveryStore.getState().loadFromStores()).not.toThrow();
    const { contexts, flows, components } = useDeliveryStore.getState();
    expect(contexts).toHaveLength(0);
    expect(flows).toHaveLength(0);
    expect(components).toHaveLength(0);
  });

  it('T1: loadFromStores overwrites previous data (replaces state)', () => {
    // Set initial state
    useDeliveryStore.setState({
      contexts: [{ id: 'old', name: 'Old', description: '', nodeCount: 0, relationCount: 0, relations: [] }],
      flows: [],
      components: [],
    });

    // Load from stores with new data
    useDDSCanvasStore.setState({
      chapters: {
        ...useDDSCanvasStore.getState().chapters,
        context: {
          type: 'context',
          cards: [{ id: 'bc-new', type: 'bounded-context', title: 'New Context', description: '', edges: [] } as DDSContextCard],
          edges: [],
          loading: false,
          error: null,
        },
      },
    });

    useDeliveryStore.getState().loadFromStores();

    const { contexts } = useDeliveryStore.getState();
    expect(contexts).toHaveLength(1);
    expect(contexts[0].id).toBe('bc-new');
    expect(contexts[0].name).toBe('New Context');
  });
});
