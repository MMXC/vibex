/**
 * dds-exporter.test.ts — E4-U1 / E4-U2 Tests
 * Sprint4 E4-U1: APICanvasExporter
 * Sprint4 E4-U2: SMExporter
 */

import { describe, it, expect } from 'vitest';
import { toOpenAPISpec, toStateMachineSpec, exportDDSCanvasData, exportToStateMachine } from '../exporter';
import type { APIEndpointCard, StateMachineCard } from '@/types/dds';

// ==================== E4-U1: APICanvasExporter ====================

describe('toOpenAPISpec — E4-U1', () => {
  it('E4-U5.1: returns OpenAPI 3.0.3 version', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'Get Users', method: 'GET', path: '/users' },
    ];
    const doc = toOpenAPISpec(cards);
    expect(doc.openapi).toBe('3.0.3');
  });

  it('E4-U5.2: GET/POST/PUT/DELETE/PATCH all mapped', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'List', method: 'GET', path: '/items' },
      { id: 'ep-2', type: 'api-endpoint', title: 'Create', method: 'POST', path: '/items' },
      { id: 'ep-3', type: 'api-endpoint', title: 'Replace', method: 'PUT', path: '/items/{id}' },
      { id: 'ep-4', type: 'api-endpoint', title: 'Remove', method: 'DELETE', path: '/items/{id}' },
      { id: 'ep-5', type: 'api-endpoint', title: 'Modify', method: 'PATCH', path: '/items/{id}' },
    ];
    const doc = toOpenAPISpec(cards);
    expect(doc.paths['/items'].get).toBeDefined();
    expect(doc.paths['/items'].post).toBeDefined();
    expect(doc.paths['/items/{id}'].put).toBeDefined();
    expect(doc.paths['/items/{id}'].delete).toBeDefined();
    expect(doc.paths['/items/{id}'].patch).toBeDefined();
  });

  it('E4-U5.3: empty cards exports empty paths', () => {
    const doc = toOpenAPISpec([]);
    expect(doc.paths).toEqual({});
  });

  it('E4-U5.4: null card skipped without crash', () => {
    // @ts-expect-error testing invalid input
    const result = exportDDSCanvasData([null]);
    expect(result).toBeTruthy();
  });

  it('uses card title as summary fallback', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'My Endpoint', method: 'GET', path: '/x' },
    ];
    const doc = toOpenAPISpec(cards);
    expect(doc.paths['/x'].get.summary).toBe('My Endpoint');
  });

  it('collects unique tags', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'A', method: 'GET', path: '/a', tags: ['users'] },
      { id: 'ep-2', type: 'api-endpoint', title: 'B', method: 'POST', path: '/b', tags: ['users', 'admin'] },
    ];
    const doc = toOpenAPISpec(cards);
    const tagNames = doc.tags?.map((t) => t.name) ?? [];
    expect(tagNames).toContain('users');
    expect(tagNames).toContain('admin');
  });

  it('respects options.title and options.version', () => {
    const doc = toOpenAPISpec([], { title: 'My API', version: '2.0.0' });
    expect(doc.info.title).toBe('My API');
    expect(doc.info.version).toBe('2.0.0');
  });

  it('includes requestBody when provided', () => {
    const cards: APIEndpointCard[] = [
      {
        id: 'ep-1', type: 'api-endpoint', title: 'Create',
        method: 'POST', path: '/items',
        requestBody: { contentType: 'application/json', schema: '{"type":"object"}' },
      },
    ];
    const doc = toOpenAPISpec(cards);
    expect(doc.paths['/items'].post.requestBody).toBeDefined();
    expect(doc.paths['/items'].post.requestBody.required).toBe(true);
  });

  it('normalizes path to start with /', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'API', method: 'GET', path: 'api/data' },
    ];
    const doc = toOpenAPISpec(cards);
    expect(doc.paths['/api/data']).toBeDefined();
  });

  it('maps responses correctly', () => {
    const cards: APIEndpointCard[] = [
      {
        id: 'ep-1', type: 'api-endpoint', title: 'Test',
        method: 'GET', path: '/test',
        responses: [
          { status: 200, description: 'OK' },
          { status: 404, description: 'Not Found' },
        ],
      },
    ];
    const doc = toOpenAPISpec(cards);
    expect(doc.paths['/test'].get.responses['200']).toBeDefined();
    expect(doc.paths['/test'].get.responses['404']).toBeDefined();
  });
});

