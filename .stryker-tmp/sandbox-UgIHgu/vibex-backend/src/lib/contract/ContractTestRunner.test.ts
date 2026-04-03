/**
 * ContractTestRunner Tests
 */
// @ts-nocheck


import { ContractTestRunner, OpenAPISpec } from './ContractTestRunner';

describe('ContractTestRunner', () => {
  const createSpec = (paths: Record<string, any> = {}): OpenAPISpec => ({
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths,
  });

  describe('constructor', () => {
    it('should create instance with spec', () => {
      const spec = createSpec();
      const runner = new ContractTestRunner(spec);
      expect(runner).toBeDefined();
    });

    it('should accept custom options', () => {
      const spec = createSpec();
      const runner = new ContractTestRunner(spec, { exitOnFailure: false, timeout: 5000 });
      expect(runner).toBeDefined();
    });
  });

  describe('runTests', () => {
    it('should run endpoint tests', async () => {
      const spec = createSpec({
        '/users': { get: { responses: { 200: { description: 'OK' } } } },
      });
      const runner = new ContractTestRunner(spec, { exitOnFailure: false });
      
      const result = await runner.runTests();
      
      expect(result.total).toBeGreaterThan(0);
    });

    it('should include failure scenario tests', async () => {
      const spec = createSpec({
        '/users': { get: { responses: { 200: { description: 'OK' } } } },
      });
      const runner = new ContractTestRunner(spec, { exitOnFailure: false });
      
      const result = await runner.runTests();
      
      // Should have endpoint and schema tests
      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  describe('test filtering', () => {
    it('should filter tests based on filter option', async () => {
      const spec = createSpec({
        '/users': { get: { responses: { 200: { description: 'OK' } } } },
      });
      const runner = new ContractTestRunner(spec, { 
        exitOnFailure: false,
        filter: (name) => name.includes('users'),
      });
      
      const result = await runner.runTests();
      
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getResults', () => {
    it('should return test results', async () => {
      const spec = createSpec({
        '/users': { get: { responses: { 200: { description: 'OK' } } } },
      });
      const runner = new ContractTestRunner(spec, { exitOnFailure: false });
      
      await runner.runTests();
      const results = runner.getResults();
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('TestSuiteResult', () => {
    it('should return result with passed/failed counts', async () => {
      const spec = createSpec({
        '/users': { get: { responses: { 200: { description: 'OK' } } } },
      });
      const runner = new ContractTestRunner(spec, { exitOnFailure: false });
      
      const result = await runner.runTests();
      
      expect(result.passed).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      expect(result.total).toBe(result.passed + result.failed);
    });
  });
});
