/**
 * /snapshot/[id] — Public read-only canvas snapshot viewer
 * S45-P005-E5: Canvas Snapshot Sharing
 *
 * Flow: GET /api/snapshot/[id] → render read-only canvas
 * Auth: public (no authentication required)
 */
'use client';

import { useState, useEffect, use } from 'react';
import { SnapshotCanvas } from '@/components/dds/flow/SnapshotCanvas';
import type { CanvasSnapshotData } from '@/lib/canvas/serialize';

interface SnapshotPageProps {
  params: Promise<{ id: string }>;
}

export default function SnapshotPage({ params }: SnapshotPageProps) {
  const { id } = use(params);
  const [snapshot, setSnapshot] = useState<CanvasSnapshotData | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchSnapshot = async () => {
      try {
        const resp = await fetch(`/api/snapshot/${id}`);

        if (!resp.ok) {
          if (resp.status === 404) {
            setError('Snapshot not found. This link may have expired or been deleted.');
          } else {
            setError('Failed to load snapshot. Please try again later.');
          }
          return;
        }

        const data = await resp.json();
        setSnapshot(data.canvasJSON as CanvasSnapshotData);
        setProjectName(data.projectName || null);
        setCreatedAt(data.createdAt || null);
      } catch (err) {
        console.error('[SnapshotPage] Error:', err);
        setError('Failed to load snapshot. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, [id]);

  if (loading) {
    return (
      <div className="snapshot-loading" data-testid="snapshot-loading">
        <div className="snapshot-loading-spinner">⟳</div>
        <p>Loading snapshot...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="snapshot-error" data-testid="snapshot-error">
        <div className="snapshot-error-icon">⚠️</div>
        <h2>Unable to load snapshot</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="snapshot-error" data-testid="snapshot-error">
        <p>No snapshot data available.</p>
      </div>
    );
  }

  return (
    <div className="snapshot-page" data-testid="snapshot-page">
      {/* Header */}
      <div className="snapshot-header">
        <div className="snapshot-header-left">
          <span className="snapshot-logo">VibeX</span>
          <span className="snapshot-badge">Read-only snapshot</span>
        </div>
        {projectName && (
          <div className="snapshot-project-name">
            <span className="snapshot-project-label">Project:</span>
            <span className="snapshot-project-value">{projectName}</span>
          </div>
        )}
        {createdAt && (
          <div className="snapshot-created-at">
            Shared: {new Date(createdAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Read-only canvas */}
      <SnapshotCanvas data={snapshot} />
    </div>
  );
}
