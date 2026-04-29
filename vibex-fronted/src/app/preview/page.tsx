'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SimpleSteps } from '@/components/ui/Steps';
import { TemplateSelector } from '@/components/templates';
import { useConfirmationStore } from '@/stores/confirmationStore';
import type { BusinessFlow as ConfirmationBusinessFlow } from '@/stores/confirmationStore';
import styles from './preview.module.css';

// 4步设计流程
const designSteps = ['需求输入', '限界上下文', '领域模型', '业务流程'];

// 模拟预览页面数据
const previewPages = [
  { id: 1, name: '首页', thumbnail: '🏠' },
  { id: 2, name: '关于', thumbnail: '📄' },
  { id: 3, name: '产品', thumbnail: '📦' },
  { id: 4, name: '联系', thumbnail: '📧' },
  { id: 5, name: '博客', thumbnail: '📝' },
  { id: 6, name: '定价', thumbnail: '💰' },
];

// 模拟设备尺寸
const devices = [
  { id: 'desktop', name: '桌面端', width: '100%', icon: '🖥️' },
  { id: 'tablet', name: '平板', width: '768px', icon: '📱' },
  { id: 'mobile', name: '手机', width: '375px', icon: '📲' },
];

export default function Preview() {
  const [selectedPage, setSelectedPage] = useState(previewPages[0]!);
  const [device, setDevice] = useState('desktop');
  const [zoom, setZoom] = useState(100);
  const [showPageList, setShowPageList] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [requirementText, setRequirementText] = useState('');
  const [mounted, setMounted] = useState(false);

  // 避免 SSR 问题
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取 Store 数据
  const boundedContexts = useConfirmationStore((s) => s.boundedContexts) || [];
  const domainModels = useConfirmationStore((s) => s.domainModels) || [];
  const businessFlow = (useConfirmationStore((s) => s.businessFlow) || { steps: [], currentStepIndex: 0, states: [], transitions: [] }) as ConfirmationBusinessFlow;

  // 根据数据确定当前步骤
  const getCurrentStep = () => {
    if ((businessFlow as ConfirmationBusinessFlow).states?.length ?? 0 > 0) return 3; // 业务流程
    if (domainModels?.length > 0) return 2; // 领域模型
    if (boundedContexts?.length > 0) return 1; // 限界上下文
    return 0; // 需求输入
  };

  const currentStep = getCurrentStep();

  return (
    <div className={styles.page}>
      {/* 顶部说明区域 */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          用 AI 轻松构建你的 Web 应用
        </h1>
        <p className={styles.subtitle}>
          描述需求，AI 实时生成预览
        </p>
      </header>

      {/* 步骤指示器 */}
      <div className={styles.stepIndicator}>
        {mounted && (
          <SimpleSteps
            steps={designSteps}
            current={currentStep}
          />
        )}
      </div>

      {/* 预览画布 */}
      <div className={styles.previewCanvas}>
        {/* 上下文图/模型图/流程图显示区域 */}
        <div className={styles.centerPanel}>
          {currentStep === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateEmoji}>🎯</div>
              <p>输入需求后，AI 将实时生成预览</p>
            </div>
          )}

          {currentStep >= 1 && boundedContexts.length > 0 && (
            <div className={styles.cardSection}>
              <h3 className={styles.cardTitle}>限界上下文</h3>
              <div className={styles.cardTags}>
                {(boundedContexts ?? []).map((ctx: any) => (
                  <div
                    key={ctx.id}
                    className={styles.cardTag}
                  >
                    {ctx.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep >= 2 && domainModels.length > 0 && (
            <div className={styles.cardSection}>
              <h3 className={styles.cardTitle}>领域模型</h3>
              <div className={styles.cardTags}>
                {(domainModels ?? []).map((model: any) => (
                  <div
                    key={model.id}
                    className={`${styles.cardTag} ${styles.cardTagPurple}`}
                  >
                    {model.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep >= 3 && ((businessFlow as ConfirmationBusinessFlow).states?.length ?? 0) > 0 && (
            <div className={styles.cardSection}>
              <h3 className={styles.cardTitle}>业务流程</h3>
              <div className={styles.cardTags}>
                {((businessFlow as ConfirmationBusinessFlow).states || []).map((state: { id: string; name: string }) => (
                  <div
                    key={state.id}
                    className={`${styles.cardTag} ${styles.cardTagGreen}`}
                  >
                    {state.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 顶部工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <a
            href="/"
            className={styles.logoLink}
          >
            VibeX
          </a>
          <span className={styles.breadcrumbSlash}>/</span>
          <span className={styles.breadcrumbItem}>页面预览</span>
        </div>

        {/* 页面选择 */}
        <div className={styles.toolbarCenter}>
          <button
            onClick={() => setShowPageList(!showPageList)}
            className={`${styles.pageSelectBtn} ${!showPageList ? styles.pageSelectBtnInactive : ''}`}
          >
            📄 {selectedPage.name}
          </button>
        </div>

        <div className={styles.toolbarRight}>
          {/* 缩放控制 */}
          <div className={styles.zoomGroup}>
            <button
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              className={styles.zoomBtn}
            >
              -
            </button>
            <span className={styles.zoomLabel}>
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className={styles.zoomBtn}
            >
              +
            </button>
          </div>

          <button className={styles.exportBtn}>
            📤 导出
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* 左侧设备面板 */}
        <div className={styles.leftPanel}>
          <h3 className={styles.panelSectionTitle}>
            设备类型
          </h3>
          <div className={styles.deviceList}>
            {devices.map((d) => (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                className={`${styles.deviceBtn} ${device === d.id ? styles.deviceBtnActive : ''}`}
              >
                <span className={styles.deviceBtnIcon}>{d.icon}</span>
                <span className={`${styles.deviceBtnLabel} ${device === d.id ? styles.deviceBtnLabelActive : ''}`}>
                  {d.name}
                </span>
              </button>
            ))}
          </div>

          {/* 页面列表 */}
          <h3 className={styles.panelSectionTitle}>
            页面列表
          </h3>
          <div className={styles.pageList}>
            {previewPages.map((page) => (
              <button
                key={page.id}
                onClick={() => setSelectedPage(page)}
                className={`${styles.pageBtn} ${selectedPage.id === page.id ? styles.pageBtnActive : ''}`}
              >
                <span className={styles.pageBtnIcon}>{page.thumbnail}</span>
                <span className={`${styles.pageBtnLabel} ${selectedPage.id === page.id ? styles.pageBtnLabelActive : ''}`}>
                  {page.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 中间预览区域 */}
        <div className={styles.previewCenter}>
          {/* 预览容器 */}
          <div
            className={styles.previewFrame}
            style={{ width: devices.find((d) => d.id === device)?.width, transform: `scale(${zoom / 100})` }}
          >
            {/* 浏览器地址栏 */}
            <div className={styles.browserBar}>
              <div className={styles.browserDots}>
                <span className={`${styles.browserDot} ${styles.browserDotRed}`}></span>
                <span className={`${styles.browserDot} ${styles.browserDotYellow}`}></span>
                <span className={`${styles.browserDot} ${styles.browserDotGreen}`}></span>
              </div>
              <div className={styles.browserUrl}>
                vibex.app/{selectedPage.name.toLowerCase()}
              </div>
            </div>

            {/* 预览内容 */}
            <div className={styles.previewContent}>
              {/* 模拟页面内容 */}
              <div className={styles.previewPage}>
                <h1 className={styles.previewH1}>
                  {selectedPage.name}
                </h1>
                <p className={styles.previewDesc}>
                  这是 {selectedPage.name} 页面的预览效果。
                </p>
                <div className={styles.previewGrid}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={styles.previewGridItem}
                    >
                      <div className={styles.previewGridEmoji}>📄</div>
                      <div className={styles.previewGridText}>内容块 {i}</div>
                    </div>
                  ))}
                </div>
                <button className={styles.previewCta}>
                  立即体验
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧信息面板 */}
        <div className={styles.rightPanel}>
          <h3 className={styles.rightPanelTitle}>
            预览信息
          </h3>

          <div className={styles.infoRow}>
            <label className={styles.infoLabel}>
              当前页面
            </label>
            <div className={styles.infoValue}>
              {selectedPage.name}
            </div>
          </div>

          <div className={styles.infoRow}>
            <label className={styles.infoLabel}>
              设备类型
            </label>
            <div className={styles.infoValue}>
              {devices.find((d) => d.id === device)?.name}
            </div>
          </div>

          <div className={styles.infoRow}>
            <label className={styles.infoLabel}>
              缩放比例
            </label>
            <div className={styles.infoValue}>{zoom}%</div>
          </div>

          <div className={styles.infoRow}>
            <label className={styles.infoLabel}>
              视口宽度
            </label>
            <div className={`${styles.infoValue} ${styles.infoValueMono}`}>
              {devices.find((d) => d.id === device)?.width}
            </div>
          </div>

          <div className={styles.tipBox}>
            <div className={styles.tipTitle}>
              💡 提示
            </div>
            <div className={styles.tipText}>
              点击"导出"按钮可以导出当前页面的 HTML、CSS 代码
            </div>
          </div>
        </div>
      </div>

      {/* 底部输入区域 - 需求输入框 + 生成按钮 */}
      <div className={styles.bottomSection}>
        <div className={styles.bottomRow}>
          <input
            type="text"
            placeholder="描述你的产品需求，例如：创建一个在线教育平台..."
            value={requirementText}
            onChange={(e) => setRequirementText(e.target.value)}
            className={styles.requirementInput}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(0, 212, 255, 0.5)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          />
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={styles.templateBtn}
          >
            📋 模板
          </button>
          <button className={styles.generateBtn}>
            🎯 开始生成
          </button>
        </div>

        {/* 模板选择器 */}
        {showTemplates && (
          <div className={styles.templateSelector}>
            <TemplateSelector
              isOpen={showTemplates}
              onClose={() => setShowTemplates(false)}
              onSelect={(template) => {
                setRequirementText(template.description || template.content || '');
                setShowTemplates(false);
              }}
            />
          </div>
        )}

        <p className={styles.bottomHint}>
          登录后可保存和导出项目
        </p>
      </div>
    </div>
  );
}
