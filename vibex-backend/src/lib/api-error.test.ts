/**
 * @fileoverview Unit tests for apiError
 * Part of: vibex-p0-q2-sprint1 / Unit 2
 */
import { apiError, ERROR_CODES } from './api-error';

describe('apiError', () => {
  it('creates error with message and code', () => {
    const result = apiError('Not found', ERROR_CODES.NOT_FOUND);
    expect(result).toEqual({ error: 'Not found', code: 'NOT_FOUND' });
  });

  it('includes details when provided', () => {
    const details = { field: 'name', issue: 'required' };
    const result = apiError('Validation failed', ERROR_CODES.VALIDATION_ERROR, details);
    expect(result).toEqual({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
    });
  });

  it('omits details when undefined', () => {
    const result = apiError('Error', ERROR_CODES.INTERNAL_ERROR);
    expect(result).not.toHaveProperty('details');
  });

  it('covers all error codes', () => {
    (Object.values(ERROR_CODES) as string[]).forEach((code) => {
      const result = apiError('test', code as typeof ERROR_CODES.NOT_FOUND);
      expect(result.code).toBe(code);
    });
  });
});
