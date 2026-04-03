/**
 * Component Registry Tests
 */
// @ts-nocheck


import { componentRegistry, registerComponent } from './componentRegistry';

describe('componentRegistry', () => {
  beforeEach(() => {
    // Clear any test components from previous runs
  });

  it('registers a component', () => {
    componentRegistry.register('TestComponent', {
      status: 'integrated',
      since: '2026-03-11',
    });
    
    const component = componentRegistry.get('TestComponent');
    expect(component).toBeDefined();
    expect(component?.name).toBe('TestComponent');
    expect(component?.status).toBe('integrated');
  });

  it('returns undefined for non-existent component', () => {
    const component = componentRegistry.get('NonExistentComponentXYZ');
    expect(component).toBeUndefined();
  });

  it('gets all registered components', () => {
    componentRegistry.register('Component1Test', { status: 'integrated' });
    componentRegistry.register('Component2Test', { status: 'pending' });
    
    const all = componentRegistry.getAll();
    const testComponents = all.filter(c => c.name.includes('Test'));
    expect(testComponents.length).toBeGreaterThanOrEqual(2);
  });

  it('filters unintegrated components', () => {
    componentRegistry.register('PendingTest1', { status: 'pending' });
    componentRegistry.register('DeprecatedTest1', { status: 'deprecated' });
    
    const unintegrated = componentRegistry.getUnintegrated();
    expect(unintegrated.length).toBeGreaterThan(0);
  });

  it('verifies registry status', () => {
    componentRegistry.register('GoodComponentTest', { status: 'integrated' });
    
    const result = componentRegistry.verify();
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('issues');
  });

  it('stores component metadata', () => {
    componentRegistry.register('MetaComponent', { 
      status: 'integrated',
      since: '2026-03-11',
      integratedIn: 'Test Suite',
      notes: 'Test notes',
    });
    
    const component = componentRegistry.get('MetaComponent');
    expect(component?.since).toBe('2026-03-11');
    expect(component?.integratedIn).toBe('Test Suite');
    expect(component?.notes).toBe('Test notes');
  });

  it('handles deprecated status', () => {
    componentRegistry.register('DeprecatedComponent', { 
      status: 'deprecated',
      notes: 'Replaced by NewComponent',
    });
    
    const component = componentRegistry.get('DeprecatedComponent');
    expect(component?.status).toBe('deprecated');
  });

  it('can update component registration', () => {
    componentRegistry.register('UpdateableComponent', { status: 'pending' });
    expect(componentRegistry.get('UpdateableComponent')?.status).toBe('pending');
    
    componentRegistry.register('UpdateableComponent', { status: 'integrated' });
    expect(componentRegistry.get('UpdateableComponent')?.status).toBe('integrated');
  });

  it('verifies with issues when pending components exist', () => {
    componentRegistry.register('PendingForVerify', { status: 'pending' });
    
    const result = componentRegistry.verify();
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

describe('registerComponent helper', () => {
  it('should register a component', () => {
    registerComponent('HelperComponent', { status: 'integrated' });
    
    const component = componentRegistry.get('HelperComponent');
    expect(component).toBeDefined();
  });
});