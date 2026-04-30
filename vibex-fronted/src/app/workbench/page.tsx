'use client';

import { notFound } from 'next/navigation';
import { WorkbenchUI } from '@/components/workbench/WorkbenchUI';

export default function WorkbenchPage() {
  const isEnabled = process.env.NEXT_PUBLIC_WORKBENCH_ENABLED === 'true';
  if (!isEnabled) {
    notFound();
  }
  return <WorkbenchUI />;
}
