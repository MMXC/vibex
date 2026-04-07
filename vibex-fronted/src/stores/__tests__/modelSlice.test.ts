/**
 * ModelSlice Tests
 */

import { useModelStore } from '../modelSlice';

const mockModel = {
  id: 'model-1',
  name: 'User',
  contextId: 'ctx-1',
  type: 'aggregate_root' as const,
  properties: [
    { name: 'id', type: 'string', required: true },
    { name: 'email', type: 'string', required: true },
  ],
};

describe('ModelSlice', () => {
  beforeEach(() => {
    useModelStore.getState().clearDomainModels();
    useModelStore.getState().clearModelSelection();
  });

  describe('Initial State', () => {
    it('should have empty domainModels initially', () => {
      expect(useModelStore.getState().domainModels).toEqual([]);
    });

    it('should have empty modelMermaidCode initially', () => {
      expect(useModelStore.getState().modelMermaidCode).toBe('');
    });

    it('should have empty selectedModelIds initially', () => {
      expect(useModelStore.getState().selectedModelIds).toEqual([]);
    });

    it('should have isModelPanelOpen true initially', () => {
      expect(useModelStore.getState().isModelPanelOpen).toBe(true);
    });
  });

  describe('setDomainModels', () => {
    it('should set domain models', () => {
      const { setDomainModels } = useModelStore.getState();
      const models = [mockModel];
      
      setDomainModels(models);
      
      expect(useModelStore.getState().domainModels).toEqual(models);
    });
  });

  describe('addDomainModel', () => {
    it('should add a domain model', () => {
      const { addDomainModel } = useModelStore.getState();
      
      addDomainModel(mockModel);
      
      expect(useModelStore.getState().domainModels).toContainEqual(mockModel);
    });
  });

  describe('updateDomainModel', () => {
    it('should update a domain model', () => {
      const { addDomainModel, updateDomainModel } = useModelStore.getState();
      addDomainModel(mockModel);
      
      updateDomainModel('model-1', { name: 'Updated Model' });
      
      expect(useModelStore.getState().domainModels[0].name).toBe('Updated Model');
    });
  });

  describe('removeDomainModel', () => {
    it('should remove a domain model', () => {
      const { addDomainModel, removeDomainModel } = useModelStore.getState();
      addDomainModel(mockModel);
      
      removeDomainModel('model-1');
      
      expect(useModelStore.getState().domainModels).toEqual([]);
    });
  });

  describe('clearDomainModels', () => {
    it('should clear all domain models', () => {
      const { addDomainModel, clearDomainModels } = useModelStore.getState();
      addDomainModel(mockModel);
      
      clearDomainModels();
      
      expect(useModelStore.getState().domainModels).toEqual([]);
    });
  });

  describe('setModelMermaidCode', () => {
    it('should set mermaid code', () => {
      const { setModelMermaidCode } = useModelStore.getState();
      
      setModelMermaidCode('classDiagram;');
      
      expect(useModelStore.getState().modelMermaidCode).toBe('classDiagram;');
    });
  });

  describe('selectModel', () => {
    it('should select a model', () => {
      const { selectModel } = useModelStore.getState();
      
      selectModel('model-1');
      
      expect(useModelStore.getState().selectedModelIds).toContain('model-1');
    });

    it('should not add duplicate selection', () => {
      const { selectModel } = useModelStore.getState();
      selectModel('model-1');
      selectModel('model-1');
      
      expect(useModelStore.getState().selectedModelIds.length).toBe(1);
    });
  });

  describe('deselectModel', () => {
    it('should deselect a model', () => {
      const { selectModel, deselectModel } = useModelStore.getState();
      selectModel('model-1');
      
      deselectModel('model-1');
      
      expect(useModelStore.getState().selectedModelIds).not.toContain('model-1');
    });
  });

  describe('toggleModelSelection', () => {
    it('should toggle selection on', () => {
      const { toggleModelSelection } = useModelStore.getState();
      
      toggleModelSelection('model-1');
      
      expect(useModelStore.getState().selectedModelIds).toContain('model-1');
    });

    it('should toggle selection off', () => {
      const { toggleModelSelection } = useModelStore.getState();
      toggleModelSelection('model-1');
      
      toggleModelSelection('model-1');
      
      expect(useModelStore.getState().selectedModelIds).not.toContain('model-1');
    });
  });

  describe('clearModelSelection', () => {
    it('should clear all selections', () => {
      const { selectModel, clearModelSelection } = useModelStore.getState();
      selectModel('model-1');
      selectModel('model-2');
      
      clearModelSelection();
      
      expect(useModelStore.getState().selectedModelIds).toEqual([]);
    });
  });

  describe('setModelPanelOpen', () => {
    it('should set panel open state', () => {
      const { setModelPanelOpen } = useModelStore.getState();
      
      setModelPanelOpen(false);
      
      expect(useModelStore.getState().isModelPanelOpen).toBe(false);
    });
  });
});
