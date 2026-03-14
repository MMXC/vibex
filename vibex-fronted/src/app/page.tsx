'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LoginDrawer from '@/components/ui/LoginDrawer';
import { ParticleBackground } from '@/components/particles/ParticleBackground';
import { MermaidPreview } from '@/components/ui/MermaidPreview';
import { ThinkingPanel } from '@/components/ui/ThinkingPanel';
import DiagnosisPanel from '@/components/diagnosis/DiagnosisPanel';
import { PageTreeDiagram } from '@/components/page-tree-diagram';
import { RequirementInput } from '@/components/requirement-input';
import { GitHubImport } from '@/components/github-import';
import { FigmaImport } from '@/components/figma-import';
import { useDDDStream, useDomainModelStream, useBusinessFlowStream } from '@/hooks/useDDDStream';
import { dddApi, projectApi } from '@/services/api';
import styles from './homepage.module.css';

// 五步流程
const STEPS = [
  { id: 1, label: '需求输入' },
  { id: 2, label: '限界上下文' },
  { id: 3, label: '领域模型' },
  { id: 4, label: '业务流程' },
  { id: 5, label: '项目创建' },
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
  {
    title: '在线教育平台',
    desc: '开发一个在线教育平台，包含用户管理、课程管理、订单管理、支付等功能',
  },
  {
    title: '项目管理工具',
    desc: '创建一个项目管理仪表盘，包含任务列表、进度图表、团队协作功能',
  },
  {
    title: '电商网站',
    desc: '开发一个电商网站，包含商品展示、购物车、订单处理、支付集成',
  },
];

// 快捷回复
const QUICK_REPLIES = [
  '如何开始一个项目？',
  '支持哪些功能？',
  '什么是限界上下文？',
];

// 差异化特性卡片数据
const FEATURE_CARDS = [
  {
    id: 1,
    icon: '🎯',
    title: '你主导',
    description: 'AI 辅助分析，你决策每一步',
    color: '#00d4ff',
  },
  {
    id: 2,
    icon: '📐',
    title: 'DDD 建模',
    description: '专业领域驱动设计方法论',
    color: '#8b5cf6',
  },
  {
    id: 3,
    icon: '⚡',
    title: '快速生成',
    description: '从需求到代码一键完成',
    color: '#10b981',
  },
  {
    id: 4,
    icon: '🔄',
    title: '实时预览',
    description: '边输入边看 AI 分析结果',
    color: '#f59e0b',
  },
];

// 检查是否已认证
function useIsAuthenticated(): boolean {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

  return isAuthenticated;
}

