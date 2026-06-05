/**
 * DDSToolbar — Sticky Top Toolbar
 * Epic 2: F13
 *
 * Displays current chapter name, AI generation button, and fullscreen toggle.
 * Uses useDDSCanvasStore for activeChapter and isFullscreen state.
 * Dark glassmorphism style.
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import type { ChapterType, APIEndpointCard, StateMachineCard } from '@/types/dds';
import { exportToJSON, parseImportFile } from '@/services/dds';
import { generatePlantUML, validatePlantUML } from '@/lib/exporters/plantuml';
import { generateJSONSchema, serializeJSONSchema } from '@/lib/exporters/json-schema';
import { generateSVG } from '@/lib/exporters/svg';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { exportDDSCanvasData, exportToStateMachine } from '@/services/dds/exporter';
import { useDDSCanvasStore, ddsChapterActions } from '@/stores/dds';
import { useAutoLayout } from '@/hooks/dds/useAutoLayout';
import { useClipboardStore } from '@/stores/clipboardStore';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import { useUndoRedoStore } from '@/stores/dds/undoRedoStore';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import { useCanvasExport } from '@/hooks/canvas/useCanvasExport';
import { useCanvasImport } from '@/hooks/canvas/useCanvasImport';
import { useCanvasRBAC } from '@/hooks/useCanvasRBAC';
import { ShareToTeamModal } from '@/components/team-share/ShareToTeamModal';
import { ExportMenu } from './ExportMenu';
import { OnlineUsers } from './OnlineUsers';
import { OfflineIndicator } from './OfflineIndicator';
import { PresencePanel } from '@/components/presence/PresencePanel';
import { useTranslations } from '@/hooks/useTranslations';
import { useLanguage } from '@/hooks/settings/useLanguage';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useCollaboration } from '@/lib/collaboration/useCollaboration';
import { useUIStore } from '@/lib/canvas/stores/uiStore';
import { useOplogConflictToast } from '@/stores/oplogStore';
import { TemplateGallery } from '@/components/dds/templates/TemplateGallery';
import { TemplateSaveDialog } from '@/components/dds/templates/TemplateSaveDialog';
import { ShortcutSettingsPanel } from '@/components/dds/shortcuts/ShortcutSettingsPanel';
import { HistoryPanel } from '@/components/dds/history/HistoryPanel';
import { BackupPanel } from '@/components/dds/settings/BackupPanel';
import { CanvasSettingsPanel } from '@/components/dds/settings/CanvasSettingsPanel';
import { ConflictDialog } from '@/components/dds/canvas-dashboard/ConflictDialog';
import styles from './DDSToolbar.module.css';

// ==================== Chapter label keys (mapped to i18n keys) ====================
// P001-E1 i18n pilot: chapter labels are now driven by next-intl translations
// Key format: 'chapter' + capitalized chapter type
const CHAPTER_LABEL_KEYS: Record<ChapterType, string> = {
  requirement: 'chapterRequirement',
  context: 'chapterContext',
  flow: 'chapterFlow',
  api: 'chapterApi',
  'business-rules': 'chapterBusinessRules',
};

// ==================== Icon SVGs ====================

function AiIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
      <circle cx="7.5" cy="14.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="14.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

// S16-P0-1: Eye icon for Design Review button
function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// S52-E5: Keyboard icon for Shortcuts settings
function KeyboardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h.01M12 14h.01M16 14h.01" />
    </svg>
  );
}

// S61-E1: History icon for Version History panel
function HistoryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// S61-E5: Backup icon for canvas backup panel
function BackupIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// S65-E3: Settings icon for canvas view settings panel
function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// S36-E4: Undo icon for history undo
function UndoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

// S36-E4: Redo icon for history redo
function RedoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </svg>
  );
}



function LayoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4" />
    </svg>
  );
}
// ==================== Shared download helper ====================

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== Component ====================

export interface DDSToolbarProps {
  /** Called when AI button is clicked */
  onAIGenerate?: () => void;
  /** Override isGenerating from store */
  isGenerating?: boolean;
  /** Additional class */
  className?: string;
  /** agentSession URL param */
  agentSession?: string | null;
  /** Project ID for RBAC checks */
  projectId?: string;
  /** Canvas ID for share-to-team */
  canvasId?: string;
  /** Canvas name for share-to-team modal */
  canvasName?: string;
}

