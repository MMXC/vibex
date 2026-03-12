/**
 * Confirmation Store Tests - Extended
 */

import { useConfirmationStore } from '../stores/confirmationStore';
import type { BoundedContext, DomainModel, BusinessFlow, ConfirmationSnapshot } from '../stores/confirmationStore';

describe('Confirmation Store - Extended', () => {
  beforeEach(() => {
    useConfirmationStore.getState().reset();
  });

  describe('step navigation', () => {
    it('goToNextStep advances to next step', () => {
      const { goToNextStep } = useConfirmationStore.getState();
      expect(useConfirmationStore.getState().currentStep).toBe('input');
      
      goToNextStep();
      expect(useConfirmationStore.getState().currentStep).toBe('context');
      
      goToNextStep();
      expect(useConfirmationStore.getState().currentStep).toBe('model');
    });

    it('goToNextStep stays at last step', () => {
      const { goToNextStep, setCurrentStep } = useConfirmationStore.getState();
      setCurrentStep('success');
      goToNextStep();
      expect(useConfirmationStore.getState().currentStep).toBe('success');
    });

    it('goToPreviousStep returns to previous step', () => {
      const { goToNextStep, goToPreviousStep } = useConfirmationStore.getState();
      goToNextStep();
      goToNextStep();
      expect(useConfirmationStore.getState().currentStep).toBe('model');
      
      goToPreviousStep();
      expect(useConfirmationStore.getState().currentStep).toBe('context');
    });

    it('goToPreviousStep stays at first step', () => {
      const { goToPreviousStep } = useConfirmationStore.getState();
      expect(useConfirmationStore.getState().currentStep).toBe('input');
      
      goToPreviousStep();
      expect(useConfirmationStore.getState().currentStep).toBe('input');
    });
  });

  describe('selected context IDs', () => {
    it('setSelectedContextIds updates selected IDs', () => {
      const { setSelectedContextIds } = useConfirmationStore.getState();
      setSelectedContextIds(['1', '2', '3']);
      expect(useConfirmationStore.getState().selectedContextIds).toEqual(['1', '2', '3']);
    });
  });

  describe('undo/redo', () => {
    it('saveSnapshot saves current state to history', () => {
      const { setRequirementText, saveSnapshot } = useConfirmationStore.getState();
      setRequirementText('Initial text');
      saveSnapshot();
      
      setRequirementText('Modified text');
      saveSnapshot();
      
      expect(useConfirmationStore.getState().history.length).toBe(2);
      expect(useConfirmationStore.getState().historyIndex).toBe(1);
    });

    it('undo reverts to previous state', () => {
      const { setRequirementText, saveSnapshot, undo } = useConfirmationStore.getState();
      
      setRequirementText('Text 1');
      saveSnapshot();
      
      setRequirementText('Text 2');
      saveSnapshot();
      
      expect(useConfirmationStore.getState().requirementText).toBe('Text 2');
      
      undo();
      expect(useConfirmationStore.getState().requirementText).toBe('Text 1');
    });

    it('redo restores next state', () => {
      const { setRequirementText, saveSnapshot, undo, redo } = useConfirmationStore.getState();
      
      setRequirementText('Text 1');
      saveSnapshot();
      
      setRequirementText('Text 2');
      saveSnapshot();
      
      undo();
      expect(useConfirmationStore.getState().requirementText).toBe('Text 1');
      
      redo();
      expect(useConfirmationStore.getState().requirementText).toBe('Text 2');
    });

    it('canUndo returns true when history available', () => {
      const { setRequirementText, saveSnapshot, canUndo } = useConfirmationStore.getState();
      
      expect(canUndo()).toBe(false);
      
      setRequirementText('Text');
      saveSnapshot();
      
      expect(canUndo()).toBe(false); // historyIndex starts at -1
      
      setRequirementText('Text 2');
      saveSnapshot();
      
      expect(canUndo()).toBe(true);
    });

    it('canRedo returns true when redo available', () => {
      const { setRequirementText, saveSnapshot, undo, canRedo } = useConfirmationStore.getState();
      
      setRequirementText('Text 1');
      saveSnapshot();
      
      setRequirementText('Text 2');
      saveSnapshot();
      
      expect(canRedo()).toBe(false);
      
      undo();
      
      expect(canRedo()).toBe(true);
    });

    it('undo does nothing at start of history', () => {
      const { undo, setRequirementText, saveSnapshot } = useConfirmationStore.getState();
      
      setRequirementText('Text');
      saveSnapshot();
      
      undo();
      expect(useConfirmationStore.getState().requirementText).toBe('Text');
    });

    it('redo does nothing at end of history', () => {
      const { redo, setRequirementText, saveSnapshot } = useConfirmationStore.getState();
      
      setRequirementText('Text');
      saveSnapshot();
      
      redo();
      expect(useConfirmationStore.getState().requirementText).toBe('Text');
    });
  });

  describe('history limit', () => {
    it('keeps only last 20 snapshots (PRD requirement)', () => {
      const { setRequirementText, saveSnapshot } = useConfirmationStore.getState();
      
      for (let i = 0; i < 30; i++) {
        setRequirementText(`Text ${i}`);
        saveSnapshot();
      }
      
      expect(useConfirmationStore.getState().history.length).toBe(20);
    });
  });

  describe('complete flow', () => {
    it('handles full confirmation flow', () => {
      const state = useConfirmationStore.getState();
      
      // Step 1: Input
      state.setRequirementText('Build a user management system');
      state.goToNextStep();
      
      // Step 2: Context
      state.setBoundedContexts([{
        id: '1',
        name: 'User Context',
        description: 'Manages users',
        type: 'core',
        relationships: [],
      }]);
      state.setSelectedContextIds(['1']);
      state.goToNextStep();
      
      // Step 3: Model
      state.setDomainModels([{
        id: '1',
        name: 'User',
        contextId: '1',
        type: 'aggregate_root',
        properties: [],
        methods: [],
      }]);
      state.goToNextStep();
      
      // Step 4: Flow
      state.setBusinessFlow({
        id: '1',
        name: 'User Flow',
        states: [],
        transitions: [],
      });
      state.goToNextStep();
      
      // Step 5: Success
      expect(useConfirmationStore.getState().currentStep).toBe('success');
      state.setCreatedProjectId('project-123');
      expect(useConfirmationStore.getState().createdProjectId).toBe('project-123');
    });
  });
});
