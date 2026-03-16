/**
 * HomePage - 主页容器组件
 * 
 * 封装首页所有业务逻辑和 UI
 * 由 page.tsx 导入使用
 */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import LoginDrawer from '@/components/ui/LoginDrawer';
import { ParticleBackground } from '@/components/particles/ParticleBackground';
import { MermaidPreview } from '@/components/ui/MermaidPreview';
import { ThinkingPanel } from '@/components/ui/ThinkingPanel';
import { PageTreeDiagram } from '@/components/page-tree-diagram';
import { RequirementInput } from '@/components/requirement-input';
import { GitHubImport } from '@/components/github-import';
import { FigmaImport } from '@/components/figma-import';
import { PlanBuildButtons } from '@/components/plan-build';
import { PlanResult } from '@/components/plan-result';
import { Navbar, Sidebar } from '@/components/homepage';
import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar';
import { useDDDStream, useDomainModelStream, useBusinessFlowStream } from '@/hooks/useDDDStream';
import { useAuthStore } from '@/stores/authStore';
import { dddApi, projectApi } from '@/services/api';
import styles from '@/app/homepage.module.css';

// 五步流程
const STEPS = [
  { id: 1, label: '需求输入', description: '输入项目需求' },
  { id: 2, label: '限界上下文', description: '分析限界上下文' },
  { id: 3, label: '领域模型', description: '构建领域模型' },
  { id: 4, label: '业务流程', description: '设计业务流程' },
  { id: 5, label: '项目创建', description: '生成项目代码' },
];

// 类型定义
interface ContextRelationship {
  id: string;
  fromContextId: string;
  toContextId: string;
  type: 'upstream' | 'downstream' | 'symmetric';
  description: string;
}

interface BoundedContext {
  id: string;
  name: string;
  description: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  relationships: ContextRelationship[];
}

interface DomainModel {
  id: string;
  name: string;
  contextId: string;
  type: string;
  properties: Array<{ name: string; type: string }>;
}

interface BusinessFlow {
  id: string;
  name: string;
  mermaidCode?: string;
}

// 示例需求
const SAMPLE_REQUIREMENTS = [
  { title: '在线教育平台', desc: '开发一个在线教育平台，包含用户管理、课程管理、订单管理、支付等功能' },
  { title: '项目管理工具', desc: '创建一个项目管理仪表盘，包含任务列表、进度图表、团队协作功能' },
  { title: '电商网站', desc: '开发一个电商网站，包含商品展示、购物车、订单处理、支付集成' },
];

// 快捷回复
const QUICK_REPLIES = ['如何开始一个项目？', '支持哪些功能？', '什么是限界上下文？'];

// 差异化特性卡片
const FEATURE_CARDS = [
  { id: 1, icon: '🎯', title: '你主导', description: 'AI 辅助分析，你决策每一步', color: '#00d4ff' },
  { id: 2, icon: '📐', title: 'DDD 建模', description: '专业领域驱动设计方法论', color: '#8b5cf6' },
  { id: 3, icon: '🔄', title: '迭代优化', description: '可编辑可优化，所见即所得', color: '#00ff88' },
];

// 类型定义 - ActiveStreamData
interface ActiveStreamData {
  thinkingMessages: any[];
  contexts?: BoundedContext[];
  mermaidCode: string;
  status: 'idle' | 'thinking' | 'done' | 'error';
  errorMessage: string | null;
  onAbort: () => void;
  onRetry: () => void;
}

/**
 * 获取当前活跃的 SSE 流数据
 * 基于实际 SSE 状态而非 currentStep 选择消息
 * 优先级: 限界上下文 > 领域模型 > 业务流程
 */
