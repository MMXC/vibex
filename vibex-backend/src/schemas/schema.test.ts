/**
 * @fileoverview Schema Unit Tests
 * 
 * Part of: api-input-validation-layer / Epic E5
 * Tests for project and canvas schemas
 */

import { describe, it, expect } from 'jest';
import {
  createProjectSchema,
  updateProjectSchema,
  projectListQuerySchema,
  generateContextsSchema,
  generateFlowsSchema,
  generateComponentsSchema,
  boundedContextSchema,
  flowStepSchema,
} from '../schemas';

describe('Project Schemas', () => {
  describe('createProjectSchema', () => {
    it('should validate correct input', () => {
      const input = { name: 'Test Project', description: 'A test project', userId: 'user-123' };
      const result = createProjectSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Project');
      }
    });

    it('should reject empty name', () => {
      const input = { name: '', userId: 'user-123' };
      const result = createProjectSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject extra fields', () => {
      const input = { name: 'Test', userId: 'user-123', extraField: 'not allowed' };
      const result = createProjectSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept optional description', () => {
      const input = { name: 'Test', userId: 'user-123' };
      const result = createProjectSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('updateProjectSchema', () => {
    it('should validate partial update with name only', () => {
      const input = { name: 'Updated Name' };
      const result = updateProjectSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should validate status enum', () => {
      const input = { status: 'active' };
      const result = updateProjectSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const input = { status: 'invalid-status' };
      const result = updateProjectSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should validate version is positive', () => {
      const input = { version: -1 };
      const result = updateProjectSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('projectListQuerySchema', () => {
    it('should validate empty query', () => {
      const result = projectListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate userId filter', () => {
      const input = { userId: 'user-123' };
      const result = projectListQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should validate include=snapshot', () => {
      const input = { include: 'snapshot', id: 'project-123' };
      const result = projectListQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid include value', () => {
      const input = { include: 'invalid' };
      const result = projectListQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should transform string version to number', () => {
      const input = { version: '5' };
      const result = projectListQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe(5);
      }
    });
  });
});

describe('Canvas Schemas', () => {
  describe('generateContextsSchema', () => {
    it('should validate correct input', () => {
      const input = { requirementText: 'Build an e-commerce platform' };
      const result = generateContextsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty requirementText', () => {
      const input = { requirementText: '' };
      const result = generateContextsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept optional projectId', () => {
      const input = { requirementText: 'Build something', projectId: 'proj-123' };
      const result = generateContextsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('generateFlowsSchema', () => {
    it('should validate correct input', () => {
      const input = {
        contexts: [
          { id: 'ctx-1', name: 'Order', description: 'Order management', type: 'core' }
        ],
        sessionId: 'session-123'
      };
      const result = generateFlowsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty contexts array', () => {
      const input = { contexts: [], sessionId: 'session-123' };
      const result = generateFlowsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid context type', () => {
      const input = {
        contexts: [
          { id: 'ctx-1', name: 'Order', description: 'desc', type: 'invalid' }
        ],
        sessionId: 'session-123'
      };
      const result = generateFlowsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('generateComponentsSchema', () => {
    it('should validate correct input', () => {
      const input = {
        contexts: [
          { id: 'ctx-1', name: 'Order', description: 'desc', type: 'core' }
        ],
        flows: [
          {
            name: 'Place Order',
            contextId: 'ctx-1',
            steps: [
              { name: 'Add to cart', actor: 'User' }
            ]
          }
        ],
        sessionId: 'session-123'
      };
      const result = generateComponentsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty flows array', () => {
      const input = {
        contexts: [{ id: 'ctx-1', name: 'Order', description: 'desc', type: 'core' }],
        flows: [],
        sessionId: 'session-123'
      };
      const result = generateComponentsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('boundedContextSchema', () => {
    it('should validate correct context', () => {
      const input = { id: 'ctx-1', name: 'Order', description: 'Order management', type: 'core' };
      const result = boundedContextSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should default type to core', () => {
      const input = { id: 'ctx-1', name: 'Order', description: 'desc' };
      const result = boundedContextSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('core');
      }
    });
  });

  describe('flowStepSchema', () => {
    it('should validate correct step', () => {
      const input = { name: 'Add to cart', actor: 'User' };
      const result = flowStepSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept optional fields', () => {
      const input = { 
        name: 'Add to cart', 
        actor: 'User', 
        id: 'step-1', 
        description: 'Add item to cart',
        order: 1
      };
      const result = flowStepSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});