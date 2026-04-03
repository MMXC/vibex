/**
 * Confirmation Store Tests
 */
// @ts-nocheck


import { useConfirmationStore } from '../stores/confirmationStore';

describe('Confirmation Store', () => {
  beforeEach(() => {
    useConfirmationStore.getState().reset();
  });

  it('should have initial state', () => {
    const state = useConfirmationStore.getState();
    expect(state.currentStep).toBeDefined();
  });

  it('should set current step', () => {
    const { setCurrentStep } = useConfirmationStore.getState();
    setCurrentStep('context');
    expect(useConfirmationStore.getState().currentStep).toBe('context');
  });

  it('should set requirement text', () => {
    const { setRequirementText } = useConfirmationStore.getState();
    setRequirementText('Test');
    expect(useConfirmationStore.getState().requirementText).toBe('Test');
  });

  it('should set bounded contexts', () => {
    const { setBoundedContexts } = useConfirmationStore.getState();
    setBoundedContexts([{
      id: '1',
      name: 'Test',
      description: 'Test',
      type: 'core' as const,
      relationships: [],
    }]);
    expect(useConfirmationStore.getState().boundedContexts.length).toBe(1);
  });

  it('should set domain models', () => {
    const { setDomainModels } = useConfirmationStore.getState();
    setDomainModels([{
      id: '1',
      name: 'User',
      contextId: '1',
      type: 'aggregate_root' as const,
      properties: [],
      methods: [],
    }]);
    expect(useConfirmationStore.getState().domainModels.length).toBe(1);
  });

  it('should set business flow', () => {
    const { setBusinessFlow } = useConfirmationStore.getState();
    setBusinessFlow({
      id: '1',
      name: 'Flow',
      states: [],
      transitions: [],
    });
    expect(useConfirmationStore.getState().businessFlow).toBeDefined();
  });

  it('should set context mermaid code', () => {
    const { setContextMermaidCode } = useConfirmationStore.getState();
    setContextMermaidCode('graph TD;');
    expect(useConfirmationStore.getState().contextMermaidCode).toBe('graph TD;');
  });

  it('should set model mermaid code', () => {
    const { setModelMermaidCode } = useConfirmationStore.getState();
    setModelMermaidCode('classDiagram;');
    expect(useConfirmationStore.getState().modelMermaidCode).toBe('classDiagram;');
  });

  it('should set flow mermaid code', () => {
    const { setFlowMermaidCode } = useConfirmationStore.getState();
    setFlowMermaidCode('stateDiagram-v2;');
    expect(useConfirmationStore.getState().flowMermaidCode).toBe('stateDiagram-v2;');
  });

  it('should set created project id', () => {
    const { setCreatedProjectId } = useConfirmationStore.getState();
    setCreatedProjectId('123');
    expect(useConfirmationStore.getState().createdProjectId).toBe('123');
  });

  it('should reset state', () => {
    const { setRequirementText, reset } = useConfirmationStore.getState();
    setRequirementText('Test');
    reset();
    expect(useConfirmationStore.getState().requirementText).toBe('');
  });
});
