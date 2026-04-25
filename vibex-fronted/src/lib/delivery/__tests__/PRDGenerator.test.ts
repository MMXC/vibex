/**
 * PRDGenerator.test.ts — Sprint5 QA E4-U1: PRD Generator Tests
 */

import { describe, it, expect } from 'vitest';
import { generatePRD, generatePRDMarkdown, generatePRDDual } from '../PRDGenerator';

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

describe('generatePRDDual — E4-S2: Dual Format Output', () => {
  it('returns { markdown, jsonSchema } shape', () => {
    const result = generatePRDDual({
      projectName: 'Dual Test',
      domain: 'Domain',
      goal: 'Goal',
      contexts: [],
      flows: [],
      components: [],
    });
    expect(result).toHaveProperty('markdown');
    expect(result).toHaveProperty('jsonSchema');
  });

  it('jsonSchema has type "object"', () => {
    const result = generatePRDDual({
      projectName: 'Schema Test',
      domain: 'Domain',
      goal: 'Goal',
      contexts: [],
      flows: [],
      components: [],
    });
    expect(result.jsonSchema.type).toBe('object');
  });

  it('jsonSchema has required fields', () => {
    const result = generatePRDDual({
      projectName: 'Required Test',
      domain: 'Domain',
      goal: 'Goal',
      contexts: [],
      flows: [],
      components: [],
    });
    expect(Array.isArray(result.jsonSchema.required)).toBe(true);
    expect(result.jsonSchema.required).toContain('projectName');
    expect(result.jsonSchema.required).toContain('domain');
    expect(result.jsonSchema.required).toContain('goal');
  });

  it('jsonSchema includes contexts/flows/components properties when data present', () => {
    const result = generatePRDDual({
      projectName: 'Full Schema',
      domain: 'Domain',
      goal: 'Goal',
      contexts: [{ id: 'c1', name: 'User', description: 'User domain' }],
      flows: [{ id: 'f1', name: 'Order', steps: ['Step 1'] }],
      components: [{ id: 'co1', name: 'Service', description: 'Logic' }],
    });
    expect(result.jsonSchema.properties).toHaveProperty('contexts');
    expect(result.jsonSchema.properties).toHaveProperty('flows');
    expect(result.jsonSchema.properties).toHaveProperty('components');
    expect(result.jsonSchema.properties.contexts.type).toBe('array');
    expect(result.jsonSchema.properties.flows.type).toBe('array');
    expect(result.jsonSchema.properties.components.type).toBe('array');
  });

  it('jsonSchema omits contexts/flows/components when empty', () => {
    const result = generatePRDDual({
      projectName: 'Empty',
      domain: 'Domain',
      goal: 'Goal',
      contexts: [],
      flows: [],
      components: [],
    });
    expect(result.jsonSchema.properties).not.toHaveProperty('contexts');
    expect(result.jsonSchema.properties).not.toHaveProperty('flows');
    expect(result.jsonSchema.properties).not.toHaveProperty('components');
  });

  it('markdown field matches generatePRDMarkdown output', () => {
    const data = {
      projectName: 'MD Match',
      domain: 'Domain',
      goal: 'Goal',
      contexts: [],
      flows: [],
      components: [],
    };
    const result = generatePRDDual(data);
    expect(result.markdown).toBe(generatePRDMarkdown(data));
  });
});
