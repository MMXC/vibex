/**
 * OpenAPI Generator - 从 Zod Schema 生成 OpenAPI 3.0 规范
 * 
 * Usage:
 * import { OpenAPIGenerator } from '@/lib/contract/OpenAPIGenerator'
 * import { z } from 'zod'
 * 
 * const generator = new OpenAPIGenerator()
 * 
 * // 添加 API 端点
 * generator.addEndpoint({
 *   path: '/api/projects',
 *   method: 'get',
 *   summary: '获取项目列表',
 *   description: '获取用户的所有项目',
 *   requestSchema: undefined,
 *   responseSchema: z.array(ProjectSchema),
 * })
 * 
 * const spec = generator.generate()
 * generator.writeFile('openapi.json')
 */

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

// ==================== 类型定义 ====================

export interface OpenAPISpec {
  openapi: string;
  info: InfoObject;
  servers?: ServerObject[];
  paths: PathsObject;
  components?: ComponentsObject;
  tags?: TagObject[];
}

export interface InfoObject {
  title: string;
  version: string;
  description?: string;
}

export interface ServerObject {
  url: string;
  description?: string;
}

export interface PathsObject {
  [path: string]: PathItemObject;
}

export interface PathItemObject {
  summary?: string;
  description?: string;
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  patch?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  trace?: OperationObject;
}

export interface OperationObject {
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: ResponsesObject;
  security?: SecurityRequirementObject[];
}

export interface ParameterObject {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required?: boolean;
  description?: string;
  schema: SchemaObject;
}

export interface RequestBodyObject {
  required?: boolean;
  content: ContentObject;
}

export interface ContentObject {
  [mediaType: string]: MediaTypeObject;
}

export interface MediaTypeObject {
  schema?: SchemaObject;
  example?: unknown;
}

export interface ResponsesObject {
  [statusCode: string]: ResponseObject;
}

export interface ResponseObject {
  description: string;
  content?: ContentObject;
  headers?: HeadersObject;
}

export interface HeadersObject {
  [name: string]: HeaderObject;
}

export interface HeaderObject {
  schema: SchemaObject;
  description?: string;
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
  minimumDate?: string;
  maximumDate?: string;
  // Additional OpenAPI properties
  additionalProperties?: boolean | SchemaObject;
  uniqueItems?: boolean;
  minItems?: number;
  maxItems?: number;
  not?: SchemaObject;
}

export interface ComponentsObject {
  schemas?: Record<string, SchemaObject>;
  securitySchemes?: Record<string, SecuritySchemeObject>;
}

export interface SecuritySchemeObject {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  bearerFormat?: string;
  flows?: Record<string, unknown>;
  name?: string;
  in?: 'header' | 'query' | 'cookie';
  description?: string;
}

export interface SecurityRequirementObject {
  [name: string]: string[];
}

export interface TagObject {
  name: string;
  description?: string;
}

export interface EndpointDefinition {
  path: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head' | 'trace';
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  parameters?: ParameterObject[];
  requestSchema?: z.ZodType<unknown>;
  responseSchema?: z.ZodType<unknown>;
  responseStatusCodes?: number[];
  security?: boolean;
}

export interface GeneratorOptions {
  title?: string;
  version?: string;
  description?: string;
  servers?: ServerObject[];
  outputPath?: string;
  baseUrl?: string;
}

const DEFAULT_OPTIONS: Required<GeneratorOptions> = {
  title: 'VibeX API',
  version: '1.0.0',
  description: 'VibeX API Documentation',
  servers: [{ url: 'https://api.vibex.top/api', description: 'Production server' }],
  outputPath: './openapi.json',
  baseUrl: '/api',
};

// ==================== OpenAPI 生成器 ====================

