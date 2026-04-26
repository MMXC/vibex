/**
 * /design/dds-canvas/page.tsx
 * Detailed Design Canvas (DDS) Route
 *
 * Epic 5: F22 — Route integration with full canvas
 * PRD: F2.1 DDS page routing
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DDSCanvasPage } from '@/components/dds/DDSCanvasPage';

// ==================== Inner component (needs useSearchParams) ====================

function DDSCanvasContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') ?? '';
  const agentSession = searchParams.get('agentSession') ?? null;

  return (
    <DDSCanvasPage
      projectId={projectId}
      agentSession={agentSession}
    />
  );
}

// ==================== Loading fallback ====================

function PageSkeleton() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="页面加载中"
      role="status"
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ==================== Page export ====================

export default function DDSCanvasPage_() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DDSCanvasContent />
    </Suspense>
  );
}
