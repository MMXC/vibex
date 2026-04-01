declare module '@axe-core/playwright' {
  import type { Page, ElementHandle } from '@playwright/test';
  export { default } from 'axe-core';

  export interface AxeConfiguration {
    reporter?: string;
    rules?: Record<string, { enabled?: boolean }>;
    tags?: string[];
    [key: string]: unknown;
  }

  export interface AxeResults {
    violations: AxeViolation[];
    passes: AxeViolation[];
    incomplete: AxeViolation[];
    inapplicable: AxeViolation[];
  }

  export interface AxeViolation {
    id: string;
    impact: 'critical' | 'serious' | 'moderate' | 'minor' | null;
    tags: string[];
    help: string;
    helpUrl: string;
    description: string;
    nodes: AxeNode[];
  }

  export interface AxeNode {
    html: string;
    target: string[];
    impact: string | null;
  }

  export default class AxeBuilder {
    constructor(options: { page: Page });
    withTags(tags: string[]): AxeBuilder;
    analyze(): Promise<AxeResults>;
  }
}
