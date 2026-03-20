'use client';

import { getAuthToken } from '@/lib/auth-token';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './prototype.module.css';
import {
  apiService,
  PrototypeSnapshot,
  UIPage,
  UIComponent,
  Project,
} from '@/services/api';

// 设备配置
const devices = [
  {
    id: 'desktop',
    name: '桌面端',
    width: '100%',
    icon: '🖥️',
    description: '响应式布局',
  },
  {
    id: 'tablet',
    name: '平板',
    width: '768px',
    icon: '📱',
    description: 'iPad / 平板设备',
  },
  {
    id: 'mobile',
    name: '手机',
    width: '375px',
    icon: '📲',
    description: 'iPhone / Android',
  },
];

// 组件图标映射
const componentIcons: Record<string, string> = {
  navigation: '🧭',
  container: '📦',
  text: '📝',
  button: '🔘',
  input: '✏️',
  form: '📋',
  card: '🎴',
  list: '📑',
  table: '📊',
  chart: '📈',
  image: '🖼️',
  media: '🎬',
};

export default function PrototypePreview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const snapshotId = searchParams.get('snapshotId');

  const [project, setProject] = useState<Project | null>(null);
  const [snapshots, setSnapshots] = useState<PrototypeSnapshot[]>([]);
  const [pages, setPages] = useState<UIPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedPage, setSelectedPage] = useState<UIPage | null>(null);
  const [selectedDevice, setSelectedDevice] = useState('desktop');
  const [zoom, setZoom] = useState(100);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPageList, setShowPageList] = useState(true);
  const [selectedComponent, setSelectedComponent] =
    useState<UIComponent | null>(null);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('preview');

  // 初始化
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/auth');
      return;
    }

    const fetchData = async () => {
      try {
        if (projectId) {
          const projectData = await apiService.getProject(projectId);
          setProject(projectData);

          // 加载快照
          const snapshotsData =
            await apiService.getPrototypeSnapshots(projectId);
          setSnapshots(snapshotsData);

          // 如果有 snapshotId，加载该快照
          if (snapshotId) {
            const snapshot = await apiService.getPrototypeSnapshot(snapshotId);
            if (snapshot.content) {
              const content = JSON.parse(snapshot.content);
              setPages(content.pages || []);
            }
          } else if (snapshotsData.length > 0) {
            // 默认加载最新快照
            const latestSnapshot = snapshotsData[0];
            if (latestSnapshot.content) {
              const content = JSON.parse(latestSnapshot.content);
              setPages(content.pages || []);
            }
          } else {
            // 无快照数据
            setPages([]);
          }
        } else {
          // 无项目数据
          setPages([]);
        }
      } catch (err: unknown) {
        console.error('Load error:', err);
        // 错误时使用空数据
        setPages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, snapshotId, router]);

  // 设置默认选中的页面
  useEffect(() => {
    if (pages.length > 0 && !selectedPage) {
      setSelectedPage(pages[0]);
    }
  }, [pages, selectedPage]);

  // 渲染组件预览
  const renderComponent = useCallback(
    (component: UIComponent, depth = 0): React.ReactNode => {
      const isSelected = selectedComponent?.id === component.id;

      const baseStyle: React.CSSProperties = {
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      };

      if (isSelected) {
        baseStyle.boxShadow = '0 0 0 2px #00d4ff';
        baseStyle.borderRadius = '4px';
      }

      switch (component.type) {
        case 'navigation':
          return (
            <nav
              key={component.id}
              style={{
                ...baseStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 24px',
                backgroundColor: '#1a1a2e',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent(component);
              }}
            >
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#00d4ff',
                }}
              >
                {component.props.title || '应用'}
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                {((component.props.items as string[]) || []).map((item, i) => (
                  <span
                    key={i}
                    style={{
                      color: '#94a3b8',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </nav>
          );

        case 'container':
          return (
            <div
              key={component.id}
              style={{
                ...baseStyle,
                padding:
                  component.props.className === 'hero' ? '80px 24px' : '24px',
                backgroundColor:
                  component.props.className === 'hero'
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                    : 'transparent',
                textAlign:
                  component.props.className === 'hero' ? 'center' : 'left',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent(component);
              }}
            >
              {component.children?.map((child) =>
                renderComponent(child, depth + 1)
              )}
            </div>
          );

        case 'text':
          const TextTag =
            component.props.variant === 'h1'
              ? 'h1'
              : component.props.variant === 'h2'
                ? 'h2'
                : 'p';
          const textStyle: React.CSSProperties = {
            ...baseStyle,
            fontSize:
              component.props.variant === 'h1'
                ? '32px'
                : component.props.variant === 'h2'
                  ? '24px'
                  : '16px',
            fontWeight: component.props.variant?.startsWith('h')
              ? 'bold'
              : 'normal',
            color:
              component.props.className === 'hero-title'
                ? '#ffffff'
                : component.props.className === 'hero-subtitle'
                  ? '#94a3b8'
                  : '#e2e8f0',
            marginBottom: component.props.variant === 'h1' ? '16px' : '8px',
          };
          return (
            <TextTag
              key={component.id}
              style={textStyle}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent(component);
              }}
            >
              {component.props.text || '文本内容'}
            </TextTag>
          );

        case 'button':
          const buttonStyle: React.CSSProperties = {
            ...baseStyle,
            padding:
              component.props.size === 'large'
                ? '16px 32px'
                : component.props.size === 'small'
                  ? '8px 16px'
                  : '12px 24px',
            backgroundColor:
              component.props.variant === 'primary' ? '#00d4ff' : 'transparent',
            color:
              component.props.variant === 'primary' ? '#0f172a' : '#00d4ff',
            border:
              component.props.variant === 'primary'
                ? 'none'
                : '1px solid #00d4ff',
            borderRadius: '8px',
            fontSize: component.props.size === 'large' ? '16px' : '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          };
          return (
            <button
              key={component.id}
              style={buttonStyle}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent(component);
              }}
            >
              {component.props.text || '按钮'}
            </button>
          );

        case 'input':
          return (
            <div key={component.id} style={{ marginBottom: '16px' }}>
              {component.props.label && (
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#94a3b8',
                    fontSize: '14px',
                  }}
                >
                  {component.props.label}
                </label>
              )}
              <input
                type={component.props.type || 'text'}
                placeholder={component.props.placeholder}
                defaultValue={component.props.value}
                style={{
                  ...baseStyle,
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedComponent(component);
                }}
              />
            </div>
          );

        case 'card':
          return (
            <div
              key={component.id}
              style={{
                ...baseStyle,
                padding: '20px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent(component);
              }}
            >
              {component.props.title && (
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: '#ffffff',
                  }}
                >
                  {component.props.title}
                </h3>
              )}
              {component.props.description && (
                <p
                  style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    marginBottom: '12px',
                  }}
                >
                  {component.props.description}
                </p>
              )}
              {component.props.value && (
                <div
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#00d4ff',
                    marginBottom: '8px',
                  }}
                >
                  {component.props.value}
                </div>
              )}
              {component.props.price && (
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#10b981',
                    marginBottom: '12px',
                  }}
                >
                  {component.props.price}
                </div>
              )}
              {component.props.trend && (
                <div style={{ fontSize: '14px', color: '#10b981' }}>
                  {component.props.trend}
                </div>
              )}
            </div>
          );

        case 'list':
          return (
            <div
              key={component.id}
              style={{
                ...baseStyle,
                display: 'grid',
                gridTemplateColumns: component.props.columns
                  ? `repeat(${component.props.columns}, 1fr)`
                  : '1fr',
                gap: '16px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent(component);
              }}
            >
              {component.children?.map((child) =>
                renderComponent(child, depth + 1)
              )}
            </div>
          );

        case 'table':
          const columns = (component.props.columns as string[]) || [];
          const rows = (component.props.rows as string[][]) || [];
          return (
            <div
              key={component.id}
              style={{ ...baseStyle, overflowX: 'auto' }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent(component);
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    {columns.map((col, i) => (
                      <th
                        key={i}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#94a3b8',
                          borderBottom: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          style={{
                            padding: '12px 16px',
                            fontSize: '14px',
                            color: '#e2e8f0',
                          }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

        case 'form':
          return (
            <div
              key={component.id}
              style={{
                ...baseStyle,
                padding: '24px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent(component);
              }}
            >
              {component.props.title && (
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '24px',
                    color: '#ffffff',
                  }}
                >
                  {component.props.title}
                </h2>
              )}
              {component.children?.map((child) =>
                renderComponent(child, depth + 1)
              )}
            </div>
          );

        case 'chart':
          return (
            <div
              key={component.id}
              style={{
                ...baseStyle,
                height: '300px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent(component);
              }}
            >
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>📈</div>
                <div style={{ fontSize: '14px' }}>
                  {component.props.title || '图表'}
                </div>
              </div>
            </div>
          );

        default:
          return (
            <div
              key={component.id}
              style={{
                ...baseStyle,
                padding: '16px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedComponent(component);
              }}
            >
              {component.type}
            </div>
          );
      }
    },
    [selectedComponent]
  );

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.bgEffect}>
          <div className={styles.gridOverlay} />
          <div className={styles.glowOrb} />
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>加载原型数据...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} data-testid="prototype-container">
      {/* 背景特效 */}
      <div className={styles.bgEffect}>
        <div className={styles.gridOverlay} />
        <div className={styles.glowOrb} />
      </div>

      {/* 顶部工具栏 */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link
            href={
              projectId ? `/dashboard?projectId=${projectId}` : '/dashboard'
            }
            className={styles.backBtn}
          >
            <span>←</span>
            <span>返回</span>
          </Link>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>{project?.name || '原型预览'}</h1>
            <span className={styles.subtitle}>{pages.length} 个页面</span>
          </div>
        </div>

        <div className={styles.headerCenter}>
          {/* 设备切换 */}
          <div className={styles.deviceTabs}>
            {devices.map((device) => (
              <button
                key={device.id}
                className={`${styles.deviceTab} ${selectedDevice === device.id ? styles.active : ''}`}
                onClick={() => setSelectedDevice(device.id)}
                title={device.description}
                data-testid={`device-${device.id}`}
              >
                <span className={styles.deviceIcon}>{device.icon}</span>
                <span className={styles.deviceName}>{device.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* 缩放控制 */}
          <div className={styles.zoomControl}>
            <button
              className={styles.zoomBtn}
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              disabled={zoom <= 25}
              data-testid="zoom-out"
            >
              −
            </button>
            <span className={styles.zoomValue} data-testid="zoom-level">{zoom}%</span>
            <button
              className={styles.zoomBtn}
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              disabled={zoom >= 200}
              data-testid="zoom-in"
            >
              +
            </button>
          </div>

          {/* 视图切换 */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${previewMode === 'preview' ? styles.active : ''}`}
              onClick={() => setPreviewMode('preview')}
              title="预览模式"
            >
              👁️
            </button>
            <button
              className={`${styles.viewBtn} ${previewMode === 'edit' ? styles.active : ''}`}
              onClick={() => setPreviewMode('edit')}
              title="编辑模式"
            >
              ✏️
            </button>
          </div>

          {/* 侧边栏切换 */}
          <button
            className={styles.toggleBtn}
            onClick={() => setShowSidebar(!showSidebar)}
            title={showSidebar ? '隐藏侧边栏' : '显示侧边栏'}
          >
            {showSidebar ? '☰' : '☷'}
          </button>

          {/* 导出按钮 */}
          <button className={styles.exportBtn}>
            <span>📤</span>
            <span>导出</span>
          </button>
        </div>
      </header>

      <div className={styles.mainContainer}>
        {/* 左侧页面列表 */}
        {showPageList && (
          <aside className={styles.pageList} data-testid="page-list">
            <div className={styles.pageListHeader}>
              <h2 className={styles.pageListTitle}>页面</h2>
              <span className={styles.pageCount}>{pages.length}</span>
            </div>

            <div className={styles.pageListContent}>
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className={`${styles.pageItem} ${selectedPage?.id === page.id ? styles.active : ''}`}
                  onClick={() => setSelectedPage(page)}
                >
                  <div className={styles.pageIndex}>{index + 1}</div>
                  <div className={styles.pageInfo}>
                    <span className={styles.pageName}>{page.name}</span>
                    <span className={styles.pageRoute}>{page.route}</span>
                  </div>
                  <span className={styles.pageComponents}>
                    {page.components?.length || 0} 组件
                  </span>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* 中间预览区域 */}
        <main className={styles.previewArea} data-testid="preview-frame">
          <div
            className={styles.previewContainer}
            style={{
              width: devices.find((d) => d.id === selectedDevice)?.width,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* 浏览器模拟器 */}
            <div className={styles.browserFrame}>
              <div className={styles.browserHeader}>
                <div className={styles.browserDots}>
                  <span
                    className={styles.browserDot}
                    style={{ backgroundColor: '#ff5f56' }}
                  ></span>
                  <span
                    className={styles.browserDot}
                    style={{ backgroundColor: '#ffbd2e' }}
                  ></span>
                  <span
                    className={styles.browserDot}
                    style={{ backgroundColor: '#27ca40' }}
                  ></span>
                </div>
                <div className={styles.browserUrl}>
                  <span className={styles.urlIcon}>🔒</span>
                  <span>vibex.app{selectedPage?.route || '/'}</span>
                </div>
                <div className={styles.browserActions}>
                  <span>↻</span>
                  <span>⋮</span>
                </div>
              </div>

              <div className={styles.browserContent}>
                {selectedPage ? (
                  <div className={styles.pageContent} data-testid="preview-content">
                    {selectedPage.components?.map((comp) =>
                      renderComponent(comp)
                    )}
                  </div>
                ) : (
                  <div className={styles.emptyPage}>
                    <span className={styles.emptyIcon}>📄</span>
                    <p>选择一个页面开始预览</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* 右侧信息面板 */}
        {showSidebar && (
          <aside className={styles.infoPanel} data-testid="prototype-sidebar">
            <div className={styles.panelSection}>
              <h3 className={styles.panelTitle}>页面信息</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>页面名称</span>
                  <span className={styles.infoValue}>
                    {selectedPage?.name || '-'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>路由</span>
                  <span className={styles.infoValue}>
                    {selectedPage?.route || '-'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>组件数</span>
                  <span className={styles.infoValue}>
                    {selectedPage?.components?.length || 0}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>布局</span>
                  <span className={styles.infoValue}>
                    {selectedPage?.layout?.type || 'single'}
                  </span>
                </div>
              </div>
            </div>

            {selectedComponent && (
              <div className={styles.panelSection}>
                <h3 className={styles.panelTitle}>组件属性</h3>
                <div className={styles.componentInfo}>
                  <div className={styles.componentHeader}>
                    <span className={styles.componentIcon}>
                      {componentIcons[selectedComponent.type] || '📦'}
                    </span>
                    <span className={styles.componentType}>
                      {selectedComponent.type}
                    </span>
                  </div>
                  <div className={styles.propsList}>
                    {Object.entries(selectedComponent.props).map(
                      ([key, value]) => (
                        <div key={key} className={styles.propItem}>
                          <span className={styles.propKey}>{key}</span>
                          <span className={styles.propValue}>
                            {typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className={styles.panelSection}>
              <h3 className={styles.panelTitle}>预览设置</h3>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>设备类型</span>
                <span className={styles.settingValue}>
                  {devices.find((d) => d.id === selectedDevice)?.name}
                </span>
              </div>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>视口宽度</span>
                <span className={styles.settingValue}>
                  {devices.find((d) => d.id === selectedDevice)?.width}
                </span>
              </div>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>缩放比例</span>
                <span className={styles.settingValue}>{zoom}%</span>
              </div>
            </div>

            <div className={styles.panelTip}>
              <span className={styles.tipIcon}>💡</span>
              <p className={styles.tipText}>点击页面组件可查看详细属性</p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
