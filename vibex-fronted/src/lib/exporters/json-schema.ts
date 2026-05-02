/**
 * json-schema.ts — E4-Export-Formats S4.2
 *
 * Generates JSON Schema from canvas component nodes.
 * Supports: component API params, nested structures.
 */

import type { ComponentNode } from '@/lib/canvas/types';

export interface JSONSchemaExportResult {
  success: boolean;
  schema?: JSONSchemaDocument;
  error?: string;
}

export interface JSONSchemaDocument {
  $schema: string;
  $id: string;
  title: string;
  description?: string;
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  definitions?: Record<string, JSONSchemaProperty>;
}

export interface JSONSchemaProperty {
  type?: string;
  format?: string;
  description?: string;
  enum?: string[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  $ref?: string;
  example?: unknown;
}

/**
 * Converts canvas component nodes into a JSON Schema document
 */
export function generateJSONSchema(
  components: ComponentNode[],
  title = 'VibeX Canvas Schema',
): JSONSchemaExportResult {
  try {
    const properties: Record<string, JSONSchemaProperty> = {};
    const definitions: Record<string, JSONSchemaProperty> = {};
    const required: string[] = [];

    for (const comp of components) {
      const compSchema: JSONSchemaProperty = {
        type: 'object',
        description: String(comp.props?.description ?? ""),
        properties: {},
      };

      // API parameters
      if (comp.api) {
        for (const param of comp.api.params) {
          compSchema.properties![param] = {
            type: 'string',
            description: `Parameter: ${param}`,
          };
        }
        compSchema.properties!._endpoint = {
          type: 'string',
          description: `${comp.api.method} ${comp.api.path}`,
          example: `${comp.api.path}`,
        };
      }

      // Status field (common to all)
      compSchema.properties!.status = {
        type: 'string',
        enum: ['active', 'inactive', 'pending'],
        description: 'Component status',
      };

      properties[comp.name] = compSchema;
      required.push(comp.name);

      // Create definition reference
      definitions[comp.name] = compSchema;
    }

    const schema: JSONSchemaDocument = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: title.toLowerCase().replace(/\s+/g, '-'),
      title,
      type: 'object',
      properties: {
        components: {
          type: 'object',
          description: 'Canvas component definitions',
          properties,
          required,
        },
      },
      required: ['components'],
      definitions,
    };

    return { success: true, schema };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error generating JSON Schema',
    };
  }
}

/**
 * Serializes JSON Schema to string with 2-space indent
 */
export function serializeJSONSchema(result: JSONSchemaExportResult): string {
  if (!result.success || !result.schema) {
    throw new Error(result.error ?? 'Schema generation failed');
  }
  return JSON.stringify(result.schema, null, 2);
}