// 简单的 Mermaid 流程图生成器（基于关键词）
function generatePreviewMermaid(text: string): string {
  if (!text.trim()) return '';
  
  const lowerText = text.toLowerCase();
  const nodes: string[] = [];
  const edges: string[] = [];
  
  // 检测功能模块关键词
  const moduleKeywords: Record<string, string[]> = {
    '用户管理': ['用户', '登录', '注册', '认证', '权限', '角色'],
    '订单管理': ['订单', '购买', '支付', '结算'],
    '课程管理': ['课程', '教学', '学习', '视频', '章节'],
    '项目管理': ['项目', '任务', '看板', '进度'],
    '商品管理': ['商品', '库存', 'SKU', '类目'],
    '支付系统': ['支付', '收款', '退款', '钱包'],
    '消息通知': ['消息', '通知', '推送', '邮件', '短信'],
    '数据分析': ['统计', '报表', '图表', '分析', '数据'],
  };
  
  // 检测到的模块
  const detectedModules: string[] = [];
  for (const [module, keywords] of Object.entries(moduleKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      detectedModules.push(module);
    }
  }
  
  // 如果没有检测到模块，显示默认提示
  if (detectedModules.length === 0) {
    nodes.push('  start((开始))');
    nodes.push('  input[输入需求]');
    nodes.push('  ai[AI 分析]');
    nodes.push('  output((输出设计))');
    edges.push('  start --> input');
    edges.push('  input --> ai');
    edges.push('  ai --> output');
  } else {
    // 生成限界上下文图
    nodes.push('  start((用户需求))');
    edges.push('  start --> requirement[需求分析]');
    
    detectedModules.forEach((module, idx) => {
      nodes.push(`  ctx${idx}[${module}]`);
      edges.push(`  requirement --> ctx${idx}`);
      
      // 每个模块连接到最终输出
      edges.push(`  ctx${idx} --> output${idx}[设计输出]`);
    });
  }
  
  return `flowchart TB\n${nodes.join('\n')}\n${edges.join('\n')}`;
}

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const [requirementText, setRequirementText] = useState('');
  const [activeTab, setActiveTab] = useState<'input' | 'preview'>('input');
  const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: '你好！我是 VibeX AI 助手。描述你的产品需求，我可以帮你生成完整的应用结构。' },
  ]);

  // 单页式流程状态
  const [currentStep, setCurrentStep] = useState(1);
  const [boundedContexts, setBoundedContexts] = useState<BoundedContext[]>([]);
  const [contextMermaidCode, setContextMermaidCode] = useState('');
  const [domainModels, setDomainModels] = useState<DomainModel[]>([]);
  const [modelMermaidCode, setModelMermaidCode] = useState('');
  const [businessFlow, setBusinessFlow] = useState<BusinessFlow | null>(null);
  const [flowMermaidCode, setFlowMermaidCode] = useState('');
  const [generationError, setGenerationError] = useState('');

  // F2: useDDDStream Hook for AI thinking process visualization
  const {
    thinkingMessages,
    contexts: streamContexts,
    mermaidCode: streamMermaidCode,
    status: streamStatus,
    errorMessage: streamError,
    generateContexts,
    abort: abortContexts,
    reset: resetContexts,
  } = useDDDStream();

  // F3: useDomainModelStream Hook for domain model generation
  const {
    thinkingMessages: modelThinkingMessages,
    domainModels: streamDomainModels,
    status: modelStreamStatus,
    errorMessage: modelStreamError,
    generateDomainModels,
    abort: abortModels,
    reset: resetModels,
  } = useDomainModelStream();

  // F4: useBusinessFlowStream Hook for business flow streaming
  const {
    thinkingMessages: flowThinkingMessages,
    businessFlow: streamBusinessFlow,
    mermaidCode: streamFlowMermaidCode,
    status: flowStreamStatus,
    errorMessage: flowStreamError,
    generateBusinessFlow: generateFlow,
    abort: abortFlow,
    reset: resetFlow,
  } = useBusinessFlowStream();

  // F2.2: 同步 SSE 流结果到本地状态
  useEffect(() => {
    if (streamStatus === 'done' && streamContexts.length > 0) {
      setBoundedContexts(streamContexts);
      setContextMermaidCode(streamMermaidCode);
      setCurrentStep(2);
    }
  }, [streamStatus, streamContexts, streamMermaidCode]);

  // F3.2: 同步领域模型流结果到本地状态
  useEffect(() => {
    if (modelStreamStatus === 'done' && streamDomainModels.length > 0) {
      setDomainModels(streamDomainModels as DomainModel[]);
      setCurrentStep(3);
      setActiveTab('preview');
    }
  }, [modelStreamStatus, streamDomainModels]);

  // 实时生成预览 Mermaid 代码
  const mermaidCode = useMemo(() => generatePreviewMermaid(requirementText), [requirementText]);

  const handleSampleClick = (desc: string) => {
    setRequirementText(desc);
  };

  // F2.1: 使用 SSE 流式生成（优先）
  const handleGenerate = () => {
    if (!isAuthenticated) {
      setIsLoginDrawerOpen(true);
      return;
    }

    if (!requirementText.trim()) {
      return;
    }

    // 触发 SSE 流式生成
    generateContexts(requirementText);
  };

  // Fallback: 传统 API（当 SSE 失败时使用）
  const handleGenerateLegacy = async () => {
    if (!isAuthenticated) {
      setIsLoginDrawerOpen(true);
      return;
    }

    if (!requirementText.trim()) {
      return;
    }

    setIsGenerating(true);
    setGenerationError('');

    try {
      // 调用 API 生成限界上下文
      const response = await dddApi.generateBoundedContext(requirementText);

      if (response && response.success && response.boundedContexts) {
        // 保存限界上下文
        setBoundedContexts(response.boundedContexts);
        
        // 保存 Mermaid 代码
        if (response.mermaidCode) {
          setContextMermaidCode(response.mermaidCode);
        }

        // 切换到步骤2（限界上下文）
        setCurrentStep(2);
        setActiveTab('preview');
      } else {
        throw new Error(response?.error || '生成失败');
      }
    } catch (err) {
      console.error('生成限界上下文失败:', err);
      setGenerationError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 继续生成领域模型 - 使用流式 API
  const handleGenerateDomainModel = () => {
    if (boundedContexts.length === 0) return;

    // F3: 使用流式 API
    generateDomainModels(requirementText, boundedContexts);
  };

  // 继续生成业务流程 - 使用流式 API
  const handleGenerateBusinessFlow = () => {
    if (domainModels.length === 0) return;

    // 使用流式 API
    generateFlow(domainModels, requirementText);
    setCurrentStep(4);
    setActiveTab('preview');
  };

  // F4.2: 同步业务流程流结果到本地状态
  useEffect(() => {
    if (flowStreamStatus === 'done' && streamBusinessFlow) {
      setBusinessFlow(streamBusinessFlow as BusinessFlow);
      if (streamFlowMermaidCode) {
        setFlowMermaidCode(streamFlowMermaidCode);
      }
    }
  }, [flowStreamStatus, streamBusinessFlow, streamFlowMermaidCode]);

  // 判断步骤是否完成
  const isStepCompleted = (stepId: number) => {
    switch (stepId) {
      case 1:
        return requirementText.trim().length > 0;
      case 2:
        return boundedContexts.length > 0;
      case 3:
        return domainModels.length > 0;
      case 4:
        return businessFlow !== null;
      case 5:
        return false; // 项目创建完成
      default:
        return false;
    }
  };

  // 判断步骤是否可点击
  const isStepClickable = (stepId: number) => {
    return stepId <= currentStep;
  };

  // 点击步骤切换
  const handleStepClick = (stepId: number) => {
    if (!isStepClickable(stepId)) return;
    
    setCurrentStep(stepId);
    if (stepId > 1) {
      setActiveTab('preview');
    } else {
      setActiveTab('input');
    }
  };

  // 处理项目创建完成
  const handleCreateProject = async () => {
    if (!isAuthenticated) {
      setIsLoginDrawerOpen(true);
      return;
    }

    setIsGenerating(true);
    setGenerationError('');

    try {
      // 调用项目创建 API
      const projectName = requirementText.slice(0, 50) || '未命名项目';
      const response = await projectApi.createProject({
        name: projectName,
        description: requirementText,
        userId: 'current-user', // TODO: 获取当前用户 ID
      });

      if (response) {
        // 切换到步骤5（项目创建）
        setCurrentStep(5);
        setActiveTab('preview');
      } else {
        throw new Error('创建项目失败');
      }
    } catch (err) {
      console.error('创建项目失败:', err);
      setGenerationError(err instanceof Error ? err.message : '创建项目失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    setAiMessage(reply);
    // 自动发送
    setTimeout(() => {
      // 添加用户消息
      setMessages((prev) => [...prev, { role: 'user', content: reply }]);
      
      // 模拟 AI 回复
      setTimeout(() => {
        let response = '感谢你的提问！';
        if (reply.includes('如何开始')) {
          response = '开始一个项目很简单！在中间区域描述你的需求，点击"开始设计"按钮即可。AI 会帮你生成限界上下文、领域模型和业务流程。';
        } else if (reply.includes('支持')) {
          response = 'VibeX 支持：需求分析、限界上下文设计、领域建模、业务流程图、原型生成等多种功能。';
        } else if (reply.includes('限界上下文')) {
          response = '限界上下文(Bounded Context)是 DDD 的核心概念，指的是语义边界的清晰划分，帮助团队明确职责范围。';
        }
        
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: response },
        ]);
      }, 500);
    }, 100);
  };

  const handleAiSend = () => {
    if (!aiMessage.trim()) return;

    // 添加用户消息
    setMessages((prev) => [...prev, { role: 'user', content: aiMessage }]);
    
    // 模拟 AI 回复
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '感谢你的提问！请在左侧描述你的需求，我会帮你完善产品设计。' },
      ]);
    }, 500);

    setAiMessage('');
  };

  return (
    <div className={styles.page}>
      {/* 登录抽屉 */}
      <LoginDrawer
        isOpen={isLoginDrawerOpen}
        onClose={() => setIsLoginDrawerOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      {/* 背景粒子特效 - galaxy preset */}
      <ParticleBackground preset="galaxy" enabled={true} className={styles.particles} />

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
          <span>VibeX</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="#features" className={styles.navLink}>
            功能
          </Link>
          <Link href="#pricing" className={styles.navLink}>
            价格
          </Link>
          <Link href="/auth" className={styles.ctaButton}>
            开始使用
          </Link>
        </div>
      </nav>

      {/* 顶部产品功能说明 */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            AI 驱动的应用构建平台
          </div>
          <h1 className={styles.title}>
            用 AI 轻松构建
            <br />
            <span className={styles.titleGradient}>你的 Web 应用</span>
          </h1>
          <p className={styles.subtitle}>
            VibeX 是一个 AI 驱动的应用构建平台，通过自然语言描述即可生成完整的
            Web 应用界面和功能。
          </p>
          <div className={styles.heroCta}>
            <Link href="/auth" className={styles.primaryButton}>
              <span>免费开始</span>
              <span className={styles.buttonGlow} />
            </Link>
            <Link href="/preview" className={styles.secondaryButton}>
              查看演示
            </Link>
          </div>
        </div>
      </header>

      {/* B3 差异化特性卡片 - Framer Motion 动画 */}
      <section className={styles.featuresSection} id="features">
        <div className={styles.featuresGrid}>
          {FEATURE_CARDS.map((feature, index) => (
            <motion.div
              key={feature.id}
              className={styles.featureCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02, y: -5 }}
              style={{ '--feature-color': feature.color } as React.CSSProperties}
            >
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 三栏布局 */}
      <div className={styles.mainContainer}>
        {/* 左侧：流程指示器 - 15% */}
        <aside className={styles.sidebar}>
          <div>
            <div className={styles.sidebarTitle}>设计流程</div>
            <div className={styles.stepList}>
              {STEPS.map((step) => {
                const isActive = step.id === currentStep;
                const isCompleted = isStepCompleted(step.id);
                const isClickable = isStepClickable(step.id);
                
                return (
                  <div
                    key={step.id}
                    className={`${styles.stepItem} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
                    onClick={() => handleStepClick(step.id)}
                    style={{ cursor: isClickable ? 'pointer' : 'not-allowed', opacity: isClickable ? 1 : 0.5 }}
                  >
                    <span className={styles.stepNumber}>
                      {isCompleted ? '✓' : step.id}
                    </span>
                    <span className={styles.stepLabel}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* 中间：需求输入/预览 - 60% */}
        <main className={styles.content}>
          <div className={styles.contentInner}>
            {/* Tab 切换 */}
            <div className={styles.tabContainer}>
              <button
                className={`${styles.tabButton} ${activeTab === 'input' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('input')}
              >
                📝 需求输入
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'preview' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                👁️ 实时预览
              </button>
            </div>

            {activeTab === 'input' ? (
              <>
                <h1 className={styles.pageTitle}>Step 1: 需求输入</h1>
                <p className={styles.pageSubtitle}>
                  描述你的产品需求，AI 将协助你完成完整的设计
                </p>

                <div className={styles.inputSection}>
                  <label className={styles.inputLabel}>
                    描述你的产品需求
                  </label>
                  
                  {/* 统一需求输入组件 - 集成诊断和优化功能 */}
                  <RequirementInput
                    initialValue={requirementText}
                    onValueChange={setRequirementText}
                    onGenerate={handleGenerate}
                  />

                  {/* GitHub 导入选项 */}
                  <details className={styles.importOptions}>
                    <summary className={styles.importSummary}>
                      🐙 从 GitHub 导入项目
                    </summary>
                    <div className={styles.importContent}>
                      <GitHubImport
                        onImport={(text) => {
                          setRequirementText(text);
                          setCurrentStep(1);
                        }}
                      />
                    </div>
                  </details>

                  {/* Figma 导入选项 */}
                  <details className={styles.importOptions}>
                    <summary className={styles.importSummary}>
                      🎨 从 Figma 导入设计
                    </summary>
                    <div className={styles.importContent}>
                      <FigmaImport
                        onImport={(text) => {
                          setRequirementText(text);
                          setCurrentStep(1);
                        }}
                      />
                    </div>
                  </details>

                  {/* 示例需求 */}
                  <div className={styles.sampleSection}>
                    <span className={styles.sampleLabel}>试试这些示例：</span>
                    <div className={styles.sampleList}>
                      {SAMPLE_REQUIREMENTS.map((sample, idx) => (
                        <button
                          key={idx}
                          className={styles.sampleButton}
                          onClick={() => handleSampleClick(sample.desc)}
                        >
                          {sample.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 智能诊断功能 - F1.3 诊断 UI 集成 */}
                  <div className={styles.diagnosisSection}>
                    <DiagnosisPanel 
                      onAnalyze={(text) => console.log('Diagnosed:', text)}
                      onOptimize={(text) => {
                        setRequirementText(text);
                        console.log('Optimized and applied:', text);
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 根据当前步骤显示不同的预览内容 */}
                {currentStep === 1 && (
                  <>
                    <h1 className={styles.pageTitle}>实时预览</h1>
                    <p className={styles.pageSubtitle}>
                      AI 正在分析你的需求，自动生成限界上下文设计
                    </p>

                    <div className={styles.previewSection}>
                      {mermaidCode ? (
                        <MermaidPreview 
                          code={mermaidCode} 
                          diagramType="flowchart"
                          layout="TB"
                          height="400px"
                        />
                      ) : (
                        <div className={styles.previewEmpty}>
                          <div className={styles.previewEmptyIcon}>🔍</div>
                          <div className={styles.previewEmptyText}>
                            输入需求后，这里将实时显示 AI 生成的设计预览
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.previewHint}>
                      <span>💡 提示：</span> 输入越详细，AI 生成的限界上下文越准确
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <h1 className={styles.pageTitle}>Step 2: 限界上下文</h1>
                    <p className={styles.pageSubtitle}>
                      AI 已生成限界上下文设计，请预览确认
                    </p>

                    <div className={styles.previewSection}>
                      {contextMermaidCode ? (
                        <MermaidPreview 
                          code={contextMermaidCode} 
                          diagramType="flowchart"
                          layout="TB"
                          height="400px"
                        />
                      ) : boundedContexts.length > 0 ? (
                        <div className={styles.resultList}>
                          {boundedContexts.map((ctx) => (
                            <div key={ctx.id} className={styles.resultItem}>
                              <div className={styles.resultItemTitle}>
                                <span className={styles.ctxType}>{ctx.type}</span>
                                {ctx.name}
                              </div>
                              <div className={styles.resultItemDesc}>{ctx.description}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.previewEmpty}>
                          <div className={styles.previewEmptyIcon}>⏳</div>
                          <div className={styles.previewEmptyText}>
                            正在生成限界上下文...
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.actions}>
                      <button
                        className={styles.primaryButton}
                        onClick={handleGenerateDomainModel}
                        disabled={isGenerating || boundedContexts.length === 0}
                      >
                        {isGenerating ? '生成中...' : '🚀 继续生成领域模型'}
                      </button>
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <h1 className={styles.pageTitle}>Step 3: 领域模型</h1>
                    <p className={styles.pageSubtitle}>
                      AI 已生成领域模型，请预览确认
                    </p>

                    <div className={styles.previewSection}>
                      {modelMermaidCode ? (
                        <MermaidPreview 
                          code={modelMermaidCode} 
                          diagramType="classDiagram"
                          layout="TB"
                          height="400px"
                        />
                      ) : domainModels.length > 0 ? (
                        <div className={styles.resultList}>
                          {domainModels.map((model) => (
                            <div key={model.id} className={styles.resultItem}>
                              <div className={styles.resultItemTitle}>{model.name}</div>
                              <div className={styles.resultItemDesc}>
                                类型: {model.type}
                                {model.properties.length > 0 && (
                                  <div className={styles.properties}>
                                    属性: {model.properties.map(p => p.name).join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.previewEmpty}>
                          <div className={styles.previewEmptyIcon}>⏳</div>
                          <div className={styles.previewEmptyText}>
                            正在生成领域模型...
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.actions}>
                      <button
                        className={styles.primaryButton}
                        onClick={handleGenerateBusinessFlow}
                        disabled={flowStreamStatus !== 'idle' || domainModels.length === 0}
                      >
                        {flowStreamStatus !== 'idle' ? '🌊 流式生成中...' : '🌊 继续生成业务流程'}
                      </button>
                    </div>
                  </>
                )}

                {currentStep === 4 && (
                  <>
                    <h1 className={styles.pageTitle}>Step 4: 业务流程</h1>
                    <p className={styles.pageSubtitle}>
                      AI 已生成业务流程，请预览确认
                    </p>

                    <div className={styles.previewSection}>
                      {flowMermaidCode ? (
                        <MermaidPreview 
                          code={flowMermaidCode} 
                          diagramType="flowchart"
                          layout="TB"
                          height="400px"
                        />
                      ) : businessFlow ? (
                        <div className={styles.resultList}>
                          <div className={styles.resultItem}>
                            <div className={styles.resultItemTitle}>{businessFlow.name}</div>
                            {businessFlow.mermaidCode && (
                              <div className={styles.mermaidCode}>
                                <pre>{businessFlow.mermaidCode}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.previewEmpty}>
                          <div className={styles.previewEmptyIcon}>⏳</div>
                          <div className={styles.previewEmptyText}>
                            正在生成业务流程...
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 页面树结构展示 */}
                    <div className={styles.previewSection}>
                      <h3 className={styles.pageTitle} style={{ fontSize: '18px', marginBottom: '12px' }}>
                        📄 页面树结构
                      </h3>
                      <div style={{ height: '300px', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                        <PageTreeDiagram
                          data={[
                            {
                              id: 'page-home',
                              type: 'page',
                              name: '首页',
                              children: [
                                {
                                  id: 'section-hero',
                                  type: 'section',
                                  name: 'Hero 区域',
                                  children: [
                                    { id: 'comp-title', type: 'component', name: '标题组件' },
                                    { id: 'comp-cta', type: 'component', name: 'CTA 按钮' },
                                  ],
                                },
                                {
                                  id: 'section-features',
                                  type: 'section',
                                  name: '功能展示',
                                  children: [
                                    { id: 'comp-card-1', type: 'component', name: '功能卡片 1' },
                                    { id: 'comp-card-2', type: 'component', name: '功能卡片 2' },
                                  ],
                                },
                              ],
                            },
                          ]}
                          direction="TB"
                          showControls
                          showBackground
                        />
                      </div>
                    </div>

                    <div className={styles.actions}>
                      <button
                        className={styles.primaryButton}
                        onClick={handleCreateProject}
                        disabled={isGenerating || !businessFlow}
                      >
                        {isGenerating ? '创建中...' : '✨ 创建项目'}
                      </button>
                    </div>
                  </>
                )}

                {currentStep === 5 && (
                  <>
                    <h1 className={styles.pageTitle}>Step 5: 项目创建</h1>
                    <p className={styles.pageSubtitle}>
                      恭喜！项目已创建成功
                    </p>

                    <div className={styles.previewSection}>
                      <div className={styles.successCard}>
                        <div className={styles.successIcon}>🎉</div>
                        <div className={styles.successTitle}>项目创建成功！</div>
                        <div className={styles.successDesc}>
                          你的项目 "{requirementText.slice(0, 30)}..." 已成功创建
                        </div>
                        <div className={styles.projectSummary}>
                          <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>限界上下文:</span>
                            <span className={styles.summaryValue}>{boundedContexts.length} 个</span>
                          </div>
                          <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>领域模型:</span>
                            <span className={styles.summaryValue}>{domainModels.length} 个</span>
                          </div>
                          <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>业务流程:</span>
                            <span className={styles.summaryValue}>{businessFlow ? '已生成' : '-'}</span>
                          </div>
                        </div>
                        <div className={styles.actions}>
                          <Link href="/dashboard" className={styles.primaryButton}>
                            查看项目
                          </Link>
                          <button 
                            className={styles.secondaryButton}
                            onClick={() => {
                              setCurrentStep(1);
                              setRequirementText('');
                              setBoundedContexts([]);
                              setDomainModels([]);
                              setBusinessFlow(null);
                              setActiveTab('input');
                            }}
                          >
                            继续创建新项目
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </main>

        {/* 右侧：AI 助手 / ThinkingPanel - 25% */}
        <aside className={styles.aiPanel}>
          {/* F2/F3: Show ThinkingPanel when stream is active */}
          {streamStatus !== 'idle' || modelStreamStatus !== 'idle' ? (
            <ThinkingPanel
              thinkingMessages={currentStep === 2 ? thinkingMessages : modelThinkingMessages}
              contexts={currentStep === 2 ? streamContexts : undefined}
              mermaidCode={currentStep === 2 ? streamMermaidCode : undefined}
              status={currentStep === 2 ? streamStatus : modelStreamStatus}
              errorMessage={currentStep === 2 ? streamError : modelStreamError}
              onAbort={currentStep === 2 ? abortModels : abortContexts}
              onRetry={currentStep === 2 ? () => generateContexts(requirementText) : () => generateDomainModels(requirementText, boundedContexts)}
              onUseDefault={handleGenerate}
            />
          ) : (
            <>
              <div className={styles.aiHeader}>
                <div className={styles.aiAvatar}>🤖</div>
                <div>
                  <div className={styles.aiTitle}>AI 设计助手</div>
                  <div className={styles.aiSubtitle}>随时为你解答</div>
                </div>
              </div>

              <div className={styles.aiMessages}>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`${styles.aiMessage} ${styles[msg.role]}`}>
                    {msg.content}
                  </div>
                ))}
              </div>

              {/* 快捷回复 */}
              <div className={styles.quickReplies}>
                {QUICK_REPLIES.map((reply, idx) => (
                  <button
                    key={idx}
                    className={styles.quickReplyButton}
                    onClick={() => handleQuickReply(reply)}
                  >
                    {reply}
                  </button>
                ))}
              </div>

              <div className={styles.aiInput}>
                <input
                  type="text"
                  className={styles.aiInputField}
                  placeholder="有问题尽管问我..."
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                />
                <button className={styles.aiSendButton} onClick={handleAiSend}>
                  ➤
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
