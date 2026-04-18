/**
 * DDLGenerator.test.ts — Sprint5 T6 Tests
 */

import { describe, it, expect } from 'vitest';
import { generateDDL } from '../DDLGenerator';
import type { APIEndpointCard } from '@/types/dds';

describe('generateDDL — T6', () => {
  it('T6 AC1: /api/users → tableName users', () => {
    const cards: APIEndpointCard[] = [
      {
        id: 'ep-1', type: 'api-endpoint', title: 'Get Users',
        method: 'GET', path: '/api/users',
      },
    ];
    const tables = generateDDL(cards);
    expect(tables).toHaveLength(1);
    expect(tables[0].tableName).toBe('users');
  });

  it('T6 AC2: empty array → []', () => {
    const tables = generateDDL([]);
    expect(tables).toEqual([]);
  });

  it('T6 AC3: generates DDLTable with columns from parameters', () => {
    const cards: APIEndpointCard[] = [
      {
        id: 'ep-1', type: 'api-endpoint', title: 'Get Users',
        method: 'GET', path: '/api/users',
        parameters: [
          { name: 'id', in: 'path', required: true, type: 'string' },
          { name: 'email', in: 'query', required: false, type: 'string' },
          { name: 'is_active', in: 'query', required: false, type: 'boolean' },
        ],
      },
    ];
    const tables = generateDDL(cards);
    const colNames = tables[0].columns.map((c) => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('email');
    expect(colNames).toContain('is_active');
    // Audit columns added
    expect(colNames).toContain('created_at');
    expect(colNames).toContain('updated_at');
  });

  it('strips /api prefix', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'API', method: 'GET', path: '/api/orders' },
    ];
    const tables = generateDDL(cards);
    expect(tables[0].tableName).toBe('orders');
  });

  it('removes {param} segments from path', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'API', method: 'GET', path: '/api/users/{id}/posts' },
    ];
    const tables = generateDDL(cards);
    // users_posts (pluralized)
    expect(tables[0].tableName).toBe('users_posts');
  });

  it('id parameter → BIGINT PRIMARY KEY', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'API', method: 'GET', path: '/api/items', parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }] },
    ];
    const tables = generateDDL(cards);
    const idCol = tables[0].columns.find((c) => c.name === 'id');
    expect(idCol?.type).toBe('BIGINT');
    expect(idCol?.primaryKey).toBe(true);
  });

  it('created_at → DATETIME nullable', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'API', method: 'GET', path: '/api/test', parameters: [{ name: 'created_at', in: 'body', required: false, type: 'string' }] },
    ];
    const tables = generateDDL(cards);
    const col = tables[0].columns.find((c) => c.name === 'created_at');
    expect(col?.type).toBe('DATETIME');
    expect(col?.nullable).toBe(true);
  });

  it('requestBody schema → columns', () => {
    const cards: APIEndpointCard[] = [
      {
        id: 'ep-1', type: 'api-endpoint', title: 'API',
        method: 'POST', path: '/api/items',
        requestBody: {
          contentType: 'application/json',
          schema: JSON.stringify({
            properties: {
              name: { type: 'string', description: 'Item name' },
              quantity: { type: 'integer' },
            },
          }),
        },
      },
    ];
    const tables = generateDDL(cards);
    const colNames = tables[0].columns.map((c) => c.name);
    expect(colNames).toContain('name');
    expect(colNames).toContain('quantity');
    const nameCol = tables[0].columns.find((c) => c.name === 'name');
    expect(nameCol?.type).toBe('VARCHAR(255)');
  });

  it('same table for multiple endpoints on same path', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'List', method: 'GET', path: '/api/users' },
      { id: 'ep-2', type: 'api-endpoint', title: 'Create', method: 'POST', path: '/api/users' },
    ];
    const tables = generateDDL(cards);
    expect(tables).toHaveLength(1);
  });

  it('description from summary used as table comment', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'Users API', method: 'GET', path: '/api/users', summary: 'User management' },
    ];
    const tables = generateDDL(cards);
    expect(tables[0].comment).toBe('User management');
  });
});
