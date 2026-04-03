// @ts-nocheck
'use client';

import { Suspense } from 'react';
import DomainPageContent from './DomainPageContent';

export default function DomainPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      }
    >
      <DomainPageContent />
    </Suspense>
  );
}
