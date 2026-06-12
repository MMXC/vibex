/**
 * annotationStore.test.ts — S90-E4
 * Tests for annotationStore state management
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useAnnotationStore, getActiveAnnotations, type Annotation } from '../annotationStore';

const CANVAS_ID = 'canvas-001';

function makeAnnotation(overrides: Partial<Annotation> = {}): Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    canvasId: CANVAS_ID,
    content: 'Test annotation',
    x: 100,
    y: 200,
    type: 'text',
    authorId: 'user-1',
    authorName: 'Test User',
    color: '#6366F1',
    status: 'active',
    ...overrides,
  };
}

describe('annotationStore', () => {
  beforeEach(() => {
    useAnnotationStore.getState().clearAnnotations();
  });

  // ─── addAnnotation ────────────────────────────────────────────────────────────

  it('addAnnotation creates annotation with auto-generated id and timestamps', () => {
    const partial = makeAnnotation();
    const annotation = useAnnotationStore.getState().addAnnotation(partial);

    expect(annotation.id).toBeTruthy();
    expect(annotation.createdAt).toBeGreaterThan(0);
    expect(annotation.updatedAt).toBeGreaterThan(0);
    expect(annotation.content).toBe('Test annotation');
    expect(annotation.canvasId).toBe(CANVAS_ID);
    expect(annotation.status).toBe('active');
  });

  it('addAnnotation appends to annotations array', () => {
    useAnnotationStore.getState().addAnnotation(makeAnnotation());
    useAnnotationStore.getState().addAnnotation(makeAnnotation({ content: 'Second' }));

    const { annotations } = useAnnotationStore.getState();
    expect(annotations).toHaveLength(2);
    expect(annotations[1].content).toBe('Second');
  });

  // ─── editAnnotation ──────────────────────────────────────────────────────────

  it('editAnnotation updates fields and refreshes updatedAt', () => {
    const { addAnnotation } = useAnnotationStore.getState();
    const ann = addAnnotation(makeAnnotation());
    const before = ann.updatedAt;

    useAnnotationStore.getState().editAnnotation(ann.id, { content: 'Updated content' });

    const updated = useAnnotationStore.getState().annotations.find(a => a.id === ann.id);
    expect(updated?.content).toBe('Updated content');
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it('editAnnotation only updates specified fields', () => {
    const { addAnnotation } = useAnnotationStore.getState();
    const ann = addAnnotation(makeAnnotation({ x: 100, y: 200 }));

    useAnnotationStore.getState().editAnnotation(ann.id, { x: 300 });

    const updated = useAnnotationStore.getState().annotations.find(a => a.id === ann.id);
    expect(updated?.x).toBe(300);
    expect(updated?.y).toBe(200); // unchanged
  });

  // ─── resolveAnnotation ──────────────────────────────────────────────────────

  it('resolveAnnotation sets status to resolved', () => {
    const { addAnnotation } = useAnnotationStore.getState();
    const ann = addAnnotation(makeAnnotation());

    useAnnotationStore.getState().resolveAnnotation(ann.id);

    const resolved = useAnnotationStore.getState().annotations.find(a => a.id === ann.id);
    expect(resolved?.status).toBe('resolved');
  });

  // ─── deleteAnnotation ───────────────────────────────────────────────────────

  it('deleteAnnotation removes annotation from store', () => {
    const { addAnnotation } = useAnnotationStore.getState();
    const ann = addAnnotation(makeAnnotation());

    useAnnotationStore.getState().deleteAnnotation(ann.id);

    const found = useAnnotationStore.getState().annotations.find(a => a.id === ann.id);
    expect(found).toBeUndefined();
    expect(useAnnotationStore.getState().annotations).toHaveLength(0);
  });

  // ─── setAnnotations ─────────────────────────────────────────────────────────

  it('setAnnotations replaces all annotations', () => {
    const { addAnnotation, setAnnotations } = useAnnotationStore.getState();
    addAnnotation(makeAnnotation());
    addAnnotation(makeAnnotation({ content: 'Two' }));

    const newAnns: Annotation[] = [
      {
        id: 'existing-1',
        canvasId: CANVAS_ID,
        content: 'Loaded from API',
        x: 0, y: 0,
        type: 'text',
        authorId: 'user-2',
        color: '#EC4899',
        status: 'active',
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    setAnnotations(newAnns);
    const { annotations } = useAnnotationStore.getState();
    expect(annotations).toHaveLength(1);
    expect(annotations[0].content).toBe('Loaded from API');
  });

  // ─── subscribeToCanvas ──────────────────────────────────────────────────────

  it('subscribeToCanvas clears annotations and updates canvasId', () => {
    const { addAnnotation, subscribeToCanvas } = useAnnotationStore.getState();
    addAnnotation(makeAnnotation());

    subscribeToCanvas('new-canvas');

    expect(useAnnotationStore.getState().subscribedCanvasId).toBe('new-canvas');
    expect(useAnnotationStore.getState().annotations).toHaveLength(0);
  });

  it('subscribeToCanvas skips if same canvasId', () => {
    const { subscribeToCanvas, addAnnotation } = useAnnotationStore.getState();
    addAnnotation(makeAnnotation());

    subscribeToCanvas(CANVAS_ID);

    // Should not clear — same canvas
    expect(useAnnotationStore.getState().annotations).toHaveLength(1);
  });

  // ─── getActiveAnnotations selector ──────────────────────────────────────────

  it('getActiveAnnotations filters to active-only', () => {
    const { addAnnotation } = useAnnotationStore.getState();
    addAnnotation(makeAnnotation({ status: 'active' }));
    addAnnotation(makeAnnotation({ content: 'resolved', status: 'resolved' }));
    addAnnotation(makeAnnotation({ content: 'also active', status: 'active' }));

    const active = getActiveAnnotations(useAnnotationStore.getState());
    expect(active).toHaveLength(2);
    expect(active.every(a => a.status === 'active')).toBe(true);
  });

  // ─── clearAnnotations ───────────────────────────────────────────────────────

  it('clearAnnotations removes all annotations', () => {
    const { addAnnotation, clearAnnotations } = useAnnotationStore.getState();
    addAnnotation(makeAnnotation());
    addAnnotation(makeAnnotation({ content: 'Two' }));

    clearAnnotations();

    expect(useAnnotationStore.getState().annotations).toHaveLength(0);
  });
});
