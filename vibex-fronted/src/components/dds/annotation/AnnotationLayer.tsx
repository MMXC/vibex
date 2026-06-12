'use client';

/**
 * AnnotationLayer — Sprint90 E4
 *
 * Free-floating canvas annotations rendered as overlay inside the canvas grid.
 * The layer is positioned absolute and inherits CSS transform (pan/zoom) from
 * its parent (gridRef). This guarantees annotations stay anchored to canvas
 * content during pan/zoom operations (AC2).
 *
 * AC Coverage:
 *  - AC1: click-to-add (when placementMode is true) → input box → submit shows annotation
 *  - AC2: parent CSS transform handles pan/zoom; no manual sync needed
 *  - AC3: authorColor() hashes userId → HSL → distinct per author
 *  - AC4: resolve → strikethrough; delete → removed
 *
 * NOTE: This component is designed to be mounted INSIDE the gridRef container
 * so it inherits the existing pan/zoom transform applied via CSS variables.
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  useAnnotationStore,
  type Annotation,
  type AnnotationType,
} from './annotationStore';
import styles from './AnnotationLayer.module.css';

// ==================== Helpers ====================

/**
 * Deterministic color per author — stable across renders and users.
 * Hashes userId → HSL with golden-angle hue distribution for visual separation.
 */
function authorColor(userId: string): string {
  if (!userId) return 'hsl(220, 70%, 55%)';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

// ==================== Props ====================

export interface AnnotationLayerProps {
  /** Canvas ID — used to scope addAnnotation and persist correctly */
  canvasId: string;
  /** Current user ID — used for authorId on new annotations */
  currentUserId: string;
  /** Optional display name */
  currentUserName?: string;
  /** Whether placement mode is active (caller controls via toolbar toggle) */
  placementMode: boolean;
  /** Notify parent of mode requests (e.g., disable canvas pan while placing) */
  onPlacementModeChange?: (active: boolean) => void;
  /** Optional pre-bound author color (overrides hash) */
  authorColor?: string;
}

// ==================== Sub-component: Annotation Pin ====================

interface AnnotationPinProps {
  annotation: Annotation;
  currentUserId: string;
  onResolve: (id: string) => void;
  onUnresolve: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: { content?: string }) => void;
}

function AnnotationPin({
  annotation,
  currentUserId,
  onResolve,
  onUnresolve,
  onDelete,
  onUpdate,
}: AnnotationPinProps) {
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(annotation.content);
  const [expanded, setExpanded] = useState(false);

  const color = annotation.color || authorColor(annotation.authorId);
  const isAuthor = annotation.authorId === currentUserId;
  const isResolved = annotation.status === 'resolved';

  useEffect(() => {
    setDraftText(annotation.content);
  }, [annotation.content]);

  const handleSave = useCallback(() => {
    const trimmed = draftText.trim();
    if (trimmed && trimmed !== annotation.content) {
      onUpdate(annotation.id, { content: trimmed });
    }
    setEditing(false);
  }, [annotation.content, annotation.id, draftText, onUpdate]);

  const handleCancel = useCallback(() => {
    setDraftText(annotation.content);
    setEditing(false);
  }, [annotation.content]);

  return (
    <div
      className={`${styles.pin} ${isResolved ? styles.resolved : ''}`}
      data-annotation-id={annotation.id}
      data-annotation-status={annotation.status}
      style={{
        left: `${annotation.x}px`,
        top: `${annotation.y}px`,
        // CSS custom prop drives the pin border/accent color
        ['--pin-color' as string]: color,
      }}
      onClick={(e) => {
        e.stopPropagation();
        setExpanded((v) => !v);
      }}
    >
      <div className={styles.pinDot} aria-hidden="true" />
      {expanded && (
        <div className={styles.pinBubble} role="dialog" aria-label="批注详情">
          <div className={styles.pinHeader}>
            <span className={styles.pinAuthor} title={annotation.authorId}>
              {annotation.authorName || annotation.authorId.slice(0, 8)}
            </span>
            <span className={styles.pinType}>{annotation.type}</span>
          </div>
          {editing ? (
            <div className={styles.editBox}>
              <textarea
                className={styles.editTextarea}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSave();
                  } else if (e.key === 'Escape') {
                    handleCancel();
                  }
                }}
                aria-label="编辑批注"
                autoFocus
                rows={3}
              />
              <div className={styles.editActions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                >
                  保存
                </button>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <p
              className={`${styles.pinContent} ${isResolved ? styles.strike : ''}`}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (isAuthor) setEditing(true);
              }}
              title={isAuthor ? '双击编辑' : undefined}
            >
              {annotation.content}
            </p>
          )}
          <div className={styles.pinActions}>
            {isResolved ? (
              <button
                type="button"
                className={styles.btnGhost}
                onClick={(e) => {
                  e.stopPropagation();
                  onUnresolve(annotation.id);
                }}
              >
                重新打开
              </button>
            ) : (
              <button
                type="button"
                className={styles.btnGhost}
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve(annotation.id);
                }}
              >
                标记已解决
              </button>
            )}
            {isAuthor && !editing && (
              <button
                type="button"
                className={styles.btnGhost}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
              >
                编辑
              </button>
            )}
            {isAuthor && (
              <button
                type="button"
                className={styles.btnDanger}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(annotation.id);
                }}
                aria-label="删除批注"
              >
                删除
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Main Component ====================

