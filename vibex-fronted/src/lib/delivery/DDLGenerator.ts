/**
 * DDLGenerator.ts — Sprint5 T6: DDLGenerator
 *
 * Converts APIEndpointCard[] from the API chapter to DDLTable[].
 * Path → table name mapping; parameters → columns with type inference.
 */

'use client';

import type { APIEndpointCard } from '@/types/dds';

export interface DDLColumn {
  name: string;
  type: string; // MySQL type string
  nullable: boolean;
  primaryKey: boolean;
  indexed?: boolean;
  comment?: string;
}

export interface DDLTable {
  tableName: string;
  comment?: string;
  columns: DDLColumn[];
}

export interface DDLOptions {
  /** Database dialect: 'mysql' | 'postgresql' */
  dbType?: 'mysql' | 'postgresql';
  /** Strip this prefix from path before generating table name */
  prefix?: string;
}

// ==================== Type Inference ====================

/** Infer MySQL column type from parameter name + in location */
function inferType(paramName: string, paramIn: string): { type: string; nullable: boolean; primaryKey: boolean } {
  const name = paramName.toLowerCase();

  // ID fields
  if (name === 'id' || name.endsWith('_id')) {
    return { type: 'BIGINT', nullable: false, primaryKey: true };
  }

  // Boolean
  if (name === 'is_' || name === 'has_' || name === 'enabled' || name === 'active' || name === 'deleted') {
    return { type: 'TINYINT(1)', nullable: false, primaryKey: false };
  }

  // Timestamps
  if (name === 'created_at' || name === 'updated_at' || name === 'deleted_at') {
    return { type: 'DATETIME', nullable: true, primaryKey: false };
  }

  if (name === 'created_by' || name === 'updated_by') {
    return { type: 'BIGINT', nullable: true, primaryKey: false };
  }

  // URL / slug
  if (name === 'url' || name === 'slug' || name === 'email') {
    return { type: 'VARCHAR(255)', nullable: !name.includes('required'), primaryKey: false };
  }

  // Text content
  if (name === 'description' || name === 'content' || name === 'body' || name === 'summary') {
    return { type: 'TEXT', nullable: true, primaryKey: false };
  }

  // Path parameters are often IDs or strings
  if (paramIn === 'path') {
    return { type: 'VARCHAR(255)', nullable: false, primaryKey: name === 'id' };
  }

  // Default
  return { type: 'VARCHAR(255)', nullable: paramIn !== 'path', primaryKey: false };
}

// ==================== Path → Table Name ====================

/** Convert API path to table name */
function pathToTableName(path: string, prefix = '/api'): string {
  let cleaned = path;

  // Strip prefix
  if (cleaned.startsWith(prefix)) {
    cleaned = cleaned.slice(prefix.length);
  }

  // Remove leading slash
  cleaned = cleaned.replace(/^\//, '');

  // /users/{id} → users
  // /admin/orders/{id} → orders
  // /v1/items → items
  // Remove {param} segments
  cleaned = cleaned.replace(/\{[^}]+\}/g, '');

  // Remove leading/trailing slashes
  cleaned = cleaned.replace(/\/+/g, '_').replace(/^_|_$/g, '');

  // Remove version prefix (v1, v2, v3...)
  cleaned = cleaned.replace(/^v\d+_?/, '');

  // Pluralize simple names (simple heuristic: add 's')
  // Keep 'status' 'news' 'series' unchanged
  const unplural = ['status', 'news', 'series', 'access', 'progress'];
  if (!unplural.includes(cleaned) && !cleaned.endsWith('s')) {
    cleaned = `${cleaned}s`;
  }

  return cleaned || 'unknown_table';
}

// ==================== T6: generateDDL ====================

/**
 * Convert APIEndpointCard[] from API chapter to DDLTable[].
 *
 * @param apiCards - APIEndpointCard[] from DDSCanvasStore.chapters.api.cards
 * @param options - Generation options
 * @returns DDLTable[] ready for formatDDL()
 *
 * @example
 * const tables = generateDDL(apiCards, { dbType: 'mysql', prefix: '/api' });
 */
