/**
 * DDSCanvasPage — Main DDS Canvas Page Component
 * Epic 5: F22-F24
 *
 * Responsibilities:
 * - Read projectId from URL searchParams
 * - Fetch & load chapter data into DDSCanvasStore
 * - Render full canvas layout: Toolbar + ScrollContainer + AI Drawer
 * - Handle loading / error states
 * - Cleanup on unmount (no dangling listeners)
 */

'use client';

import React, {
  memo,
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react';
import { DDSToolbar } from '@/components/dds/toolbar';
import { DDSScrollContainer } from '@/components/dds/canvas';
import { CrossChapterEdgesOverlay } from '@/components/dds/canvas/CrossChapterEdgesOverlay';
import { AIDraftDrawer } from '@/components/dds/ai-draft';
import { DDSFlow } from '@/components/dds/DDSFlow';
import { useDDSCanvasStore, ddsChapterActions } from '@/stores/dds/DDSCanvasStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ShortcutEditModal } from '@/components/shortcuts/ShortcutEditModal';
import { useShortcutStore } from '@/stores/shortcutStore';
import { createDDSAPI } from '@/hooks/dds/useDDSAPI';
import { useDDSCanvasSearch } from '@/hooks/dds/useDDSCanvasSearch';
import { DDSSearchPanel } from '@/components/dds/DDSSearchPanel';
import type { ChapterType, ChapterData } from '@/types/dds';
import type { DDSCard } from '@/types/dds';
import type { ReactNode } from 'react';

// ==================== Props ====================

export interface DDSCanvasPageProps {
  /** Project ID from URL */
  projectId: string;
  /** Called when AI generate button is clicked */
  onAIGenerate?: () => void;
}

// ==================== Page State ====================

type PageState = 'loading' | 'ready' | 'error';

interface DDSCanvasPageState {
  pageState: PageState;
  errorMessage: string | null;
}

// ==================== Component ====================


// ==================== E5: Four States Components ====================

/** E5-U1/U2 AC2: Skeleton state — uses var(--color-skeleton) token */
function ChapterSkeleton({ title }: { title: string }) {
  return (
    <div
      style={{
        height: '64px',
        borderRadius: '10px',
        background: 'var(--color-skeleton, rgba(255,255,255,0.06))',
        animation: 'dds-skeleton-shimmer 1.5s ease-in-out infinite',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '12px',
      }}
      aria-hidden="true"
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '8px',
        background: 'var(--color-skeleton, rgba(255,255,255,0.04))',
      }} />
      <div style={{ flex: 1 }}>
        <div style={{
          height: '12px', width: '40%', borderRadius: '4px', marginBottom: '8px',
          background: 'var(--color-skeleton, rgba(255,255,255,0.04))',
        }} />
        <div style={{
          height: '10px', width: '60%', borderRadius: '4px',
          background: 'var(--color-skeleton, rgba(255,255,255,0.04))',
        }} />
      </div>
    </div>
  );
}

/** E5-U1 AC1: Empty state — API chapter */
function APIEmptyState() {
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 5,
      }}
      data-testid="api-empty-state"
    >
      <div style={{
        textAlign: 'center', padding: '32px',
        color: 'rgba(255,255,255,0.3)',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.4 }}>🔌</div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
          暂无 API 端点
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
          从左侧卡片面板拖入 API Endpoint 节点
        </div>
      </div>
    </div>
  );
}

/** E5-U2 AC1: Empty state — SM chapter */
function SMEmptyState() {
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 5,
      }}
      data-testid="sm-empty-state"
    >
      <div style={{
        textAlign: 'center', padding: '32px',
        color: 'rgba(255,255,255,0.3)',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.4 }}>⚙️</div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
          暂无状态节点
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
          从左侧卡片面板拖入 State Machine 节点
        </div>
      </div>
    </div>
  );
}

/**
 * E5-U1 AC1 / E5-U2 AC1: Chapter empty state overlay.
 * Shows when the active chapter has no cards.
 */
function ChapterEmptyState({ chapter, cards }: { chapter: ChapterType; cards: DDSCard[] }) {
  if (cards.length > 0) return null;
  if (chapter === 'api') return <APIEmptyState />;
  if (chapter === 'business-rules') return <SMEmptyState />;
  return null;
}

