import { useDesignStore, type DesignStep, type ClarificationRound, type DomainEntity, type BusinessFlow, type UIPage, type PrototypeData } from '../stores/designStore';

describe('designStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useDesignStore.getState().reset();
  });

  describe('initial state', () => {
    it('has correct initial values', () => {
      const state = useDesignStore.getState();
      expect(state.currentStep).toBe('clarification');
      expect(state.stepHistory).toEqual([]);
      expect(state.sessionId).toBeNull();
      expect(state.projectId).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.requirementText).toBe('');
      expect(state.clarificationRounds).toEqual([]);
      expect(state.boundedContexts).toEqual([]);
      expect(state.domainEntities).toEqual([]);
      expect(state.businessFlows).toEqual([]);
      expect(state.uiPages).toEqual([]);
      expect(state.prototype).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('navigation', () => {
    it('setCurrentStep updates step and adds to history', () => {
      const { setCurrentStep } = useDesignStore.getState();
      setCurrentStep('bounded-context');
      
      const state = useDesignStore.getState();
      expect(state.currentStep).toBe('bounded-context');
      expect(state.stepHistory).toContain('clarification');
    });

    it('goBack returns to previous step', () => {
      const { setCurrentStep, goBack } = useDesignStore.getState();
      setCurrentStep('bounded-context');
      setCurrentStep('domain-model');
      goBack();
      
      expect(useDesignStore.getState().currentStep).toBe('bounded-context');
    });

    it('goBack does nothing when no history', () => {
      const { goBack } = useDesignStore.getState();
      goBack();
      
      expect(useDesignStore.getState().currentStep).toBe('clarification');
    });

    it('goForward advances to next step', () => {
      const { goForward } = useDesignStore.getState();
      goForward();
      
      expect(useDesignStore.getState().currentStep).toBe('bounded-context');
    });

    it('goForward does nothing at last step', () => {
      const { setCurrentStep, goForward } = useDesignStore.getState();
      setCurrentStep('prototype');
      goForward();
      
      expect(useDesignStore.getState().currentStep).toBe('prototype');
    });
  });

  describe('requirement text', () => {
    it('setRequirementText updates requirement', () => {
      const { setRequirementText } = useDesignStore.getState();
      setRequirementText('Test requirement');
      
      expect(useDesignStore.getState().requirementText).toBe('Test requirement');
    });
  });

  describe('clarification rounds', () => {
    it('addClarificationRound adds a round', () => {
      const { addClarificationRound } = useDesignStore.getState();
      const round: ClarificationRound = {
        id: '1',
        question: 'What is X?',
        answer: 'It is Y',
        timestamp: Date.now(),
        isAccepted: false,
      };
      addClarificationRound(round);
      
      expect(useDesignStore.getState().clarificationRounds).toHaveLength(1);
      expect(useDesignStore.getState().clarificationRounds[0].question).toBe('What is X?');
    });

    it('acceptClarification marks round as accepted', () => {
      const { addClarificationRound, acceptClarification } = useDesignStore.getState();
      const round: ClarificationRound = {
        id: '1',
        question: 'What is X?',
        answer: 'It is Y',
        timestamp: Date.now(),
        isAccepted: false,
      };
      addClarificationRound(round);
      acceptClarification('1');
      
      expect(useDesignStore.getState().clarificationRounds[0].isAccepted).toBe(true);
    });
  });

  describe('bounded contexts', () => {
    it('setBoundedContexts updates contexts', () => {
      const { setBoundedContexts } = useDesignStore.getState();
      const contexts = [
        { id: '1', name: 'Context 1', description: 'Desc 1' },
        { id: '2', name: 'Context 2', description: 'Desc 2' },
      ];
      setBoundedContexts(contexts);
      
      expect(useDesignStore.getState().boundedContexts).toEqual(contexts);
    });
  });

  describe('domain entities', () => {
    it('setDomainEntities updates entities', () => {
      const { setDomainEntities } = useDesignStore.getState();
      const entities: DomainEntity[] = [
        {
          id: '1',
          name: 'User',
          type: 'aggregate',
          attributes: [],
          relationships: [],
        },
      ];
      setDomainEntities(entities);
      
      expect(useDesignStore.getState().domainEntities).toEqual(entities);
    });

    it('addDomainEntity adds entity', () => {
      const { addDomainEntity } = useDesignStore.getState();
      const entity: DomainEntity = {
        id: '1',
        name: 'User',
        type: 'aggregate',
        attributes: [],
        relationships: [],
      };
      addDomainEntity(entity);
      
      expect(useDesignStore.getState().domainEntities).toHaveLength(1);
    });

    it('updateDomainEntity updates existing entity', () => {
      const { addDomainEntity, updateDomainEntity } = useDesignStore.getState();
      const entity: DomainEntity = {
        id: '1',
        name: 'User',
        type: 'aggregate',
        attributes: [],
        relationships: [],
      };
      addDomainEntity(entity);
      updateDomainEntity('1', { name: 'Updated User' });
      
      expect(useDesignStore.getState().domainEntities[0].name).toBe('Updated User');
    });

    it('deleteDomainEntity removes entity', () => {
      const { addDomainEntity, deleteDomainEntity } = useDesignStore.getState();
      const entity: DomainEntity = {
        id: '1',
        name: 'User',
        type: 'aggregate',
        attributes: [],
        relationships: [],
      };
      addDomainEntity(entity);
      deleteDomainEntity('1');
      
      expect(useDesignStore.getState().domainEntities).toHaveLength(0);
    });
  });

  describe('business flows', () => {
    it('setBusinessFlows updates flows', () => {
      const { setBusinessFlows } = useDesignStore.getState();
      const flows: BusinessFlow[] = [
        { id: '1', name: 'Flow 1', steps: [] },
      ];
      setBusinessFlows(flows);
      
      expect(useDesignStore.getState().businessFlows).toEqual(flows);
    });

    it('addBusinessFlow adds flow', () => {
      const { addBusinessFlow } = useDesignStore.getState();
      const flow: BusinessFlow = { id: '1', name: 'Flow 1', steps: [] };
      addBusinessFlow(flow);
      
      expect(useDesignStore.getState().businessFlows).toHaveLength(1);
    });

    it('updateBusinessFlow updates existing flow', () => {
      const { addBusinessFlow, updateBusinessFlow } = useDesignStore.getState();
      const flow: BusinessFlow = { id: '1', name: 'Flow 1', steps: [] };
      addBusinessFlow(flow);
      updateBusinessFlow('1', { name: 'Updated Flow' });
      
      expect(useDesignStore.getState().businessFlows[0].name).toBe('Updated Flow');
    });
  });

  describe('UI pages', () => {
    it('setUIPages updates pages', () => {
      const { setUIPages } = useDesignStore.getState();
      const pages: UIPage[] = [
        { id: '1', name: 'Page 1', route: '/page1', components: [], layout: {} },
      ];
      setUIPages(pages);
      
      expect(useDesignStore.getState().uiPages).toEqual(pages);
    });

    it('addUIPage adds page', () => {
      const { addUIPage } = useDesignStore.getState();
      const page: UIPage = { id: '1', name: 'Page 1', route: '/page1', components: [], layout: {} };
      addUIPage(page);
      
      expect(useDesignStore.getState().uiPages).toHaveLength(1);
    });

    it('updateUIPage updates existing page', () => {
      const { addUIPage, updateUIPage } = useDesignStore.getState();
      const page: UIPage = { id: '1', name: 'Page 1', route: '/page1', components: [], layout: {} };
      addUIPage(page);
      updateUIPage('1', { name: 'Updated Page' });
      
      expect(useDesignStore.getState().uiPages[0].name).toBe('Updated Page');
    });
  });

  describe('prototype', () => {
    it('setPrototype updates prototype', () => {
      const { setPrototype } = useDesignStore.getState();
      const prototype: PrototypeData = {
        id: '1',
        pages: [],
        theme: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setPrototype(prototype);
      
      expect(useDesignStore.getState().prototype).toEqual(prototype);
    });
  });

  describe('session', () => {
    it('setSession updates session info', () => {
      const { setSession } = useDesignStore.getState();
      setSession('session-1', 'project-1', 'user-1');
      
      const state = useDesignStore.getState();
      expect(state.sessionId).toBe('session-1');
      expect(state.projectId).toBe('project-1');
      expect(state.userId).toBe('user-1');
    });
  });

  describe('reset', () => {
    it('reset restores initial state', () => {
      const { setCurrentStep, setRequirementText, reset } = useDesignStore.getState();
      setCurrentStep('prototype');
      setRequirementText('Some requirement');
      reset();
      
      const state = useDesignStore.getState();
      expect(state.currentStep).toBe('clarification');
      expect(state.requirementText).toBe('');
    });
  });

  describe('UI state', () => {
    it('setLoading updates loading state', () => {
      const { setLoading } = useDesignStore.getState();
      setLoading(true);
      
      expect(useDesignStore.getState().isLoading).toBe(true);
    });

    it('setError updates error state', () => {
      const { setError } = useDesignStore.getState();
      setError('Something went wrong');
      
      expect(useDesignStore.getState().error).toBe('Something went wrong');
    });
  });

  describe('selectors', () => {
    it('selectCurrentStep returns current step', () => {
      const { setCurrentStep } = useDesignStore.getState();
      setCurrentStep('domain-model');
      
      const state = useDesignStore.getState();
      expect(state.currentStep).toBe('domain-model');
    });

    it('selectRequirementText returns requirement text', () => {
      const { setRequirementText } = useDesignStore.getState();
      setRequirementText('Test requirement');
      
      expect(useDesignStore.getState().requirementText).toBe('Test requirement');
    });
  });
});
