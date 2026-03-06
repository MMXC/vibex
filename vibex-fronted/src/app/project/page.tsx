'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './project.module.css';
import { apiService, Project, DomainEntity } from '@/services/api';

// 模拟数据
const mockDomains: DomainEntity[] = [
  {
    id: '1',
    requirementId: '1',
    name: 'User',
    type: 'user',
    description: '系统用户实体',
    attributes: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: '用户唯一标识',
      },
      {
        name: 'username',
        type: 'string',
        required: true,
        description: '用户名',
      },
      {
        name: 'email',
        type: 'string',
        required: true,
        description: '邮箱地址',
      },
    ],
    position: { x: 100, y: 100 },
  },
  {
    id: '2',
    requirementId: '1',
    name: 'Product',
    type: 'business',
    description: '产品实体',
    attributes: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: '产品唯一标识',
      },
      { name: 'name', type: 'string', required: true, description: '产品名称' },
      {
        name: 'price',
        type: 'number',
        required: true,
        description: '产品价格',
      },
    ],
    position: { x: 400, y: 100 },
  },
];

const mockPrototypes = [
  { id: '1', name: '首页', pages: 3 },
  { id: '2', name: '产品详情页', pages: 5 },
  { id: '3', name: '购物车', pages: 2 },
];

type TabType = 'domain' | 'prototype';

function ProjectDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('domain');
  const [selectedDomain, setSelectedDomain] = useState<DomainEntity | null>(
    null
  );

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const fetchProject = async () => {
      if (!projectId) {
        setError('缺少项目 ID');
        setLoading(false);
        return;
      }

      try {
        const data = await apiService.getProject(projectId);
        setProject(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '加载项目失败');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, router]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>加载中...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || '项目不存在'}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 背景特效 */}
      <div className={styles.bgEffect}>
        <div className={styles.gridOverlay} />
        <div className={styles.glowOrb} />
      </div>

      {/* 侧边栏 */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.backLink}>
            ← 返回
          </Link>
          <h2 className={styles.projectTitle}>{project.name}</h2>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeTab === 'domain' ? styles.active : ''}`}
            onClick={() => setActiveTab('domain')}
          >
            <span className={styles.navIcon}>📊</span>
            <span>领域模型</span>
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'prototype' ? styles.active : ''}`}
            onClick={() => setActiveTab('prototype')}
          >
            <span className={styles.navIcon}>🎨</span>
            <span>原型</span>
          </button>
        </nav>

        {/* 树形结构 */}
        <div className={styles.treeSection}>
          {activeTab === 'domain' && (
            <div className={styles.tree}>
              <h3 className={styles.treeTitle}>实体列表</h3>
              {mockDomains.map((domain) => (
                <div
                  key={domain.id}
                  className={`${styles.treeItem} ${selectedDomain?.id === domain.id ? styles.selected : ''}`}
                  onClick={() => setSelectedDomain(domain)}
                >
                  <span className={styles.treeIcon}>◈</span>
                  <span>{domain.name}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'prototype' && (
            <div className={styles.tree}>
              <h3 className={styles.treeTitle}>原型页面</h3>
              {mockPrototypes.map((proto) => (
                <Link
                  key={proto.id}
                  href={`/preview?id=${proto.id}`}
                  className={styles.treeItem}
                >
                  <span className={styles.treeIcon}>📄</span>
                  <span>{proto.name}</span>
                  <span className={styles.treeBadge}>{proto.pages} 页</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* 主内容区 */}
      <main className={styles.main}>
        {/* 标签页 */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'domain' ? styles.active : ''}`}
            onClick={() => setActiveTab('domain')}
          >
            领域模型
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'prototype' ? styles.active : ''}`}
            onClick={() => setActiveTab('prototype')}
          >
            原型预览
          </button>
        </div>

        {/* 内容 */}
        <div className={styles.content}>
          {activeTab === 'domain' && (
            <div className={styles.domainView}>
              <h2>领域模型</h2>
              <p>实体数量: {mockDomains.length}</p>
              {selectedDomain && (
                <div className={styles.entityDetail}>
                  <h3>{selectedDomain.name}</h3>
                  <p>{selectedDomain.description}</p>
                  <table className={styles.attrTable}>
                    <thead>
                      <tr>
                        <th>属性名</th>
                        <th>类型</th>
                        <th>必填</th>
                        <th>描述</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDomain.attributes.map((attr) => (
                        <tr key={attr.name}>
                          <td>{attr.name}</td>
                          <td>
                            <code>{attr.type}</code>
                          </td>
                          <td>{attr.required ? '是' : '否'}</td>
                          <td>{attr.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === 'prototype' && (
            <div className={styles.prototypeView}>
              <h2>原型预览</h2>
              <div className={styles.prototypeList}>
                {mockPrototypes.map((proto) => (
                  <Link
                    key={proto.id}
                    href={`/preview?id=${proto.id}`}
                    className={styles.prototypeCard}
                  >
                    <span className={styles.prototypeIcon}>🎨</span>
                    <span className={styles.prototypeName}>{proto.name}</span>
                    <span className={styles.prototypePages}>
                      {proto.pages} 页
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>加载中...</div>}>
      <ProjectDetailContent />
    </Suspense>
  );
}
