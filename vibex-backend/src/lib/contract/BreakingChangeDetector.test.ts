/**
 * BreakingChangeDetector Tests
 */

import { BreakingChangeDetector, OpenAPISpec } from './BreakingChangeDetector';

describe('BreakingChangeDetector', () => {
  const createSpec = (paths: Record<string, any> = {}, schemas: Record<string, any> = {}): OpenAPISpec => ({
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths,
    components: { schemas },
  });

  describe('detect', () => {
    it('should return empty array when no changes', () => {
      const oldSpec = createSpec({
        '/users': { get: { responses: { 200: { description: 'OK' } } } },
      });
      const newSpec = createSpec({
        '/users': { get: { responses: { 200: { description: 'OK' } } } },
      });

      const detector = new BreakingChangeDetector();
      const changes = detector.detect(oldSpec, newSpec);

      expect(changes).toHaveLength(0);
    });

    it('should detect removed endpoint', () => {
      const oldSpec = createSpec({
        '/users': { get: { responses: { 200: { description: 'OK' } } } },
      });
      const newSpec = createSpec({});

      const detector = new BreakingChangeDetector();
      const changes = detector.detect(oldSpec, newSpec);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('ENDPOINT_REMOVED');
      expect(changes[0].severity).toBe('error');
    });

    it('should detect removed HTTP method', () => {
      const oldSpec = createSpec({
        '/users': { get: { responses: { 200: { description: 'OK' } } } },
      });
      const newSpec = createSpec({
        '/users': {},
      });

      const detector = new BreakingChangeDetector();
      const changes = detector.detect(oldSpec, newSpec);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('ENDPOINT_REMOVED');
    });

    it('should detect removed schema', () => {
      const oldSpec = createSpec({}, { User: { type: 'object' } });
      const newSpec = createSpec({}, {});

      const detector = new BreakingChangeDetector();
      const changes = detector.detect(oldSpec, newSpec);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('SCHEMA_REMOVED');
    });

    it('should detect removed schema property', () => {
      const oldSpec = createSpec({}, {
        User: {
          type: 'object',
          properties: { id: { type: 'string' }, name: { type: 'string' } },
        },
      });
      const newSpec = createSpec({}, {
        User: {
          type: 'object',
          properties: { id: { type: 'string' } },
        },
      });

      const detector = new BreakingChangeDetector();
      const changes = detector.detect(oldSpec, newSpec);

      expect(changes.some(c => c.type === 'RESPONSE_FIELD_REMOVED')).toBe(true);
    });

    it('should detect schema property type change', () => {
      const oldSpec = createSpec({}, {
        User: {
          type: 'object',
          properties: { id: { type: 'string' } },
        },
      });
      const newSpec = createSpec({}, {
        User: {
          type: 'object',
          properties: { id: { type: 'number' } },
        },
      });

      const detector = new BreakingChangeDetector();
      const changes = detector.detect(oldSpec, newSpec);

      expect(changes.some(c => c.type === 'RESPONSE_FIELD_TYPE_CHANGED')).toBe(true);
    });

    it('should detect new required parameter', () => {
      const oldSpec = createSpec({
        '/users': {
          get: {
            parameters: [],
            responses: { 200: { description: 'OK' } },
          },
        },
      });
      const newSpec = createSpec({
        '/users': {
          get: {
            parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string' } }],
            responses: { 200: { description: 'OK' } },
          },
        },
      });

      const detector = new BreakingChangeDetector();
      const changes = detector.detect(oldSpec, newSpec);

      expect(changes.some(c => c.type === 'REQUIRED_PARAM_ADDED')).toBe(true);
    });
  });

  describe('isBreaking', () => {
    it('should return false for empty changes', () => {
      const detector = new BreakingChangeDetector();
      expect(detector.isBreaking([])).toBe(false);
    });

    it('should return true when there are error severity changes', () => {
      const detector = new BreakingChangeDetector();
      expect(detector.isBreaking([{ type: 'ENDPOINT_REMOVED', severity: 'error', message: 'test', path: '/test' }])).toBe(true);
    });

    it('should return false for warning/info in non-strict mode', () => {
      const detector = new BreakingChangeDetector({ strict: false });
      expect(detector.isBreaking([{ type: 'ENDPOINT_REMOVED', severity: 'warning', message: 'test', path: '/test' }])).toBe(false);
    });

    it('should return true for any change in strict mode', () => {
      const detector = new BreakingChangeDetector({ strict: true });
      expect(detector.isBreaking([{ type: 'ENDPOINT_REMOVED', severity: 'warning', message: 'test', path: '/test' }])).toBe(true);
    });
  });

  describe('generateReport', () => {
    it('should generate report with no changes', () => {
      const detector = new BreakingChangeDetector();
      const report = detector.generateReport([]);
      expect(report).toContain('未检测到破坏性变更');
    });

    it('should generate report with errors', () => {
      const detector = new BreakingChangeDetector();
      const changes = [
        { type: 'ENDPOINT_REMOVED' as const, severity: 'error' as const, message: 'Removed', path: '/test' },
      ];
      const report = detector.generateReport(changes);
      expect(report).toContain('Errors');
      expect(report).toContain('ENDPOINT_REMOVED');
    });
  });

  describe('ignorePaths', () => {
    it('should ignore specified paths', () => {
      const oldSpec = createSpec({
        '/test': { get: { responses: { 200: { description: 'OK' } } } },
        '/ignore': { get: { responses: { 200: { description: 'OK' } } } },
      });
      const newSpec = createSpec({
        '/test': {},
        '/ignore': {},
      });

      const detector = new BreakingChangeDetector({ ignorePaths: ['/ignore'] });
      const changes = detector.detect(oldSpec, newSpec);

      expect(changes).toHaveLength(1);
      expect(changes[0].path).toContain('/test');
    });
  });

  describe('customRules', () => {
    it('should execute custom rules', () => {
      const customRule = jest.fn().mockReturnValue([
        { type: 'ENDPOINT_REMOVED' as const, severity: 'error' as const, message: 'Custom', path: '/custom' },
      ]);
      
      const oldSpec = createSpec({});
      const newSpec = createSpec({});
      
      const detector = new BreakingChangeDetector({ customRules: customRule });
      detector.detect(oldSpec, newSpec);
      
      expect(customRule).toHaveBeenCalledWith(oldSpec, newSpec);
    });
  });
});
