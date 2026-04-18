/**
 * dds-exporter.test.ts — E4-U1 / E4-U2 Tests
 * Sprint4 E4-U1: APICanvasExporter
 * Sprint4 E4-U2: SMExporter
 */

import { describe, it, expect } from 'vitest';
import { toOpenAPISpec, toStateMachineSpec, exportDDSCanvasData, exportToStateMachine } from '../exporter';
import type { APIEndpointCard, StateMachineCard } from '@/types/dds';

describe('exportDDSCanvasData — E4-U1', () => {
  it('E4-U5.1: returns OpenAPI 3.0.3 version', () => {
    const cards: APIEndpointCard[] = [
      {
        id: 'ep-1', type: 'api-endpoint', title: 'Get Users', method: 'GET', path: '/users',
      },
    ];
    const doc = toOpenAPISpec(cards);
    expect(doc.openapi).toBe('3.0.3');
  });

  it('E4-U5.2: maps GET/POST/PUT/DELETE/PATCH correctly', () => {
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

  it('E4-U5.3: empty array exports empty paths', () => {
    const doc = toOpenAPISpec([]);
    expect(doc.paths).toEqual({});
  });

  it('E4-U5.4: handles null/undefined fields without crashing', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'Null Test', method: 'GET', path: '/null' },
    ];
    // @ts-expect-error — testing invalid input
    const result = exportDDSCanvasData([null]);
    expect(result).toBeTruthy();
  });

  it('E4-U5.5: initial state exported correctly', () => {
    const cards: StateMachineCard[] = [
      {
        id: 'sm-1', type: 'state-machine', title: 'Test SM',
        initialState: 'idle',
        states: [
          { id: 'sm-state-1', stateId: 'idle', stateType: 'initial', label: 'Idle' },
          { id: 'sm-state-2', stateId: 'active', stateType: 'normal', label: 'Active' },
        ],
        transitions: [],
      },
    ];
    const doc = toStateMachineSpec(cards);
    expect(doc.initial).toBe('idle');
    expect(doc.states).toHaveLength(2);
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
    const tagNames = doc.tags?.map((t: { name: string }) => t.name) ?? [];
    expect(tagNames).toContain('users');
    expect(tagNames).toContain('admin');
  });

  it('respects options.title and options.version', () => {
    const doc = JSON.parse(exportDDSCanvasData([], { title: 'My API', version: '2.0.0' }));
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

describe('exportToStateMachine — E4-U2', () => {
  it('exports states and initial correctly', () => {
    const cards: StateMachineCard[] = [
      {
        id: 'sm-1', type: 'state-machine', title: 'User State Machine',
        initialState: 'idle',
        states: [
          { id: 's1', stateId: 'idle', stateType: 'initial', label: 'Idle' },
          { id: 's2', stateId: 'active', stateType: 'normal', label: 'Active' },
          { id: 's3', stateId: 'done', stateType: 'final', label: 'Done' },
        ],
        transitions: [],
      },
    ];
    const doc = toStateMachineSpec(cards);
    expect(doc.smVersion).toBe('1.0.0');
    expect(doc.states).toHaveLength(3);
    expect(doc.initial).toBe('idle');
  });

  it('maps transitions to state.on entries', () => {
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
    const doc = toStateMachineSpec(cards);
    const idle = doc.states.find((s: SMStateExport) => s.id === 'idle');
    expect(idle?.on?.START).toBe('active');
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
          { id: 's4', stateId: 'a', stateType: 'normal', label: 'A Duplicate' },
        ],
        transitions: [],
      },
    ];
    const doc = toStateMachineSpec(cards);
    expect(doc.states).toHaveLength(3);
  });

  it('handles empty cards gracefully', () => {
    const doc = toStateMachineSpec([]);
    expect(doc.states).toEqual([]);
    expect(doc.initial).toBe('');
  });

  it('uses first state as initial when no initialState is set', () => {
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
    const doc = toStateMachineSpec(cards);
    expect(doc.initial).toBe('first');
  });
});

// Type for test use
interface SMStateExport {
  id: string;
  name: string;
  type?: string;
  on?: Record<string, string>;
}
