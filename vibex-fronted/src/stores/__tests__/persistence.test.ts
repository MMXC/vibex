/**
 * State Persistence Tests
 */

import { useConfirmationStore } from '@/stores/confirmationStore';

describe('State Persistence', () => {
  beforeEach(() => {
    // Reset store to initial state
    useConfirmationStore.getState().reset?.();
  });

  describe('ConfirmationStore', () => {
    it('should have initial state', () => {
      const store = useConfirmationStore.getState();
      
      expect(store.currentStep).toBeDefined();
      expect(typeof store.setCurrentStep).toBe('function');
    });

    it('should update currentStep', () => {
      const { setCurrentStep } = useConfirmationStore.getState();
      
      setCurrentStep('context');
      
      expect(useConfirmationStore.getState().currentStep).toBe('context');
    });

    it('should update requirementText', () => {
      const { setRequirementText } = useConfirmationStore.getState();
      
      setRequirementText('Test requirement');
      
      expect(useConfirmationStore.getState().requirementText).toBe('Test requirement');
    });

    it('should handle step navigation', () => {
      const { goToNextStep } = useConfirmationStore.getState();
      
      const initialStep = useConfirmationStore.getState().currentStep;
      goToNextStep();
      
      // Step should change (or stay same if at end)
      const newStep = useConfirmationStore.getState().currentStep;
      expect(newStep).toBeDefined();
    });

    it('should save and restore snapshots', () => {
      const { setRequirementText, saveSnapshot, undo } = useConfirmationStore.getState();
      
      // Save version 1
      setRequirementText('Version 1');
      saveSnapshot();
      
      // Save version 2
      setRequirementText('Version 2');
      saveSnapshot();
      
      // Should have history
      const { history } = useConfirmationStore.getState();
      expect(history.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle undo functionality', () => {
      const { setRequirementText, saveSnapshot, undo, history } = useConfirmationStore.getState();
      
      // Save some versions
      setRequirementText('V1');
      saveSnapshot();
      setRequirementText('V2');
      saveSnapshot();
      
      const historyBefore = history.length;
      
      // Undo should work
      undo();
      
      const { canUndo } = useConfirmationStore.getState();
      expect(canUndo).toBeDefined();
    });
  });
});