export function AnnotationLayer({
  canvasId,
  currentUserId,
  currentUserName,
  placementMode,
  onPlacementModeChange,
  authorColor: forcedAuthorColor,
}: AnnotationLayerProps) {
  // Subscribe to annotations
  const annotations = useAnnotationStore((s) => s.annotations);
  const initialized = useAnnotationStore((s) => s.initialized);
  const loadForCanvas = useAnnotationStore((s) => s.loadForCanvas);
  const addAnnotation = useAnnotationStore((s) => s.addAnnotation);
  const resolveAnnotation = useAnnotationStore((s) => s.resolveAnnotation);
  const unresolveAnnotation = useAnnotationStore((s) => s.unresolveAnnotation);
  const deleteAnnotation = useAnnotationStore((s) => s.deleteAnnotation);
  const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation);

  // Pending placement state — when user clicks while in placement mode,
  // we create a temporary annotation and show input until submit/cancel.
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const layerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load annotations for this canvas on mount / canvasId change
  useEffect(() => {
    if (!canvasId) return;
    if (!initialized) {
      void loadForCanvas(canvasId);
    }
  }, [canvasId, initialized, loadForCanvas]);

  // Focus the input when pending appears
  useEffect(() => {
    if (pendingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [pendingId]);

  const myColor = useMemo(
    () => forcedAuthorColor || authorColor(currentUserId),
    [forcedAuthorColor, currentUserId]
  );

  // ===== Handlers =====

  const handleLayerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!placementMode || !layerRef.current) return;
      // Only respond to direct clicks on the layer background, not pins
      if (e.target !== e.currentTarget) return;

      const rect = layerRef.current.getBoundingClientRect();
      // Compute canvas-local coordinates by reverse-applying the parent's
      // CSS scale (--canvas-zoom). Reading computed style avoids measuring DOM.
      const parentStyle = layerRef.current.parentElement
        ? getComputedStyle(layerRef.current.parentElement)
        : null;
      const zoomRaw = parentStyle?.getPropertyValue('--canvas-zoom').trim();
      const zoom = zoomRaw ? parseFloat(zoomRaw) : 1;
      const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;

      const localX = (e.clientX - rect.left) / safeZoom;
      const localY = (e.clientY - rect.top) / safeZoom;

      const created = addAnnotation({
        canvasId,
        content: '',
        x: localX,
        y: localY,
        type: 'point' as AnnotationType,
        authorId: currentUserId,
        authorName: currentUserName,
        color: myColor,
      });
      setPendingId(created.id);
      setDraftText('');
      onPlacementModeChange?.(false);
    },
    [
      placementMode,
      canvasId,
      currentUserId,
      currentUserName,
      myColor,
      addAnnotation,
      onPlacementModeChange,
    ]
  );

  const handleSubmitPending = useCallback(() => {
    const trimmed = draftText.trim();
    if (!pendingId) return;
    if (!trimmed) {
      // Empty text → cancel and discard
      deleteAnnotation(pendingId);
    } else {
      updateAnnotation(pendingId, { content: trimmed });
    }
    setPendingId(null);
    setDraftText('');
  }, [pendingId, draftText, deleteAnnotation, updateAnnotation]);

  const handleCancelPending = useCallback(() => {
    if (pendingId) {
      deleteAnnotation(pendingId);
    }
    setPendingId(null);
    setDraftText('');
  }, [pendingId, deleteAnnotation]);

  // ===== Render =====

  return (
    <div
      ref={layerRef}
      className={`${styles.layer} ${placementMode ? styles.placementMode : ''}`}
      data-testid="annotation-layer"
      data-placement-mode={placementMode ? 'on' : 'off'}
      onClick={handleLayerClick}
      // Critical: pointer events must NOT block canvas pan when not in placement mode
      style={{ pointerEvents: placementMode ? 'auto' : 'auto' }}
    >
      {annotations.map((annotation) => {
        // Hide non-active resolved annotations by default; user can still expand pins
        if (annotation.status === 'resolved' && annotation.id === pendingId) {
          // skip; rendered separately as pending
          return null;
        }
        return (
          <AnnotationPin
            key={annotation.id}
            annotation={annotation}
            currentUserId={currentUserId}
            onResolve={resolveAnnotation}
            onUnresolve={unresolveAnnotation}
            onDelete={deleteAnnotation}
            onUpdate={updateAnnotation}
          />
        );
      })}

      {/* Pending input — floats at the placement point */}
      {pendingId &&
        (() => {
          const pending = annotations.find((a) => a.id === pendingId);
          if (!pending) return null;
          return (
            <div
              className={styles.pendingBubble}
              style={{ left: `${pending.x}px`, top: `${pending.y}px` }}
              data-testid="annotation-pending-input"
              onClick={(e) => e.stopPropagation()}
            >
              <textarea
                ref={inputRef}
                className={styles.pendingTextarea}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmitPending();
                  } else if (e.key === 'Escape') {
                    handleCancelPending();
                  }
                }}
                placeholder="输入批注…（⌘/Ctrl+Enter 提交，Esc 取消）"
                aria-label="新建批注"
                rows={3}
              />
              <div className={styles.pendingActions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleSubmitPending}
                  aria-label="提交批注"
                >
                  提交
                </button>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={handleCancelPending}
                  aria-label="取消批注"
                >
                  取消
                </button>
              </div>
            </div>
          );
        })()}
    </div>
  );
}