export const DDSCanvasPage = memo(function DDSCanvasPage({
  projectId,
  onAIGenerate,
}: DDSCanvasPageProps) {
  const [state, setState] = useState<DDSCanvasPageState>({
    pageState: 'loading',
    errorMessage: null,
  });
  // Store refs
  const selectedCardIds = useDDSCanvasStore((s) => s.selectedCardIds);
  const toggleDrawer = useDDSCanvasStore((s) => s.toggleDrawer);

  // Abort controller for cleanup
  // Ref for the scroll container (used by CrossChapterEdgesOverlay)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // ---- Load chapter data ----

  const loadChapters = useCallback(
    async (pid: string) => {
      // Cancel any previous in-flight request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const controller = abortControllerRef.current;

      setState({ pageState: 'loading', errorMessage: null });

      try {
        const api = createDDSAPI();

        // Get chapter list for this project
        const chapterRes = await api.getChapters(pid);

        if (controller.signal.aborted) return;

        if (!chapterRes.success) {
          setState({
            pageState: 'error',
            errorMessage: chapterRes.error?.message ?? '加载章节失败',
          });
          return;
        }

        const chapters: Array<{ id: string; type: ChapterType }> = chapterRes.data ?? [];

        // Load each chapter's cards in parallel
        const loadCards = chapters.map(async ({ id, type }) => {
          const cardsRes = await api.getCards(id);
          if (cardsRes.success && cardsRes.data) {
            // Write each card to the store (merge, don't replace)
            cardsRes.data.forEach((card) => {
              ddsChapterActions.addCard(type, card);
            });
          }
        });

        await Promise.all(loadCards);

        if (controller.signal.aborted) return;

        setState({ pageState: 'ready', errorMessage: null });
      } catch (err) {
        if (controller.signal.aborted) return;
        setState({
          pageState: 'error',
          errorMessage: err instanceof Error ? err.message : '加载失败',
        });
      }
    },
    []
  );

  // ---- Load on mount / projectId change ----

  useEffect(() => {
    if (!projectId) {
      setState({ pageState: 'error', errorMessage: '未提供项目 ID' });
      return;
    }

    loadChapters(projectId);

    // Cleanup: abort any pending requests
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [projectId, loadChapters]);

  // ---- Sync activeChapter from URL query param ----
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const chapterParam = params.get('chapter') as ChapterType | null;
    if (chapterParam) {
      useDDSCanvasStore.getState().setActiveChapter(chapterParam);
    }
  }, []);

  // ---- Handlers ----

  const handleSelectCard = useCallback(
    (cardId: string) => {
      useDDSCanvasStore.getState().selectCard(cardId);
    },
    []
  );

  const handleAIGenerate = useCallback(() => {
    toggleDrawer();
    onAIGenerate?.();
  }, [toggleDrawer, onAIGenerate]);

  // ---- Keyboard Shortcuts ----
  // Note: useKeyboardShortcuts uses OLD canvas history (context/flow/component).
  // For DDS canvas, undo/redo will be wired when DDS history is implemented.
  // For now, pass no-op stubs that return false (required by hook interface).
  // ---- E3: DDS Canvas Search ----
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const { query: searchQuery, setQuery: setSearchQuery, results: searchResults, clearResults } =
    useDDSCanvasSearch();

  // Ctrl+K / Cmd+K: toggle search panel
  useEffect(() => {
    function handleCtrlK(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchPanelOpen((v) => !v);
      }
    }
    document.addEventListener('keydown', handleCtrlK);
    return () => document.removeEventListener('keydown', handleCtrlK);
  }, []);

  const undoCallback = useCallback((): boolean => false, []);
  const redoCallback = useCallback((): boolean => false, []);

  useKeyboardShortcuts({
    undo: undoCallback,
    redo: redoCallback,
    onDelete: useCallback(() => {
      // Find each selected card's chapter and delete it
      selectedCardIds.forEach((id) => {
        const store = useDDSCanvasStore.getState();
        const chapterKeys = Object.keys(store.chapters) as ChapterType[];
        chapterKeys.forEach((chapter) => {
          const card = store.chapters[chapter].cards.find((c) => c.id === id);
          if (card) {
            ddsChapterActions.deleteCard(chapter, id);
          }
        });
      });
    }, [selectedCardIds]),
    onClearSelection: () => useDDSCanvasStore.getState().deselectAll(),
    onOpenSearch: () => { /* placeholder */ },
    onZoomIn: () => { /* placeholder */ },
    onZoomOut: () => { /* placeholder */ },
    onZoomReset: () => { /* placeholder */ },
    onSelectAll: () => { /* placeholder */ },
    onNewNode: () => { /* placeholder */ },
    enabled: true,
  });

  // ---- ? key: toggle ShortcutEditModal ----
  // ShortcutEditModal shows when shortcutStore.editingAction !== null
  // Press ? to start editing the first shortcut action
  useEffect(() => {
    function handleQuestionMark(e: KeyboardEvent) {
      if (e.key !== '?') return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl instanceof HTMLElement)) {
        const tagName = activeEl.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA') return;
      }
      e.preventDefault();
      const store = useShortcutStore.getState();
      if (store.editingAction) {
        store.cancelEditing();
      } else {
        store.startEditing('go-to-canvas');
      }
    }
    document.addEventListener('keydown', handleQuestionMark);
    return () => document.removeEventListener('keydown', handleQuestionMark);
  }, []);

  // ---- Render ----

  if (state.pageState === 'error') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary, #0a0a0a)',
          color: 'var(--text-primary, #e5e5e5)',
          fontFamily: 'system-ui, sans-serif',
          padding: '1rem',
        }}
        role="alert"
        data-testid="dds-error-state"
      >
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            加载失败
          </h2>
          <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {state.errorMessage ?? '未知错误'}
          </p>
          <button
            type="button"
            onClick={() => loadChapters(projectId)}
            style={{
              padding: '0.5rem 1rem',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#e5e5e5',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-theme="dark"
      data-testid="dds-canvas-page"
      style={{ minHeight: '100vh', background: 'var(--bg-primary, #0a0a0a)' }}
    >
      {/* Toolbar */}
      <DDSToolbar onAIGenerate={handleAIGenerate} />

      {/* Loading overlay */}
      {state.pageState === 'loading' && (
        <div
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '24px 32px',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
          }}
          role="status"
          aria-label="骨架屏加载中..."
          data-testid="dds-skeleton-overlay"
        >
          <ChapterSkeleton title="需求章节" />
          <ChapterSkeleton title="上下文章节" />
          <ChapterSkeleton title="流程章节" />
        </div>
      )}

      {/* Canvas Scroll Container */}
      <div style={{ position: 'relative' }}>
        <DDSScrollContainer
          className="dds-scroll-container"
          rootRef={scrollContainerRef}
          renderChapterContent={(
            chapter: ChapterType,
            data: ChapterData
          ): ReactNode => (
            <>
              <ChapterEmptyState chapter={chapter} cards={data.cards} />
              <DDSFlow
                chapter={chapter}
                onSelectCard={handleSelectCard}
                selectedCardIds={selectedCardIds}
              />
            </>
          )}
        />
        {/* Cross-chapter DAG edge overlay (E4-U1) */}
        <CrossChapterEdgesOverlay
          scrollContainerRef={scrollContainerRef}
          className="cross-chapter-edges-overlay"
        />
      </div>

      {/* AI Draft Drawer */}
      <AIDraftDrawer />

      {/* Keyboard shortcut edit modal */}
      <ShortcutEditModalPortal />

      {/* E3: Search Panel */}
      <DDSSearchPanel
        open={searchPanelOpen}
        onClose={() => {
          setSearchPanelOpen(false);
          clearResults();
        }}
        results={searchResults}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onSelectResult={() => {
          setSearchPanelOpen(false);
        }}
      />

      {/* Loading animation style */}
      <style>{`
        @keyframes dds-skeleton-shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
        @keyframes dds-loading-shrink {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        @keyframes search-highlight-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
          50% { box-shadow: 0 0 0 4px rgba(234, 179, 8, 0.5); }
        }
        .search-highlight {
          animation: search-highlight-pulse 0.5s ease-in-out 4;
          border: 2px solid #eab308 !important;
          z-index: 100;
        }
      `}</style>
    </div>
  );
});

// ShortcutEditModal rendered outside the main div, always mounted
// Visibility controlled by shortcutStore.editingAction
// The ? key handler above toggles shortcutModalOpen which drives editingAction via ShortcutEditModal internals
function ShortcutEditModalPortal() {
  // Only render when an action is being edited
  const editingAction = useShortcutStore((s) => s.editingAction);
  if (!editingAction) return null;
  return <ShortcutEditModal />;
}

export default DDSCanvasPage;
