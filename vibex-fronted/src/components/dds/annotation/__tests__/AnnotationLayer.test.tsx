/**
 * AnnotationLayer.test.tsx — S90-E4
 * Tests for AnnotationLayer component
 * NOTE: Fixed mock to handle Zustand selector functions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
const mockUpdateAnnotation = vi.fn();
const mockResolveAnnotation = vi.fn();
const mockDeleteAnnotation = vi.fn();
const mockUnresolveAnnotation = vi.fn();
const mockLoadForCanvas = vi.fn();

const CANVAS_ID = 'test-canvas-1';
const USER_ID = 'user-1';

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

function makeMockState(annotations: Annotation[] = []) {
  return {
    annotations,
    initialized: true,
    loadingCanvasId: null,
    loadForCanvas: mockLoadForCanvas,
    addAnnotation: mockAddAnnotation,
    updateAnnotation: mockUpdateAnnotation,
    resolveAnnotation: mockResolveAnnotation,
    unresolveAnnotation: mockUnresolveAnnotation,
    deleteAnnotation: mockDeleteAnnotation,
  };
}

function setupMockStore(annotations: Annotation[] = []) {
  const state = makeMockState(annotations);
  (useAnnotationStore as ReturnType<typeof vi.fn>).mockImplementation(
    (selector?: (s: ReturnType<typeof useAnnotationStore>) => unknown) => {
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    }
  );
}

describe('AnnotationLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadForCanvas.mockResolvedValue(undefined);
    setupMockStore([]);
  });

  it('renders nothing when no annotations', () => {
    setupMockStore([]);
    render(
      <AnnotationLayer
        canvasId={CANVAS_ID}
        currentUserId={USER_ID}
        currentUserName="Test User"
        authorColor="#6366F1"
        placementMode={false}
      />
    );
    expect(screen.queryAllByTitle('Edit')).toHaveLength(0);
  });

  it('renders annotation pin for active annotations', () => {
    const ann = makeAnnotation();
    setupMockStore([ann]);
    render(
      <AnnotationLayer
        canvasId={CANVAS_ID}
        currentUserId={USER_ID}
        currentUserName="Test User"
        placementMode={false}
      />
    );
    // Annotation renders as a pin element (collapsed by default)
    expect(screen.getByTestId('annotation-layer')).toBeTruthy();
    const pin = screen.queryByTestId(/^$/); // no data-testid on pins; check via data-attr
    // The pin div has data-annotation-id
    const pinDiv = document.querySelector('[data-annotation-id="ann-1"]');
    expect(pinDiv).toBeTruthy();
    expect(pinDiv).toHaveAttribute('data-annotation-status', 'active');
  });

  it('hides owner action buttons for non-owner annotations', () => {
    const ann = makeAnnotation({ authorId: 'other-user' });
    setupMockStore([ann]);
    render(
      <AnnotationLayer
        canvasId={CANVAS_ID}
        currentUserId={USER_ID}
        currentUserName="Test User"
        placementMode={false}
      />
    );
    // Non-owner pins should not have Edit button
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
  });

  it('renders annotation layer with placement mode', () => {
    setupMockStore([]);
    render(
      <AnnotationLayer
        canvasId={CANVAS_ID}
        currentUserId={USER_ID}
        placementMode={true}
      />
    );
    // Layer renders with placement-mode data attribute
    expect(screen.getByTestId('annotation-layer')).toHaveAttribute('data-placement-mode', 'on');
  });

  it('does not call addAnnotation when placementMode is false', () => {
    setupMockStore([]);
    render(
      <AnnotationLayer
        canvasId={CANVAS_ID}
        currentUserId={USER_ID}
        currentUserName="Test User"
        placementMode={false}
      />
    );
    expect(mockAddAnnotation).not.toHaveBeenCalled();
  });

  it('is ready to receive addAnnotation calls in placement mode', () => {
    setupMockStore([]);
    render(
      <AnnotationLayer
        canvasId={CANVAS_ID}
        currentUserId={USER_ID}
        currentUserName="Test User"
        placementMode={true}
      />
    );
    // Verify the layer renders in placement mode and mock is configured
    expect(screen.getByTestId('annotation-layer')).toHaveAttribute('data-placement-mode', 'on');
  });
});
