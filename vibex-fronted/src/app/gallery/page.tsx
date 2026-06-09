/**
 * Gallery Page — S82-E2: Template Gallery UI
 *
 * Dedicated gallery page at /gallery for browsing templates.
 */
'use client';

import React, { useCallback } from 'react';
import { TemplateGallery } from '@/components/dds/gallery/TemplateGallery';
import type { RequirementTemplate } from '@/data/templates';

export default function GalleryPage() {
  const handleInsert = useCallback((template: RequirementTemplate) => {
    // Navigate to canvas with the selected template
    // The templateStore.applyTemplate handles loading into canvas state
    console.info('[Gallery] Insert template:', template.name);
    // In a full implementation, this would navigate to the canvas page
    // and call templateStore.applyTemplate(template)
    window.location.href = `/canvas?template=${template.id}`;
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg, #f9fafb)' }}>
      <TemplateGallery open onInsert={handleInsert} />
    </main>
  );
}
