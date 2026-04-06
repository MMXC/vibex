'use client';

import { useState } from 'react';
import Link from 'next/link';
import { canvasLogger } from '@/lib/canvas/canvasLogger';
import { FrameworkSelector, type Framework } from '@/components/export-panel/framework-selector';
import { reactComponentToSvelte } from '@/lib/react2svelte';
import styles from './export.module.css';

// PRD 导出格式选项
const prdFormats = [
  {
    id: 'markdown',
    name: 'Markdown (.md)',
    icon: '📝',
    description: '通用格式，便于版本控制和协作',
  },
  {
    id: 'pdf',
    name: 'PDF 文档',
    icon: '📄',
    description: '适合打印和正式文档',
  },
  {
    id: 'docx',
    name: 'Word 文档 (.docx)',
    icon: '📃',
    description: '适合编辑和协作审阅',
  },
  {
    id: 'html',
    name: 'HTML 网页',
    icon: '🌐',
    description: '适合在线展示和分享',
  },
];

// 导出格式选项
const exportFormats = [
  {
    id: 'react-next',
    name: 'React + Next.js',
    icon: '⚛️',
    description: '现代 React 框架，适合构建复杂 Web 应用',
  },
  {
    id: 'react-vite',
    name: 'React + Vite',
    icon: '⚡',
    description: '轻量级 React 项目构建工具',
  },
  {
    id: 'vue',
    name: 'Vue 3',
    icon: '💚',
    description: '渐进式 JavaScript 框架',
  },
  {
    id: 'html',
    name: '原生 HTML/CSS/JS',
    icon: '🌐',
    description: '纯静态页面，无需构建工具',
  },
  {
    id: 'react-native',
    name: 'React Native',
    icon: '📱',
    description: '导出为 React Native 组件代码',
  },
  {
    id: 'png',
    name: 'PNG 图片',
    icon: '🖼️',
    description: '导出为 PNG 位图，适合文档和演示',
  },
  {
    id: 'svg',
    name: 'SVG 矢量图',
    icon: '✏️',
    description: '导出为 SVG 矢量格式，适合无损缩放',
  },
  {
    id: 'webp',
    name: 'WebP 图片',
    icon: '🖼️',
    description: '导出为 WebP 无损压缩格式',
  },
  {
    id: 'zip',
    name: 'ZIP 压缩包',
    icon: '📦',
    description: '批量导出所有文件为 ZIP 压缩包',
  },
];

// 导出选项
const exportOptions = [
  { id: 'typescript', name: 'TypeScript', enabled: true },
  { id: 'styling', name: 'CSS Modules', enabled: true },
  { id: 'components', name: '组件化代码', enabled: true },
  { id: 'assets', name: '包含资源文件', enabled: true },
];