export function generateDDL(
  apiCards: APIEndpointCard[],
  options: DDLOptions = {}
): DDLTable[] {
  const { prefix = '/api' } = options;

  const tableMap = new Map<string, DDLTable>();

  for (const card of apiCards) {
    if (!card) continue;
    if (!card) continue;
    if (!card.path) continue;

    const tableName = pathToTableName(card.path, prefix);
    if (!tableMap.has(tableName)) {
      tableMap.set(tableName, {
        tableName,
        comment: card.summary ?? card.title ?? '',
        columns: [],
      });
    }

    const table = tableMap.get(tableName)!;

    // Add columns from parameters
    for (const param of card.parameters ?? []) {
      const { type, nullable, primaryKey } = inferType(param.name, param.in);

      // Avoid duplicate columns
      if (!table.columns.find((c) => c.name === param.name)) {
        table.columns.push({
          name: param.name,
          type,
          nullable,
          primaryKey,
          comment: param.description,
        });
      }
    }

    // Add request body fields as columns
    if (card.requestBody?.schema) {
      try {
        const schema = JSON.parse(card.requestBody.schema);
        if (schema.properties) {
          for (const [propName, propDef] of Object.entries<Record<string, unknown>>(schema.properties)) {
            const typeStr = typeof propDef === 'object' && propDef !== null
              ? String((propDef as { type?: string }).type ?? 'VARCHAR(255)')
              : 'VARCHAR(255)';
            const mysqlType = mapType(typeStr);

            if (!table.columns.find((c) => c.name === propName)) {
              table.columns.push({
                name: propName,
                type: mysqlType,
                nullable: true,
                primaryKey: propName === 'id',
                comment: typeof propDef === 'object' ? String((propDef as { description: string }).description || '') : '',
              });
            }
          }
        }
      } catch {
        // Invalid JSON schema, skip
      }
    }

    // Add standard audit columns if not present
    const auditCols = ['created_at', 'updated_at', 'deleted_at', 'created_by'];
    for (const colName of auditCols) {
      if (!table.columns.find((c) => c.name === colName)) {
        const { type, nullable } = inferType(colName, 'body');
        table.columns.push({ name: colName, type, nullable, primaryKey: false });
      }
    }
  }

  return Array.from(tableMap.values());
}

/**
 * Map a field type string to a database-specific column type.
 * Supports all 7 types: VARCHAR, INT, DATE, ENUM, JSONB, UUID, ARRAY.
 */
export function mapType(fieldType: string): string {
  const t = fieldType.toLowerCase();
  switch (t) {
    case 'varchar':
    case 'string':
      return 'VARCHAR(255)';
    case 'int':
    case 'integer':
    case 'int32':
      return 'INT';
    case 'int64':
    case 'long':
      return 'BIGINT';
    case 'date':
      return 'DATE';
    case 'datetime':
    case 'date-time':
      return 'DATETIME';
    case 'boolean':
    case 'bool':
      return 'TINYINT(1)';
    case 'float':
    case 'double':
    case 'number':
      return 'DOUBLE';
    case 'enum':
      return 'VARCHAR(50)';
    case 'jsonb':
      return 'JSONB';
    case 'uuid':
      return 'UUID';
    case 'array':
      return 'INTEGER[]';
    case 'json':
    case 'object':
      return 'JSON';
    default:
      return 'VARCHAR(255)';
  }
}

/**
 * Generate a PostgreSQL CHECK constraint for ENUM columns.
 * @param columnName - Column name
 * @param values - Array of allowed enum values
 */
export function generateEnumCheck(columnName: string, values: string[]): string {
  const escaped = values.map((v) => `'${v}'`).join(', ');
  return `CHECK (${columnName} IN (${escaped}))`;
}

/**
 * Generate a CREATE INDEX statement.
 * @param tableName - Target table name
 * @param columnName - Column to index
 * @param indexType - Optional index type (default: B-Tree)
 */
export function generateIndex(tableName: string, columnName: string, indexType?: 'BTREE' | 'HASH' | 'GIN' | 'GIST'): string {
  const idxType = indexType ?? 'BTREE';
  const idxName = `idx_${tableName}_${columnName}`;
  if (idxType === 'BTREE' || idxType === 'HASH') {
    return `CREATE INDEX ${idxName} ON ${tableName} USING ${idxType} (${columnName});`;
  }
  return `CREATE INDEX ${idxName} ON ${tableName} (${columnName});`;
}
