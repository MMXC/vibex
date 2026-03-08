/**
 * Breaking Change Detector - 检测 API 破坏性变更
 * 
 * 检测类型:
 * - ENDPOINT_REMOVED: 删除端点
 * - METHOD_CHANGED: HTTP 方法变更
 * - REQUIRED_PARAM_ADDED: 新增必填参数
 * - PARAM_TYPE_CHANGED: 参数类型变更
 * - RESPONSE_FIELD_REMOVED: 响应字段删除
 * - RESPONSE_FIELD_TYPE_CHANGED: 响应字段类型变更
 * - SCHEMA_REMOVED: Schema 删除
 * 
 * Usage:
 * const detector = new BreakingChangeDetector()
 * const changes = detector.detect(oldSpec, newSpec)
 * detector.isBreaking(changes) // true/false
 */

import { OpenAPISpec, SchemaObject } from './OpenAPIGenerator';

// 变更类型
export type ChangeType =
  | 'ENDPOINT_REMOVED'
  | 'METHOD_CHANGED'
  | 'REQUIRED_PARAM_ADDED'
  | 'PARAM_REMOVED'
  | 'PARAM_TYPE_CHANGED'
  | 'RESPONSE_FIELD_REMOVED'
  | 'RESPONSE_FIELD_TYPE_CHANGED'
  | 'SCHEMA_REMOVED'
  | 'SCHEMA_PROPERTY_REMOVED'
  | 'SCHEMA_PROPERTY_REQUIRED_CHANGED';

// 变更严重程度
export type Severity = 'error' | 'warning' | 'info';

// 检测到的变更
export interface DetectedChange {
  type: ChangeType;
  severity: Severity;
  message: string;
  path: string;
  oldValue?: unknown;
  newValue?: unknown;
}

// 检测选项
export interface DetectorOptions {
  /** 严格模式: 所有变更都视为 breaking */
  strict?: boolean;
  /** 忽略的变更路径 */
  ignorePaths?: string[];
  /** 自定义变更检测规则 */
  customRules?: (oldSpec: OpenAPISpec, newSpec: OpenAPISpec) => DetectedChange[];
}

/**
 * Breaking Change 检测器
 */
export class BreakingChangeDetector {
  private options: Required<DetectorOptions>;

  constructor(options: DetectorOptions = {}) {
    this.options = {
      strict: options.strict ?? false,
      ignorePaths: options.ignorePaths ?? [],
      customRules: options.customRules ?? (() => []),
    };
  }

  /**
   * 检测两个 OpenAPI 规范之间的破坏性变更
   */
  detect(oldSpec: OpenAPISpec, newSpec: OpenAPISpec): DetectedChange[] {
    const changes: DetectedChange[] = [];

    // 检测端点变更
    changes.push(...this.detectEndpointChanges(oldSpec, newSpec));
    
    // 检测 Schema 变更
    changes.push(...this.detectSchemaChanges(oldSpec, newSpec));
    
    // 检测自定义规则
    changes.push(...this.options.customRules(oldSpec, newSpec));
    
    // 过滤忽略的路径
    return changes.filter(change => 
      !this.options.ignorePaths.some(ignorePath => change.path.includes(ignorePath))
    );
  }

  /**
   * 检测端点变更
   */
  private detectEndpointChanges(oldSpec: OpenAPISpec, newSpec: OpenAPISpec): DetectedChange[] {
    const changes: DetectedChange[] = [];
    
    const oldPaths = oldSpec.paths || {};
    const newPaths = newSpec.paths || {};
    
    // 检测删除的端点
    for (const [path, methods] of Object.entries(oldPaths)) {
      if (!newPaths[path]) {
        changes.push({
          type: 'ENDPOINT_REMOVED',
          severity: 'error',
          message: `端点已删除: ${path}`,
          path: `paths.${path}`,
        });
        continue;
      }
      
      // 检测方法变更
      for (const [method, operation] of Object.entries(methods as Record<string, any>)) {
        if (!newPaths[path][method]) {
          changes.push({
            type: 'ENDPOINT_REMOVED',
            severity: 'error',
            message: `HTTP 方法已删除: ${method.toUpperCase()} ${path}`,
            path: `paths.${path}.${method}`,
          });
        }
      }
    }
    
    // 检测新增必填参数
    for (const [path, methods] of Object.entries(newPaths)) {
      if (!oldPaths[path]) continue;
      
      for (const [method, operation] of Object.entries(methods as Record<string, any>)) {
        const oldOperation = (oldPaths[path] as Record<string, any>)[method];
        if (!oldOperation) continue;
        
        const oldParams = oldOperation.parameters || [];
        const newParams = operation.parameters || [];
        
        for (const param of newParams) {
          const oldParam = oldParams.find((p: any) => p.name === param.name);
          
          if (!oldParam && param.required) {
            changes.push({
              type: 'REQUIRED_PARAM_ADDED',
              severity: 'error',
              message: `新增必填参数: ${param.name} in ${method.toUpperCase()} ${path}`,
              path: `paths.${path}.${method}.parameters.${param.name}`,
            });
          }
        }
      }
    }
    
    return changes;
  }

