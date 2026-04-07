/**
 * OpenAPI Generator - 从 Hono 路由生成 OpenAPI 3.0 规范
 * 
 * Usage:
 * const generator = new OpenAPIGenerator()
 * const spec = generator.generate(routes)
 * generator.writeFile('openapi.json')
 */

import { Hono } from 'hono';
import { validator } from 'hono/validator';

// 路由类型
interface Route {
  path: string;
  method: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (c: unknown, next?: unknown) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validators?: Record<string, any>;
}

// OpenAPI 类型定义
export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, Record<string, OperationObject>>;
  components?: ComponentsObject;
  tags?: TagObject[];
}

export interface OperationObject {
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: Record<string, ResponseObject>;
  security?: SecurityRequirementObject[];
}

export interface ParameterObject {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required?: boolean;
  schema: SchemaObject;
  description?: string;
}

export interface RequestBodyObject {
  required?: boolean;
  content: Record<string, MediaTypeObject>;
}

export interface ResponseObject {
  description: string;
  content?: Record<string, MediaTypeObject>;
  headers?: Record<string, HeaderObject>;
}

export interface MediaTypeObject {
  schema: SchemaObject;
  example?: unknown;
}

export interface HeaderObject {
  schema: SchemaObject;
}

export interface SchemaObject {
  type?: string;
  format?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  enum?: unknown[];
  description?: string;
  example?: unknown;
  $ref?: string;
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  allOf?: SchemaObject[];
  nullable?: boolean;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface ComponentsObject {
  schemas?: Record<string, SchemaObject>;
  securitySchemes?: Record<string, SecuritySchemeObject>;
}

export interface SecuritySchemeObject {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  flows?: Record<string, unknown>;
}

export interface SecurityRequirementObject {
  [key: string]: string[];
}

export interface TagObject {
  name: string;
  description?: string;
}

export interface GeneratorOptions {
  title?: string;
  version?: string;
  description?: string;
  servers?: Array<{ url: string; description?: string }>;
  outputPath?: string;
}

const DEFAULT_OPTIONS: Required<GeneratorOptions> = {
  title: 'VibeX API',
  version: '1.0.0',
  description: 'VibeX API Documentation',
  servers: [{ url: 'https://api.vibex.top/api', description: 'Production server' }],
  outputPath: './openapi.json',
};

/**
 * OpenAPI 生成器
 */
export class OpenAPIGenerator {
  private spec: OpenAPISpec;
  private options: Required<GeneratorOptions>;
  private schemas: Map<string, SchemaObject> = new Map();

  constructor(options: GeneratorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options } as Required<GeneratorOptions>;
    
    this.spec = {
      openapi: '3.0.3',
      info: {
        title: this.options.title,
        version: this.options.version,
        description: this.options.description,
      },
      servers: this.options.servers,
      paths: {},
      components: {
        schemas: {},
      },
    };
  }

  /**
   * 从 Hono 路由生成 OpenAPI
   */
  generate(routes: Route[]): OpenAPISpec {
    for (const route of routes) {
      this.addRoute(route);
    }
    
    // 添加 schemas
    this.spec.components!.schemas = Object.fromEntries(this.schemas);
    
    return this.spec;
  }

  /**
   * 添加单个路由
   */
  addRoute(route: Route): void {
    const path = this.convertPathParams(route.path);
    const method = route.method.toLowerCase();
    
    if (!this.spec.paths[path]) {
      this.spec.paths[path] = {};
    }
    
    const operation: OperationObject = {
      summary: this.getSummary(route.path),
      description: this.getDescription(route),
      parameters: [],
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        '400': {
          description: 'Bad Request',
        },
        '401': {
          description: 'Unauthorized',
        },
        '404': {
          description: 'Not Found',
        },
        '500': {
          description: 'Internal Server Error',
        },
      },
    };
    
    // 添加请求体验证
    if (route.validators) {
      operation.requestBody = this.convertValidators(route.validators);
    }
    
