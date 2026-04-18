/**
 * formatDDL.test.ts — Sprint5 T7 Tests
 */

import { describe, it, expect } from 'vitest';
import { formatDDL } from '../formatDDL';
import type { DDLTable } from '../DDLGenerator';

describe('formatDDL — T7', () => {
  it('T7 AC1: formatDDL generates CREATE TABLE SQL', () => {
    const tables: DDLTable[] = [
      {
        tableName: 'users',
        comment: 'User table',
        columns: [
          { name: 'id', type: 'BIGINT', nullable: false, primaryKey: true },
          { name: 'email', type: 'VARCHAR(255)', nullable: false, primaryKey: false },
          { name: 'created_at', type: 'DATETIME', nullable: true, primaryKey: false },
        ],
      },
    ];
    const sql = formatDDL(tables, 'mysql');
    expect(sql).toContain('CREATE TABLE');
    expect(sql).toContain('`users`');
    expect(sql).toContain('BIGINT');
    expect(sql).toContain('PRIMARY KEY');
    expect(sql).toContain('VARCHAR(255)');
  });

  it('T7 AC2: empty tables shows placeholder', () => {
    const sql = formatDDL([], 'mysql');
    expect(sql).toContain('No tables');
  });

  it('includes MySQL engine', () => {
    const tables: DDLTable[] = [
      { tableName: 't1', columns: [{ name: 'id', type: 'BIGINT', nullable: false, primaryKey: true }] },
    ];
    const sql = formatDDL(tables, 'mysql');
    expect(sql).toContain('ENGINE=InnoDB');
  });

  it('formats multiple tables', () => {
    const tables: DDLTable[] = [
      {
        tableName: 'users',
        columns: [{ name: 'id', type: 'BIGINT', nullable: false, primaryKey: true }],
      },
      {
        tableName: 'orders',
        columns: [{ name: 'id', type: 'BIGINT', nullable: false, primaryKey: true }],
      },
    ];
    const sql = formatDDL(tables, 'mysql');
    expect(sql).toContain('users');
    expect(sql).toContain('orders');
  });

  it('not null columns marked correctly', () => {
    const tables: DDLTable[] = [
      {
        tableName: 'test',
        columns: [
          { name: 'a', type: 'BIGINT', nullable: false, primaryKey: false },
          { name: 'b', type: 'VARCHAR(255)', nullable: true, primaryKey: false },
        ],
      },
    ];
    const sql = formatDDL(tables, 'mysql');
    expect(sql).toContain('NOT NULL');
    expect(sql).toContain('NULL');
  });

  it('null card in tables array skipped', () => {
    const tables: DDLTable[] = [
      null as unknown as DDLTable,
      { tableName: 'valid', columns: [] },
    ];
    // Should not throw
    const sql = formatDDL(tables, 'mysql');
    expect(sql).toContain('valid');
  });
});
