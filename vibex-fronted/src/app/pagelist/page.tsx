'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './pagelist.module.css';

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
    if (status === 'published') {
      return <span className={styles.statusPublished}>已发布</span>;
    }
    return <span className={styles.statusDraft}>草稿</span>;
  };

  return (
    <div className={styles.page}>
      {/* 背景装饰（与 auth.module.css 一致的网格 + 发光球） */}
      <div className={styles.gridOverlay} />
      <div className={styles.glowEffect} />

      {/* 顶部导航 */}
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <Link href="/" className={styles.navLogo}>
            VibeX
          </Link>
          <div className={styles.navLinks}>
            <Link href="/dashboard" className={styles.navLink}>
              控制台
            </Link>
            <Link href="/pagelist" className={styles.navLinkActive}>
              页面管理
            </Link>
            <Link href="/templates" className={styles.navLink}>
              模板库
            </Link>
          </div>
        </div>
        <div className={styles.navRight}>
          <Link href="/chat" className={styles.navAction}>
            ✨ 新建页面
          </Link>
        </div>
      </nav>

      <main className={styles.main}>
        {/* 页面标题 */}
        <div className={styles.header}>
          <h1 className={styles.title}>页面管理</h1>
          <p className={styles.subtitle}>管理您的所有页面，查看访问统计</p>
        </div>

        {/* 搜索和筛选 */}
        <div className={styles.filterBar}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="搜索页面名称或路径..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterBtns}>
            {(['all', 'published', 'draft'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={filter === f ? styles.filterBtnActive : styles.filterBtn}
              >
                {f === 'all' ? '全部' : f === 'published' ? '已发布' : '草稿'}
              </button>
            ))}
          </div>
        </div>

        {/* 页面列表 */}
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th className={styles.tableHead}>页面名称</th>
                <th className={styles.tableHead}>路径</th>
                <th className={styles.tableHead}>模板</th>
                <th className={styles.tableHead}>状态</th>
                <th className={styles.tableHeadRight}>访问量</th>
                <th className={styles.tableHeadRight}>最后编辑</th>
                <th className={styles.tableHeadCenter}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((page) => (
                <tr key={page.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>{page.name}</td>
                  <td className={styles.tableCellMono}>{page.path}</td>
                  <td className={styles.tableCell}>
                    <span className={styles.tag}>{page.template}</span>
                  </td>
                  <td className={styles.tableCell}>{getStatusBadge(page.status)}</td>
                  <td className={styles.tableCellRight}>
                    {page.visits.toLocaleString()}
                  </td>
                  <td className={styles.tableCellRight}>{page.lastEdit}</td>
                  <td className={styles.tableCellCenter}>
                    <Link
                      href={`/preview?page=${page.id}`}
                      className={styles.actionLink}
                    >
                      预览
                    </Link>
                    <Link
                      href={`/editor?page=${page.id}`}
                      className={styles.actionLinkMuted}
                    >
                      编辑
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPages.length === 0 && (
            <div className={styles.emptyState}>没有找到匹配的页面</div>
          )}
        </div>

        {/* 统计信息 */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.statValuePrimary}`}>
              {pages.length}
            </div>
            <div className={styles.statLabel}>总页面数</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.statValueSuccess}`}>
              {pages.filter((p) => p.status === 'published').length}
            </div>
            <div className={styles.statLabel}>已发布</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.statValueWarning}`}>
              {pages.filter((p) => p.status === 'draft').length}
            </div>
            <div className={styles.statLabel}>草稿</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.statValueAccent}`}>
              {pages.reduce((acc, p) => acc + p.visits, 0).toLocaleString()}
            </div>
            <div className={styles.statLabel}>总访问量</div>
          </div>
        </div>
      </main>
    </div>
  );
}
