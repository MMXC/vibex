/**
 * @fileoverview Tests for API Validation Infrastructure
 * 
 * Part of: api-input-validation-layer / Epic E1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { ValidationError, JsonParseError } from './validation-error';

// Mock Hono Context
function createMockContext(options: {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string[]>;
  contentType?: string;
} = {}) {
  return {
    req: {
      header: vi.fn().mockReturnValue(options.contentType || 'application/json'),
      json: vi.fn().mockResolvedValue(options.body || {}),
      param: vi.fn().mockReturnValue(options.params || {}),
      queries: vi.fn().mockReturnValue(options.query || {}),
      raw: {
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue(options.body || {}),
        }),
      },
    },
    json: vi.fn().mockReturnValue({}),
  } as unknown as any;
}

describe('ValidationError', () => {
  describe('fromZodError', () => {
    it('should convert ZodError to ValidationError with field errors', () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      const result = schema.safeParse({ email: 'invalid', password: 'short' });
      expect(result.success).toBe(false);

      if (!result.success) {
        const error = ValidationError.fromZodError(result.error);

        expect(error.message).toBe('Validation failed');
        expect(error.fieldErrors).toHaveProperty('email');
        expect(error.fieldErrors).toHaveProperty('password');
        expect(error.fieldErrors.email[0]).toBeTruthy();
        expect(error.fieldErrors.password[0]).toBeTruthy();
      }
    });

    it('should handle form-level errors', () => {
      const schema = z.object({}).refine(() => false, {
        message: 'Form-level validation failed',
      });

      const result = schema.safeParse({});
      expect(result.success).toBe(false);

      if (!result.success) {
        const error = ValidationError.fromZodError(result.error);

        expect(error.formErrors).toContain('Form-level validation failed');
      }
    });
  });

  describe('toResponse', () => {
    it('should format error as API response', () => {
      const error = new ValidationError('Validation failed', {
        email: ['Invalid email'],
      }, ['Form error']);

      const response = error.toResponse();

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.message).toBe('Validation failed');
      expect(response.error.details?.fieldErrors.email).toContain('Invalid email');
      expect(response.error.details?.formErrors).toContain('Form error');
    });
  });
});

describe('JsonParseError', () => {
  it('should have correct status code and code', () => {
    const error = new JsonParseError();

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('INVALID_JSON');
    expect(error.message).toBe('Invalid JSON format');
  });

  it('should format response correctly', () => {
    const error = new JsonParseError('Custom message');
    const response = error.toResponse();

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('INVALID_JSON');
    expect(response.error.message).toBe('Custom message');
  });
});
