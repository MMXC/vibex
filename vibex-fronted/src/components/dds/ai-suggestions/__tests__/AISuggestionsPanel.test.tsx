/**
 * AISuggestionsPanel — S89-E2 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AISuggestionsPanel } from '../AISuggestionsPanel';
import { useAIDesignSuggestionsStore } from '@/stores/dds/aiDesignSuggestionsStore';
import { useAISuggestions } from '@/hooks/dds/useAISuggestions';

// vi.hoisted ensures the mock fns are available at module scope alongside vi.mock
const mockClosePanel = vi.hoisted(() => vi.fn());
const mockApplySuggestion = vi.hoisted(() => vi.fn());
const mockDismissSuggestion = vi.hoisted(() => vi.fn());

vi.mock('@/stores/dds/aiDesignSuggestionsStore', () => {
  // Persistent test state — mutating sharedState persists across re-renders
  const sharedState = {
    isOpen: false,
    suggestions: [] as Array<{ id: string; type: string; icon: string; title: string; description: string; status: string }>,
    closePanel: mockClosePanel,
    applySuggestion: mockApplySuggestion,
    dismissSuggestion: mockDismissSuggestion,
  };
  return {
    useAIDesignSuggestionsStore: vi.fn((selector?) => {
      if (typeof selector === 'function') return selector(sharedState);
      return sharedState;
    }),
  };
});

// Shared mutable state for useAISuggestions — declared before vi.mock via vi.hoisted so it's
// available when the mock factory runs at module-parse time
const mockAISState = vi.hoisted(() => ({
  suggestions: [] as Array<{ id: string; type: string; icon: string; title: string; description: string; status: string }>,
}));

vi.mock('@/hooks/dds/useAISuggestions', () => ({
  useAISuggestions: vi.fn(() => ({
    suggestions: mockAISState.suggestions,
    stats: { totalNodes: 0, totalEdges: 0, chapters: {}, chapterTypes: new Set() },
  })),
}));

describe('AISuggestionsPanel', () => {
  beforeEach(() => {
    // Use mockReset instead of vi.clearAllMocks() — clearAllMocks() also clears
    // mockImplementation set in this beforeEach, causing useAISuggestions to return
    // undefined (empty state renders instead of suggestion list).
    mockClosePanel.mockReset();
    mockApplySuggestion.mockReset();
    mockDismissSuggestion.mockReset();
    vi.mocked(useAISuggestions).mockReset();
    // Reset suggestions for each test
    mockAISState.suggestions.length = 0;
    // Reset useAISuggestions to return empty by default
    vi.mocked(useAISuggestions).mockImplementation(() => ({
      suggestions: mockAISState.suggestions,
      stats: { totalNodes: 0, totalEdges: 0, chapters: {}, chapterTypes: new Set() },
    }));
  });

  // Helper to set store state — mutates sharedState in the module scope mock
  // Must use mockImplementation (not mockReturnValueOnce) because Zustand calls the
  // store selector multiple times per render (getServerState + getSnapshot + subscribe),
  // consuming mockReturnValueOnce on the first call and breaking subsequent selectors.
  const setStoreState = (overrides: Partial<{
    isOpen: boolean;
    suggestions: Array<{ id: string; type: string; icon: string; title: string; description: string; status: string }>;
  }>) => {
    vi.mocked(useAIDesignSuggestionsStore).mockImplementation((selector?) => {
      const sharedState = {
        isOpen: false,
        suggestions: [] as Array<{ id: string; type: string; icon: string; title: string; description: string; status: string }>,
        closePanel: mockClosePanel,
        applySuggestion: mockApplySuggestion,
        dismissSuggestion: mockDismissSuggestion,
        ...overrides,
      };
      if (typeof selector === 'function') return selector(sharedState);
      return sharedState;
    });
  };

  it('does not render drawer when isOpen is false', () => {
    setStoreState({ isOpen: false, suggestions: [] });
    render(<AISuggestionsPanel />);
    expect(screen.queryByRole('dialog', { name: /AI Design Suggestions/i })).toBeNull();
  });

  it('renders drawer when isOpen is true', () => {
    setStoreState({ isOpen: true, suggestions: [] });
    render(<AISuggestionsPanel />);
    expect(screen.getByRole('dialog', { name: /AI Design Suggestions/i })).toBeInTheDocument();
  });

  it('shows empty state when no suggestions', () => {
    setStoreState({ isOpen: true, suggestions: [] });
    render(<AISuggestionsPanel />);
    expect(screen.getByText(/No suggestions/i)).toBeInTheDocument();
  });

  it('shows suggestion cards when suggestions exist', () => {
    const suggestions = [
      { id: 'sg-1', type: 'structure', icon: '📦', title: 'Group nodes', description: 'Too many nodes', status: 'pending' },
    ];
    vi.mocked(useAISuggestions).mockReturnValueOnce({
      suggestions,
      stats: { totalNodes: 10, totalEdges: 5, chapters: {}, chapterTypes: new Set() },
    });
    setStoreState({ isOpen: true, suggestions });
    render(<AISuggestionsPanel />);
    expect(screen.getByText('Group nodes')).toBeInTheDocument();
    expect(screen.getByText('Too many nodes')).toBeInTheDocument();
  });

  it('calls applySuggestion when Apply button clicked', () => {
    const suggestions = [
      { id: 'sg-1', type: 'structure', icon: '📦', title: 'Group nodes', description: 'Too many nodes', status: 'pending' },
    ];
    vi.mocked(useAISuggestions).mockReturnValueOnce({
      suggestions,
      stats: { totalNodes: 10, totalEdges: 5, chapters: {}, chapterTypes: new Set() },
    });
    setStoreState({ isOpen: true, suggestions });
    render(<AISuggestionsPanel />);
    fireEvent.click(screen.getByTestId('apply-sg-1'));
    expect(mockApplySuggestion).toHaveBeenCalledWith('sg-1');
  });

  it('calls dismissSuggestion when Dismiss button clicked', () => {
    const suggestions = [
      { id: 'sg-1', type: 'structure', icon: '📦', title: 'Group nodes', description: 'Too many nodes', status: 'pending' },
    ];
    vi.mocked(useAISuggestions).mockReturnValueOnce({
      suggestions,
      stats: { totalNodes: 10, totalEdges: 5, chapters: {}, chapterTypes: new Set() },
    });
    setStoreState({ isOpen: true, suggestions });
    render(<AISuggestionsPanel />);
    fireEvent.click(screen.getByTestId('dismiss-sg-1'));
    expect(mockDismissSuggestion).toHaveBeenCalledWith('sg-1');
  });

  it('shows Applied badge after suggestion is applied', () => {
    // Applied suggestion is returned by useAISuggestions (store suggestions are NOT rendered).
    // The hook returns all suggestions (pending + applied) for the panel to display.
    const pendingSuggestion = { id: 'sg-1', type: 'structure', icon: '📦', title: 'Group nodes', description: 'Too many nodes', status: 'pending' as const };
    const appliedSuggestion = { id: 'sg-2', type: 'connection', icon: '🔗', title: 'Add connections', description: 'Missing edges', status: 'applied' as const };
    vi.mocked(useAISuggestions).mockReturnValueOnce({
      suggestions: [pendingSuggestion, appliedSuggestion],
      stats: { totalNodes: 10, totalEdges: 5, chapters: {}, chapterTypes: new Set() },
    });
    setStoreState({ isOpen: true, suggestions: [] });
    render(<AISuggestionsPanel />);
    // Both pending (with Apply/Dismiss buttons) and applied (with ✓ badge) appear in the list
    expect(screen.getByText('✓ Applied')).toBeInTheDocument();
    expect(screen.getByText('Group nodes')).toBeInTheDocument();
  });

  it('renders type tag for each suggestion', () => {
    const suggestions = [
      { id: 'sg-1', type: 'structure', icon: '📦', title: 'Group nodes', description: 'Too many nodes', status: 'pending' },
      { id: 'sg-2', type: 'connection', icon: '🔗', title: 'Add connections', description: 'Missing edges', status: 'pending' },
    ];
    vi.mocked(useAISuggestions).mockReturnValueOnce({
      suggestions,
      stats: { totalNodes: 10, totalEdges: 5, chapters: {}, chapterTypes: new Set() },
    });
    setStoreState({ isOpen: true, suggestions });
    render(<AISuggestionsPanel />);
    expect(screen.getByText('Structure')).toBeInTheDocument();
    expect(screen.getByText('Connection')).toBeInTheDocument();
  });

  it('calls closePanel when close button is clicked', () => {
    setStoreState({ isOpen: true, suggestions: [] });
    render(<AISuggestionsPanel />);
    fireEvent.click(screen.getByLabelText('Close suggestions panel'));
    expect(mockClosePanel).toHaveBeenCalled();
  });

  it('does not show action buttons for applied suggestions', () => {
    vi.mocked(useAISuggestions).mockReturnValueOnce({
      suggestions: [
        { id: 'sg-1', type: 'structure', icon: '📦', title: 'Group nodes', description: 'Too many nodes', status: 'applied' },
      ],
      stats: { totalNodes: 10, totalEdges: 5, chapters: {}, chapterTypes: new Set() },
    });
    setStoreState({ isOpen: true, suggestions: [] });
    render(<AISuggestionsPanel />);
    expect(screen.queryByTestId('apply-sg-1')).toBeNull();
    expect(screen.queryByTestId('dismiss-sg-1')).toBeNull();
  });
});