  /**
   * 检测 Schema 变更
   */
  private detectSchemaChanges(oldSpec: OpenAPISpec, newSpec: OpenAPISpec): DetectedChange[] {
    const changes: DetectedChange[] = [];
    
    const oldSchemas = oldSpec.components?.schemas || {};
    const newSchemas = newSpec.components?.schemas || {};
    
    // 检测删除的 Schema
    for (const [name, schema] of Object.entries(oldSchemas)) {
      if (!newSchemas[name]) {
        changes.push({
          type: 'SCHEMA_REMOVED',
          severity: 'error',
          message: `Schema 已删除: ${name}`,
          path: `components.schemas.${name}`,
          oldValue: schema,
        });
      }
    }
    
    // 检测 Schema 属性变更
    for (const [name, newSchema] of Object.entries(newSchemas)) {
      const oldSchema = oldSchemas[name];
      if (!oldSchema) continue;
      
      changes.push(...this.detectSchemaPropertyChanges(name, oldSchema as SchemaObject, newSchema as SchemaObject));
    }
    
    return changes;
  }

  /**
   * 检测 Schema 属性变更
   */
  private detectSchemaPropertyChanges(
    schemaName: string,
    oldSchema: SchemaObject,
    newSchema: SchemaObject,
    path = ''
  ): DetectedChange[] {
    const changes: DetectedChange[] = [];
    
    const oldProps = oldSchema.properties || {};
    const newProps = newSchema.properties || {};
    
    // 检测删除的属性
    for (const [propName, prop] of Object.entries(oldProps)) {
      if (!newProps[propName]) {
        changes.push({
          type: 'RESPONSE_FIELD_REMOVED',
          severity: 'error',
          message: `响应字段已删除: ${schemaName}.${propName}`,
          path: `components.schemas.${schemaName}.properties.${propName}${path}`,
          oldValue: prop,
        });
      }
    }
    
    // 检测属性类型变更
    for (const [propName, newProp] of Object.entries(newProps)) {
      const oldProp = oldProps[propName];
      if (!oldProp) continue;
      
      if (oldProp.type !== newProp.type) {
        changes.push({
          type: 'RESPONSE_FIELD_TYPE_CHANGED',
          severity: 'error',
          message: `字段类型变更: ${schemaName}.${propName} (${oldProp.type} -> ${newProp.type})`,
          path: `components.schemas.${schemaName}.properties.${propName}.type`,
          oldValue: oldProp.type,
          newValue: newProp.type,
        });
      }
    }
    
    // 递归检测嵌套对象
    for (const [propName, newProp] of Object.entries(newProps)) {
      const oldProp = oldProps[propName];
      if (oldProp && oldProp.type === 'object' && newProp.type === 'object') {
        changes.push(...this.detectSchemaPropertyChanges(
          `${schemaName}.${propName}`,
          oldProp as SchemaObject,
          newProp as SchemaObject,
          `${path}.properties.${propName}`
        ));
      }
    }
    
    return changes;
  }

  /**
   * 判断是否存在破坏性变更
   */
  isBreaking(changes: DetectedChange[]): boolean {
    if (this.options.strict) {
      return changes.length > 0;
    }
    
    // 只有 severity 为 error 的变更才是破坏性的
    return changes.some(change => change.severity === 'error');
  }

  /**
   * 生成变更报告
   */
  generateReport(changes: DetectedChange[]): string {
    if (changes.length === 0) {
      return '✅ 未检测到破坏性变更';
    }
    
    const errors = changes.filter(c => c.severity === 'error');
    const warnings = changes.filter(c => c.severity === 'warning');
    const infos = changes.filter(c => c.severity === 'info');
    
    let report = '# API Breaking Changes Report\n\n';
    
    if (errors.length > 0) {
      report += `## 🔴 Errors (${errors.length})\n\n`;
      for (const change of errors) {
        report += `- **${change.type}**: ${change.message}\n`;
        report += `  - Path: \`${change.path}\`\n\n`;
      }
    }
    
    if (warnings.length > 0) {
      report += `## 🟡 Warnings (${warnings.length})\n\n`;
      for (const change of warnings) {
        report += `- **${change.type}**: ${change.message}\n`;
        report += `  - Path: \`${change.path}\`\n\n`;
      }
    }
    
    if (infos.length > 0) {
      report += `## ℹ️ Info (${infos.length})\n\n`;
      for (const change of infos) {
        report += `- **${change.type}**: ${change.message}\n\n`;
      }
    }
    
    return report;
  }

  /**
   * CI 友好输出
   */
  generateCIOutput(changes: DetectedChange[]): void {
    const errors = changes.filter(c => c.severity === 'error');
    
    if (errors.length > 0) {
      console.error('❌ Breaking Changes Detected:\n');
      for (const change of errors) {
        console.error(`  - [${change.type}] ${change.message}`);
      }
      console.error('\nPlease fix these changes before merging.');
      process.exit(1);
    } else {
      console.log('✅ No breaking changes detected.');
    }
  }
}

export default BreakingChangeDetector;