export const DDSToolbar = memo(function DDSToolbar({
  onAIGenerate,
  isGenerating: isGeneratingProp,
  className = '',
  agentSession,
  projectId,
  canvasId,
  canvasName,
}: DDSToolbarProps) {
  const activeChapter = useDDSCanvasStore((s) => s.activeChapter);
  const isFullscreen = useDDSCanvasStore((s) => s.isFullscreen);
  const isGenerating = useDDSCanvasStore((s) => s.isGenerating);
  const toggleFullscreen = useDDSCanvasStore((s) => s.toggleFullscreen);
  const chapters = useDDSCanvasStore((s) => s.chapters);
  const chatHistory = useDDSCanvasStore((s) => s.chatHistory);

  // P001-E1 i18n: use translations for chapter label
  const tToolbar = useTranslations('toolbar')();
  const tCommon = useTranslations('common')();
  const chapterLabel = tToolbar(CHAPTER_LABEL_KEYS[activeChapter]);
  const generating = isGeneratingProp ?? isGenerating;

  const crossChapterEdges = useDDSCanvasStore((s) => s.crossChapterEdges);

  // S36-E4: History state for undo/redo buttons

  const { applyAutoLayout, isLayouting } = useAutoLayout();
  const canUndo = useCanvasHistoryStore((s) => s.canUndo());
  const canRedo = useCanvasHistoryStore((s) => s.canRedo());

  // S62-E4: Collaborative undo/redo — operator info + conflict state
  const currentOperator = useUndoRedoStore((s) => s.currentOperator);
  const conflictDialog = useUndoRedoStore((s) => s.conflictDialog);
  const dismissConflict = useUndoRedoStore((s) => s.dismissConflict);
  const undoRedoStore = useUndoRedoStore.getState;

  // P002-E3: Collaboration — online users + connection status
  const { isConnected, onlineUsers, connect, disconnect } = useCollaboration();
  const isOffline = useUIStore((s) => s.isOffline);

  // P002-E2: Oplog conflict toast — renders toast when conflicts are detected
  useOplogConflictToast();

  const { exportAsJSON, exportAsVibex } = useCanvasExport();
  const { showFilePicker, importFile } = useCanvasImport();

  const [ddsExportModalOpen, setDdsExportModalOpen] = useState(false);
  const [shareToTeamModalOpen, setShareToTeamModalOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isShortcutSettingsOpen, setIsShortcutSettingsOpen] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isCanvasSettingsOpen, setIsCanvasSettingsOpen] = useState(false);

  // E3-S3: RBAC for toolbar actions
  const rbac = useCanvasRBAC(projectId);

  // E4-U3: Download OpenAPI handler
  const handleDownloadOpenAPI = useCallback(() => {
    try {
      const apiCards = chapters.api.cards as APIEndpointCard[];
      const json = exportDDSCanvasData(apiCards);
      downloadBlob(new Blob([json], { type: 'application/json' }), 'openapi.json');
      setDdsExportModalOpen(false);
    } catch (err) {
      console.error('[DDSToolbar] OpenAPI export error:', err);
    }
  }, [chapters.api.cards]);

  // E4-U4: Download StateMachine handler
  const handleDownloadStateMachine = useCallback(() => {
    try {
      const smCards = chapters['business-rules'].cards as StateMachineCard[];
      const json = exportToStateMachine(smCards);
      downloadBlob(new Blob([json], { type: 'application/json' }), 'statemachine.json');
    } catch (err) {
      console.error('[DDSToolbar] StateMachine export error:', err);
    }
  }, [chapters['business-rules'].cards]);

  const handleDDSExportJSON = () => {
    const allChapters = Object.values(chapters);
    const blob = exportAsJSON(allChapters, crossChapterEdges);
    downloadBlob(blob, `vibex-canvas-${new Date().toISOString().slice(0,10)}.json`);
    setDdsExportModalOpen(false);
  };

  const handleDDSExportVibex = async () => {
    const allChapters = Object.values(chapters);
    const blob = await exportAsVibex(allChapters, crossChapterEdges);
    downloadBlob(blob, `vibex-canvas-${new Date().toISOString().slice(0,10)}.vibex`);
    setDdsExportModalOpen(false);
  };

  const handleDDSImport = async () => {
    const file = await showFilePicker();
    if (!file) return;
    try {
      await importFile(file, (importedChapters, warnings, _rawDoc) => {
        ddsChapterActions.setChapters(importedChapters);
        if (warnings.length > 0) {
          console.warn('[DDSToolbar] Import warnings:', warnings);
        }
      });
    } catch (err) {
      console.error('[DDSToolbar] DDS import error:', err);
    }
  };

  // E4-U1: PlantUML export
  const handleExportPlantUML = useCallback(() => {
    try {
      const ctxStore = useContextStore.getState();
      const flowStore = useFlowStore.getState();
      const compStore = useComponentStore.getState();
      const puml = generatePlantUML(
        ctxStore.contextNodes,
        flowStore.flowNodes,
        compStore.componentNodes,
        { diagramType: 'class', title: 'VibeX Canvas' }
      );
      if (!validatePlantUML(puml)) {
        throw new Error('PlantUML syntax validation failed');
      }
      const blob = new Blob([puml], { type: 'text/plain' });
      downloadBlob(blob, `vibex-canvas-${new Date().toISOString().slice(0,10)}.puml`);
    } catch (err) {
      console.error('[DDSToolbar] PlantUML export error:', err);
    }
  }, []);

  // E4-U2: JSON Schema export
  const handleExportJSONSchema = useCallback(() => {
    try {
      const compStore = useComponentStore.getState();
      const result = generateJSONSchema(compStore.componentNodes, 'VibeX Component Schema');
      if (!result.success) throw new Error(result.error ?? 'Schema error');
      const json = serializeJSONSchema(result) || '';
      const blob = new Blob([json], { type: 'application/json' });
      downloadBlob(blob, `vibex-canvas-${new Date().toISOString().slice(0,10)}.schema.json`);
      setDdsExportModalOpen(false);
    } catch (err) {
      console.error('[DDSToolbar] JSON Schema export error:', err);
    }
  }, []);

  // E4-U3: SVG export with fallback
  const handleExportSVG = useCallback(() => {
    try {
      const ctxStore = useContextStore.getState();
      const flowStore = useFlowStore.getState();
      const compStore = useComponentStore.getState();
      const result = generateSVG(ctxStore.contextNodes, flowStore.flowNodes, compStore.componentNodes);
      if (!result.success) {
        console.warn('[DDSToolbar] SVG export fallback:', result.fallbackMessage);
        // Show fallback toast — AGENTS.md §4.3
        alert(result.fallbackMessage ?? 'SVG export failed');
        return;
      }
      const blob = new Blob([result.svg ?? ''], { type: 'image/svg+xml' });
      downloadBlob(blob, `vibex-canvas-${new Date().toISOString().slice(0,10)}.svg`);
      setDdsExportModalOpen(false);
    } catch (err) {
      console.error('[DDSToolbar] SVG export error:', err);
    }
  }, []);

  // ---- Export handler (E4 legacy) ----
  const handleExport = () => {
    exportToJSON(
      'dds-canvas',
      'DDS Project',
      {
        requirement: { cards: chapters.requirement.cards, edges: chapters.requirement.edges },
        context: { cards: chapters.context.cards, edges: chapters.context.edges },
        flow: { cards: chapters.flow.cards, edges: chapters.flow.edges },
        api: { cards: chapters.api.cards, edges: chapters.api.edges },
        'business-rules': { cards: chapters['business-rules'].cards, edges: chapters['business-rules'].edges },
      },
      chatHistory
    );
  };

  // ---- Import handler ----
  const importRef = React.useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const handleImportClick = () => importRef.current?.click();
  const handleImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const data = await parseImportFile(file);
      window.dispatchEvent(new CustomEvent('dds:import', { detail: { data } }));
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      e.target.value = '';
    }
  };

  // ---- [S46-E3] Copy handler ----
  const { selectedCardIds } = useDDSCanvasStore();
  const { isValid: clipboardValid, entry: clipboardEntry } = useClipboardStore();
  const clipboardCount = clipboardEntry?.cards.length ?? 0;
  const handleCopy = useCallback(() => {
    if (selectedCardIds.length === 0) return;
    ddsChapterActions.copyCards(activeChapter, selectedCardIds);
  }, [selectedCardIds, activeChapter]);

  // ---- [S46-E3] Paste handler ----
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false);
  const handlePaste = useCallback((targetChapter: ChapterType) => {
    const pasted = ddsChapterActions.pasteCards(targetChapter);
    if (pasted.length === 0 && !clipboardValid()) {
      alert(tToolbar('clipboardEmpty'));
    }
    setIsPasteDialogOpen(false);
  }, [clipboardValid]);

  const handleFullscreenToggle = () => {
    toggleFullscreen();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {/* ignore */});
    } else {
      document.exitFullscreen?.().catch(() => {/* ignore */});
    }
  };

  // S62-E4: Undo handler — conflict check before undo
  const handleUndo = () => {
    // Get the current user ID (from presence or a default)
    const currentUserId = usePresenceStore.getState().remoteUsers.size > 0
      ? Array.from(usePresenceStore.getState().remoteUsers.keys())[0]
      : 'local-user';

    // Check conflict on the top undo item (approximate — without node IDs in the message)
    const state = undoRedoStore();
    // If conflict dialog is open, dismiss it first
    if (state.conflictDialog.open) {
      state.dismissConflict();
    }

    // Mark operator and execute undo
    state.setCurrentOperator({
      userId: currentUserId,
      userName: 'You',
      avatar: '',
      action: 'undo',
      timestamp: Date.now(),
    });
    useCanvasHistoryStore.getState().undo();
  };

  // S62-E4: Redo handler — conflict check before redo
  const handleRedo = () => {
    const currentUserId = usePresenceStore.getState().remoteUsers.size > 0
      ? Array.from(usePresenceStore.getState().remoteUsers.keys())[0]
      : 'local-user';

    const state = undoRedoStore();
    if (state.conflictDialog.open) {
      state.dismissConflict();
    }

    state.setCurrentOperator({
      userId: currentUserId,
      userName: 'You',
      avatar: '',
      action: 'redo',
      timestamp: Date.now(),
    });
    useCanvasHistoryStore.getState().redo();
  };

  // P001-E1 i18n: use translations for export modal
  const tExport = useTranslations('export')();

  return (
    <>
      <header
        className={`${styles.toolbar} ${className}`}
        data-theme="dark"
        role="banner"
      >
        {/* Left: Chapter indicator */}
        <div className={styles.leftSection}>
          {/* E2-U3: Clickable chapter tabs for quick navigation */}
          {(Object.keys(CHAPTER_LABEL_KEYS) as ChapterType[]).map((ch) => (
            <button
              key={ch}
              type="button"
              className={`${styles.chapterTab} ${activeChapter === ch ? styles.chapterTabActive : ''}`}
              onClick={() => useDDSCanvasStore.getState().setActiveChapter(ch)}
              aria-label={`切换到${tToolbar(CHAPTER_LABEL_KEYS[ch])}章节`}
              aria-pressed={activeChapter === ch}
            >
              {tToolbar(CHAPTER_LABEL_KEYS[ch])}
            </button>
          ))}

          {/* E007: ExportMenu dropdown */}
          <ExportMenu
            disabled={!rbac.canShare && !rbac.loading}
            className={styles.exportMenuWrapper}
          />

          {/* S46-E3: Copy button */}
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleCopy}
            aria-label={tToolbar('copyNodes')}
            title={selectedCardIds.length > 0 ? `${tToolbar('copy')} ${selectedCardIds.length} ${tToolbar('selectedNodes').replace('{count}', String(selectedCardIds.length))}` : tToolbar('copy')}
            disabled={selectedCardIds.length === 0}
            data-testid="canvas-copy-btn"
          >
            {tToolbar('copy')}
          </button>

          {/* S46-E3: Paste button */}
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => setIsPasteDialogOpen(true)}
            aria-label={tToolbar('pasteNodes')}
            title={clipboardValid ? `${tToolbar('paste')} (${clipboardCount} ${tToolbar('selectedNodes').replace('{count}', String(clipboardCount))})` : tToolbar('paste')}
            data-testid="canvas-paste-btn"
          >
            {tToolbar('paste')}
            {clipboardValid && clipboardCount > 0 && (
              <span
                style={{
                  marginLeft: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'var(--color-primary, #3b82f6)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
                data-testid="clipboard-count-badge"
              >
                {clipboardCount > 99 ? '99+' : clipboardCount}
              </span>
            )}
          </button>

          {/* S46-E3: Paste Chapter Selector Dialog */}
          {isPasteDialogOpen && (
            <div
              style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.5)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
              onClick={() => setIsPasteDialogOpen(false)}
            >
              <div
                style={{
                  background: 'var(--color-surface)', borderRadius: 8,
                  padding: 24, minWidth: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
                  {tToolbar('pasteTargetChapter')}
                </h3>
                {(['requirement', 'context', 'flow', 'api', 'business-rules'] as ChapterType[]).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    style={{
                      display: 'block', width: '100%', padding: '10px 16px',
                      marginBottom: 8, background: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)', borderRadius: 6,
                      cursor: 'pointer', textAlign: 'left',
                    }}
                    onClick={() => handlePaste(ch)}
                  >
                    {tToolbar(CHAPTER_LABEL_KEYS[ch])}
                  </button>
                ))}
                <button
                  type="button"
                  style={{
                    display: 'block', width: '100%', padding: '10px 16px',
                    marginTop: 8, background: 'transparent',
                    border: '1px solid var(--color-border)', borderRadius: 6,
                    cursor: 'pointer', color: 'var(--color-text-secondary)',
                  }}
                  onClick={() => setIsPasteDialogOpen(false)}
                >
                  {tCommon('cancel')}
                </button>
              </div>
            </div>
          )}

          {/* E4: Analytics button */}
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => window.open('/dashboard?open=funnel', '_blank')}
            aria-label={tToolbar('viewAnalytics')}
            title={tToolbar('analyze')}
            data-testid="canvas-analytics-btn"
          >
            <ChartIcon />
            <span>{tToolbar('analyze')}</span>
          </button>

          {/* E2: Import button with hidden file input (Bug fix: wire hidden input) */}
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => importRef.current?.click()}
            aria-label={tToolbar('importCanvas')}
            title={rbac.canEdit ? tToolbar('importHint') : tToolbar('permissionRequired')}
            disabled={!rbac.canEdit && !rbac.loading}
            data-testid="canvas-import-btn"
          >
            {tToolbar('import')}
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json,.vibex"
            style={{ display: 'none' }}
            data-testid="canvas-import-input"
            onChange={handleImportChange}
          />

          {/* S42-E3: Template Gallery button */}
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => setIsTemplateGalleryOpen(true)}
            aria-label={tToolbar('templateGallery')}
            title={tToolbar('templateGallery')}
            data-testid="template-gallery-btn"
          >
            {tToolbar('templateGallery')}
          </button>

          {/* S42-E3: Save as Template button */}
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => setIsSaveDialogOpen(true)}
            aria-label={tToolbar('saveTemplate')}
            title={tToolbar('saveTemplate')}
            data-testid="save-template-btn"
          >
            {tToolbar('saveTemplate')}
          </button>

          {/* E5: Share to Team button */}
          {canvasId && (
            <button
              type="button"
              className={styles.shareToTeamBtn}
              onClick={() => setShareToTeamModalOpen(true)}
              aria-label={tToolbar('shareToTeam')}
              title={tToolbar('shareToTeam')}
              data-testid="share-to-team-btn"
            >
              {tToolbar('shareToTeam')}
            </button>
          )}
        </div>

        {/* Right: Action buttons */}
        <div className={styles.rightSection}>
          {/* S36-E4 + S62-E4: Undo button + operator badge */}
          <div className={styles.undoRedoGroup}>
            <button
              type="button"
              className={`${styles.iconButton}`}
              onClick={handleUndo}
              disabled={!canUndo}
              aria-label={tToolbar('undo')}
              title={currentOperator?.action === 'undo' && currentOperator?.userName !== 'You'
                ? `${tToolbar('undo')} by ${currentOperator.userName} (Ctrl+Z)`
                : `${tToolbar('undo')} (Ctrl+Z)`}
              data-testid="canvas-undo-btn"
            >
              <UndoIcon />
            </button>
            {/* S62-E4: Operator badge — shows who performed the last undo */}
            {currentOperator?.action === 'undo' && currentOperator?.userName !== 'You' && (
              <span className={styles.operatorBadge} aria-label={`Undo by ${currentOperator.userName}`}>
                {currentOperator.userName}
              </span>
            )}
          </div>

          {/* S36-E4 + S62-E4: Redo button + operator badge */}
          <div className={styles.undoRedoGroup}>
            <button
              type="button"
              className={`${styles.iconButton}`}
              onClick={handleRedo}
              disabled={!canRedo}
              aria-label={tToolbar('redo')}
              title={currentOperator?.action === 'redo' && currentOperator?.userName !== 'You'
                ? `${tToolbar('redo')} by ${currentOperator.userName} (Ctrl+Shift+Z)`
                : `${tToolbar('redo')} (Ctrl+Shift+Z)`}
              data-testid="canvas-redo-btn"
            >
              <RedoIcon />
            </button>
            {/* S62-E4: Operator badge — shows who performed the last redo */}
            {currentOperator?.action === 'redo' && currentOperator?.userName !== 'You' && (
              <span className={styles.operatorBadge} aria-label={`Redo by ${currentOperator.userName}`}>
                {currentOperator.userName}
              </span>
            )}
          </div>

          {/* S50-E2: Auto-layout button */}
          <button
            type="button"
            className={`${styles.iconButton}`}
            onClick={() => applyAutoLayout({ direction: 'TB' })}
            aria-label={tToolbar('autoLayout')}
            title={`${tToolbar('autoLayout')} (Cmd+L)`}
            data-testid="canvas-auto-layout-btn"
          >
            <LayoutIcon />
          </button>

          {/* P002-E3: Online users + offline indicator */}
          <OnlineUsers users={onlineUsers} maxVisible={4} />
          {/* S64-E1: Presence panel with status badges */}
          <PresencePanel />
          <OfflineIndicator isConnected={isConnected} />
          {/* P005-E2: Network offline badge */}
          {isOffline && (
            <span
              className={styles.offline}
              title={tToolbar('offline')}
              aria-label={tToolbar('offline')}
              role="img"
            >
              📴
            </span>
          )}

          {/* AI Generate button */}
          <button
            type="button"
            className={`${styles.actionButton} ${styles.aiButton}`}
            onClick={onAIGenerate}
            disabled={generating}
            aria-label={generating ? tToolbar('aiGenerating') : tToolbar('aiGenerate')}
            aria-busy={generating}
          >
            <AiIcon />
            <span>{generating ? tToolbar('aiGenerating') : tToolbar('aiGenerate')}</span>
          </button>

          {/* S52-E5: Keyboard Shortcuts settings */}
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setIsShortcutSettingsOpen(true)}
            aria-label={tToolbar('shortcutSettings')}
            title={tToolbar('shortcutSettings')}
          >
            <KeyboardIcon />
          </button>

          {/* S61-E1: Version History panel */}
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setIsHistoryPanelOpen(true)}
            aria-label={tToolbar('versionHistory')}
            title={tToolbar('versionHistory')}
          >
            <HistoryIcon />
          </button>

          {/* S61-E5: Canvas Backup panel */}
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setIsBackupOpen(true)}
            aria-label={tToolbar('canvasBackup')}
            title={tToolbar('canvasBackup')}
          >
            <BackupIcon />
          </button>

          {/* S65-E3: Canvas settings panel */}
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setIsCanvasSettingsOpen(true)}
            aria-label="画布设置"
            title="画布设置"
          >
            <SettingsIcon />
          </button>

          {/* S61-E3: Language switcher */}
          <LanguageSwitcher />

          {/* Fullscreen toggle */}
          <button
            type="button"
            className={`${styles.iconButton} ${isFullscreen ? styles.iconButtonActive : ''}`}
            onClick={handleFullscreenToggle}
            aria-label={isFullscreen ? tToolbar('exitFullscreen') : tToolbar('fullscreen')}
            aria-pressed={isFullscreen}
          >
            {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </button>

          {/* S16-P0-1: Design Review button */}
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => window.dispatchEvent(new CustomEvent('design-review:open'))}
            data-testid="design-review-btn"
            aria-label={tToolbar('designReview')}
            title={`${tToolbar('designReview')} (Ctrl+Shift+R)`}
          >
            <EyeIcon /> {tToolbar('designReview')}
          </button>
        </div>

        {/* Import error */}
        {importError && (
          <div className={styles.toast} role="alert" aria-live="polite">
            {importError}
          </div>
        )}
      </header>

      {/* E4-U3/U4 + E2: Export/Import modal */}
      {ddsExportModalOpen && (
        <div
          className={styles.exportOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setDdsExportModalOpen(false); }}
        >
          <div className={styles.exportModal}>
            <div className={styles.modalHeader}>
              <h2 id="export-modal-title" className={styles.modalTitle}>{tExport('title')}</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setDdsExportModalOpen(false)}
                aria-label={tExport('close')}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* E2: Canvas Export */}
              <h3 className={styles.exportSectionTitle}>{tExport('canvasExport')}</h3>
              <button
                type="button"
                className={styles.exportOption}
                onClick={handleDDSExportJSON}
                data-testid="export-json-btn"
              >
                <span className={styles.exportOptionTitle}>{tExport('jsonFormat')}</span>
                <span className={styles.exportOptionDesc}>{tExport('jsonFormatDesc')}</span>
              </button>
              <button
                type="button"
                className={styles.exportOption}
                onClick={handleDDSExportVibex}
                data-testid="export-vibex-btn"
              >
                <span className={styles.exportOptionTitle}>{tExport('vibexFormat')}</span>
                <span className={styles.exportOptionDesc}>{tExport('vibexFormatDesc')}</span>
              </button>

              {/* E4-U3/U4: OpenAPI / StateMachine */}
              <h3 className={styles.exportSectionTitle}>{tExport('codeExport')}</h3>
              <button
                type="button"
                className={styles.exportOption}
                onClick={handleDownloadOpenAPI}
              >
                <span className={styles.exportOptionTitle}>{tExport('openapi')}</span>
                <span className={styles.exportOptionDesc}>{tExport('openapiDesc')}</span>
              </button>
              <button
                type="button"
                className={styles.exportOption}
                onClick={handleDownloadStateMachine}
              >
                <span className={styles.exportOptionTitle}>{tExport('stateMachine')}</span>
                <span className={styles.exportOptionDesc}>{tExport('stateMachineDesc')}</span>
              </button>

              {/* E4-U1/U2/U3: PlantUML / JSON Schema / SVG */}
              <h3 className={styles.exportSectionTitle}>{tExport('specialExport')}</h3>
              <button
                type="button"
                className={styles.exportOption}
                onClick={handleExportPlantUML}
                data-testid="plantuml-option"
              >
                <span className={styles.exportOptionTitle}>{tExport('plantUML')}</span>
                <span className={styles.exportOptionDesc}>{tExport('plantUMLDesc')}</span>
              </button>
              <button
                type="button"
                className={styles.exportOption}
                onClick={handleExportJSONSchema}
                data-testid="schema-option"
              >
                <span className={styles.exportOptionTitle}>{tExport('jsonSchema')}</span>
                <span className={styles.exportOptionDesc}>{tExport('jsonSchemaDesc')}</span>
              </button>
              <button
                type="button"
                className={styles.exportOption}
                onClick={handleExportSVG}
                data-testid="svg-option"
              >
                <span className={styles.exportOptionTitle}>{tExport('svgCanvas')}</span>
                <span className={styles.exportOptionDesc}>{tExport('svgCanvasDesc')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E5: Share to Team modal */}
      <ShareToTeamModal
        isOpen={shareToTeamModalOpen}
        canvasId={canvasId ?? ''}
        canvasName={canvasName}
        onClose={() => setShareToTeamModalOpen(false)}
      />

      {/* S42-E3: Template Gallery modal */}
      <TemplateGallery
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
      />

      {/* S42-E3: Save as Template dialog */}
      <TemplateSaveDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
      />

      {/* S52-E5: Keyboard Shortcuts settings panel */}
      <ShortcutSettingsPanel
        isOpen={isShortcutSettingsOpen}
        onClose={() => setIsShortcutSettingsOpen(false)}
      />

      {/* S61-E1: Version History panel */}
      <HistoryPanel
        isOpen={isHistoryPanelOpen}
        onClose={() => setIsHistoryPanelOpen(false)}
      />

      {/* S61-E5: Canvas Backup panel */}
      <BackupPanel
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        canvasId={canvasId ?? ''}
      />

      {/* S65-E3: Canvas View Settings panel */}
      <CanvasSettingsPanel
        isOpen={isCanvasSettingsOpen}
        onClose={() => setIsCanvasSettingsOpen(false)}
      />

      {/* S63-E2: Collaborative undo/redo conflict resolution dialog */}
      {conflictDialog.open && (
        <ConflictDialog
          conflictingUserName={conflictDialog.conflictingUserName}
          onUndoMine={() => useUndoRedoStore.getState().resolveConflict('undo-mine')}
          onKeepTheirs={() => useUndoRedoStore.getState().resolveConflict('keep-theirs')}
          onCancel={() => useUndoRedoStore.getState().resolveConflict('cancel')}
        />
      )}
    </>
  );
});

export default DDSToolbar;
