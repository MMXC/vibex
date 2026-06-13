/**
 * PublicVisibilitySection.tsx — S95-E2: Public Canvas Portal
 * Settings section for canvas public visibility toggle + slug config.
 * Renders inside the CanvasSettingsDrawer 'public' tab.
 */
'use client';

import React, { useState, useEffect } from 'react';
import styles from './PublicVisibilitySection.module.css';

interface PublicCanvasVisibility {
  is_public: boolean;
  slug: string | null;
  public_url: string | null;
}

interface PublicVisibilitySectionProps {
  canvasId: string;
}

export function PublicVisibilitySection({ canvasId }: PublicVisibilitySectionProps) {
  const [visibility, setVisibility] = useState<PublicCanvasVisibility | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customSlug, setCustomSlug] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch current visibility
  useEffect(() => {
    if (!canvasId) return;

    async function fetchVisibility() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/canvas/${canvasId}/visibility`, {
          credentials: 'include',
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? 'Failed to fetch visibility');
        }
        const data: PublicCanvasVisibility = await res.json();
        setVisibility(data);
        setCustomSlug(data.slug ?? '');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load visibility');
      } finally {
        setIsLoading(false);
      }
    }

    fetchVisibility();
  }, [canvasId]);

  async function handleToggle() {
    if (!visibility) return;
    const newIsPublic = !visibility.is_public;
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const body: { is_public: boolean; slug?: string } = { is_public: newIsPublic };
      if (newIsPublic && customSlug.trim()) {
        body.slug = customSlug.trim();
      }

      const res = await fetch(`/api/canvas/${canvasId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to save visibility');
      }

      const updated: PublicCanvasVisibility = await res.json();
      setVisibility(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className={styles.loading}>Loading visibility settings…</div>;
  }

  if (error && !visibility) {
    return <div className={styles.error}>{error}</div>;
  }

  const isPublic = visibility?.is_public ?? false;
  const publicUrl = visibility?.public_url ?? null;

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Public Canvas
        </div>
        <label className={styles.toggle} aria-label="Toggle public visibility">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={handleToggle}
            disabled={isSaving}
            role="switch"
            aria-checked={isPublic}
          />
          <span className={styles.toggleTrack}>
            <span className={styles.toggleThumb} />
          </span>
        </label>
      </div>

      <p className={styles.description}>
        {isPublic
          ? 'This canvas is publicly accessible. Anyone with the link can view it.'
          : 'Make this canvas publicly accessible. A shareable link will be generated.'}
      </p>

      {isPublic && (
        <>
          <div className={styles.slugSection}>
            <label htmlFor="custom-slug" className={styles.label}>
              Custom URL slug (optional)
            </label>
            <input
              id="custom-slug"
              type="text"
              className={styles.slugInput}
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
              placeholder="my-custom-slug"
              pattern="[a-z0-9][a-z0-9-]{1,62}[a-z0-9]"
              maxLength={64}
              aria-describedby="slug-hint"
            />
            <p id="slug-hint" className={styles.hint}>
              Lowercase letters, numbers, hyphens. 3–64 characters.
            </p>
          </div>

          {publicUrl && (
            <div className={styles.publicUrlSection}>
              <label className={styles.label}>Public URL</label>
              <div className={styles.urlRow}>
                <input
                  type="text"
                  className={styles.urlInput}
                  value={window.location.origin + publicUrl}
                  readOnly
                  aria-label="Public canvas URL"
                />
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => navigator.clipboard?.writeText(window.location.origin + publicUrl)}
                  aria-label="Copy URL"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {error && visibility && (
        <div className={styles.errorInline}>{error}</div>
      )}

      {saveSuccess && (
        <div className={styles.successInline}>Visibility updated!</div>
      )}

      <button
        type="button"
        className={styles.saveBtn}
        onClick={handleToggle}
        disabled={isSaving || !visibility}
      >
        {isSaving ? 'Saving…' : isPublic ? 'Make Private' : 'Make Public'}
      </button>
    </div>
  );
}