export class OpenAPIGenerator {
  private spec: OpenAPISpec;
  private options: Required<GeneratorOptions>;
  private endpoints: EndpointDefinition[] = [];
  private schemaDefinitions: Map<string, z.ZodType<unknown>> = new Map();

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
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token authentication',
          },
        },
      },
    };
  }

  /**
   * 添加 API 端点
   */
  addEndpoint(endpoint: EndpointDefinition): void {
    this.endpoints.push(endpoint);
  }

  /**
   * 批量添加端点
   */
  addEndpoints(endpoints: EndpointDefinition[]): void {
    this.endpoints.push(...endpoints);
  }

  /**
   * 注册 Schema 定义
   */
  registerSchema(name: string, schema: z.ZodType<unknown>): void {
    this.schemaDefinitions.set(name, schema);
  }

  /**
   * 生成 OpenAPI 规范
   */
  generate(): OpenAPISpec {
    // 处理每个端点
    for (const endpoint of this.endpoints) {
      this.addPath(endpoint);
    }

    // 添加 schema 定义
    if (this.schemaDefinitions.size > 0) {
      const components = this.spec.components || { schemas: {} };
      components.schemas = components.schemas || {};
      
      for (const [name, schema] of this.schemaDefinitions) {
        components.schemas[name] = this.zodToOpenAPI(schema);
      }
      
      this.spec.components = components;
    }

    // 提取 tags
    const tagsSet = new Set<string>();
    for (const endpoint of this.endpoints) {
      if (endpoint.tags) {
        endpoint.tags.forEach(tag => tagsSet.add(tag));
      }
    }
    
    if (tagsSet.size > 0) {
      this.spec.tags = Array.from(tagsSet).map(tag => ({
        name: tag,
        description: `${tag} endpoints`,
      }));
    }

    return this.spec;
  }

  /**
   * 添加路径
   */
  private addPath(endpoint: EndpointDefinition): void {
    const openApiPath = this.convertPathParams(endpoint.path);
    const method = endpoint.method.toLowerCase() as keyof PathItemObject;
    
    if (!this.spec.paths[openApiPath]) {
      this.spec.paths[openApiPath] = {};
    }

    const operation: OperationObject = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      operationId: endpoint.operationId,
      parameters: endpoint.parameters,
      responses: this.buildResponses(endpoint),
      security: endpoint.security !== false ? [{ bearerAuth: [] }] : undefined,
    };

    // 添加请求体
    if (endpoint.requestSchema) {
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: this.zodToOpenAPI(endpoint.requestSchema),
          },
        },
      };
    }

    // 处理响应 schema
    if (endpoint.responseSchema) {
      const statusCodes = endpoint.responseStatusCodes || [200];
      for (const statusCode of statusCodes) {
        const responseKey = statusCode.toString();
        if (operation.responses[responseKey]) {
          operation.responses[responseKey].content = {
            'application/json': {
              schema: this.zodToOpenAPI(endpoint.responseSchema),
            },
          };
        }
      }
    }

    (this.spec.paths[openApiPath] as Record<string, OperationObject>)[method] = operation;
  }

  /**
   * 构建响应对象
   */
  private buildResponses(endpoint: EndpointDefinition): ResponsesObject {
    const responses: ResponsesObject = {
      '200': {
        description: 'Successful response',
      },
      '400': {
        description: 'Bad Request',
      },
      '401': {
        description: 'Unauthorized',
      },
      '403': {
        description: 'Forbidden',
      },
      '404': {
        description: 'Not Found',
      },
      '500': {
        description: 'Internal Server Error',
      },
    };

    // 添加自定义状态码
    if (endpoint.responseStatusCodes) {
      for (const code of endpoint.responseStatusCodes) {
        if (!responses[code.toString()]) {
          responses[code.toString()] = {
            description: this.getStatusDescription(code),
          };
        }
      }
    }

    return responses;
  }

  /**
   * 获取状态码描述
   */
  private getStatusDescription(statusCode: number): string {
    const descriptions: Record<number, string> = {
      200: 'Successful response',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };
    return descriptions[statusCode] || 'Response';
  }

  /**
   * 转换路径参数格式
   */
  private convertPathParams(apiPath: string): string {
    // 确保路径以 /api 开头
    let fullPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
    if (!fullPath.startsWith('/api') && !fullPath.startsWith('/auth')) {
      fullPath = `${this.options.baseUrl}${fullPath}`;
    }
    // Convert :param to {param}
    return fullPath.replace(/:(\w+)/g, '{$1}');
  }

  /**
   * Zod Schema 转换为 OpenAPI Schema
   */
  private zodToOpenAPI(schema: z.ZodType<unknown>): SchemaObject {
    const parsed = this.parseZodSchema(schema);
    return parsed;
  }

  /**
   * 解析 Zod Schema
   */
  private parseZodSchema(schema: z.ZodType<unknown>): SchemaObject {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const def = (schema as unknown as { _def: any })._def;
    
    if (!def) {
      return { type: 'string' };
    }

    switch (def.typeName) {
      case 'ZodString': {
        const result: SchemaObject = { type: 'string' };
        if (def.checks) {
          for (const check of def.checks) {
            switch (check.kind) {
              case 'min':
                result.minLength = check.value;
                break;
              case 'max':
                result.maxLength = check.value;
                break;
              case 'regex':
                result.pattern = check.regex.source;
                break;
              case 'email':
                result.format = 'email';
                break;
              case 'url':
                result.format = 'uri';
                break;
              case 'datetime':
                result.format = 'date-time';
                break;
            }
          }
        }
        return result;
      }

      case 'ZodNumber':
      case 'ZodInteger': {
        const result: SchemaObject = {
          type: def.typeName === 'ZodInteger' ? 'integer' : 'number',
        };
        if (def.checks) {
          for (const check of def.checks) {
            switch (check.kind) {
              case 'min':
                result.minimum = check.value;
                break;
              case 'max':
                result.maximum = check.value;
                break;
            }
          }
        }
        return result;
      }

      case 'ZodBoolean':
        return { type: 'boolean' };

      case 'ZodBigInt':
        return { type: 'integer', format: 'int64' };

      case 'ZodDate':
        return { type: 'string', format: 'date-time' };

      case 'ZodArray': {
        return {
          type: 'array',
          items: this.parseZodSchema(def.schema as z.ZodType<unknown>),
        };
      }

      case 'ZodObject': {
        const properties: Record<string, SchemaObject> = {};
        const required: string[] = [];
        const shape = def.shape();
        
        for (const [key, value] of Object.entries(shape)) {
          const valueSchema = value as z.ZodType<unknown>;
          properties[key] = this.parseZodSchema(valueSchema);
          
          // 检查是否必需
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const valueDef = (valueSchema as unknown as { _def: any })._def;
          if (!valueDef || valueDef.typeName !== 'ZodOptional') {
            required.push(key);
          }
        }
        
        return {
          type: 'object',
          properties,
          required: required.length > 0 ? required : undefined,
        };
      }

      case 'ZodEnum': {
        return {
          type: 'string',
          enum: def.values,
        };
      }

      case 'ZodNativeEnum': {
        return {
          type: 'string',
          enum: Object.values(def.values),
        };
      }

      case 'ZodUnion':
      case 'ZodDiscriminatedUnion': {
        if (def.typeName === 'ZodUnion' && def.options) {
          return {
            oneOf: def.options.map((opt: z.ZodType<unknown>) => this.parseZodSchema(opt)),
          };
        }
        return { type: 'string' };
      }

      case 'ZodIntersection': {
        return {
          allOf: [
            this.parseZodSchema(def.left as z.ZodType<unknown>),
            this.parseZodSchema(def.right as z.ZodType<unknown>),
          ],
        };
      }

      case 'ZodNullable': {
        return {
          ...this.parseZodSchema(def.innerType as z.ZodType<unknown>),
          nullable: true,
        };
      }

      case 'ZodOptional': {
        return this.parseZodSchema(def.innerType as z.ZodType<unknown>);
      }

      case 'ZodDefault': {
        return {
          ...this.parseZodSchema(def.innerType as z.ZodType<unknown>),
          default: def.defaultValue(),
        };
      }

      case 'ZodLazy': {
        return this.parseZodSchema(def.getter() as z.ZodType<unknown>);
      }

      case 'ZodLiteral': {
        return {
          type: typeof def.value === 'string' ? 'string' :
                typeof def.value === 'number' ? 'number' :
                typeof def.value === 'boolean' ? 'boolean' : 'string',
          enum: [def.value],
        };
      }

      case 'ZodEffects': {
        // 处理 refine, transform, preprocess
        return this.parseZodSchema(def.schema as z.ZodType<unknown>);
      }

      case 'ZodRecord': {
        return {
          type: 'object',
          additionalProperties: this.parseZodSchema(def.valueType as z.ZodType<unknown>),
        };
      }

      case 'ZodMap': {
        return {
          type: 'object',
          additionalProperties: this.parseZodSchema(def.valueType as z.ZodType<unknown>),
        };
      }

      case 'ZodSet': {
        return {
          type: 'array',
          items: this.parseZodSchema(def.valueType as z.ZodType<unknown>),
          uniqueItems: true,
        };
      }

      case 'ZodTuple': {
        if (def.items) {
          return {
            type: 'array',
            items: def.items.map((item: z.ZodType<unknown>) => this.parseZodSchema(item)),
            minItems: def.items.length,
            maxItems: def.items.length,
          };
        }
        return { type: 'array' };
      }

      case 'ZodAny':
        return {};

      case 'ZodUnknown':
        return {};

      case 'ZodNever':
        return { not: {} };

      case 'ZodVoid':
        return { type: 'null' };

      default:
        return { type: 'string' };
    }
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
    return this.jsonToYaml(this.toJSON());
  }

  /**
   * JSON to YAML 转换
   */
  private jsonToYaml(json: string): string {
    const obj = JSON.parse(json);
    return this.objectToYaml(obj, 0);
  }

  private objectToYaml(obj: unknown, indent: number): string {
    const spaces = ' '.repeat(indent * 2);
    
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj !== 'object') return JSON.stringify(obj);
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return obj.map(item => `${spaces}- ${this.objectToYaml(item, indent + 1)}`).join('\n');
    }
    
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    
    return entries.map(([key, value]) => {
      const valueYaml = typeof value === 'object' && value !== null
        ? '\n' + this.objectToYaml(value, indent + 1)
        : ' ' + JSON.stringify(value);
      return `${spaces}${key}:${valueYaml}`;
    }).join('\n');
  }

  /**
   * 写入文件
   */
  async writeFile(filePath?: string): Promise<void> {
    const outputPath = filePath || this.options.outputPath;
    const ext = path.extname(outputPath).toLowerCase();
    
    const content = ext === '.yaml' || ext === '.yml'
      ? this.toYAML()
      : this.toJSON();
    
    await fs.writeFile(outputPath, content, 'utf-8');
  }
}

export default OpenAPIGenerator;
