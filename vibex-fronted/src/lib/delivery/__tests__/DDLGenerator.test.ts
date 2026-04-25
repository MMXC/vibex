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

// ==================== E4-S1: Type Extension ====================

import { mapType, generateEnumCheck, generateIndex } from '../DDLGenerator';

describe('mapType — E4-S1: All 7 types', () => {
  it('VARCHAR → VARCHAR(255)', () => {
    expect(mapType('varchar')).toBe('VARCHAR(255)');
    expect(mapType('string')).toBe('VARCHAR(255)');
  });

  it('INT → INT', () => {
    expect(mapType('int')).toBe('INT');
    expect(mapType('integer')).toBe('INT');
    expect(mapType('int32')).toBe('INT');
  });


  it('DATE → DATE', () => {
    expect(mapType('date')).toBe('DATE');
  });


  it('ENUM → VARCHAR(50)', () => {
    expect(mapType('enum')).toBe('VARCHAR(50)');
  });

  it('JSONB → JSONB', () => {
    expect(mapType('jsonb')).toBe('JSONB');
  });

  it('UUID → UUID', () => {
    expect(mapType('uuid')).toBe('UUID');
  });


  it('ARRAY → INTEGER[]', () => {
    expect(mapType('array')).toBe('INTEGER[]');
  });
});

describe('generateEnumCheck — E4-S1', () => {
  it('generates CHECK constraint with values', () => {
    const result = generateEnumCheck('status', ['active', 'inactive']);
    expect(result).toBe("CHECK (status IN ('active', 'inactive'))");
  });

  it('handles single value', () => {
    const result = generateEnumCheck('role', ['admin']);
    expect(result).toBe("CHECK (role IN ('admin'))");
  });
});

describe('generateIndex — E4-S1', () => {
  it('BTREE index by default', () => {
    const result = generateIndex('users', 'email');
    expect(result).toBe('CREATE INDEX idx_users_email ON users USING BTREE (email);');
  });

  it('HASH index', () => {
    const result = generateIndex('users', 'email', 'HASH');
    expect(result).toBe('CREATE INDEX idx_users_email ON users USING HASH (email);');
  });

  it('GIN/GIST index without USING clause', () => {
    const result = generateIndex('data', 'payload', 'GIN');
    expect(result).toBe('CREATE INDEX idx_data_payload ON data (payload);');
  });
});

// ==================== E3-U1: Additional tests ====================

describe('generateDDL — E3-U1: Extended Coverage', () => {
  it('custom prefix option strips /v1 from path', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'Items', method: 'GET', path: '/v1/items' },
    ];
    const tables = generateDDL(cards, { prefix: '/v1' });
    expect(tables[0].tableName).toBe('items');
  });

  it('version prefix v2 stripped', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'Products', method: 'GET', path: '/v2/products' },
    ];
    const tables = generateDDL(cards);
    expect(tables[0].tableName).toBe('products');
  });

  it('status not pluralized', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'Status', method: 'GET', path: '/api/status' },
    ];
    const tables = generateDDL(cards);
    expect(tables[0].tableName).toBe('status');
  });

  it('requestBody with string field → VARCHAR(255)', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'Create User', method: 'POST', path: '/api/users', requestBody: { schema: JSON.stringify({ properties: { name: { type: 'string' }, email: { type: 'string' } } }) } },
    ];
    const tables = generateDDL(cards);
    const cols = tables[0].columns;
    expect(cols.find(c => c.name === 'name')?.type).toBe('VARCHAR(255)');
    expect(cols.find(c => c.name === 'email')?.type).toBe('VARCHAR(255)');
  });

  it('boolean field → TINYINT(1)', () => {
    const cards: APIEndpointCard[] = [
      { id: 'ep-1', type: 'api-endpoint', title: 'Toggle', method: 'PATCH', path: '/api/settings', parameters: [{ name: 'enabled', in: 'body', schema: { type: 'boolean' } }] },
    ];
    const tables = generateDDL(cards);
    const cols = tables[0].columns;
    expect(cols.find(c => c.name === 'enabled')?.type).toBe('TINYINT(1)');
  });

  it('null/undefined cards skipped without crash', () => {
    const cards: (APIEndpointCard | null | undefined)[] = [
      null,
      undefined,
      { id: 'ep-1', type: 'api-endpoint', title: 'Users', method: 'GET', path: '/api/users' },
    ];
    expect(() => generateDDL(cards)).not.toThrow();
    const tables = generateDDL(cards);
    expect(tables).toHaveLength(1);
    expect(tables[0].tableName).toBe('users');
  });
});