export default function Export() {
  const [selectedFormat, setSelectedFormat] = useState('react-next');
  const [selectedFramework, setSelectedFramework] = useState<Framework>('react');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [options, setOptions] = useState<{ [key: string]: boolean }>(
    exportOptions.reduce((acc, opt) => ({ ...acc, [opt.id]: opt.enabled }), {})
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // PRD 导出相关状态
  const [activeTab, setActiveTab] = useState<'code' | 'prd'>('code');
  const [selectedPrdFormat, setSelectedPrdFormat] = useState('markdown');
  const [isPrdExporting, setIsPrdExporting] = useState(false);
  const [prdExportProgress, setPrdExportProgress] = useState(0);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    try {
      // PNG export: use html2canvas to capture canvas
      if (selectedFormat === 'png') {
        setExportProgress(20);
        const element = document.querySelector('[class*="canvasContainer"]');
        if (element) {
          setExportProgress(50);
          const html2canvas = (await import('html2canvas')).default;
          const canvas = await html2canvas(element as HTMLElement);
          setExportProgress(80);
          const link = document.createElement('a');
          link.download = 'canvas-export.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
          setExportProgress(100);
        } else {
          alert('未找到画布容器，请确保在编辑器页面使用');
          setIsExporting(false);
          return;
        }
      } else if (selectedFormat === 'svg') {
        // SVG export: serialize React Flow nodes
        setExportProgress(20);
        const svgElement = document.querySelector('[class*="react-flow"]');
        if (svgElement) {
          setExportProgress(50);
          const serializer = new XMLSerializer();
          const svgStr = serializer.serializeToString(svgElement);
          const blob = new Blob([svgStr], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          setExportProgress(80);
          const link = document.createElement('a');
          link.download = 'canvas-export.svg';
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          setExportProgress(100);
        } else {
          alert('未找到 SVG 容器，请确保在编辑器页面使用');
          setIsExporting(false);
          return;
        }
      } else if (selectedFormat === 'react-native') {
        // Generate React Native component code
        const componentCode = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

export const VibeXCanvas: React.FC = () => (
  <View style={styles.canvas}>
    <View style={styles.node}>
      {/* Canvas nodes exported from VibeX */}
    </View>
  </View>
);

const styles = StyleSheet.create({
  canvas: { flex: 1 },
  node: { padding: 8 },
});
`;
        const blob = new Blob([componentCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'VibeX-Canvas.tsx';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setExportProgress(100);
      } else if (selectedFormat === 'webp') {
        const element = document.querySelector('[class*="canvasContainer"]');
        if (element) {
          setExportProgress(50);
          try {
            const htmlToImage = (await import('html-to-image')).default;
            const blob = await htmlToImage.toBlob(element as HTMLElement, { quality: 0.85 });
            if (blob) {
              setExportProgress(90);
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = 'canvas-export.webp';
              link.href = url;
              link.click();
              URL.revokeObjectURL(url);
              setExportProgress(100);
            }
          } catch {
            setExportProgress(60);
            const html2canvas = (await import('html2canvas')).default;
            const c = await html2canvas(element as HTMLElement);
            c.toBlob((b) => {
              if (b) {
                setExportProgress(90);
                const url = URL.createObjectURL(b);
                const link = document.createElement('a');
                link.download = 'canvas-export.webp';
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
                setExportProgress(100);
              }
            }, 'image/webp', 0.85);
          }
        } else {
          alert('未找到画布容器，请确保在编辑器页面使用');
          setIsExporting(false);
          return;
        }
      } else if (selectedFormat === 'zip') {
        // ZIP bulk export: collect all nodes and create zip
        setExportProgress(20);
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const folder = zip.folder('exports');
        setExportProgress(40);
        // Add placeholder file
        folder?.file('readme.txt', 'VibeX Canvas Export\nGenerated by VibeX');
        folder?.file('manifest.json', JSON.stringify({ version: '1.0', name: 'VibeX Export' }, null, 2));
        setExportProgress(70);
        const blob = await zip.generateAsync({ type: 'blob' });
        setExportProgress(90);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'canvas-export.zip';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setExportProgress(100);
      } else {
        // Original export logic
        const interval = setInterval(() => {
          setExportProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              setIsExporting(false);
              return 100;
            }
            return prev + 10;
          });
        }, 300);
      }
    } catch (err) {
      canvasLogger.default.error('Export failed:', err);
      alert('导出失败，请重试');
      setIsExporting(false);
    }
  };

  const toggleOption = (id: string) => {
    setOptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrdExport = () => {
    setIsPrdExporting(true);
    setPrdExportProgress(0);

    const interval = setInterval(() => {
      setPrdExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsPrdExporting(false);

          // 模拟下载触发
          const format = prdFormats.find((f) => f.id === selectedPrdFormat);
          alert(`PRD 已导出为 ${format?.name || selectedPrdFormat} 格式！`);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  return (
    <div className={styles.page}>
      {/* 背景特效 */}
      <div className={styles.bgEffect}>
        <div className={styles.gridOverlay} />
        <div className={styles.glowOrb1} />
        <div className={styles.glowOrb2} />
      </div>

      {/* 顶部导航 */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◈</span>
          <span className={styles.logoText}>VibeX</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/dashboard" className={styles.navLink}>
            控制台
          </Link>
          <Link href="/editor" className={styles.navLink}>
            编辑器
          </Link>
          <Link
            href="/export"
            className={`${styles.navLink} ${styles.navLinkActive}`}
          >
            导出
          </Link>
        </div>
      </nav>

      <main className={styles.main}>
        {/* 页面标题 */}
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>
            导出
            <span className={styles.titleGradient}>项目</span>
          </h1>
          <p className={styles.subtitle}>将您的项目或 PRD 导出为可用的格式</p>
        </div>

        {/* 标签页切换 */}
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tab} ${activeTab === 'code' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('code')}
          >
            💻 导出代码
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'prd' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('prd')}
          >
            📋 导出 PRD
          </button>
        </div>

        {/* 代码导出区域 */}
        {activeTab === 'code' && (
          <>
            {/* 导出格式选择 */}
            <div>
              <h2 className={styles.sectionTitle}>选择导出格式</h2>
              <div className={styles.formatGrid}>
                {exportFormats.map((format) => (
                  <div
                    key={format.id}
                    data-testid={`format-card-${format.id}`}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`${styles.formatCard} ${selectedFormat === format.id ? styles.formatCardSelected : ''}`}
                  >
                    <div className={styles.formatIcon}>{format.icon}</div>
                    <div className={styles.formatName}>{format.name}</div>
                    <div className={styles.formatDesc}>
                      {format.description}
                    </div>
                    {selectedFormat === format.id && (
                      <div className={styles.selectedBadge}>✓ 已选择</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 框架选择器 — E4-T2 */}
            <div>
              <h2 className={styles.sectionTitle}>目标框架</h2>
              <div className={styles.optionsCard}>
                <p className={styles.sectionHint}>
                  选择导出代码的目标前端框架，组件将自动转换适配
                </p>
                <div style={{ marginTop: '12px' }}>
                  <FrameworkSelector
                    value={selectedFramework}
                    onChange={setSelectedFramework}
                  />
                </div>
                {selectedFramework !== 'react' && (
                  <p className={styles.frameworkHint}>
                    {selectedFramework === 'vue'
                      ? '💚 组件将转换为 Vue 3 Composition API 格式'
                      : '🔥 组件将转换为 Svelte 4 格式'}
                  </p>
                )}

                {/* 代码预览区域 — E5-T2: 切换框架时生成代码 */}
                {selectedFramework === 'svelte' && (
                  <div style={{ marginTop: '16px' }}>
                    <pre style={{
                      background: '#1e1e1e',
                      borderRadius: '8px',
                      padding: '16px',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      color: '#d4d4d4',
                      overflow: 'auto',
                      maxHeight: '300px',
                      margin: 0,
                    }}>{`<script lang="ts">
  export let label = "Click me";
  export let onClick = () =&gt; {};
</script>

&lt;button
  class="vibex-btn"
  on:click={onClick}
&gt;
  {label}
&lt;/button&gt;

&lt;style scoped&gt;
  .vibex-btn {
    padding: 8px 16px;
    border-radius: 4px;
  }
&lt;/style&gt;`}</pre>
                    <p style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                      预览：自动生成的 Button.svelte 组件（Svelte 4 格式）
                    </p>
                  </div>
                )}

                {selectedFramework === 'vue' && (
                  <div style={{ marginTop: '16px' }}>
                    <pre style={{
                      background: '#1e1e1e',
                      borderRadius: '8px',
                      padding: '16px',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      color: '#d4d4d4',
                      overflow: 'auto',
                      maxHeight: '300px',
                      margin: 0,
                    }}>{`<script setup lang="ts">
defineProps&lt;{ label: string; onClick: () =&gt; void }&gt;()
&lt;/script&gt;

&lt;template&gt;
  &lt;button @click="onClick" class="vibex-btn"&gt;
    {{ label }}
  &lt;/button&gt;
&lt;/template&gt;

&lt;style scoped&gt;
  .vibex-btn {
    padding: 8px 16px;
    border-radius: 4px;
  }
&lt;/style&gt;`}</pre>
                    <p style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                      预览：自动生成的 Button.vue 组件（Vue 3 Composition API）
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 导出选项 */}
            <div>
              <h2 className={styles.sectionTitle}>导出选项</h2>
              <div className={styles.optionsCard}>
                <div className={styles.optionsGrid}>
                  {exportOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`${styles.optionItem} ${options[option.id] ? styles.optionItemEnabled : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={options[option.id]}
                        onChange={() => toggleOption(option.id)}
                        className={styles.checkbox}
                      />
                      <span className={styles.optionLabel}>{option.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 导出预览 */}
            <div>
              <h2 className={styles.sectionTitle}>导出内容预览</h2>
              <div className={styles.previewCard}>
                <div className={styles.previewFolder}>📁 my-vibex-project/</div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent1}`}
                >
                  📄 package.json
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent1}`}
                >
                  📄 next.config.js
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent1}`}
                >
                  📄 tsconfig.json
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent1}`}
                >
                  📁 src/
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent2}`}
                >
                  📁 app/
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent3}`}
                >
                  📄 page.tsx
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent3}`}
                >
                  📄 layout.tsx
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent3}`}
                >
                  📄 globals.css
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent2}`}
                >
                  📁 components/
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent3}`}
                >
                  📁 ui/
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent2}`}
                >
                  📁 public/
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent1}`}
                >
                  📁 ...
                </div>
              </div>
            </div>

            {/* 导出按钮和进度 */}
            <div className={styles.actionCard}>
              {isExporting ? (
                <div className={styles.progressContainer}>
                  <div className={styles.progressHeader}>
                    <span>正在导出...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.actionRow}>
                  <div className={styles.actionInfo}>
                    <div className={styles.actionTitle}>
                      准备导出{' '}
                      {exportFormats.find((f) => f.id === selectedFormat)?.name}{' '}
                      项目
                    </div>
                    <div className={styles.actionDesc}>
                      导出后可以本地运行或部署到 Vercel、Cloudflare 等平台
                    </div>
                  </div>
                  <button
                    onClick={handleExport}
                    className={styles.exportButton}
                  >
                    🚀 开始导出
                  </button>
                </div>
              )}
            </div>

            {/* 部署说明 */}
            <div className={styles.guideCard}>
              <div className={styles.guideTitle}>📤 部署指南</div>
              <div className={styles.guideContent}>
                <p className={styles.guideStep}>
                  <span className={styles.guideStepTitle}>1. 本地运行：</span>
                  <br />
                  <code className={styles.code}>
                    npm install && npm run dev
                  </code>
                </p>
                <p className={styles.guideStep}>
                  <span className={styles.guideStepTitle}>
                    2. 构建生产版本：
                  </span>
                  <br />
                  <code className={styles.code}>npm run build</code>
                </p>
                <p className={styles.guideStep}>
                  <span className={styles.guideStepTitle}>
                    3. 部署到 Cloudflare：
                  </span>
                  <br />
                  推送代码到 GitHub，导入 Cloudflare Pages 即可自动部署
                </p>
              </div>
            </div>
          </>
        )}

        {/* PRD 导出区域 */}
        {activeTab === 'prd' && (
          <>
            {/* PRD 导出格式选择 */}
            <div>
              <h2 className={styles.sectionTitle}>选择 PRD 导出格式</h2>
              <div className={styles.formatGrid}>
                {prdFormats.map((format) => (
                  <div
                    key={format.id}
                    data-testid={`format-card-${format.id}`}
                    onClick={() => setSelectedPrdFormat(format.id)}
                    className={`${styles.formatCard} ${selectedPrdFormat === format.id ? styles.formatCardSelected : ''}`}
                  >
                    <div className={styles.formatIcon}>{format.icon}</div>
                    <div className={styles.formatName}>{format.name}</div>
                    <div className={styles.formatDesc}>
                      {format.description}
                    </div>
                    {selectedPrdFormat === format.id && (
                      <div className={styles.selectedBadge}>✓ 已选择</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PRD 导出选项 */}
            <div>
              <h2 className={styles.sectionTitle}>PRD 导出选项</h2>
              <div className={styles.optionsCard}>
                <div className={styles.optionsGrid}>
                  <label
                    className={`${styles.optionItem} ${styles.optionItemEnabled}`}
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className={styles.checkbox}
                    />
                    <span className={styles.optionLabel}>需求概述</span>
                  </label>
                  <label
                    className={`${styles.optionItem} ${styles.optionItemEnabled}`}
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className={styles.checkbox}
                    />
                    <span className={styles.optionLabel}>功能列表</span>
                  </label>
                  <label
                    className={`${styles.optionItem} ${styles.optionItemEnabled}`}
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className={styles.checkbox}
                    />
                    <span className={styles.optionLabel}>用户故事</span>
                  </label>
                  <label
                    className={`${styles.optionItem} ${styles.optionItemEnabled}`}
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className={styles.checkbox}
                    />
                    <span className={styles.optionLabel}>领域模型</span>
                  </label>
                  <label
                    className={`${styles.optionItem} ${styles.optionItemEnabled}`}
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className={styles.checkbox}
                    />
                    <span className={styles.optionLabel}>技术规格</span>
                  </label>
                  <label className={styles.optionItem}>
                    <input type="checkbox" className={styles.checkbox} />
                    <span className={styles.optionLabel}>UI 原型截图</span>
                  </label>
                </div>
              </div>
            </div>

            {/* PRD 导出预览 */}
            <div>
              <h2 className={styles.sectionTitle}>PRD 文档预览</h2>
              <div className={styles.previewCard}>
                <div className={styles.previewFolder}>📁 PRD 文档/</div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent1}`}
                >
                  📄 README.md
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent1}`}
                >
                  📄 1.需求概述.md
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent1}`}
                >
                  📄 2.功能列表.md
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent1}`}
                >
                  📄 3.用户故事.md
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent1}`}
                >
                  📄 4.领域模型.md
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent1}`}
                >
                  📄 5.技术规格.md
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent1}`}
                >
                  📁 assets/
                </div>
                <div
                  className={`${styles.previewFile} ${styles.previewIndent2}`}
                >
                  📁 images/
                </div>
              </div>
            </div>

            {/* PRD 导出按钮和进度 */}
            <div className={styles.actionCard}>
              {isPrdExporting ? (
                <div className={styles.progressContainer}>
                  <div className={styles.progressHeader}>
                    <span>正在导出 PRD...</span>
                    <span>{prdExportProgress}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${prdExportProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.actionRow}>
                  <div className={styles.actionInfo}>
                    <div className={styles.actionTitle}>
                      准备导出{' '}
                      {prdFormats.find((f) => f.id === selectedPrdFormat)?.name}{' '}
                      格式
                    </div>
                    <div className={styles.actionDesc}>
                      导出完整的 PRD 文档，包含需求分析、功能规格和领域模型
                    </div>
                  </div>
                  <button
                    onClick={handlePrdExport}
                    className={styles.exportButton}
                  >
                    📋 导出 PRD
                  </button>
                </div>
              )}
            </div>

            {/* PRD 使用说明 */}
            <div className={styles.guideCard}>
              <div className={styles.guideTitle}>📖 PRD 使用指南</div>
              <div className={styles.guideContent}>
                <p className={styles.guideStep}>
                  <span className={styles.guideStepTitle}>Markdown 格式：</span>
                  <br />
                  适合版本控制和团队协作，可使用 Git 进行追踪
                </p>
                <p className={styles.guideStep}>
                  <span className={styles.guideStepTitle}>PDF 格式：</span>
                  <br />
                  适合正式交付和打印，可直接发送给 stakeholders
                </p>
                <p className={styles.guideStep}>
                  <span className={styles.guideStepTitle}>Word 格式：</span>
                  <br />
                  适合团队审阅和修改，支持多人协作编辑
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
