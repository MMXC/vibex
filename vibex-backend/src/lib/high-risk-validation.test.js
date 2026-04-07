/**
 * @fileoverview Tests for High-Risk Route Validation Helper
 *
 * Part of: api-input-validation-layer / Epic E2
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseBody, validateParams } from './high-risk-validation';
import { NextResponse } from 'next/server';

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

describe('parseBody', () => {
  it('should parse valid JSON body', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alice', age: 30 }),
      headers: { 'content-type': 'application/json' },
    });

    const result = await parseBody(request, testSchema);
    expect('data' in result).toBe(true);
    if ('data' in result) {
      expect(result.data).toEqual({ name: 'Alice', age: 30 });
    }
  });

  it('should return error for invalid JSON', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: '{ invalid json }',
      headers: { 'content-type': 'application/json' },
    });

    const result = await parseBody(request, testSchema);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.status).toBe(400);
    }
  });

  it('should return error for validation failure', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ name: '', age: -5 }),
      headers: { 'content-type': 'application/json' },
    });

    const result = await parseBody(request, testSchema);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.status).toBe(400);
    }
  });
});

describe('validateParams', () => {
  it('should return validated data for valid params', () => {
    const result = validateParams({ owner: 'octocat', repo: 'hello' }, testSchema);
    expect('data' in result).toBe(true);
  });

  it('should return NextResponse error for invalid params', () => {
    const result = validateParams({ owner: '', age: -5 }, testSchema);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toBeInstanceOf(NextResponse);
    }
  });
});
