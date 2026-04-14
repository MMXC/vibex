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
import { AIDraftDrawer } from '@/components/dds/ai-draft';
import { DDSFlow } from '@/components/dds/DDSFlow';
import { useDDSCanvasStore, ddsChapterActions } from '@/stores/dds/DDSCanvasStore';
import { createDDSAPI } from '@/hooks/dds/useDDSAPI';
import type { ChapterType, ChapterData } from '@/types/dds';
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
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
          role="status"
          aria-label="加载章节数据..."
          data-testid="dds-loading-bar"
        >
          <div
            style={{
              width: '120px',
              height: '3px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: '#3b82f6',
                borderRadius: '2px',
                animation: 'dds-loading-shrink 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      )}

      {/* Canvas Scroll Container */}
      <DDSScrollContainer
        className="dds-scroll-container"
        renderChapterContent={(
          chapter: ChapterType,
          _data: ChapterData
        ): ReactNode => (
          <DDSFlow
            chapter={chapter}
            onSelectCard={handleSelectCard}
            selectedCardIds={selectedCardIds}
          />
        )}
      />

      {/* AI Draft Drawer */}
      <AIDraftDrawer />

      {/* Loading animation style */}
      <style>{`
        @keyframes dds-loading-shrink {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
});

export default DDSCanvasPage;
