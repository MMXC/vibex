/**
 * /canvas/public/page.tsx — S95-E2: Public Canvas Portal
 *
 * Public canvas discovery page — paginated list of all public canvases.
 * No auth required.
 */
'use client';

import React, { useEffect, useState } from 'react';

interface PublicCanvas {
  canvasId: string;
  slug: string;
  name: string;
  owner: { name: string | null; email: string | null };
  publicUrl: string;
  nodeCount: number;
  edgeCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PublicCanvasListResponse {
  canvases: PublicCanvas[];
  total: number;
  page: number;
  limit: number;
}

export default function PublicCanvasDiscoveryPage() {
  const [data, setData] = useState<PublicCanvasListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');

  useEffect(() => {
    async function fetchPublicCanvases() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/canvas/public?page=${page}&sort=${sort}`);
        if (!res.ok) throw new Error('Failed to load public canvases');
        const result: PublicCanvasListResponse = await res.json();
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchPublicCanvases();
  }, [page, sort]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: '#f8fafc',
      padding: '48px 24px',
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🌐</span>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Public Canvas Gallery</h1>
          </div>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>
            Browse publicly shared canvases from the VibeX community.
          </p>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          padding: '12px 16px',
          background: '#1e293b',
          borderRadius: 8,
          border: '1px solid #334155',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Sort by:</span>
            <button
              onClick={() => { setSort('newest'); setPage(1); }}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: 'none',
                fontSize: 13,
                cursor: 'pointer',
                background: sort === 'newest' ? '#3b82f6' : '#334155',
                color: 'white',
              }}
            >
              Newest
            </button>
            <button
              onClick={() => { setSort('popular'); setPage(1); }}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: 'none',
                fontSize: 13,
                cursor: 'pointer',
                background: sort === 'popular' ? '#3b82f6' : '#334155',
                color: 'white',
              }}
            >
              Popular
            </button>
          </div>
          {data && (
            <span style={{ fontSize: 13, color: '#64748b' }}>
              {data.total} public canvas{data.total !== 1 ? 'es' : ''}
            </span>
          )}
        </div>

        {/* Loading / Error */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
            Loading public canvases…
          </div>
        )}

        {error && (
          <div style={{
            padding: 16,
            background: '#7f1d1d',
            borderRadius: 8,
            color: '#fca5a5',
            fontSize: 14,
          }}>
            Error: {error}
          </div>
        )}

        {/* Canvas grid */}
        {!loading && !error && data && (
          <>
            {data.canvases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 64, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <p style={{ fontSize: 16 }}>No public canvases yet.</p>
                <p style={{ fontSize: 14, marginTop: 8 }}>Be the first to share a canvas publicly!</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}>
                {data.canvases.map((canvas) => (
                  <a
                    key={canvas.canvasId}
                    href={`/public/${canvas.slug}`}
                    style={{
                      display: 'block',
                      padding: 20,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 12,
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'border-color 150ms, transform 150ms',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#334155';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: 120,
                      background: '#0f172a',
                      borderRadius: 8,
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 32,
                      color: '#334155',
                    }}>
                      📋
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: '#f1f5f9' }}>
                      {canvas.name}
                    </div>
                    {canvas.owner.name && (
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                        by {canvas.owner.name}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#475569' }}>
                      <span>{canvas.nodeCount} nodes</span>
                      <span>{canvas.edgeCount} edges</span>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                marginTop: 32,
              }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: '1px solid #334155',
                    background: page <= 1 ? 'transparent' : '#1e293b',
                    color: page <= 1 ? '#334155' : 'white',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                  }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: '1px solid #334155',
                    background: page >= totalPages ? 'transparent' : '#1e293b',
                    color: page >= totalPages ? '#334155' : 'white',
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
