/**
 * annotationStore.test.ts — S90-E4
 * Tests for annotationStore state management
 * NOTE: Fixed method names to match AnnotationStoreState interface
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useAnnotationStore, type Annotation } from '../annotationStore';

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
    useAnnotationStore.getState().clear();
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

  // ─── updateAnnotation ────────────────────────────────────────────────────────

  it('updateAnnotation updates fields and refreshes updatedAt', () => {
    const { addAnnotation } = useAnnotationStore.getState();
    const ann = addAnnotation(makeAnnotation());
    const before = ann.updatedAt;

    useAnnotationStore.getState().updateAnnotation(ann.id, { content: 'Updated content' });

    const updated = useAnnotationStore.getState().annotations.find(a => a.id === ann.id);
    expect(updated?.content).toBe('Updated content');
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it('updateAnnotation only updates specified fields', () => {
    const { addAnnotation } = useAnnotationStore.getState();
    const ann = addAnnotation(makeAnnotation({ x: 100, y: 200 }));

    useAnnotationStore.getState().updateAnnotation(ann.id, { x: 300 });

    const updated = useAnnotationStore.getState().annotations.find(a => a.id === ann.id);
    expect(updated?.x).toBe(300);
    expect(updated?.y).toBe(200); // unchanged
  });

  // ─── resolveAnnotation ────────────────────────────────────────────────────────

  it('resolveAnnotation sets status to resolved', () => {
    const { addAnnotation } = useAnnotationStore.getState();
    const ann = addAnnotation(makeAnnotation());

    useAnnotationStore.getState().resolveAnnotation(ann.id);

    const resolved = useAnnotationStore.getState().annotations.find(a => a.id === ann.id);
    expect(resolved?.status).toBe('resolved');
  });

  // ─── deleteAnnotation ────────────────────────────────────────────────────────

  it('deleteAnnotation removes annotation from store', () => {
    const { addAnnotation } = useAnnotationStore.getState();
    const ann = addAnnotation(makeAnnotation());

    useAnnotationStore.getState().deleteAnnotation(ann.id);

    const found = useAnnotationStore.getState().annotations.find(a => a.id === ann.id);
    expect(found).toBeUndefined();
    expect(useAnnotationStore.getState().annotations).toHaveLength(0);
  });

  // ─── getActive / getResolved ─────────────────────────────────────────────────
  // NOTE: addAnnotation always sets status:'active', so all new items are active.
  // Use resolveAnnotation to move items to resolved.

  it('getActive returns only active annotations', () => {
    const { addAnnotation } = useAnnotationStore.getState();
    const ann1 = addAnnotation(makeAnnotation());
    addAnnotation(makeAnnotation()); // second active
    // Move one to resolved
    useAnnotationStore.getState().resolveAnnotation(ann1.id);

    const active = useAnnotationStore.getState().getActive();
    expect(active).toHaveLength(1);
    expect(active.every(a => a.status === 'active')).toBe(true);
  });

  it('getResolved returns only resolved annotations', () => {
    const { addAnnotation } = useAnnotationStore.getState();
    addAnnotation(makeAnnotation()); // active
    const ann2 = addAnnotation(makeAnnotation());

    useAnnotationStore.getState().resolveAnnotation(ann2.id);

    const resolved = useAnnotationStore.getState().getResolved();
    expect(resolved).toHaveLength(1);
    expect(resolved[0].status).toBe('resolved');
  });

  it('getById returns the correct annotation', () => {
    const { addAnnotation } = useAnnotationStore.getState();
    const ann = addAnnotation(makeAnnotation({ content: 'Target' }));

    const found = useAnnotationStore.getState().getById(ann.id);
    expect(found?.content).toBe('Target');
  });

  it('getByAuthor filters annotations by authorId', () => {
    const { addAnnotation } = useAnnotationStore.getState();
    addAnnotation(makeAnnotation({ authorId: 'user-1' }));
    addAnnotation(makeAnnotation({ content: 'other', authorId: 'user-2' }));

    const byAuthor = useAnnotationStore.getState().getByAuthor('user-1');
    expect(byAuthor).toHaveLength(1);
    expect(byAuthor[0].authorId).toBe('user-1');
  });

  // ─── clear ──────────────────────────────────────────────────────────────────

  it('clear removes all annotations', () => {
    const { addAnnotation, clear } = useAnnotationStore.getState();
    addAnnotation(makeAnnotation());
    addAnnotation(makeAnnotation({ content: 'Two' }));

    clear();

    expect(useAnnotationStore.getState().annotations).toHaveLength(0);
    expect(useAnnotationStore.getState().initialized).toBe(false);
  });
});
