/**
 * designStore.ts — Sprint6 QA E1: Design Metadata Storage
 *
 * Manages design document metadata (ID, name, version, created at).
 */

'use client';

import type { DesignMetadata } from '@/types/design';
import { create } from 'zustand';


interface DesignState {
  designs: DesignMetadata[];
}

interface DesignActions {
  addDesign: (design: DesignMetadata) => void;
  removeDesign: (id: string) => void;
  updateDesign: (id: string, updates: Partial<DesignMetadata>) => void;
  getDesignById: (id: string) => DesignMetadata | undefined;
}

export type DesignStore = DesignState & DesignActions;

export const useDesignStore = create<DesignStore>((set, get) => ({
  designs: [],

  addDesign: (design) =>
    set((state) => ({
      designs: [design, ...state.designs].slice(0, 100), // max 100 designs
    })),

  removeDesign: (id) =>
    set((state) => ({
      designs: state.designs.filter((d) => d.id !== id),
    })),

  updateDesign: (id, updates) =>
    set((state) => ({
      designs: state.designs.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
      ),
    })),

  getDesignById: (id) => get().designs.find((d) => d.id === id),
}));
