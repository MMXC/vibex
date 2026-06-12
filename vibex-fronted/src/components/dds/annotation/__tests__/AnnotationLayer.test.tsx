/**
 * AnnotationLayer.test.tsx — S90-E4
 * Tests for AnnotationLayer component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AnnotationLayer } from '../AnnotationLayer';
import { useAnnotationStore } from '../annotationStore';
import type { Annotation } from '../annotationStore';

vi.mock('../annotationStore', () => {
  const actual = vi.importActual('../annotationStore');
  return {
    ...actual as object,
    useAnnotationStore: vi.fn(),
  };
});

const mockAddAnnotation = vi.fn();
const mockEditAnnotation = vi.fn();
const mockResolveAnnotation = vi.fn();
const mockDeleteAnnotation = vi.fn();
const mockSetAnnotations = vi.fn();

const CANVAS_ID = 'test-canvas-1';
const USER_ID = 'user-1';

const DEFAULT_VIEWPORT = { scale: 1, panX: 0, panY: 0 };

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'ann-1',
    canvasId: CANVAS_ID,
    content: 'Test annotation',
    x: 100,
    y: 200,
    type: 'text',
    authorId: USER_ID,
    authorName: 'Test User',
    color: '#6366F1',
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function setupMockStore(annotations: Annotation[] = []) {
  (useAnnotationStore as ReturnType<typeof vi.fn>).mockReturnValue({
    annotations,
    get activeAnnotations() { return annotations; },
    addAnnotation: mockAddAnnotation,
    editAnnotation: mockEditAnnotation,
    resolveAnnotation: mockResolveAnnotation,
    deleteAnnotation: mockDeleteAnnotation,
    setAnnotations: mockSetAnnotations,
  });
}

describe('AnnotationLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnnotationStore.getState().clearAnnotations();
    setupMockStore([]);
  });

  // ─── Rendering ───────────────────────────────────────────────────────────────

  it('renders nothing when no annotations', () => {
    setupMockStore([]);
    render(
      <AnnotationLayer
        viewport={DEFAULT_VIEWPORT}
        canvasId={CANVAS_ID}
        userId={USER_ID}
        userName="Test User"
        userColor="#6366F1"
      />
    );

    // No bubbles rendered
    expect(screen.queryAllByTitle('Edit')).toHaveLength(0);
  });

  it('renders annotation bubbles for active annotations', () => {
    const ann = makeAnnotation();
    setupMockStore([ann]);

    render(
      <AnnotationLayer
        viewport={DEFAULT_VIEWPORT}
        canvasId={CANVAS_ID}
        userId={USER_ID}
        userName="Test User"
      />
    );

    // Annotation content should be visible
    expect(screen.getByText('Test annotation')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('hides owner action buttons for non-owner annotations', () => {
    const ann = makeAnnotation({ authorId: 'other-user' });
    setupMockStore([ann]);

    render(
      <AnnotationLayer
        viewport={DEFAULT_VIEWPORT}
        canvasId={CANVAS_ID}
        userId={USER_ID}
        userName="Test User"
      />
    );

    // No edit/resolve/delete buttons for non-owner
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
  });

  // ─── Transform ──────────────────────────────────────────────────────────────

  it('applies CSS transform from viewport props', () => {
    const viewport = { scale: 0.5, panX: 100, panY: 200 };
    setupMockStore([]);

    const { container } = render(
      <AnnotationLayer
        viewport={viewport}
        canvasId={CANVAS_ID}
        userId={USER_ID}
      />
    );

    const layer = container.querySelector('[class*="layer"]');
    expect(layer).toBeTruthy();
    const style = layer!.getAttribute('style') || '';
    expect(style).toContain('scale(0.5)');
    expect(style).toContain('translate(100px, 200px)');
  });

  // ─── Annotation Creation ────────────────────────────────────────────────────

  it('shows edit mode cursor when editMode=true', () => {
    setupMockStore([]);

    const { container } = render(
      <AnnotationLayer
        viewport={DEFAULT_VIEWPORT}
        canvasId={CANVAS_ID}
        userId={USER_ID}
        editMode={true}
      />
    );

    const layer = container.querySelector('[class*="editMode"]');
    expect(layer).toBeTruthy();
  });

  it('loads annotations from API on canvasId change', () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        annotations: [makeAnnotation({ id: 'api-1', content: 'From API' })],
      }),
    } as unknown as Response);

    setupMockStore([]);

    render(
      <AnnotationLayer
        viewport={DEFAULT_VIEWPORT}
        canvasId={CANVAS_ID}
        userId={USER_ID}
        apiBase="/api"
      />
    );

    // Should have called the API
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(`/canvas/annotations?canvasId=${CANVAS_ID}`)
    );

    fetchSpy.mockRestore();
  });

  // ─── Arrow annotations ──────────────────────────────────────────────────────

  it('renders arrow SVG for type=arrow annotations', () => {
    const ann = makeAnnotation({
      type: 'arrow',
      endX: 200,
      endY: 300,
      content: '',
    });
    setupMockStore([ann]);

    const { container } = render(
      <AnnotationLayer
        viewport={DEFAULT_VIEWPORT}
        canvasId={CANVAS_ID}
        userId={USER_ID}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
