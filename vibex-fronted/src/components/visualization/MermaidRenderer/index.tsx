/**
 * MermaidRenderer dynamic import wrapper (visualization)
 * E2: Bundle optimization — mermaid loaded on demand (~350KB)
 */
'use client';

import dynamic from 'next/dynamic';
import { MermaidSkeleton } from '@/components/mermaid/MermaidSkeleton';

export const MermaidDiagram = dynamic(
  () => import('./MermaidRenderer').then((m) => m.MermaidRenderer as React.ComponentType<unknown>),
  {
    ssr: false,
    loading: () => <MermaidSkeleton />,
  }
);

export { MermaidRenderer } from './MermaidRenderer';
export type { MermaidRendererProps } from './MermaidRenderer';
