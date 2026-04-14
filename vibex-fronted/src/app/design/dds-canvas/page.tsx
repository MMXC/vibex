/**
 * /design/dds-canvas/page.tsx
 * 详细设计画布（Detailed Design Canvas）基础路由
 *
 * Epic1: 入口与路由 (vibex-dds-canvas)
 * PRD: F2.1 DDS 页面路由
 *
 * ⚠️ 当前状态: 基础路由已创建（Epic1 增量交付）
 * 完整画布实现依赖 @xyflow/react v12 类型修复（既有代码债务）
 */

'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DDSCanvasContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary, #0a0a0a)',
      color: 'var(--text-primary, #e5e5e5)',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        padding: '3rem',
        maxWidth: '600px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📐</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
          详细设计画布
        </h1>
        <p style={{ color: '#888', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          VibeX 详细设计画布将所有软件工程文档章节整合到交互式横向多面板画布中。
        </p>

        {projectId ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ color: '#666' }}>项目 ID: </span>
            <code style={{ background: '#1a1a1a', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              {projectId}
            </code>
          </div>
        ) : (
          <div style={{ marginBottom: '1.5rem', color: '#888' }}>
            未提供项目 ID
          </div>
        )}

        <div style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          textAlign: 'left',
        }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#f59e0b' }}>
            ⚠️ 完整画布待实现
          </h2>
          <ul style={{ fontSize: '0.85rem', color: '#888', paddingLeft: '1.2rem', lineHeight: 1.8 }}>
            <li>横向多面板 Scroll-Snap Canvas</li>
            <li>DDSCanvasStore (Zustand)</li>
            <li>三种卡片类型 (BoundedContext, Flow, Component)</li>
            <li>AI Draft Flow</li>
            <li>Backend CRUD API</li>
          </ul>
          <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
            Epic1 本次交付: 入口 + 路由基础设施
          </p>
        </div>

        <Link
          href={projectId ? `/project?id=${projectId}` : '/dashboard'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.2rem',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#e5e5e5',
            textDecoration: 'none',
            fontSize: '0.9rem',
          }}
        >
          ← 返回项目
        </Link>
      </div>
    </div>
  );
}

export default function DDSCanvasPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0a' }} />}>
      <DDSCanvasContent />
    </Suspense>
  );
}
