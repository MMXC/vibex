/**
 * designStore.test.ts — Sprint6 QA E1: Design Metadata Store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore } from '../designStore';

describe('useDesignStore — E1', () => {
  beforeEach(() => {
    useDesignStore.setState({ designs: [] });
  });

  it('addDesign adds a design to the store', () => {
    const design = {
      id: 'd1', name: 'My Design', version: 1,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    useDesignStore.getState().addDesign(design);
    expect(useDesignStore.getState().designs).toHaveLength(1);
    expect(useDesignStore.getState().designs[0].id).toBe('d1');
  });

  it('getDesignById returns the correct design', () => {
    const design = {
      id: 'd2', name: 'Design B', version: 1,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    useDesignStore.getState().addDesign(design);
    const found = useDesignStore.getState().getDesignById('d2');
    expect(found?.name).toBe('Design B');
  });

  it('getDesignById returns undefined for unknown id', () => {
    expect(useDesignStore.getState().getDesignById('unknown')).toBeUndefined();
  });

  it('removeDesign removes a design', () => {
    useDesignStore.getState().addDesign({
      id: 'd3', name: 'To Remove', version: 1,
      createdAt: Date.now(), updatedAt: Date.now(),
    });
    useDesignStore.getState().removeDesign('d3');
    expect(useDesignStore.getState().designs).toHaveLength(0);
  });

  it('updateDesign updates a design', () => {
    useDesignStore.getState().addDesign({
      id: 'd4', name: 'Old Name', version: 1,
      createdAt: Date.now(), updatedAt: Date.now(),
    });
    useDesignStore.getState().updateDesign('d4', { name: 'New Name', version: 2 });
    const updated = useDesignStore.getState().getDesignById('d4');
    expect(updated?.name).toBe('New Name');
    expect(updated?.version).toBe(2);
    expect(updated?.updatedAt).toBeGreaterThan(updated!.createdAt);
  });

  it('stores max 100 designs', () => {
    for (let i = 0; i < 105; i++) {
      useDesignStore.getState().addDesign({
        id: `d${i}`, name: `Design ${i}`, version: 1,
        createdAt: Date.now(), updatedAt: Date.now(),
      });
    }
    expect(useDesignStore.getState().designs).toHaveLength(100);
  });
});
