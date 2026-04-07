/**
 * PreviewStore Tests
 */

import { usePreviewStore, STEP_CONFIG, getNextStep, getStepProgress } from '../previewStore';

describe('PreviewStore', () => {
  beforeEach(() => {
    usePreviewStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have empty mermaidCode initially', () => {
      expect(usePreviewStore.getState().mermaidCode).toBe('');
    });

    it('should have idle step initially', () => {
      expect(usePreviewStore.getState().currentStep).toBe('idle');
    });

    it('should not be generating initially', () => {
      expect(usePreviewStore.getState().isGenerating).toBe(false);
    });

    it('should have no error initially', () => {
      expect(usePreviewStore.getState().error).toBeNull();
    });

    it('should have empty requirement initially', () => {
      expect(usePreviewStore.getState().requirement).toBe('');
    });
  });

  describe('setMermaidCode', () => {
    it('should set mermaid code', () => {
      const { setMermaidCode } = usePreviewStore.getState();
      const code = 'graph TD; A-->B;';
      
      setMermaidCode(code);
      
      expect(usePreviewStore.getState().mermaidCode).toBe(code);
    });
  });

  describe('setStep', () => {
    it('should set current step', () => {
      const { setStep } = usePreviewStore.getState();
      
      setStep('context');
      
      expect(usePreviewStore.getState().currentStep).toBe('context');
    });
  });

  describe('setGenerating', () => {
    it('should set generating state', () => {
      const { setGenerating } = usePreviewStore.getState();
      
      setGenerating(true);
      
      expect(usePreviewStore.getState().isGenerating).toBe(true);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { setError } = usePreviewStore.getState();
      
      setError('Something went wrong');
      
      expect(usePreviewStore.getState().error).toBe('Something went wrong');
    });

    it('should clear error when set to null', () => {
      const { setError } = usePreviewStore.getState();
      setError('Error');
      
      setError(null);
      
      expect(usePreviewStore.getState().error).toBeNull();
    });
  });

  describe('setRequirement', () => {
    it('should set requirement text', () => {
      const { setRequirement } = usePreviewStore.getState();
      
      setRequirement('Build a todo app');
      
      expect(usePreviewStore.getState().requirement).toBe('Build a todo app');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const { setMermaidCode, setStep, setRequirement, reset } = usePreviewStore.getState();
      setMermaidCode('code');
      setStep('complete');
      setRequirement('test');
      
      reset();
      
      expect(usePreviewStore.getState().mermaidCode).toBe('');
      expect(usePreviewStore.getState().currentStep).toBe('idle');
      expect(usePreviewStore.getState().requirement).toBe('');
    });
  });

  describe('STEP_CONFIG', () => {
    it('should have config for all steps', () => {
      expect(STEP_CONFIG.idle).toBeDefined();
      expect(STEP_CONFIG.context).toBeDefined();
      expect(STEP_CONFIG.model).toBeDefined();
      expect(STEP_CONFIG.flow).toBeDefined();
      expect(STEP_CONFIG.complete).toBeDefined();
    });
  });

  describe('getNextStep', () => {
    it('should return next step', () => {
      expect(getNextStep('idle')).toBe('context');
      expect(getNextStep('context')).toBe('model');
      expect(getNextStep('model')).toBe('flow');
      expect(getNextStep('flow')).toBe('complete');
    });

    it('should return null for complete', () => {
      expect(getNextStep('complete')).toBeNull();
    });
  });

  describe('getStepProgress', () => {
    it('should return correct progress values', () => {
      expect(getStepProgress('idle')).toBe(0);
      expect(getStepProgress('context')).toBe(25);
      expect(getStepProgress('model')).toBe(50);
      expect(getStepProgress('flow')).toBe(75);
      expect(getStepProgress('complete')).toBe(100);
    });
  });
});
