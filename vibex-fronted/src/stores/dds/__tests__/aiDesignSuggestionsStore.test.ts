/**
 * aiDesignSuggestionsStore — S89-E2 tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAIDesignSuggestionsStore } from '../aiDesignSuggestionsStore';

describe('aiDesignSuggestionsStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAIDesignSuggestionsStore.setState({
      isOpen: false,
      suggestions: [],
    });
  });

  it('has correct initial state', () => {
    const state = useAIDesignSuggestionsStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.suggestions).toEqual([]);
  });

  it('toggles panel open/closed', () => {
    const { togglePanel } = useAIDesignSuggestionsStore.getState();
    togglePanel();
    expect(useAIDesignSuggestionsStore.getState().isOpen).toBe(true);
    togglePanel();
    expect(useAIDesignSuggestionsStore.getState().isOpen).toBe(false);
  });

  it('opens and closes panel explicitly', () => {
    const { openPanel, closePanel } = useAIDesignSuggestionsStore.getState();
    openPanel();
    expect(useAIDesignSuggestionsStore.getState().isOpen).toBe(true);
    closePanel();
    expect(useAIDesignSuggestionsStore.getState().isOpen).toBe(false);
  });

  it('sets suggestions', () => {
    const mockSuggestions = [
      { id: 'sg-1', type: 'structure' as const, icon: '📦', title: 'Group nodes', description: 'Too many nodes', status: 'pending' as const },
    ];
    const { setSuggestions } = useAIDesignSuggestionsStore.getState();
    setSuggestions(mockSuggestions);
    expect(useAIDesignSuggestionsStore.getState().suggestions).toEqual(mockSuggestions);
  });

  it('applies suggestion by id', () => {
    const mockSuggestions = [
      { id: 'sg-1', type: 'structure' as const, icon: '📦', title: 'Group', description: 'Desc', status: 'pending' as const },
      { id: 'sg-2', type: 'layout' as const, icon: '📊', title: 'Layout', description: 'Desc', status: 'pending' as const },
    ];
    useAIDesignSuggestionsStore.setState({ suggestions: mockSuggestions });
    const { applySuggestion } = useAIDesignSuggestionsStore.getState();
    applySuggestion('sg-1');
    const state = useAIDesignSuggestionsStore.getState();
    expect(state.suggestions[0].status).toBe('applied');
    expect(state.suggestions[1].status).toBe('pending');
  });

  it('dismisses suggestion by id', () => {
    const mockSuggestions = [
      { id: 'sg-1', type: 'structure' as const, icon: '📦', title: 'Group', description: 'Desc', status: 'pending' as const },
    ];
    useAIDesignSuggestionsStore.setState({ suggestions: mockSuggestions });
    const { dismissSuggestion } = useAIDesignSuggestionsStore.getState();
    dismissSuggestion('sg-1');
    expect(useAIDesignSuggestionsStore.getState().suggestions[0].status).toBe('dismissed');
  });

  it('clears all suggestions', () => {
    const mockSuggestions = [
      { id: 'sg-1', type: 'structure' as const, icon: '📦', title: 'Group', description: 'Desc', status: 'pending' as const },
    ];
    useAIDesignSuggestionsStore.setState({ suggestions: mockSuggestions });
    const { clearSuggestions } = useAIDesignSuggestionsStore.getState();
    clearSuggestions();
    expect(useAIDesignSuggestionsStore.getState().suggestions).toEqual([]);
  });
});
