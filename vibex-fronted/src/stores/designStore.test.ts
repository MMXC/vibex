/**
 * Design Store Tests
 */

import { useDesignStore } from '../stores/designStore';

describe('Design Store', () => {
  beforeEach(() => {
    useDesignStore.getState().reset();
  });

  it('should have initial state', () => {
    const state = useDesignStore.getState();
    expect(state.currentStep).toBeDefined();
  });

  it('should set current step', () => {
    const { setCurrentStep } = useDesignStore.getState();
    setCurrentStep('bounded-context');
    expect(useDesignStore.getState().currentStep).toBe('bounded-context');
  });

  it('should set requirement text', () => {
    const { setRequirementText } = useDesignStore.getState();
    setRequirementText('Test requirement');
    expect(useDesignStore.getState().requirementText).toBe('Test requirement');
  });

  it('should add domain entity', () => {
    const { addDomainEntity } = useDesignStore.getState();
    addDomainEntity({
      id: '1',
      name: 'User',
      type: 'aggregate',
      attributes: [],
      relationships: [],
    });
    expect(useDesignStore.getState().domainEntities.length).toBe(1);
  });

  it('should set bounded contexts', () => {
    const { setBoundedContexts } = useDesignStore.getState();
    setBoundedContexts([{ id: '1', name: 'Test', description: 'Test' }]);
    expect(useDesignStore.getState().boundedContexts.length).toBe(1);
  });

  it('should add business flow', () => {
    const { addBusinessFlow } = useDesignStore.getState();
    addBusinessFlow({
      id: '1',
      name: 'User Registration',
      steps: [],
    });
    expect(useDesignStore.getState().businessFlows.length).toBe(1);
  });

  it('should add UI page', () => {
    const { addUIPage } = useDesignStore.getState();
    addUIPage({
      id: '1',
      name: 'Login',
      route: '/login',
      components: [],
    });
    expect(useDesignStore.getState().uiPages.length).toBe(1);
  });

  it('should set loading', () => {
    const { setLoading } = useDesignStore.getState();
    setLoading(true);
    expect(useDesignStore.getState().isLoading).toBe(true);
  });

  it('should set error', () => {
    const { setError } = useDesignStore.getState();
    setError('Test error');
    expect(useDesignStore.getState().error).toBe('Test error');
  });

  it('should reset state', () => {
    const { setRequirementText, reset } = useDesignStore.getState();
    setRequirementText('Test');
    reset();
    expect(useDesignStore.getState().requirementText).toBe('');
  });
});
