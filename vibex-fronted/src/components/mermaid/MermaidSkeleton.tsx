/**
 * MermaidSkeleton — Loading skeleton for MermaidRenderer
 * Shown while the ~350KB mermaid chunk is loading
 */

'use client';

export function MermaidSkeleton() {
  return (
    <div
      style={{
        marginTop: '16px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        padding: '16px',
        minHeight: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Animated skeleton bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '300px' }}>
        <div
          style={{
            height: '12px',
            borderRadius: '4px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)',
            backgroundSize: '200% 100%',
            animation: 'mermaidSkeleton 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            height: '12px',
            borderRadius: '4px',
            width: '75%',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)',
            backgroundSize: '200% 100%',
            animation: 'mermaidSkeleton 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            height: '12px',
            borderRadius: '4px',
            width: '50%',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)',
            backgroundSize: '200% 100%',
            animation: 'mermaidSkeleton 1.5s ease-in-out infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes mermaidSkeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
        加载图表组件…
      </span>
    </div>
  );
}
