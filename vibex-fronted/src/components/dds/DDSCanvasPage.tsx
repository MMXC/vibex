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
import { PresenceIndicator } from '@/components/dds/presence/PresenceIndicator';
import { usePresence } from '@/hooks/canvas/usePresence';
import { DDSScrollContainer } from '@/components/dds/canvas';
import { CrossChapterEdgesOverlay } from '@/components/dds/canvas/CrossChapterEdgesOverlay';
import { AIDraftDrawer } from '@/components/dds/ai-draft';
import { DDSFlow } from '@/components/dds/DDSFlow';
import { useDDSCanvasStore, ddsChapterActions } from '@/stores/dds/DDSCanvasStore';
// S85-E1: 画布级权限体系 — viewer mode
import { useCanvasPermissionsStore, selectIsViewerMode, selectMyRole } from '@/stores/dds/canvasPermissionsStore';
import { useCanvasHistoryStore, saveHistoryToStorage, loadHistoryFromStorage } from '@/stores/dds/canvasHistoryStore';
import { loadSnapshotFromDB } from '@/lib/canvas/historyDB';
import { canvasStoreRegistry } from '@/lib/canvas/canvasStoreRegistry';
import type { CanvasChapterData } from '@/lib/canvas/canvasStoreRegistry';
import { parseRequirementContent } from '@/components/dds/canvas/ChapterPanel';
import { TreeErrorBoundary } from '@/components/canvas/panels/TreeErrorBoundary';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardHelpOverlay } from '@/components/shared/KeyboardHelpOverlay';
import { OperationOverlay } from '@/components/shared/OperationOverlay';
import { ShortcutEditModal } from '@/components/shortcuts/ShortcutEditModal';
import { useShortcutStore } from '@/stores/shortcutStore';
import { useSettingsStore } from '@/stores/dds/settingsStore';
import { calculateEffectiveDPR } from '@/components/dds/settings/PerformanceSettings';
import { NewUserGuide } from '@/components/guide/NewUserGuide';
import { createDDSAPI } from '@/hooks/dds/useDDSAPI';
import { useDDSCanvasSearch } from '@/hooks/dds/useDDSCanvasSearch';
import { DDSSearchPanel } from '@/components/dds/DDSSearchPanel';
import { SearchPanel } from '@/components/dds/SearchPanel';
import { GlobalSearchPanel } from '@/components/dds/search/GlobalSearchPanel';
import { CanvasSearchPanel } from '@/components/dds/canvas/CanvasSearchPanel';
import { useSearchIndex } from '@/hooks/useSearchIndex';
import { useCanvasSearchStore } from '@/stores/canvasSearchStore';
import { useCanvasSearchStore as useDdsCanvasSearchStore } from '@/stores/dds/canvasSearchStore';
import { useAutoLayout } from '@/hooks/dds/useAutoLayout';
import { useCanvasListStore } from '@/stores/canvasListStore';
import { MiniMapPanel } from '@/components/dds/MiniMapPanel';
import { ReviewReportPanel } from '@/components/design-review';
import { HistoryPanel } from '@/components/canvas/features/HistoryPanel';
import { NodeCommentPanel } from '@/components/dds/canvas/NodeCommentPanel';
import { CanvasImportPanel } from '@/components/dds/canvas-dashboard/CanvasImportPanel';
import { ImportShareDialog } from '@/components/dds/share/ImportShareDialog';
import { useFileDrop } from '@/hooks/canvas/useFileDrop';
import { useCollabSessionStore } from '@/lib/collaboration/collabSessionStore';
import { useConflictStore } from '@/stores/dds/conflictStore';
import { PerformanceMonitor } from '@/components/dds/canvas/PerformanceMonitor';
import { ConflictDialog } from '@/components/dds/canvas-dashboard/ConflictDialog';
import { ConflictResolutionDialog } from '@/components/dds/canvas-dashboard/ConflictResolutionDialog';
import { ConflictConfirmToast } from '@/components/dds/canvas-dashboard/ConflictConfirmToast';
import type { AutoResolveStrategy } from '@/components/dds/canvas-dashboard/ConflictConfirmToast';
// S76-E5: Conflict detection banner
import { ConflictWarningBanner } from '@/components/dds/canvas-dashboard/ConflictWarningBanner/ConflictWarningBanner';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import { CollabConflictDialog } from '@/components/dds/collaboration/ConflictResolutionDialog';
import { PresenceOverlay } from '@/components/dds/presence/PresenceOverlay';
import { useWebSocketPresence } from '@/lib/collaboration/useWebSocketPresence';
// S62-E1: Collaboration editing broadcast
import { useCollabEditing } from '@/lib/collaboration/useCollabEditing';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import { OnlinePresenceIndicator } from '@/components/dds/collab/OnlinePresenceIndicator';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import useRealtimeSync from '@/hooks/useRealtimeSync';
import { useAuthStore } from '@/stores/authStore';
import type { ChapterType, ChapterData , DDSCard , UserStoryCard } from '@/types/dds';
import type { ReactNode } from 'react';
import type { CodeGenContext } from '@/types/codegen';
import type { TokenChange } from '@/types/designSync';
import { useAgentStore } from '@/stores/agentStore';
import { CodeGenPanel } from '@/components/CodeGenPanel';
import type { CanvasFlow, CanvasNode } from '@/lib/codeGenerator';
import { useAIController } from '@/hooks/canvas/useAIController';
import { DiffOverlay } from '@/components/agent/DiffOverlay';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useResponsiveMode } from '@/hooks/useResponsiveMode';
import { TouchModeIndicator } from '@/components/shared/TouchModeIndicator';
import { SelectionToolbar } from '@/components/dds/SelectionToolbar';
import { useSelectionBox } from '@/hooks/dds/useSelectionBox';
// S79-E1: Start/stop the scheduled export runner on mount/unmount
import { ScheduledExportRunner } from '@/services/export/ScheduledExportRunner';
// S84-E3: Command Palette
import { CommandPalette } from '@/components/dds/command-palette/CommandPalette';
import { registerShortcutAction, unregisterShortcutAction } from '@/hooks/useKeyboardShortcuts';
import { useCommandPaletteStore } from '@/stores/commandPaletteStore';
import { useCanvasListStore } from '@/stores/canvasListStore';

