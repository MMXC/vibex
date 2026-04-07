/**
 * OpenAPIGenerator Tests
 */
// @ts-nocheck


import { OpenAPIGenerator, OpenAPISpec } from './OpenAPIGenerator';

describe('OpenAPIGenerator', () => {
  describe('constructor', () => {
    it('should create instance with default options', () => {
      const generator = new OpenAPIGenerator();
      expect(generator).toBeDefined();
    });

    it('should create instance with custom title and version', () => {
      const generator = new OpenAPIGenerator({ title: 'Custom API', version: '2.0.0' });
      expect(generator).toBeDefined();
    });
  });

  describe('generate', () => {
    it('should generate spec with openapi version', () => {
      const generator = new OpenAPIGenerator();
      const routes = [
        { path: '/users', method: 'get', handler: () => {} },
      ];
      
      const spec = generator.generate(routes);
      
      expect(spec.openapi).toMatch(/3\.0\.\d+/);
      expect(spec.info.title).toBe('VibeX API');
    });

    it('should process multiple routes', () => {
      const generator = new OpenAPIGenerator();
      const routes = [
        { path: '/users', method: 'get', handler: () => {} },
        { path: '/users/:id', method: 'get', handler: () => {} },
        { path: '/users', method: 'post', handler: () => {} },
      ];
      
      const spec = generator.generate(routes);
      
      expect(Object.keys(spec.paths)).toContain('/users');
      expect(Object.keys(spec.paths)).toContain('/users/{id}');
      expect(spec.paths['/users'].get).toBeDefined();
      expect(spec.paths['/users'].post).toBeDefined();
    });

    it('should convert path params (:param to {param})', () => {
      const generator = new OpenAPIGenerator();
      const routes = [
        { path: '/users/:id', method: 'get', handler: () => {} },
      ];
      
      const spec = generator.generate(routes);
      
      expect(spec.paths['/users/{id}']).toBeDefined();
    });

    it('should add summary to operation', () => {
      const generator = new OpenAPIGenerator();
      const routes = [
        { path: '/users', method: 'get', handler: () => {} },
      ];
      
      const spec = generator.generate(routes);
      
      expect(spec.paths['/users'].get.summary).toBeDefined();
    });

    it('should include HTTP method in operation', () => {
      const generator = new OpenAPIGenerator();
      const routes = [
        { path: '/users', method: 'get', handler: () => {} },
      ];
      
      const spec = generator.generate(routes);
      
      expect(spec.paths['/users'].get).toBeDefined();
    });
  });

  describe('writeFile', () => {
    it('should have writeFile method', () => {
      const generator = new OpenAPIGenerator();
      expect(typeof generator.writeFile).toBe('function');
    });
  });

  describe('getSpec', () => {
    it('should return generated spec', () => {
      const generator = new OpenAPIGenerator();
      const routes = [
        { path: '/users', method: 'get', handler: () => {} },
      ];
      
      generator.generate(routes);
      const spec = generator.getSpec();
      
      expect(spec.paths['/users']).toBeDefined();
    });
  });

  describe('servers', () => {
    it('should add servers to spec', () => {
      const generator = new OpenAPIGenerator({ servers: [{ url: 'https://api.example.com' }] });
      const routes = [{ path: '/users', method: 'get', handler: () => {} }];
      
      const spec = generator.generate(routes);
      
      expect(spec.servers).toHaveLength(1);
      expect(spec.servers?.[0].url).toBe('https://api.example.com');
    });
  });
});
