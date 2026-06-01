/**
 * TemplateThumbnail.tsx — SVG/Canvas Thumbnail Renderer
 * Sprint49 E2: 画布模板管理完善
 *
 * Renders a template thumbnail: uses cached PNG data URL if available,
 * otherwise falls back to a placeholder icon + name preview.
 */
'use client';

import React, { useEffect, useRef } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import styles from './TemplateThumbnail.module.css';

interface TemplateThumbnailProps {
  templateId: string;
  templateName: string;
  /** DOM element to capture (SVG canvas) — triggers captureThumbnail */
  captureRef?: React.RefObject<HTMLElement | null>;
  /** Fixed pixel width (default 200) */
  width?: number;
  /** Fixed pixel height (default 120) */
  height?: number;
}

export function TemplateThumbnail({
  templateId,
  templateName,
  captureRef,
  width = 200,
  height = 120,
}: TemplateThumbnailProps) {
  const { thumbnailCache, getThumbnail, captureThumbnail } = useTemplateStore();
  const imgRef = useRef<HTMLImageElement>(null);

  // Load cached thumbnail
  const cachedUrl = thumbnailCache[templateId] ?? getThumbnail(templateId);

  // Trigger capture if a DOM ref is provided and no cache exists
  useEffect(() => {
    if (captureRef?.current && !cachedUrl) {
      captureThumbnail(templateId, captureRef.current);
    }
  }, [templateId, cachedUrl, captureRef, captureThumbnail]);

  // Placeholder: dark card with icon + name
  const placeholder = (
    <div className={styles.placeholder} style={{ width, height }}>
      <span className={styles.placeholderIcon} aria-hidden="true">📋</span>
      <span className={styles.placeholderName}>{templateName.slice(0, 20)}</span>
    </div>
  );

  return cachedUrl ? (
    <img
      ref={imgRef}
      src={cachedUrl}
      alt={`${templateName} 缩略图`}
      className={styles.thumbnail}
      style={{ width, height }}
      loading="lazy"
    />
  ) : (
    placeholder
  );
}