// E1 (Sprint70): reloadFromSnapshot — reads a snapshot from IndexedDB and replaces canvas nodes
async function reloadFromSnapshot(canvasId: string, snapshotId: string): Promise<void> {
  const snapshot = await loadSnapshotFromDB(canvasId, snapshotId);
  if (!snapshot?.data) return;
  const current = canvasStoreRegistry.get(canvasId);
  if (!current) return;
  // Replace chapters with snapshot data
  const updated: CanvasChapterData = {
    ...current,
    chapters: snapshot.data.chapters ?? current.chapters,
    updatedAt: Date.now(),
  };
  canvasStoreRegistry.set(canvasId, updated);
}

// ==================== Props ====================

export interface DDSCanvasPageProps {
  /** Project ID from URL */
  projectId: string;
  /** Called when AI generate button is clicked */
  onAIGenerate?: () => void;
  /** agentSession URL param — triggers code generation context display */
  agentSession?: string | null;
  /** E1-S2: 来自 Onboarding 的模板 requirement 内容 */
  templateRequirement?: string;
  /** S83-E2: Share token from URL ?import= param — triggers ImportShareDialog */
  importShareToken?: string | null;
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
  agentSession,
  templateRequirement: templateReqProp,
  importShareToken,
}: DDSCanvasPageProps) {
  /** E1-S2: 从 prop 或 localStorage 读取模板 requirement */
  const templateRequirement = (() => {
    if (templateReqProp) return templateReqProp;
    try {
      return localStorage.getItem('vibex:pending_template_req') ?? undefined;
    } catch {
      return undefined;
    }
  })();
  const [state, setState] = useState<DDSCanvasPageState>({
    pageState: 'loading',
    errorMessage: null,
  });

  // ---- S83-E2: Import Share Dialog ----
  const [importShareOpen, setImportShareOpen] = useState(false);
  const [importShareTokenState, setImportShareTokenState] = useState<string | null>(null);

  // S83-E2: Open import dialog when ?import= param is present
  useEffect(() => {
    if (importShareToken) {
      setImportShareTokenState(importShareToken);
      setImportShareOpen(true);
    }
  }, [importShareToken]);

  const handleImportShareClose = useCallback(() => {
    setImportShareOpen(false);
    // Remove ?import= from URL without full navigation
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('import');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // ---- S16-P0-2: Conflict Resolution Dialog ----
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictChanges, setConflictChanges] = useState<TokenChange[]>([]);

  // E1 (Sprint70): Branch merge conflict dialog state
  const [mergeConflictOpen, setMergeConflictOpen] = useState(false);
  const [mergeConflictError, setMergeConflictError] = useState<string | null>(null);

  // S83-E3: Conflict confirmation toast state
  const [conflictConfirmVisible, setConflictConfirmVisible] = useState(false);
  const [conflictConfirmStrategy, setConflictConfirmStrategy] = useState<AutoResolveStrategy | null>(null);

  // S83-E3: Handle conflict resolution strategy chosen
  const handleConflictResolved = useCallback((strategy: AutoResolveStrategy) => {
    setConflictConfirmStrategy(strategy);
    setConflictConfirmVisible(true);
  }, []);

  // S83-E3: Handle viewing details (placeholder — can be extended to show diff)
  const handleConflictDetails = useCallback(() => {
    // TODO(S83-E3): Navigate to a details panel or open a diff modal
    // e.g., setShowDiffPanel(true);
    setConflictConfirmVisible(false);
  }, []);

  // E4 (Sprint70): Collaboration conflict dialog state
  const [collabConflictOpen, setCollabConflictOpen] = useState(false);
  // E4 (Sprint70): Listen for presenceStore.pendingConflicts changes → auto-open dialog
  const presencePendingConflicts = usePresenceStore((s) => s.pendingConflicts);
  useEffect(() => {
    if (presencePendingConflicts.length > 0) {
      setCollabConflictOpen(true);
    }
  }, [presencePendingConflicts]);

  // E4 (Sprint70): Called after all collab conflicts are resolved
  const handleCollabConflictResolved = useCallback(() => {
    setCollabConflictOpen(false);
  }, []);

  // E1 (Sprint70): Set current branch on mount (restore active branch from store)
  const pendingConflicts = useCanvasHistoryStore((s) => s.pendingConflicts);
  const setCurrentBranch = useCanvasHistoryStore((s) => s.setCurrentBranch);
  useEffect(() => {
    const { currentBranch } = useCanvasHistoryStore.getState();
    if (currentBranch) {
      setCurrentBranch(currentBranch);
    }
    // Show merge conflict dialog if there are pending conflicts
    if (pendingConflicts.length > 0) {
      setMergeConflictOpen(true);
    }
  }, []);

  // E1 (Sprint70): Called after all merge conflicts are resolved (called by ConflictResolutionDialog internally)
  const handleMergeResolve = useCallback(async () => {
    setMergeConflictError(null);
    try {
      // Reload canvas from latest snapshot after all conflicts resolved
      if (projectId) {
        const listSnapshots = useCanvasHistoryStore.getState().listSnapshots;
        const snapshots = await listSnapshots(projectId);
        const latest = snapshots[snapshots.length - 1];
        if (latest) {
          await reloadFromSnapshot(projectId, latest.id);
        }
      }
    } catch (e) {
      setMergeConflictError(e instanceof Error ? e.message : '合并后重载失败');
    }
  }, [projectId]);

  // E5-U1 AC1: Touch mode detection
  const { isMobile, isTablet } = useResponsiveMode();
  const [touchMode, setTouchMode] = useState(false);

  // E5 (Sprint77): DPR performance mode — calculated once on mount
  const dprMode = useSettingsStore((s) => s.dprMode);
  const [effectiveDPR] = useState(() =>
    typeof window !== 'undefined' ? calculateEffectiveDPR(window.devicePixelRatio, dprMode) : 1
  );

  // E5-U1: Detect first touch interaction — switch canvas to touch mode
  useEffect(() => {
    if (!isMobile && !isTablet) return;
    const handleTouchStart = () => setTouchMode(true);
    document.addEventListener('ontouchstart', handleTouchStart, { once: true });
    return () => document.removeEventListener('ontouchstart', handleTouchStart);
  }, [isMobile, isTablet]);

  // ---- P001-U3: Initialize history middleware (once, on mount) ----
  useEffect(() => {
    // Lazy-initialize to avoid double-wrapping (Zustand stores are singletons)
    if (useCanvasHistoryStore.getState().past.length === 0 &&
        useCanvasHistoryStore.getState().future.length === 0) {
      // Only wrap if not already wrapped (check via description heuristic)
      // We wrap once at component mount — safe because ddsChapterActions is a singleton
      const { wrapDDSCanvasActionsWithHistory } = require('@/stores/dds/canvasHistoryMiddleware');
      wrapDDSCanvasActionsWithHistory();
    }
  }, []);

  // ---- P001-U4: Load history metadata from localStorage on projectId change ----
  useEffect(() => {
    if (!projectId) return;
    const meta = loadHistoryFromStorage(projectId);
    if (meta) {
      // meta.pastMeta / meta.futureMeta available for UX hints
      // actual Command objects cannot be restored; history starts empty
    }
  }, [projectId]);

  // ---- E003: Help overlay state ----
  const [helpOverlayOpen, setHelpOverlayOpen] = useState(false);

  // ---- P002-E3: Operation overlay state (Ctrl+H) ----
  const [operationOverlayOpen, setOperationOverlayOpen] = useState(false);

  // ---- P003-E1: DiffOverlay state (AI result diff) ----
  const { lastResult } = useAIAgent();
  const [diffOverlayOpen, setDiffOverlayOpen] = useState(false);

  // Show DiffOverlay when lastResult becomes available
  useEffect(() => {
    if (lastResult && (lastResult.added > 0 || lastResult.removed > 0)) {
      setDiffOverlayOpen(true);
    }
  }, [lastResult]);

  // ---- E003: useAIController for quickGenerate ----
  const { quickGenerate } = useAIController();

  // ---- S53-E1: Subscribe to real-time presence ----
  usePresence();

  // ---- P001-U4: Debounced save history to localStorage on history change ----
  const historyState = useCanvasHistoryStore();
  useEffect(() => {
    if (!projectId) return;
    const timeout = setTimeout(() => {
      saveHistoryToStorage(projectId);
    }, 500);
    return () => clearTimeout(timeout);
  }, [historyState.past.length, historyState.future.length, projectId]);

  // Listen for drift-detected custom events from driftDetector
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ hasDrift: boolean; changes: TokenChange[] }>).detail;
      if (detail?.hasDrift) {
        setConflictChanges(detail.changes ?? []);
        setConflictDialogOpen(true);
      }
    };
    window.addEventListener('design-sync:drift-detected', handler);
    return () => window.removeEventListener('design-sync:drift-detected', handler);
  }, []);

  // D3.3: Register online event listener — when back online, replay queued canvas operations
  useEffect(() => {
    const handleOnline = () => {
      void import('@/lib/offline-queue').then(({ syncOfflineQueue }) => {
        void syncOfflineQueue();
      });
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // D3.4: Listen for canvas-op-conflict events from syncOfflineQueue replay
  // Triggers E2 ConflictDialog when offline op conflicts with remote changes
  const { setConflict } = useConflictStore();
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ op: unknown; remoteData: unknown }>).detail;
      setConflict({
        local: detail.op,
        remote: detail.remoteData,
        canvasId: projectId ?? '',
        localRevision: 0,
        remoteRevision: 0,
      });
      setConflictDialogOpen(true);
    };
    window.addEventListener('canvas-op-conflict', handler);
    return () => window.removeEventListener('canvas-op-conflict', handler);
  }, [setConflict, projectId]);

  // ---- E1: CodeGenContext Display (agentSession=new triggers context pre-fill) ----
  const codeGenContext = useAgentStore((s) => s.codeGenContext);
  const showCodeGenPanel = agentSession === 'new' && codeGenContext != null;
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? null;
  // S43-E1: WebSocket Presence integration (replaces Firebase usePresence)
  // S63-E1: returns onCursorMove for DDSFlow to wire mouse events
  // S68-E5: broadcastCursor — dedicated cursor field write (separate from remoteUsers)
