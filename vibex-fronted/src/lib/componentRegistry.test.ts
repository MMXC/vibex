/**
 * Component Registry Tests
 */

import { componentRegistry } from './componentRegistry';

describe('componentRegistry', () => {
  beforeEach(() => {
    // Get the internal registry and clear it
    const all = componentRegistry.getAll();
    all.forEach(c => {
      // We can't really clear the internal registry, so just note this
    });
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
});
