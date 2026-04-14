/**
 * Mermaid Diagram Components — Dynamic Import Wrapper
 *
 * E2.2: Provides a unified dynamic import wrapper for the MermaidRenderer.
 * Mermaid (~350KB) is loaded asynchronously to avoid bloating the initial bundle.
 *
 * Usage:
 *   import { MermaidDiagram } from '@/components/mermaid';
 *   // or
 *   const { MermaidDiagram } = await import('@/components/mermaid');
 */

'use client';

import dynamic from 'next/dynamic';
import { MermaidSkeleton } from './MermaidSkeleton';

// E2.1: Mermaid loaded lazily — ~350KB not included in initial JS bundle
export const MermaidDiagram = dynamic(
  () => import('./MermaidRenderer').then((m) => m.MermaidRenderer || m.default),
  {
    ssr: false,
    loading: () => <MermaidSkeleton />,
  }
);

// Re-export for direct import when SSR-aware (tests, etc.)
export { MermaidRenderer } from './MermaidRenderer';
export { MermaidSkeleton } from './MermaidSkeleton';
export type { default as MermaidInitializer } from './MermaidInitializer';
