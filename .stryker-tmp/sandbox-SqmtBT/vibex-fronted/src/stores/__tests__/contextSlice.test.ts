/**
 * ContextSlice Tests
 */
// @ts-nocheck


import { useContextStore } from '../contextSlice';

const mockContext = {
  id: 'ctx-1',
  name: 'Test Context',
  description: 'A test context',
  type: 'core' as const,
  entities: [],
  relationships: [],
};

describe('ContextSlice', () => {
  beforeEach(() => {
    useContextStore.getState().clearBoundedContexts();
    useContextStore.getState().clearSelection();
  });

  describe('Initial State', () => {
    it('should have empty boundedContexts initially', () => {
      expect(useContextStore.getState().boundedContexts).toEqual([]);
    });

    it('should have empty contextMermaidCode initially', () => {
      expect(useContextStore.getState().contextMermaidCode).toBe('');
    });

    it('should have empty selectedContextIds initially', () => {
      expect(useContextStore.getState().selectedContextIds).toEqual([]);
    });

    it('should have isContextPanelOpen true initially', () => {
      expect(useContextStore.getState().isContextPanelOpen).toBe(true);
    });
  });

  describe('setBoundedContexts', () => {
    it('should set bounded contexts', () => {
      const { setBoundedContexts } = useContextStore.getState();
      const contexts = [mockContext];
      
      setBoundedContexts(contexts);
      
      expect(useContextStore.getState().boundedContexts).toEqual(contexts);
    });
  });

  describe('addBoundedContext', () => {
    it('should add a bounded context', () => {
      const { addBoundedContext } = useContextStore.getState();
      
      addBoundedContext(mockContext);
      
      expect(useContextStore.getState().boundedContexts).toContainEqual(mockContext);
    });
  });

  describe('updateBoundedContext', () => {
    it('should update a bounded context', () => {
      const { addBoundedContext, updateBoundedContext } = useContextStore.getState();
      addBoundedContext(mockContext);
      
      updateBoundedContext('ctx-1', { name: 'Updated Context' });
      
      expect(useContextStore.getState().boundedContexts[0].name).toBe('Updated Context');
    });
  });

  describe('removeBoundedContext', () => {
    it('should remove a bounded context', () => {
      const { addBoundedContext, removeBoundedContext } = useContextStore.getState();
      addBoundedContext(mockContext);
      
      removeBoundedContext('ctx-1');
      
      expect(useContextStore.getState().boundedContexts).toEqual([]);
    });
  });

  describe('clearBoundedContexts', () => {
    it('should clear all bounded contexts', () => {
      const { addBoundedContext, clearBoundedContexts } = useContextStore.getState();
      addBoundedContext(mockContext);
      
      clearBoundedContexts();
      
      expect(useContextStore.getState().boundedContexts).toEqual([]);
    });
  });

  describe('setContextMermaidCode', () => {
    it('should set mermaid code', () => {
      const { setContextMermaidCode } = useContextStore.getState();
      
      setContextMermaidCode('graph TD;');
      
      expect(useContextStore.getState().contextMermaidCode).toBe('graph TD;');
    });
  });

  describe('selectContext', () => {
    it('should select a context', () => {
      const { selectContext } = useContextStore.getState();
      
      selectContext('ctx-1');
      
      expect(useContextStore.getState().selectedContextIds).toContain('ctx-1');
    });

    it('should not add duplicate selection', () => {
      const { selectContext } = useContextStore.getState();
      selectContext('ctx-1');
      selectContext('ctx-1');
      
      expect(useContextStore.getState().selectedContextIds.length).toBe(1);
    });
  });

  describe('deselectContext', () => {
    it('should deselect a context', () => {
      const { selectContext, deselectContext } = useContextStore.getState();
      selectContext('ctx-1');
      
      deselectContext('ctx-1');
      
      expect(useContextStore.getState().selectedContextIds).not.toContain('ctx-1');
    });
  });

  describe('toggleContextSelection', () => {
    it('should toggle selection on', () => {
      const { toggleContextSelection } = useContextStore.getState();
      
      toggleContextSelection('ctx-1');
      
      expect(useContextStore.getState().selectedContextIds).toContain('ctx-1');
    });

    it('should toggle selection off', () => {
      const { toggleContextSelection } = useContextStore.getState();
      toggleContextSelection('ctx-1');
      
      toggleContextSelection('ctx-1');
      
      expect(useContextStore.getState().selectedContextIds).not.toContain('ctx-1');
    });
  });

  describe('clearSelection', () => {
    it('should clear all selections', () => {
      const { selectContext, clearSelection } = useContextStore.getState();
      selectContext('ctx-1');
      selectContext('ctx-2');
      
      clearSelection();
      
      expect(useContextStore.getState().selectedContextIds).toEqual([]);
    });
  });

  describe('setContextPanelOpen', () => {
    it('should set panel open state', () => {
      const { setContextPanelOpen } = useContextStore.getState();
      
      setContextPanelOpen(false);
      
      expect(useContextStore.getState().isContextPanelOpen).toBe(false);
    });
  });
});
