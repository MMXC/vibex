/**
 * Confirmation Store Tests
 */

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
    setCurrentStep('bounded-context');
    expect(useConfirmationStore.getState().currentStep).toBe('bounded-context');
  });

  it('should set requirement text', () => {
    const { setRequirementText } = useConfirmationStore.getState();
    setRequirementText('Test');
    expect(useConfirmationStore.getState().requirementText).toBe('Test');
  });

  it('should add clarification round', () => {
    const { addClarificationRound } = useConfirmationStore.getState();
    addClarificationRound({
      id: '1',
      question: 'Test question?',
      answer: 'Test answer',
      timestamp: Date.now(),
      isAccepted: false,
    });
    expect(useConfirmationStore.getState().clarificationRounds.length).toBe(1);
  });

  it('should add bounded context', () => {
    const { addBoundedContext } = useConfirmationStore.getState();
    addBoundedContext({
      id: '1',
      name: 'Test',
      description: 'Test',
    });
    expect(useConfirmationStore.getState().boundedContexts.length).toBe(1);
  });

  it('should add domain entity', () => {
    const { addDomainEntity } = useConfirmationStore.getState();
    addDomainEntity({
      id: '1',
      name: 'User',
      type: 'aggregate',
    });
    expect(useConfirmationStore.getState().domainEntities.length).toBe(1);
  });

  it('should add business flow', () => {
    const { addBusinessFlow } = useConfirmationStore.getState();
    addBusinessFlow({
      id: '1',
      name: 'Flow',
      steps: [],
    });
    expect(useConfirmationStore.getState().businessFlows.length).toBe(1);
  });

  it('should add UI page', () => {
    const { addUIPage } = useConfirmationStore.getState();
    addUIPage({
      id: '1',
      name: 'Page',
      route: '/',
      components: [],
    });
    expect(useConfirmationStore.getState().uiPages.length).toBe(1);
  });

  it('should set domain model', () => {
    const { setDomainModel } = useConfirmationStore.getState();
    setDomainModel({ entities: [], relationships: [] } as any);
    expect(useConfirmationStore.getState().domainModel).toBeDefined();
  });

  it('should set clarification accepted', () => {
    const { setClarificationAccepted } = useConfirmationStore.getState();
    setClarificationAccepted(true);
    expect(useConfirmationStore.getState().isClarificationAccepted).toBe(true);
  });

  it('should reset state', () => {
    const { setRequirementText, reset } = useConfirmationStore.getState();
    setRequirementText('Test');
    reset();
    expect(useConfirmationStore.getState().requirementText).toBe('');
  });
});
