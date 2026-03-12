'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoginDrawer from '@/components/ui/LoginDrawer';
import styles from './homepage.module.css';

// 五步流程
const STEPS = [
  { id: 1, label: '需求输入' },
  { id: 2, label: '限界上下文' },
  { id: 3, label: '领域模型' },
  { id: 4, label: '业务流程' },
  { id: 5, label: '项目创建' },
];

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

// 检查是否已认证
function useIsAuthenticated(): boolean {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

  return isAuthenticated;
}

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const [requirementText, setRequirementText] = useState('');
  const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: '你好！我是 VibeX AI 助手。描述你的产品需求，我可以帮你生成完整的应用结构。' },
  ]);

  const handleSampleClick = (desc: string) => {
    setRequirementText(desc);
  };

  const handleGenerate = () => {
    if (!isAuthenticated) {
      setIsLoginDrawerOpen(true);
      return;
    }

    if (!requirementText.trim()) {
      return;
    }

    setIsGenerating(true);
    router.push('/confirm');
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

      {/* 三栏布局 */}
      <div className={styles.mainContainer}>
        {/* 左侧：流程指示器 - 15% */}
        <aside className={styles.sidebar}>
          <div>
            <div className={styles.sidebarTitle}>设计流程</div>
            <div className={styles.stepList}>
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`${styles.stepItem} ${step.id === 1 ? styles.active : ''}`}
                >
                  <span className={styles.stepNumber}>
                    {step.id === 1 ? '✓' : step.id}
                  </span>
                  <span className={styles.stepLabel}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* 中间：需求输入 - 60% */}
        <main className={styles.content}>
          <div className={styles.contentInner}>
            <h1 className={styles.pageTitle}>Step 1: 需求输入</h1>
            <p className={styles.pageSubtitle}>
              描述你的产品需求，AI 将协助你完成完整的设计
            </p>

            <div className={styles.inputSection}>
              <label className={styles.inputLabel}>
                描述你的产品需求
              </label>
              <textarea
                className={styles.textarea}
                placeholder="例如：开发一个在线教育平台，包含用户管理、课程管理、订单管理、支付等功能..."
                value={requirementText}
                onChange={(e) => setRequirementText(e.target.value)}
              />

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

              <div className={styles.actions}>
                <button
                  className={styles.primaryButton}
                  onClick={handleGenerate}
                  disabled={isGenerating || !requirementText.trim()}
                >
                  {isGenerating ? '生成中...' : '🎯 开始设计'}
                </button>
                <button className={styles.secondaryButton}>
                  📋 使用模板
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* 右侧：AI 助手 - 25% */}
        <aside className={styles.aiPanel}>
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
        </aside>
      </div>
    </div>
  );
}
