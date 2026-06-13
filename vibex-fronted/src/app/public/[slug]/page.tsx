/**
 * /public/[slug]/page.tsx — S95-E2: Public Canvas Portal
 *
 * Read-only public canvas page — renders a canvas by public slug.
 * No auth required, no edit toolbar.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface PublicCanvasData {
  canvas: {
    id: string;
    name: string;
    nodes: unknown[];
    edges: unknown[];
    owner: { userId: string; name: string | null; email: string | null };
    createdAt: string;
    updatedAt: string;
  };
  is_public: boolean;
}

interface PublicCanvasPageProps {
  params: Promise<{ slug: string }>;
}

export default function PublicCanvasPage({ params }: PublicCanvasPageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [canvasData, setCanvasData] = useState<PublicCanvasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    async function fetchPublicCanvas() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/public/canvas/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Canvas not found or not public');
          }
          throw new Error('Failed to load canvas');
        }
        const data: PublicCanvasData = await res.json();
        setCanvasData(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchPublicCanvas();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#94a3b8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>Loading…</div>
          <div style={{ fontSize: 13 }}>Loading public canvas</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#f8fafc' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Canvas Not Available</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>{error}</p>
          <a href="/" style={{ display: 'inline-block', marginTop: 16, padding: '8px 16px', background: '#3b82f6', color: 'white', borderRadius: 6, textDecoration: 'none', fontSize: 13 }}>
            Go to VibeX
          </a>
        </div>
      </div>
    );
  }

  if (!canvasData) return null;

  const { canvas } = canvasData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a' }}>
      {/* Public canvas header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc' }}>{canvas.name}</span>
          <span style={{ padding: '2px 8px', background: '#3b82f6', color: 'white', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
            PUBLIC
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {canvas.owner.name && (
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              by {canvas.owner.name}
            </span>
          )}
          <a
            href="/"
            style={{ padding: '6px 14px', background: '#3b82f6', color: 'white', borderRadius: 6, textDecoration: 'none', fontSize: 13 }}
          >
            Open in VibeX
          </a>
        </div>
      </div>

      {/* Read-only canvas — simplified rendering */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: 16,
          color: '#94a3b8',
        }}>
          {/* Render nodes as simple cards */}
          {canvas.nodes && canvas.nodes.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
              padding: 24,
              width: '100%',
              maxWidth: 1200,
            }}>
              {(canvas.nodes as Array<{ id: string; type?: string; label?: string; text?: string }>).map((node) => (
                <div key={node.id} style={{
                  padding: '16px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#f8fafc',
                  fontSize: 13,
                }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                    {node.type ?? 'node'}
                  </div>
                  <div style={{ fontWeight: 500 }}>
                    {node.label ?? node.text ?? node.id}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <p>This public canvas has no nodes yet.</p>
            </div>
          )}

          <div style={{ fontSize: 12, color: '#475569' }}>
            {canvas.nodes?.length ?? 0} nodes · {canvas.edges?.length ?? 0} edges
          </div>
        </div>
      </div>

      {/* Read-only notice */}
      <div style={{
        padding: '8px 24px',
        background: '#1e293b',
        borderTop: '1px solid #334155',
        textAlign: 'center',
        fontSize: 12,
        color: '#64748b',
        flexShrink: 0,
      }}>
        This is a read-only public canvas.{' '}
        <a href="/" style={{ color: '#3b82f6' }}>Create your own canvas in VibeX →</a>
      </div>
    </div>
  );
}