// ==================== E4-U2: SMExporter ====================

describe('toStateMachineSpec — E4-U2', () => {
  it('E4-U5.6: exports initial + states object', () => {
    const cards: StateMachineCard[] = [
      {
        id: 'sm-1', type: 'state-machine', title: 'User SM',
        initialState: 'idle',
        states: [
          { id: 's1', stateId: 'idle', stateType: 'initial', label: 'Idle' },
          { id: 's2', stateId: 'active', stateType: 'normal', label: 'Active' },
        ],
        transitions: [],
      },
    ];
    const doc = JSON.parse(toStateMachineSpec(cards));
    expect(doc.initial).toBe('idle');
    expect(doc.states).toBeDefined();
    expect(typeof doc.states).toBe('object');
  });

  it('E4-U5.7: states is Record<string, stateSpec> (not array)', () => {
    const cards: StateMachineCard[] = [
      {
        id: 'sm-1', type: 'state-machine', title: 'SM',
        initialState: 'idle',
        states: [{ id: 's1', stateId: 'idle', stateType: 'initial', label: 'Idle' }],
        transitions: [],
      },
    ];
    const doc = JSON.parse(toStateMachineSpec(cards));
    expect(Array.isArray(doc.states)).toBe(false);
    expect(doc.states['idle']).toBeDefined();
  });

  it('E4-U5.8: stateSpec contains type, label, on', () => {
    const cards: StateMachineCard[] = [
      {
        id: 'sm-1', type: 'state-machine', title: 'SM',
        initialState: 'idle',
        states: [
          { id: 's1', stateId: 'idle', stateType: 'initial', label: 'Idle' },
          { id: 's2', stateId: 'active', stateType: 'normal', label: 'Active' },
        ],
        transitions: [
          { id: 't1', from: 'idle', to: 'active', event: 'START', type: 'normal' },
        ],
      },
    ];
    const doc = JSON.parse(toStateMachineSpec(cards));
    const idle = doc.states['idle'];
    expect(idle.type).toBe('initial');
    expect(idle.on?.START).toBe('active');
  });

  it('E4-U5.9: empty cards → empty states', () => {
    const doc = JSON.parse(toStateMachineSpec([]));
    expect(doc.states).toEqual({});
    expect(doc.initial).toBe('');
  });

  it('E4-U5.10: no smVersion field (spec format)', () => {
    const cards: StateMachineCard[] = [
      {
        id: 'sm-1', type: 'state-machine', title: 'SM',
        initialState: 'idle',
        states: [{ id: 's1', stateId: 'idle', stateType: 'initial', label: 'Idle' }],
        transitions: [],
      },
    ];
    const doc = JSON.parse(toStateMachineSpec(cards));
    expect(doc.smVersion).toBeUndefined();
  });

  it('merges states from multiple cards without duplicates', () => {
    const cards: StateMachineCard[] = [
      {
        id: 'sm-1', type: 'state-machine', title: 'SM1', initialState: 'a',
        states: [
          { id: 's1', stateId: 'a', stateType: 'normal', label: 'A' },
          { id: 's2', stateId: 'b', stateType: 'normal', label: 'B' },
        ],
        transitions: [],
      },
      {
        id: 'sm-2', type: 'state-machine', title: 'SM2', initialState: 'c',
        states: [
          { id: 's3', stateId: 'c', stateType: 'normal', label: 'C' },
          { id: 's4', stateId: 'a', stateType: 'normal', label: 'A Dup' },
        ],
        transitions: [],
      },
    ];
    const doc = JSON.parse(toStateMachineSpec(cards));
    const keys = Object.keys(doc.states);
    expect(keys).toHaveLength(3);
    expect(keys).toContain('a');
    expect(keys).toContain('b');
    expect(keys).toContain('c');
  });

  it('uses first state as initial when no initialState', () => {
    const cards: StateMachineCard[] = [
      {
        id: 'sm-1', type: 'state-machine', title: 'SM',
        states: [
          { id: 's1', stateId: 'first', stateType: 'normal', label: 'First' },
          { id: 's2', stateId: 'second', stateType: 'normal', label: 'Second' },
        ],
        transitions: [],
      },
    ];
    const doc = JSON.parse(toStateMachineSpec(cards));
    expect(doc.initial).toBe('first');
  });
});
