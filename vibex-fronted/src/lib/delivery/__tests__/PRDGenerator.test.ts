/**
 * PRDGenerator.test.ts — Sprint5 QA E4-U1: PRD Generator Tests
 */

import { describe, it, expect } from 'vitest';
import { generatePRD, generatePRDMarkdown } from '../PRDGenerator';

describe('generatePRD — E4-U1', () => {
  it('returns structured PRD data', () => {
    const result = generatePRD({
      projectName: 'Test Project',
      domain: 'Test Domain',
      goal: 'Test Goal',
      contexts: [],
      flows: [],
      components: [],
    });
    expect(result.projectName).toBe('Test Project');
    expect(result.domain).toBe('Test Domain');
    expect(result.goal).toBe('Test Goal');
  });

  it('handles empty arrays', () => {
    const result = generatePRD({
      projectName: '',
      domain: '',
      goal: '',
      contexts: [],
      flows: [],
      components: [],
    });
    expect(result.contexts).toHaveLength(0);
    expect(result.flows).toHaveLength(0);
  });

  it('generatePRDMarkdown returns non-empty string', () => {
    const result = generatePRDMarkdown({
      projectName: 'Markdown Test',
      domain: 'Domain',
      goal: 'Goal',
      contexts: [],
      flows: [],
      components: [],
    });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('Markdown Test');
  });

  it('markdown includes sections when data present', () => {
    const result = generatePRDMarkdown({
      projectName: 'Full PRD',
      domain: 'DDD',
      goal: 'Build DDD docs',
      contexts: [{ id: 'c1', name: 'User Context', description: 'User domain' }],
      flows: [{ id: 'f1', name: 'Order Flow', steps: ['Step 1', 'Step 2'] }],
      components: [{ id: 'co1', name: 'User Service', description: 'User logic' }],
    });
    expect(result).toContain('Full PRD');
    expect(result).toContain('User Context');
    expect(result).toContain('Order Flow');
    expect(result).toContain('User Service');
  });

  it('markdown omits empty sections', () => {
    const result = generatePRDMarkdown({
      projectName: 'Empty PRD',
      domain: 'Domain',
      goal: 'Goal',
      contexts: [],
      flows: [],
      components: [],
    });
    expect(result).not.toContain('限界上下文');
    expect(result).not.toContain('业务流程');
    expect(result).not.toContain('组件架构');
  });
});