const { onCursorMove, broadcastCursor } = useWebSocketPresence({
    projectId,
    userId,
    userName: user?.name ?? 'Anonymous',
  });

  // E1-S1.4: cursorVisible setting controls PresenceOverlay display
  const cursorVisible = useUserPreferencesStore((s) => s.cursorVisible);

  // E1-S1.2: Real-time node sync with Firebase RTDB
  useRealtimeSync({ projectId: projectId ?? null, userId: userId ?? 'anonymous' });

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

  // ---- S41-E4: Load canvas from IndexedDB on mount ----
  useEffect(() => {
    if (!projectId) return;
    loadCanvas(projectId).catch((err) => {
      console.warn('[persistence] Failed to load canvas from IndexedDB:', err);
    });
  }, [projectId]);

  // ---- S79-E1: Start/stop scheduled export runner on mount/unmount ----
  useEffect(() => {
    const runner = ScheduledExportRunner.getInstance();
    runner.startScheduler();
    return () => {
      runner.stopScheduler();
    };
  }, []);

  // ---- S41-E4: Debounced canvas persistence on data changes ----
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!projectId) return;
    // Debounce: persist 1 second after last store change
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      persistCanvas(projectId).catch((err) => {
        console.warn('[persistence] Failed to persist canvas:', err);
      });
    }, 1000);
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [projectId, selectedCardIds]);

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

  // S62-E1: Collaboration editing broadcast
  const { startEditing, endEditing } = useCollabEditing();

  // S82-E4: File drag-drop import — open CanvasImportPanel on valid file drop
  const {
    isDragging: isFileDragging,
    isImportReady: isFileDragImportReady,
    clearImportReady: clearFileDragImportReady,
    handleDragEnter: handleFileDragEnter,
    handleDragLeave: handleFileDragLeave,
    handleDragOver: handleFileDragOver,
    handleDrop: handleFileDrop,
  } = useFileDrop({
    onImportReady: () => {
      clearFileDragImportReady();
      setImportPanelOpen(true);
    },
  });

  const handleSelectCard = useCallback(
    (cardId: string) => {
      const state = useDDSCanvasStore.getState();
      const prevSelected = state.selectedCardIds;
      const userId = user?.id ?? 'anonymous';
      const userName = user?.name ?? 'Anonymous';
      const avatar = user?.name?.slice(0, 1).toUpperCase() ?? 'A';

      // End editing for previously selected card
      if (prevSelected.length === 1) {
        const prevId = prevSelected[0];
        if (prevId !== cardId) {
          endEditing(prevId);
        }
      }

      // Select new card
      state.selectCard(cardId);

      // Start editing for newly selected card
      startEditing(cardId, userId, userName, avatar);
    },
    [user, startEditing, endEditing]
  );

  const handleAIGenerate = useCallback(() => {
    toggleDrawer();
    onAIGenerate?.();
  }, [toggleDrawer, onAIGenerate]);

  // ---- E4: Selection Box (drag-to-select multi-select) ----
  const { selectionBox, isSelecting, containerRef: selContainerRef, clearSelection } = useSelectionBox();

  // No-op handler for the outer div's existing onMouseMove prop
  const handleMouseMove = useCallback(() => {}, []);

  // ---- Keyboard Shortcuts ----
  // P001: useKeyboardShortcuts wired to canvasHistoryStore for DDS canvas undo/redo.
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [canvasSearchPanelOpen, setCanvasSearchPanelOpen] = useState(false);
  const [fulltextSearchOpen, setFulltextSearchOpen] = useState(false); // S73-E1: Cmd/Ctrl+F
  const [importPanelOpen, setImportPanelOpen] = useState(false); // S82-E4: File drag-drop import
  const [globalSearchPanelOpen, setGlobalSearchPanelOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const { query: searchQuery, setQuery: setSearchQuery, results: searchResults, clearResults } =
    useDDSCanvasSearch();

  // S50-E1: Initialize canvas search index
  useSearchIndex();
  const canvasSearchQuery = useCanvasSearchStore((s) => s.query);
  const canvasSearch = useCanvasSearchStore((s) => s.search);
  const canvasSetPanelOpen = useCanvasSearchStore((s) => s.setPanelOpen);
  const canvasSetActive = useCanvasListStore((s) => s.setActiveCanvas);

  // Ctrl+K / Cmd+K: toggle canvas search panel (S50-E1)
  useEffect(() => {
    function handleCtrlK(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        // Prevent opening card search when canvas search is the intended target
        if (!e.shiftKey) {
          e.preventDefault();
          setCanvasSearchPanelOpen((v) => !v);
        }
      }
    }
    document.addEventListener('keydown', handleCtrlK);
    return () => document.removeEventListener('keydown', handleCtrlK);
  }, []);

  // S73-E1: Ctrl+F / Cmd+F — toggle canvas full-text search panel
  useEffect(() => {
    function handleCtrlF(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        // Only open if not already focused in an input
        const target = e.target as HTMLElement;
        const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (!isEditable) {
          e.preventDefault();
          setFulltextSearchOpen((v) => !v);
        }
      }
    }
    document.addEventListener('keydown', handleCtrlF);
    return () => document.removeEventListener('keydown', handleCtrlF);
  }, []);

  // S73-E1: Listen for canvas:scroll-to-node events from CanvasSearchPanel
  useEffect(() => {
    function handleScrollToNode(e: Event) {
      const { nodeId } = (e as CustomEvent).detail;
      if (!nodeId) return;
      // Find the React Flow node element by data attribute
      const el = document.querySelector(`[data-id="${nodeId}"]`) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('search-highlight');
        setTimeout(() => el.classList.remove('search-highlight'), 2000);
      }
    }
    window.addEventListener('canvas:scroll-to-node', handleScrollToNode);
    return () => window.removeEventListener('canvas:scroll-to-node', handleScrollToNode);
  }, []);

  // S65-E4: Ctrl+Shift+K / Cmd+Shift+K: toggle GlobalSearchPanel (canvas name fuzzy search)
  useEffect(() => {
    function handleGlobalSearch(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchPanelOpen((v) => !v);
      }
    }
    document.addEventListener('keydown', handleGlobalSearch);
    return () => document.removeEventListener('keydown', handleGlobalSearch);
  }, []);

  // S78-E3: Cmd+Shift+M / Ctrl+Shift+M: toggle Node Comment Panel
  useEffect(() => {
    function handleToggleComment(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        const selectedCardIds = useDDSCanvasStore.getState().selectedCardIds;
        if (selectedCardIds.length === 1) {
          setCommentPanelOpen((v) => !v);
        }
      }
    }
    document.addEventListener('keydown', handleToggleComment);
    return () => document.removeEventListener('keydown', handleToggleComment);
  }, []);

  // S75-E1: Listen for dds:recent-search (from RecentSearchesDropdown) and dds:open-search-panel
  useEffect(() => {
    function handleRecentSearch(e: Event) {
      const { term } = (e as CustomEvent<{ term: string }>).detail;
      if (!term) return;
      // Set the search query in the DDS store and open GlobalSearchPanel
      useDdsCanvasSearchStore.getState().setGlobalSearchQuery(term);
      useDdsCanvasSearchStore.getState().setSearchQuery(term);
      setGlobalSearchPanelOpen(true);
    }
    function handleOpenSearchPanel() {
      setGlobalSearchPanelOpen(true);
    }
    window.addEventListener('dds:recent-search', handleRecentSearch);
    window.addEventListener('dds:open-search-panel', handleOpenSearchPanel);
    return () => {
      window.removeEventListener('dds:recent-search', handleRecentSearch);
      window.removeEventListener('dds:open-search-panel', handleOpenSearchPanel);
    };
  }, []);

  // S62-E1: Escape key — deselect all cards and broadcast editing end
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        const selectedCardIds = useDDSCanvasStore.getState().selectedCardIds;
        if (selectedCardIds.length > 0) {
          // Broadcast end for each selected card
          for (const cardId of selectedCardIds) {
            endEditing(cardId);
          }
          useDDSCanvasStore.getState().deselectAll();
        }
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [endEditing]);

  const { applyAutoLayout } = useAutoLayout();

  const undoCallback = useCallback(() => {
    // P004-E4: Open HistoryPanel for selective undo instead of immediate undo
    const { canUndo } = useCanvasHistoryStore.getState();
    if (canUndo()) {
      setHistoryPanelOpen(true);
      return false; // prevent default undo behavior when panel opens
    }
    return true;
  }, []);

  const redoCallback = useCallback(() => {
    useCanvasHistoryStore.getState().redo();
    return true;
  }, []);

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
    onNewNode: () => {
      // [E002] Ctrl+N: Create new node in active chapter
      const store = useDDSCanvasStore.getState();
      const activeChapter = store.activeChapter;
      // Default card type per chapter
      const defaultCardType: Record<ChapterType, string> = {
        requirement: 'user-story',
        context: 'bounded-context',
        flow: 'flow-step',
        api: 'api-endpoint',
        'business-rules': 'state-machine',
      };
      const cardType = defaultCardType[activeChapter] ?? 'user-story';
      const cardId = `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      const newCard = {
        id: cardId,
        type: cardType,
        title: 'New ' + (cardType === 'user-story' ? 'User Story' : cardType === 'bounded-context' ? 'Bounded Context' : cardType === 'flow-step' ? 'Flow Step' : cardType === 'api-endpoint' ? 'API Endpoint' : 'State Machine'),
        position: { x: 100, y: 100 },
        createdAt: now,
        updatedAt: now,
      } as Parameters<typeof ddsChapterActions.addCard>[1];
      ddsChapterActions.addCard(activeChapter, newCard);
    },
    onNextTab: () => {
      // [E002] Tab: Cycle to next chapter
      const order: ChapterType[] = ['requirement', 'context', 'flow', 'api', 'business-rules'];
      const current = useDDSCanvasStore.getState().activeChapter;
      const idx = order.indexOf(current);
      const next = order[(idx + 1) % order.length];
      useDDSCanvasStore.getState().setActiveChapter(next!);
    },
    onPrevTab: () => {
      // [E002] Shift+Tab: Cycle to previous chapter
      const order: ChapterType[] = ['requirement', 'context', 'flow', 'api', 'business-rules'];
      const current = useDDSCanvasStore.getState().activeChapter;
      const idx = order.indexOf(current);
      const prev = order[(idx - 1 + order.length) % order.length];
      useDDSCanvasStore.getState().setActiveChapter(prev!);
    },
    onDesignReview: () => { window.dispatchEvent(new CustomEvent('design-review:open')); },
    onQuickGenerate: () => { quickGenerate(); },
    onHelp: () => { setHelpOverlayOpen((v) => !v); },
    onOpenOplog: () => { setOperationOverlayOpen((v) => !v); },
    onAutoLayout: () => { applyAutoLayout({ direction: 'TB' }); },
    enabled: true,
  });

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

  // ---- E1/E10: CodeGenPanel (always visible) ----
  function CodeGenPanelWrapper() {
    const chapters = useDDSCanvasStore((s) => s.chapters);
    const flow: CanvasFlow = {
      id: 'dds-canvas',
      name: 'DDSCanvas',
      nodes: Object.values(chapters).flatMap((chapter) =>
        (chapter.cards ?? []).map((card): CanvasNode => ({
          id: card.id,
          name: card.title ?? '',
          type: card.type ?? 'card',
        }))
      ),
    };
    return <CodeGenPanel flow={flow} />;
  }

  return (
    <>
    <TreeErrorBoundary
      fallback={
        <div
          className="flex items-center justify-center"
          style={{ height: 'calc(100vh - 56px)' }}
          data-testid="dds-canvas-fallback"
        >
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: '#dc3545' }}>渲染失败</p>
            <p style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
              Canvas 组件渲染遇到问题
            </p>
          </div>
        </div>
      }
    >
    <div
      data-theme="dark"
      data-testid="dds-canvas-page"
      style={{ minHeight: '100vh', background: 'var(--bg-primary, #0a0a0a)' }}
      onMouseMove={handleMouseMove}
      onDragEnter={handleFileDragEnter}
      onDragLeave={handleFileDragLeave}
      onDragOver={handleFileDragOver}
      onDrop={handleFileDrop}
    >
      {/* Toolbar */}
      <DDSToolbar onAIGenerate={handleAIGenerate} agentSession={agentSession} projectId={projectId ?? ''} />

      {/* S85-E1: 画布级权限体系 — viewer mode banner (reads from canvasPermissionsStore) */}
      <ViewerModeBanner projectId={projectId ?? ''} />

      {/* S76-E5: ConflictWarningBanner — shows when a remote user is editing the selected node */}
      <ConflictWarningBannerWrapper />

      {/* S78-E3: NodeCommentBadge — shows on selected node card */}
      {(() => {
        const selectedCardIds = useDDSCanvasStore.getState().selectedCardIds;
        if (selectedCardIds.length !== 1) return null;
        const nodeId = selectedCardIds[0];
        const count = useCollabSessionStore.getState().getCommentCount(nodeId);
        if (count <= 0) return null;
        return (
          <div style={{ position: 'absolute', top: '64px', right: '16px', zIndex: 100 }}>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '16px',
                background: 'var(--color-primary, #6366f1)', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
              }}
              onClick={() => setCommentPanelOpen(true)}
              aria-label={`查看 ${count} 条评论`}
              title={`${count} 条评论 — 按 Cmd+Shift+M 打开`}
              type="button"
            >
              💬 {count >= 100 ? '99+' : count}
            </button>
          </div>
        );
      })()}

      {/* S53-E1: Real-time presence indicator — shows online collaborators */}
      <div style={{ position: 'absolute', top: '12px', right: '16px', zIndex: 50 }}>
        <PresenceIndicator />
      </div>

      {/* S80-E5: Online presence indicator — shows green/grey dots per collaborator */}
      <div style={{ position: 'absolute', top: '60px', right: '16px', zIndex: 50 }}>
        <OnlinePresenceIndicator />
      </div>

      {/* E10-E1: CodeGenPanel — always visible */}
      <CodeGenPanelWrapper />

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
      <div style={{ position: 'relative' }} ref={selContainerRef}>
        {/* E4-U1: SelectionToolbar — shown when 2+ cards selected */}
        <SelectionToolbar
          selectionBox={selectionBox}
          onClearSelection={clearSelection}
        />
        <DDSScrollContainer
          className="dds-scroll-container"
          rootRef={scrollContainerRef}
          templateRequirement={templateRequirement}
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
                /* E5-U1: Touch mode — disable drag, enable pinch-zoom */
                touchMode={touchMode}
                /* E5 (Sprint77): DPR performance mode */
                effectiveDPR={effectiveDPR}
                /* S63-E1: wire pane mouse move → cursor broadcast */
                onCursorMove={onCursorMove}
              />
            </>
          )}
        />
        {/* Cross-chapter DAG edge overlay (E4-U1) */}
        <CrossChapterEdgesOverlay
          scrollContainerRef={scrollContainerRef}
          className="cross-chapter-edges-overlay"
        />
        {/* P003-E1: MiniMap Navigation Panel — E5: hide in touch mode */}
        {!touchMode && <MiniMapPanel />}

        {/* E5-U1 AC3: Touch mode active indicator */}
        <TouchModeIndicator active={touchMode} />
      </div>

      {/* AI Draft Drawer */}
      <AIDraftDrawer />

      {/* E1: CodeGenContext Panel — shown when agentSession=new */}
      {showCodeGenPanel && codeGenContext && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            width: '480px',
            maxHeight: '80vh',
            overflow: 'auto',
            zIndex: 9000,
            background: 'var(--color-surface, #fff)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          data-testid="code-gen-context-panel"
        >
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border, #e5e7eb)' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Code Generation Context</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>
              {codeGenContext.nodes.length} nodes | schema {codeGenContext.schemaVersion} | {codeGenContext.type}
            </p>
          </div>
          <div style={{ padding: '12px' }}>
            <pre style={{
              fontSize: '11px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: '300px',
              overflow: 'auto',
              background: 'var(--color-bg-secondary, #f9fafb)',
              padding: '8px',
              borderRadius: '6px',
            }}
            data-testid="code-gen-context-preview"
            >{JSON.stringify({ type: codeGenContext.type, nodeCount: codeGenContext.nodes.length, schemaVersion: codeGenContext.schemaVersion, exportedAt: codeGenContext.exportedAt }, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Keyboard shortcut edit modal */}
      <ShortcutEditModalPortal />

      {/* S84-E3: Command Palette */}
      <CommandPalettePortal />
      <CommandPaletteShortcut />

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

      {/* S50-E1: Canvas Global Search Panel */}
      <SearchPanel
        open={canvasSearchPanelOpen}
        onClose={() => setCanvasSearchPanelOpen(false)}
        onSelectCanvas={(canvasId) => {
          canvasSetActive(canvasId);
          setCanvasSearchPanelOpen(false);
        }}
      />

      {/* S65-E4: GlobalSearchPanel — Cmd+Shift+K canvas name fuzzy search */}
      <GlobalSearchPanel
        open={globalSearchPanelOpen}
        onClose={() => setGlobalSearchPanelOpen(false)}
      />

      {/* S73-E1: Canvas Full-Text Search Panel — Cmd/Ctrl+F */}
      <CanvasSearchPanel
        open={fulltextSearchOpen}
        onClose={() => setFulltextSearchOpen(false)}
      />

      {/* S43-E1: WebSocket PresenceOverlay — replaces Firebase PresenceAvatars + RemoteCursor */}
      {cursorVisible && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          pointerEvents: 'none',
        }}>
          <PresenceOverlay excludeUserId={userId ?? undefined} />
        </div>
      )}

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
    </TreeErrorBoundary>

    {/* S82-E4: CanvasImportPanel — file drag-drop import */}
    <CanvasImportPanel
      open={importPanelOpen}
      onClose={() => setImportPanelOpen(false)}
      onImported={(canvasId) => {
        setImportPanelOpen(false);
        canvasSetActive(canvasId);
      }}
    />

    {/* S16-P0-1: Design Review panel */}
    <ReviewReportPanel />

    {/* S16-P0-2: Conflict Resolution Dialog */}
    {conflictDialogOpen && (() => {
      const conflictData = useConflictStore.getState().conflictData;
      // D3.4: E2 ConflictDialog for canvas-op-conflict events (E3 offline sync)
      if (conflictData) {
        return (
          <ConflictDialog
            conflictingUserName={String(conflictData.remote ?? 'Unknown')}
            onUndoMine={() => {
              useConflictStore.getState().clearConflict();
              setConflictDialogOpen(false);
              // Retry: call syncOfflineQueue again after clearing the conflict
              void import('@/lib/offline-queue').then(({ syncOfflineQueue }) => {
                void syncOfflineQueue();
              });
            }}
            onKeepTheirs={() => {
              useConflictStore.getState().clearConflict();
              setConflictDialogOpen(false);
            }}
            onCancel={() => {
              useConflictStore.getState().clearConflict();
              setConflictDialogOpen(false);
            }}
          />
        );
      }
      // E1 (Sprint70): Branch merge conflict dialog — show when pendingConflicts exist
      return (
        <ConflictResolutionDialog
          open={mergeConflictOpen}
          canvasId={projectId}
          onResolved={handleMergeResolve}
          onClose={() => setMergeConflictOpen(false)}
          onAutoResolved={handleConflictResolved}
        />
      );
    })()}

    {/* E4 (Sprint70): Collaboration conflict dialog — show when presenceStore.pendingConflicts exist */}
    <CollabConflictDialog
      open={collabConflictOpen}
      onResolved={handleCollabConflictResolved}
      onClose={() => setCollabConflictOpen(false)}
    />

    {/* P004-E4: History Panel — Ctrl+Z opens for selective undo */}
    <HistoryPanel
      open={historyPanelOpen}
      onClose={() => setHistoryPanelOpen(false)}
    />

    {/* S78-E3: Node Comment Panel — opens from badge or toolbar */}
    {(() => {
      const selectedCardIds = useDDSCanvasStore.getState().selectedCardIds;
      const nodeId = selectedCardIds.length === 1 ? selectedCardIds[0] : null;
      const threads = nodeId ? useCollabSessionStore.getState().getComments(nodeId) : [];
      const currentUser = useAuthStore.getState().currentUser;
      return (
        <NodeCommentPanel
          nodeId={nodeId ?? ''}
          threads={threads}
          currentUserId={currentUser?.id}
          currentUserName={currentUser?.name}
          open={commentPanelOpen && nodeId !== null}
          onClose={() => setCommentPanelOpen(false)}
          onAddComment={(nid, text, uid, uname, mentions) => {
            useCollabSessionStore.getState().addComment(nid, text, uid, uname, mentions);
          }}
          onAddReply={(nid, cid, text, uid, uname, mentions) => {
            useCollabSessionStore.getState().addReply(nid, cid, text, uid, uname, mentions);
          }}
          onDeleteComment={(nid, cid) => {
            useCollabSessionStore.getState().deleteComment(nid, cid);
          }}
        />
      );
    })()}

    {/* P003-T3.7: New user guide overlay on DDS canvas */}
    <NewUserGuide />

    {/* E003: Keyboard shortcuts help overlay */}
    <KeyboardHelpOverlay
      isOpen={helpOverlayOpen}
      onClose={() => setHelpOverlayOpen(false)}
    />

    {/* P002-E3: Operation overlay (Ctrl+H) */}
    <OperationOverlay
      isOpen={operationOverlayOpen}
      onClose={() => setOperationOverlayOpen(false)}
    />

    {/* P003-E1: AI result diff overlay */}
    {/* P003-E2: extends with error, onApprove, onReject */}
    {diffOverlayOpen && lastResult && (
      <DiffOverlay
        result={lastResult}
        error={lastError}
        onClose={() => setDiffOverlayOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    )}
    {/* S81-E3: Performance monitor — real-time FPS + node/edge count, bottom-right */}
    <PerformanceMonitor />

    {/* S83-E2: ImportShareDialog — shown when ?import=<shareToken> is in URL */}
    <ImportShareDialog
      isOpen={importShareOpen}
      shareToken={importShareTokenState ?? ''}
      onClose={handleImportShareClose}
    />

    {/* S83-E3: Conflict confirm toast — shown after auto-resolve strategy is chosen */}
    <ConflictConfirmToast
      visible={conflictConfirmVisible}
      strategy={conflictConfirmStrategy}
      onDetails={handleConflictDetails}
      onDismiss={() => setConflictConfirmVisible(false)}
    />
    </>
  );
});

// ShortcutEditModal rendered outside the main div, always mounted
// Visibility controlled by shortcutStore.editingAction
// The ? key handler above toggles shortcutModalOpen which drives editingAction via ShortcutEditModal internals
/**
 * S85-E1: 画布级权限体系 — Viewer Mode Banner
 * Shows when the current user has 'viewer' role on the canvas.
 * Displays a notice banner and disables editing capabilities.
 */
function ViewerModeBanner({ projectId }: { projectId: string }) {
  const store = useCanvasPermissionsStore();

  // Initialize store with projectId as canvasId
  React.useEffect(() => {
    if (projectId && (store.canvasId !== projectId || store.myUserId === null)) {
      store.initCanvas(projectId, 'local-user');
    }
  }, [projectId]);

  const isViewerMode = selectIsViewerMode(store);
  const myRole = selectMyRole(store);

  if (!isViewerMode || myRole === null) return null;

  return (
    <div
      style={{
        background: '#fef3c7',
        borderBottom: '1px solid #f59e0b',
        padding: '6px 16px',
        fontSize: 13,
        color: '#92400e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
      role="status"
      aria-live="polite"
    >
      <span>👁 只读模式 — 您目前以「{myRole === 'viewer' ? '只读' : myRole}」身份访问此画布</span>
      <button
        onClick={() => {
          // Open canvas settings drawer (collaboration tab)
          // Trigger the settings drawer by dispatching a custom event
          window.dispatchEvent(new CustomEvent('open-canvas-settings', { detail: { tab: 'collaboration' } }));
        }}
        style={{
          background: '#f59e0b',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          padding: '2px 10px',
          cursor: 'pointer',
          fontSize: 12,
        }}
        type="button"
      >
        查看权限
      </button>
    </div>
  );
}

/**
 * S76-E5: ConflictWarningBannerWrapper
 * Shows ConflictWarningBanner when a remote user is editing the selected node.
 * Reads selectedCardIds from DDSCanvasStore and remoteEditing from presenceStore.
 */
function ConflictWarningBannerWrapper() {
  const selectedCardIds = useDDSCanvasStore((s) => s.selectedCardIds);
  const currentUserId = useAuthStore((s) => s.currentUser?.id ?? 'local-user');
  const remoteEditing = usePresenceStore((s) => s.remoteEditing);

  if (selectedCardIds.length !== 1) return null;

  const selectedNodeId = selectedCardIds[0];
  const editors = [];
  for (const [userId, info] of remoteEditing) {
    if (info.nodeId === selectedNodeId && userId !== currentUserId) {
      editors.push({ userId, userName: info.userName });
    }
  }

  if (editors.length === 0) return null;

  const firstEditor = editors[0];
  const handleDismiss = () => {
    usePresenceStore.getState().clearRemoteEditing(firstEditor.userId);
  };

  return (
    <ConflictWarningBanner
      nodeId={selectedNodeId}
      userName={firstEditor.userName}
      onDismiss={handleDismiss}
    />
  );
}

function ShortcutEditModalPortal() {
  // Only render when an action is being edited
  const editingAction = useShortcutStore((s) => s.editingAction);
  if (!editingAction) return null;
  return <ShortcutEditModal />;
}

/** S84-E3: CommandPalette portal — always mounted, visibility driven by store */
function CommandPalettePortal() {
  // Build search index from canvasListStore canvases
  const canvases = useCanvasListStore((s) =>
    s.canvases.map((c) => ({ id: c.id, name: c.name }))
  );
  return <CommandPalette canvases={canvases} />;
}

/** S84-E3: Register Ctrl+K shortcut on mount, unregister on unmount */
function CommandPaletteShortcut() {
  const toggle = useCommandPaletteStore((s) => s.toggle);

  useEffect(() => {
    registerShortcutAction('open-command-palette', () => toggle());
    return () => unregisterShortcutAction('open-command-palette');
  }, [toggle]);

  return null;
}

export default DDSCanvasPage;
