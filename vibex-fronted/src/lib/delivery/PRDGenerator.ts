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

/** Generate structured PRD data from delivery store */
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