function getActiveStreamData(
  // 限界上下文数据
  contextData: { messages: any[]; contexts: BoundedContext[]; mermaid: string; status: string; error: string | null; abort: () => void },
  // 领域模型数据
  modelData: { messages: any[]; mermaid: string; status: string; error: string | null; abort: () => void },
  // 业务流程数据
  flowData: { messages: any[]; mermaid: string; status: string; error: string | null; abort: () => void }
): ActiveStreamData | null {
  // 优先级 1: 限界上下文生成
  if (contextData.status !== 'idle') {
    return {
      thinkingMessages: contextData.messages,
      contexts: contextData.contexts,
      mermaidCode: contextData.mermaid,
      status: contextData.status as 'idle' | 'thinking' | 'done' | 'error',
      errorMessage: contextData.error,
      onAbort: contextData.abort,
      onRetry: () => {}, // Will be set by component
    };
  }

  // 优先级 2: 领域模型生成
  if (modelData.status !== 'idle') {
    return {
      thinkingMessages: modelData.messages,
      contexts: undefined,
      mermaidCode: modelData.mermaid,
      status: modelData.status as 'idle' | 'thinking' | 'done' | 'error',
      errorMessage: modelData.error,
      onAbort: modelData.abort,
      onRetry: () => {},
    };
  }

  // 优先级 3: 业务流程生成
  if (flowData.status !== 'idle') {
    return {
      thinkingMessages: flowData.messages,
      contexts: undefined,
      mermaidCode: flowData.mermaid,
      status: flowData.status as 'idle' | 'thinking' | 'done' | 'error',
      errorMessage: flowData.error,
      onAbort: flowData.abort,
      onRetry: () => {},
    };
  }

  // 所有状态为 idle
  return null;
}

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth, syncFromStorage } = useAuthStore();
  const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
  const [requirementText, setRequirementText] = useState('');
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState(1);
  const [completedStep, setCompletedStep] = useState(1);
  const [boundedContexts, setBoundedContexts] = useState<BoundedContext[]>([]);
  const [contextMermaidCode, setContextMermaidCode] = useState('');
  const [domainModels, setDomainModels] = useState<DomainModel[]>([]);
  const [modelMermaidCode, setModelMermaidCode] = useState('');
  const [businessFlow, setBusinessFlow] = useState<BusinessFlow | null>(null);
  const [flowMermaidCode, setFlowMermaidCode] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [panelSizes, setPanelSizes] = useState<number[]>([60, 40]);
  const [maximizedPanel, setMaximizedPanel] = useState<string | null>(null);
  const [minimizedPanel, setMinimizedPanel] = useState<string | null>(null);

  // SSE Hooks
  const {
    thinkingMessages, contexts: streamContexts, mermaidCode: streamMermaidCode,
    status: streamStatus, errorMessage: streamError, generateContexts, abort: abortContexts,
  } = useDDDStream();

  const {
    thinkingMessages: modelThinkingMessages, domainModels: streamDomainModels,
    mermaidCode: streamModelMermaidCode,
    status: modelStreamStatus, errorMessage: modelStreamError, generateDomainModels, abort: abortModels,
  } = useDomainModelStream();

  const {
    thinkingMessages: flowThinkingMessages, businessFlow: streamBusinessFlow,
    mermaidCode: streamFlowMermaidCode, status: flowStreamStatus, errorMessage: flowStreamError,
    generateBusinessFlow: generateFlow, abort: abortFlow,
  } = useBusinessFlowStream();

  // 初始化时同步认证状态
  useEffect(() => {
    syncFromStorage();
    checkAuth();
  }, [syncFromStorage, checkAuth]);

  // 同步 SSE 结果
  useEffect(() => {
    if (streamStatus === 'done' && streamContexts.length > 0) {
      setBoundedContexts(streamContexts);
      setContextMermaidCode(streamMermaidCode);
      setCurrentStep(2);
      setCompletedStep(2);
    }
  }, [streamStatus, streamContexts, streamMermaidCode]);

  useEffect(() => {
    if (modelStreamStatus === 'done' && streamDomainModels.length > 0) {
      setDomainModels(streamDomainModels as DomainModel[]);
      setModelMermaidCode(streamModelMermaidCode);
      setCurrentStep(3);
      setCompletedStep(3);
    }
  }, [modelStreamStatus, streamDomainModels, streamModelMermaidCode]);

  useEffect(() => {
    if (flowStreamStatus === 'done' && streamBusinessFlow) {
      setBusinessFlow(streamBusinessFlow as BusinessFlow);
      setFlowMermaidCode(streamFlowMermaidCode);
      setCurrentStep(4);
      setCompletedStep(4);
    }
  }, [flowStreamStatus, streamBusinessFlow, streamFlowMermaidCode]);

  // 持久化
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedNodes.size > 0) {
      localStorage.setItem('vibex-selected-nodes', JSON.stringify([...selectedNodes]));
    }
  }, [selectedNodes]);

  useEffect(() => {
    const saved = localStorage.getItem('vibex-panel-sizes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) setPanelSizes(parsed);
      } catch (e) { /* ignore */ }
    }
  }, []);

  // 辅助函数
  const isStepCompleted = useCallback((step: number) => step <= completedStep, [completedStep]);
  const isStepClickable = useCallback((step: number) => step <= completedStep, [completedStep]);
  
  const handleStepClick = useCallback((step: number) => {
    if (step <= completedStep) setCurrentStep(step);
  }, [completedStep]);

  const handlePanelResize = useCallback((sizes: any) => {
    const sizeArray = sizes?.sizes || sizes;
    if (Array.isArray(sizeArray)) {
      setPanelSizes(sizeArray);
      localStorage.setItem('vibex-panel-sizes', JSON.stringify(sizeArray));
    }
  }, []);

  const handleDoubleClick = useCallback((panel: string) => {
    if (maximizedPanel === panel) setMaximizedPanel(null);
    else setMaximizedPanel(panel);
    setMinimizedPanel(null);
  }, [maximizedPanel]);

  const handleMinimize = useCallback((panel: string) => {
    if (minimizedPanel === panel) setMinimizedPanel(null);
    else { setMinimizedPanel(panel); setMaximizedPanel(null); }
  }, [minimizedPanel]);

  const handleNodeToggle = useCallback((nodeId: string) => {
    setSelectedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const handleGenerate = useCallback(() => {
    if (!isAuthenticated) { setIsLoginDrawerOpen(true); return; }
    if (!requirementText.trim()) return;
    generateContexts(requirementText);
  }, [isAuthenticated, requirementText, generateContexts]);

  const handleGenerateDomainModel = useCallback(() => {
    if (boundedContexts.length === 0) return;
    generateDomainModels(requirementText, boundedContexts);
  }, [boundedContexts, requirementText, generateDomainModels]);

  const handleGenerateBusinessFlow = useCallback(() => {
    if (domainModels.length === 0) return;
    generateFlow(domainModels, requirementText);
  }, [domainModels, requirementText, generateFlow]);

  // Mermaid 代码
  const mermaidCode = useMemo(() => {
    // 简化版预览代码生成
    return '';
  }, [requirementText]);

  const getStepTitle = () => STEPS[currentStep - 1]?.label || '';

  // 获取当前步骤的 mermaid code
  const getCurrentMermaidCode = () => {
    switch (currentStep) {
      case 1: return mermaidCode;
      case 2: return contextMermaidCode;
      case 3: return modelMermaidCode;
      case 4: return flowMermaidCode;
      default: return '';
    }
  };

  return (
    <div className={styles.page}>
      <ParticleBackground />
      
      {/* 顶部导航 */}
      <Navbar isAuthenticated={isAuthenticated} onLoginClick={() => setIsLoginDrawerOpen(true)} />

      {/* 引导流程进度条 */}
      <OnboardingProgressBar />

      {/* 主内容区 */}
      <div className={styles.mainContainer}>
        {/* 左侧 Sidebar */}
        <Sidebar
          steps={STEPS}
          currentStep={currentStep}
          completedStep={completedStep}
          onStepClick={handleStepClick}
          isStepClickable={isStepClickable}
        />

        {/* 中间内容 */}
        <main className={styles.content}>
          <PanelGroup orientation="horizontal" onLayoutChanged={handlePanelResize} className={styles.splitContainer}>
            {/* 预览区域 */}
            <Panel defaultSize={panelSizes[0]} minSize={30} maxSize={70} className={styles.previewArea}>
              <div className={styles.previewAreaHeader} onDoubleClick={() => handleDoubleClick('preview')}>
                <span className={styles.previewAreaTitle}>👁️ {getStepTitle()}</span>
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar} style={{ width: `${(currentStep / 5) * 100}%` }} />
                  <span className={styles.progressText}>步骤 {currentStep}/5</span>
                  {(streamStatus === 'thinking' || modelStreamStatus === 'thinking' || flowStreamStatus === 'thinking') && (
                    <span className={styles.progressSpinner}>⏳</span>
                  )}
                </div>
                <div className={styles.panelControls}>
                  <button className={styles.panelBtn} onClick={() => handleMinimize('preview')}>—</button>
                  <button className={styles.panelBtn} onClick={() => handleDoubleClick('preview')}>□</button>
                </div>
              </div>
              <div className={styles.previewAreaContent}>
                {minimizedPanel === 'preview' ? (
                  <div className={styles.minimized}><span>预览</span><button onClick={() => setMinimizedPanel(null)}>展开</button></div>
                ) : (
                  <>
                    {getCurrentMermaidCode() ? (
                      <>
                        <MermaidPreview code={getCurrentMermaidCode()} diagramType="flowchart" layout="TB" height="60%" />
                        {currentStep === 2 && boundedContexts.length > 0 && (
                          <div className={styles.nodeSelection}>
                            {(boundedContexts ?? []).map(ctx => (
                              <label key={ctx.id} className={`${styles.nodeCheckbox} ${selectedNodes.has(`ctx-${ctx.id}`) ? styles.checked : ''}`}>
                                <input type="checkbox" checked={selectedNodes.has(`ctx-${ctx.id}`)} onChange={() => handleNodeToggle(`ctx-${ctx.id}`)} />
                                <span>{ctx.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className={styles.previewEmpty}>
                        <div className={styles.previewEmptyIcon}>👁️</div>
                        <div className={styles.previewEmptyText}>输入需求后，这里将实时显示 AI 生成的设计预览</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Panel>

            <PanelResizeHandle className={styles.resizeHandle} />

            {/* 输入区域 */}
            <Panel defaultSize={panelSizes[1]} minSize={30} maxSize={70} className={styles.inputArea}>
              <div className={styles.inputAreaHeader} onDoubleClick={() => handleDoubleClick('input')}>
                <span className={styles.inputAreaTitle}>📝 需求录入</span>
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar} style={{ width: `${(currentStep / 5) * 100}%` }} />
                  <span className={styles.progressText}>步骤 {currentStep}/5</span>
                </div>
                <div className={styles.panelControls}>
                  <button className={styles.panelBtn} onClick={() => handleMinimize('input')}>—</button>
                  <button className={styles.panelBtn} onClick={() => handleDoubleClick('input')}>□</button>
                </div>
              </div>
              <div className={styles.inputAreaContent}>
                <h1 className={styles.pageTitle}>Step {currentStep}: {getStepTitle()}</h1>
                <p className={styles.pageSubtitle}>描述你的产品需求，AI 将协助你完成完整的设计</p>

                <div className={styles.inputSection}>
                  <label className={styles.inputLabel}>描述你的产品需求</label>
                  <RequirementInput initialValue={requirementText} onValueChange={setRequirementText} onGenerate={handleGenerate} />
                  <details className={styles.importOptions}>
                    <summary className={styles.importSummary}>🐙 从 GitHub 导入项目</summary>
                    <GitHubImport onImport={(text) => { setRequirementText(text); setCurrentStep(1); }} />
                  </details>
                  <details className={styles.importOptions}>
                    <summary className={styles.importSummary}>🎨 从 Figma 导入设计</summary>
                    <FigmaImport onImport={(text) => { setRequirementText(text); setCurrentStep(1); }} />
                  </details>
                  <PlanBuildButtons />
                </div>

                <div className={styles.actions}>
                  {currentStep === 1 && (
                    <button className={styles.generateButton} onClick={handleGenerate} disabled={!requirementText.trim()}>
                      🚀 开始生成
                    </button>
                  )}
                  {currentStep === 2 && boundedContexts.length > 0 && (
                    <button className={styles.generateButton} onClick={handleGenerateDomainModel}>🚀 生成领域模型</button>
                  )}
                  {currentStep === 3 && domainModels.length > 0 && (
                    <button className={styles.generateButton} onClick={handleGenerateBusinessFlow}>🚀 生成业务流程</button>
                  )}
                </div>

                {/* 示例需求 */}
                <div className={styles.sampleSection}>
                  <span className={styles.sampleLabel}>试试示例：</span>
                  <div className={styles.sampleButtons}>
                    {SAMPLE_REQUIREMENTS.map((sample, i) => (
                      <button key={i} className={styles.sampleButton} onClick={() => setRequirementText(sample.desc)}>
                        {sample.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 快捷回复 */}
                <div className={styles.quickReplies}>
                  {QUICK_REPLIES.map((reply, i) => (
                    <button key={i} className={styles.quickReply}>{reply}</button>
                  ))}
                </div>

                {/* 特性卡片 */}
                <div className={styles.featureCards}>
                  {FEATURE_CARDS.map((feature) => (
                    <motion.div key={feature.id} className={styles.featureCard} whileHover={{ scale: 1.02 }} style={{ '--feature-color': feature.color } as React.CSSProperties}>
                      <div className={styles.featureIcon}>{feature.icon}</div>
                      <div className={styles.featureTitle}>{feature.title}</div>
                      <div className={styles.featureDesc}>{feature.description}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </main>

        {/* 右侧 AI Panel */}
        <aside className={styles.aiPanel}>
          {(() => {
            const activeStream = getActiveStreamData(
              { messages: thinkingMessages, contexts: streamContexts, mermaid: streamMermaidCode, status: streamStatus, error: streamError, abort: abortContexts },
              { messages: modelThinkingMessages, mermaid: streamModelMermaidCode, status: modelStreamStatus, error: modelStreamError, abort: abortModels },
              { messages: flowThinkingMessages, mermaid: streamFlowMermaidCode, status: flowStreamStatus, error: flowStreamError, abort: abortFlow }
            );

            if (activeStream) {
              return (
                <ThinkingPanel
                  thinkingMessages={activeStream.thinkingMessages}
                  contexts={activeStream.contexts}
                  mermaidCode={activeStream.mermaidCode}
                  status={activeStream.status}
                  errorMessage={activeStream.errorMessage}
                  onAbort={activeStream.onAbort}
                  onRetry={() => {
                    if (streamStatus === 'error') handleGenerate();
                    else if (modelStreamStatus === 'error') handleGenerateDomainModel();
                    else if (flowStreamStatus === 'error') handleGenerateBusinessFlow();
                  }}
                  onUseDefault={handleGenerate}
                />
              );
            }

            return (
              <div className={styles.aiHeader}>
                <div className={styles.aiAvatar}>🤖</div>
                <div><div className={styles.aiTitle}>AI 设计助手</div><div className={styles.aiSubtitle}>随时为你解答</div></div>
              </div>
            );
          })()}
        </aside>
      </div>

      <LoginDrawer isOpen={isLoginDrawerOpen} onClose={() => setIsLoginDrawerOpen(false)} onSuccess={() => setIsLoginDrawerOpen(false)} />
    </div>
  );
}
