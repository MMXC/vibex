/**
 * deliveryStore — Unit Tests
 * Covers: toComponent, toSchema, toDDL
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDeliveryStore } from '../deliveryStore';
import type { ComponentSpec, SchemaSpec } from '../deliveryStore';

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
