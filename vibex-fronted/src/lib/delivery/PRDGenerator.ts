/**
 * PRDGenerator.ts — Sprint5 QA E4-U1: PRD Generator
 *
 * Generates PRD document from delivery store data.
 */

'use client';

import type { BoundedContext, BusinessFlow, Component } from '@/stores/deliveryStore';

export interface PRDData {
  projectName: string;
  domain: string;
  goal: string;
  contexts: BoundedContext[];
  flows: BusinessFlow[];
  components: Component[];
}

export interface PRDSection {
  id: string;
  title: string;
  content: string;
}

export interface JSONSchemaProperty {
  type: string;
  description?: string;
}

export interface PRDJsonSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required: string[];
}

export interface PRDDual {
  markdown: string;
  jsonSchema: PRDJsonSchema;
}

/**
 * Build a JSON Schema from contexts, flows, and components.
 */
function buildJsonSchema(
  contexts: BoundedContext[],
  flows: BusinessFlow[],
  components: Component[]
): PRDJsonSchema {
  const properties: Record<string, JSONSchemaProperty> = {
    projectName: { type: 'string', description: 'Project name' },
    domain: { type: 'string', description: 'Domain' },
    goal: { type: 'string', description: 'Core goal' },
  };
  const required: string[] = ['projectName', 'domain', 'goal'];

  if (contexts.length > 0) {
    properties.contexts = {
      type: 'array',
      description: `${contexts.length} bounded contexts`,
    };
  }
  if (flows.length > 0) {
    properties.flows = {
      type: 'array',
      description: `${flows.length} business flows`,
    };
  }
  if (components.length > 0) {
    properties.components = {
      type: 'array',
      description: `${components.length} components`,
    };
  }

  return { type: 'object', properties, required };
}

/**
 * Generate PRD data (passthrough, same input returned).
 */
export function generatePRD(data: PRDData): PRDData {
  return {
    projectName: data.projectName || '未命名项目',
    domain: data.domain || '通用领域',
    goal: data.goal || '待定义',
    contexts: data.contexts ?? [],
    flows: data.flows ?? [],
    components: data.components ?? [],
  };
}

/**
 * Generate PRD in dual format: markdown string + JSON Schema object.
 */
export function generatePRDDual(data: PRDData): PRDDual {
  const prd = generatePRD(data);
  const markdown = generatePRDMarkdown(data);
  const jsonSchema = buildJsonSchema(prd.contexts, prd.flows, prd.components);
  return { markdown, jsonSchema };
}

/** Generate PRD as markdown string */
export function generatePRDMarkdown(data: PRDData): string {
  const prd = generatePRD(data);
  const lines: string[] = [];

  // Overview
  lines.push('# ' + prd.projectName);
  lines.push('');
  lines.push('## 项目概述');
  lines.push('');
  lines.push(`- **项目名称**: ${prd.projectName}`);
  lines.push(`- **领域**: ${prd.domain}`);
  lines.push(`- **核心目标**: ${prd.goal}`);
  lines.push('');

  // Bounded Contexts
  if (prd.contexts.length > 0) {
    lines.push('## 限界上下文');
    lines.push('');
    for (const ctx of prd.contexts) {
      lines.push(`### ${ctx.name || '未命名上下文'}`);
      lines.push(ctx.description || '无描述');
      lines.push('');
    }
  }

  // Business Flows
  if (prd.flows.length > 0) {
    lines.push('## 业务流程');
    lines.push('');
    for (const flow of prd.flows) {
      lines.push(`### ${flow.name || '未命名流程'}`);
      if (flow.steps && flow.steps.length > 0) {
        for (let i = 0; i < flow.steps.length; i++) {
          lines.push(`${i + 1}. ${flow.steps[i]}`);
        }
      } else {
        lines.push('(无步骤)');
      }
      lines.push('');
    }
  }

  // Components
  if (prd.components.length > 0) {
    lines.push('## 组件架构');
    lines.push('');
    for (const comp of prd.components) {
      lines.push(`### ${comp.name || '未命名组件'}`);
      lines.push(comp.description || '无描述');
      lines.push('');
    }
  }

  return lines.join('\n');
}
