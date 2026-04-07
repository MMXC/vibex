/**
 * Template Applier
 * 
 * 模板应用器 - 负责将模板应用到项目
 */

import type { Template, ApplyTemplateRequest, ApplyTemplateResponse, TemplateVariable } from '@/types/template';

/**
 * 提取模板变量
 */
export function extractTemplateVariables(template: Template): TemplateVariable[] {
  const variables: TemplateVariable[] = [];
  
  // 从模板名称提取变量
  variables.push({
    key: 'projectName',
    label: '项目名称',
    type: 'text',
    required: true,
    defaultValue: template.name,
    description: '新项目的名称',
  });
  
  // 从模板描述提取变量
  variables.push({
    key: 'projectDescription',
    label: '项目描述',
    type: 'textarea',
    required: false,
    defaultValue: template.description,
    description: '项目的简短描述',
  });
  
  return variables;
}

/**
 * 替换模板变量
 */
export function replaceTemplateVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;
  
  for (const [key, value] of Object.entries(variables)) {
    // 替换 {{key}} 格式的变量
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    // 替换 ${key} 格式的变量
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
  }
  
  return result;
}

/**
 * 验证模板变量
 */
export function validateTemplateVariables(
  variables: TemplateVariable[],
  values: Record<string, string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const variable of variables) {
    if (variable.required && !values[variable.key]?.trim()) {
      errors.push(`${variable.label} 是必填项`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 模板应用器类
 */
export class TemplateApplier {
  private template: Template;
  private variables: Record<string, string> = {};
  
  constructor(template: Template) {
    this.template = template;
  }
  
  /**
   * 设置变量值
   */
  setVariable(key: string, value: string): void {
    this.variables[key] = value;
  }
  
  /**
   * 批量设置变量
   */
  setVariables(variables: Record<string, string>): void {
    this.variables = { ...this.variables, ...variables };
  }
  
  /**
   * 获取变量
   */
  getVariables(): Record<string, string> {
    return { ...this.variables };
  }
  
  /**
   * 获取模板
   */
  getTemplate(): Template {
    return this.template;
  }
  
  /**
   * 获取提取的变量定义
   */
  getVariableDefinitions(): TemplateVariable[] {
    return extractTemplateVariables(this.template);
  }
  
  /**
   * 验证变量
   */
  validate(): { valid: boolean; errors: string[] } {
    const definitions = this.getVariableDefinitions();
    return validateTemplateVariables(definitions, this.variables);
  }
  
  /**
   * 应用模板
   */
  async apply(): Promise<ApplyTemplateResponse> {
    // 验证变量
    const validation = this.validate();
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join('; '),
      };
    }
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 生成项目ID
      const projectId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        projectId,
        message: '项目创建成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '应用模板失败',
      };
    }
  }
  
  /**
   * 预览替换后的内容
   */
  preview(content: string): string {
    return replaceTemplateVariables(content, this.variables);
  }
}

/**
 * 创建模板应用器
 */
export function createTemplateApplier(template: Template): TemplateApplier {
  return new TemplateApplier(template);
}

/**
 * 应用模板（便捷函数）
 */
export async function applyTemplate(
  template: Template,
  variables: Record<string, string>
): Promise<ApplyTemplateResponse> {
  const applier = createTemplateApplier(template);
  applier.setVariables(variables);
  return applier.apply();
}
