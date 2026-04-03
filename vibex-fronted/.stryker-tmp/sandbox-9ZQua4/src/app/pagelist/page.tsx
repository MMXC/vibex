// @ts-nocheck
'use client';

import { useState } from 'react';
import Link from 'next/link';

// 模拟页面数据
const mockPages = [
  {
    id: 1,
    name: '首页',
    path: '/',
    template: 'Landing',
    status: 'published',
    visits: 1250,
    lastEdit: '2026-02-25',
  },
  {
    id: 2,
    name: '关于',
    path: '/about',
    template: 'Blank',
    status: 'published',
    visits: 580,
    lastEdit: '2026-02-24',
  },
  {
    id: 3,
    name: '产品',
    path: '/products',
    template: 'Gallery',
    status: 'draft',
    visits: 0,
    lastEdit: '2026-02-23',
  },
  {
    id: 4,
    name: '联系方式',
    path: '/contact',
    template: 'Form',
    status: 'published',
    visits: 320,
    lastEdit: '2026-02-20',
  },
  {
    id: 5,
    name: '博客列表',
    path: '/blog',
    template: 'List',
    status: 'draft',
    visits: 0,
    lastEdit: '2026-02-18',
  },
  {
    id: 6,
    name: '博客详情',
    path: '/blog/[slug]',
    template: 'Article',
    status: 'draft',
    visits: 0,
    lastEdit: '2026-02-17',
  },
  {
    id: 7,
    name: '定价',
    path: '/pricing',
    template: 'Pricing',
    status: 'published',
    visits: 890,
    lastEdit: '2026-02-15',
  },
  {
    id: 8,
    name: '常见问题',
    path: '/faq',
    template: 'FAQ',
    status: 'published',
    visits: 450,
    lastEdit: '2026-02-14',
  },
];

const templates = [
  {
    id: 'landing',
    name: '落地页',
    icon: '🏠',
    description: '产品介绍、特性展示、CTA',
  },
  { id: 'blank', name: '空白页', icon: '📄', description: '自定义空白页面' },
  { id: 'gallery', name: '画廊', icon: '🖼️', description: '图片展示网格' },
  { id: 'form', name: '表单', icon: '📝', description: '联系表单、数据收集' },
  { id: 'list', name: '列表', icon: '📋', description: '文章、产品列表' },
  { id: 'article', name: '文章', icon: '📰', description: '博客文章详情' },
  { id: 'pricing', name: '定价', icon: '💰', description: '价格方案展示' },
  { id: 'faq', name: 'FAQ', icon: '❓', description: '常见问题解答' },
];

export default function PageList() {
  const [pages] = useState(mockPages);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const filteredPages = pages.filter((page) => {
    const matchSearch =
      page.name.toLowerCase().includes(search.toLowerCase()) ||
      page.path.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || page.status === filter;
    return matchSearch && matchFilter;
  });

  const getStatusBadge = (status: string) => {
    const config = {
      published: { bg: '#d1fae5', color: '#065f46', text: '已发布' },
      draft: { bg: '#fef3c7', color: '#92400e', text: '草稿' },
    };
    const s = config[status as keyof typeof config];
    return (
      <span
        style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          backgroundColor: s.bg,
          color: s.color,
        }}
      >
        {s.text}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* 顶部导航 */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 32px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link
            href="/"
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#0070f3',
              textDecoration: 'none',
            }}
          >
            VibeX
          </Link>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link
              href="/dashboard"
              style={{ color: '#64748b', textDecoration: 'none' }}
            >
              控制台
            </Link>
            <Link
              href="/pagelist"
              style={{
                color: '#0070f3',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              页面管理
            </Link>
            <Link
              href="/templates"
              style={{ color: '#64748b', textDecoration: 'none' }}
            >
              模板库
            </Link>
          </div>
        </div>
        <div>
          <Link
            href="/chat"
            style={{ color: '#0070f3', textDecoration: 'none' }}
          >
            ✨ 新建页面
          </Link>
        </div>
      </nav>

      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: '8px',
            }}
          >
            页面管理
          </h1>
          <p style={{ color: '#64748b' }}>管理您的所有页面，查看访问统计</p>
        </div>

        {/* 搜索和筛选 */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="搜索页面名称或路径..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'published', 'draft'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: filter === f ? '#0070f3' : '#f1f5f9',
                  color: filter === f ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {f === 'all' ? '全部' : f === 'published' ? '已发布' : '草稿'}
              </button>
            ))}
          </div>
        </div>

        {/* 页面列表 */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontWeight: 500,
                    color: '#64748b',
                    fontSize: '13px',
                  }}
                >
                  页面名称
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontWeight: 500,
                    color: '#64748b',
                    fontSize: '13px',
                  }}
                >
                  路径
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontWeight: 500,
                    color: '#64748b',
                    fontSize: '13px',
                  }}
                >
                  模板
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontWeight: 500,
                    color: '#64748b',
                    fontSize: '13px',
                  }}
                >
                  状态
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'right',
                    fontWeight: 500,
                    color: '#64748b',
                    fontSize: '13px',
                  }}
                >
                  访问量
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'right',
                    fontWeight: 500,
                    color: '#64748b',
                    fontSize: '13px',
                  }}
                >
                  最后编辑
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'center',
                    fontWeight: 500,
                    color: '#64748b',
                    fontSize: '13px',
                  }}
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((page) => (
                <tr key={page.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 500 }}>
                    {page.name}
                  </td>
                  <td
                    style={{
                      padding: '16px 20px',
                      color: '#64748b',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                    }}
                  >
                    {page.path}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#475569',
                      }}
                    >
                      {page.template}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {getStatusBadge(page.status)}
                  </td>
                  <td
                    style={{
                      padding: '16px 20px',
                      textAlign: 'right',
                      color: '#64748b',
                    }}
                  >
                    {page.visits.toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: '16px 20px',
                      textAlign: 'right',
                      color: '#64748b',
                      fontSize: '13px',
                    }}
                  >
                    {page.lastEdit}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <Link
                      href={`/preview?page=${page.id}`}
                      style={{
                        color: '#0070f3',
                        textDecoration: 'none',
                        marginRight: '12px',
                        fontSize: '13px',
                      }}
                    >
                      预览
                    </Link>
                    <Link
                      href={`/editor?page=${page.id}`}
                      style={{
                        color: '#64748b',
                        textDecoration: 'none',
                        fontSize: '13px',
                      }}
                    >
                      编辑
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPages.length === 0 && (
            <div
              style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}
            >
              没有找到匹配的页面
            </div>
          )}
        </div>

        {/* 统计信息 */}
        <div
          style={{
            marginTop: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
          }}
        >
          <div
            style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3' }}
            >
              {pages.length}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>总页面数</div>
          </div>
          <div
            style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}
            >
              {pages.filter((p) => p.status === 'published').length}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>已发布</div>
          </div>
          <div
            style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}
            >
              {pages.filter((p) => p.status === 'draft').length}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>草稿</div>
          </div>
          <div
            style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}
            >
              {pages.reduce((acc, p) => acc + p.visits, 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>总访问量</div>
          </div>
        </div>
      </main>
    </div>
  );
}