    this.spec.paths[path][method] = operation;
  }

  /**
   * 转换路径参数格式
   */
  private convertPathParams(path: string): string {
    // Convert :param to {param}
    return path.replace(/:(\w+)/g, '{$1}');
  }

  /**
   * 获取摘要
   */
  private getSummary(path: string): string {
    const parts = path.split('/').filter(Boolean);
    return parts.join(' - ').replace(/-/g, ' ');
  }

  /**
   * 获取描述
   */
  private getDescription(route: Route): string {
    return `${route.method.toUpperCase()} ${route.path}`;
  }

  /**
   * 转换验证器到 OpenAPI
   */
  private convertValidators(validators: Record<string, unknown>): RequestBodyObject | undefined {
    // 从 Zod schema 转换
    const bodySchema = validators.body;
    if (bodySchema) {
      return {
        required: true,
        content: {
          'application/json': {
            schema: this.zodToOpenAPI(bodySchema),
          },
        },
      };
    }
    return undefined;
  }

  /**
   * Zod schema 转换为 OpenAPI Schema
   */
  private zodToOpenAPI(schema: unknown): SchemaObject {
    if (!schema) return { type: 'object' };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const def = (schema as any)._def;
    if (!def) return { type: 'object' };
    
    const checks = def.checks as Array<{ kind: string; value?: unknown; regex?: { source?: string } }> | undefined;
    
    switch (def.typeName) {
      case 'ZodString':
        return {
          type: 'string',
          minLength: checks?.find(c => c.kind === 'min')?.value as number | undefined,
          maxLength: checks?.find(c => c.kind === 'max')?.value as number | undefined,
          pattern: checks?.find(c => c.kind === 'regex')?.regex?.source,
        };
        
      case 'ZodNumber':
      case 'ZodInteger':
        return {
          type: def.typeName === 'ZodInteger' ? 'integer' : 'number',
          minimum: checks?.find(c => c.kind === 'min')?.value as number | undefined,
          maximum: checks?.find(c => c.kind === 'max')?.value as number | undefined,
        };
        
      case 'ZodBoolean':
        return { type: 'boolean' };
        
      case 'ZodArray':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { type: 'array', items: this.zodToOpenAPI((def as any).schema) };
        
      case 'ZodObject': {
        const properties: Record<string, SchemaObject> = {};
        const required: string[] = [];
        
        for (const [key, value] of Object.entries(def.shape())) {
          const propSchema = this.zodToOpenAPI(value);
          properties[key] = propSchema;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((value as any)._def?.required !== false) {
            required.push(key);
          }
        }
        
        return {
          type: 'object',
          properties,
          required: required.length > 0 ? required : undefined,
        };
      }
        
      case 'ZodEnum':
        return { type: 'string', enum: def.values as unknown[] };
        
      case 'ZodNullable':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { ...this.zodToOpenAPI((def as any).innerType), nullable: true };
        
      case 'ZodOptional':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.zodToOpenAPI((def as any).innerType);
    }
    
    return { type: 'object' };
  }

  /**
   * 添加 Schema 定义
   */
  addSchema(name: string, schema: SchemaObject): void {
    this.schemas.set(name, schema);
  }

  /**
   * 获取生成的规范
   */
  getSpec(): OpenAPISpec {
    return this.spec;
  }

  /**
   * 输出为 JSON 字符串
   */
  toJSON(): string {
    return JSON.stringify(this.spec, null, 2);
  }

  /**
   * 输出为 YAML 字符串
   */
  toYAML(): string {
    // Simple YAML output
    return this.jsonToYAML(this.toJSON());
  }

  /**
   * JSON to YAML conversion (simple)
   */
  private jsonToYAML(json: string, indent = 0): string {
    const spaces = ' '.repeat(indent);
    const obj = JSON.parse(json);
    
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj !== 'object') return JSON.stringify(obj);
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return obj.map(item => `${spaces}- ${this.jsonToYAML(JSON.stringify(item), indent + 2)}`).join('\n');
    }
    
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    
    return entries.map(([key, value]) => {
      const valueStr = typeof value === 'object' && value !== null
        ? '\n' + this.jsonToYAML(JSON.stringify(value), indent + 2)
        : JSON.stringify(value);
      return `${spaces}${key}:${valueStr}`;
    }).join('\n');
  }

  /**
   * 写入文件
   */
  async writeFile(path?: string): Promise<void> {
    const fs = await import('fs/promises');
    const outputPath = path || this.options.outputPath;
    
    await fs.writeFile(outputPath, this.toJSON(), 'utf-8');
  }
}

export default OpenAPIGenerator;
