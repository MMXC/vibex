'use client'

import Link from 'next/link'
import styles from './landing.module.css'

export default function Landing() {
  return (
    <div className={styles.page}>
      {/* 背景特效 */}
      <div className={styles.bgEffect}>
        <div className={styles.gridOverlay} />
        <div className={styles.glowOrb1} />
        <div className={styles.glowOrb2} />
      </div>

      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◈</span>
          <span className={styles.logoText}>VibeX</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="#features" className={styles.navLink}>功能</Link>
          <Link href="#pricing" className={styles.navLink}>价格</Link>
          <Link href="/auth" className={styles.ctaButton}>
            开始使用
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
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
            VibeX 是一个 AI 驱动的应用构建平台，通过自然语言描述即可生成完整的 Web 应用界面和功能。
          </p>
          <div className={styles.heroCta}>
            <Link href="/auth" className={styles.primaryButton}>
              <span>免费开始</span>
              <span className={styles.buttonGlow} />
            </Link>
            <Link href="/chat" className={styles.secondaryButton}>
              查看演示
            </Link>
          </div>
        </div>
        
        {/* 装饰性代码块 */}
        <div className={styles.codePreview}>
          <div className={styles.codeHeader}>
            <span className={styles.codeDot} />
            <span className={styles.codeDot} />
            <span className={styles.codeDot} />
          </div>
          <pre className={styles.codeContent}>
{`> 创建一个项目管理仪表盘
> 包含任务列表和进度图表
> 主题：赛博朋克风格

✨ 正在生成...
✓ 完成！`}
          </pre>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleGradient}>强大功能</span>
        </h2>
        <div className={styles.featureGrid}>
          {[
            { 
              icon: '🤖', 
              title: 'AI 对话生成', 
              desc: '用自然语言描述需求，AI 自动生成完整页面',
              glow: 'cyan'
            },
            { 
              icon: '✏️', 
              title: '可视化编辑', 
              desc: '拖拽式流程图编辑器，所见即所得',
              glow: 'purple'
            },
            { 
              icon: '📦', 
              title: '一键导出', 
              desc: '支持导出 React、Vue 等多种代码',
              glow: 'pink'
            },
          ].map((feature, i) => (
            <div key={i} className={`${styles.featureCard} ${styles[`glow${feature.glow}`]}`}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            准备好开始了吗？
          </h2>
          <p className={styles.ctaSubtitle}>
            免费注册，立即体验 AI 构建应用的乐趣
          </p>
          <Link href="/auth" className={styles.ctaButtonLarge}>
            立即免费注册
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 VibeX. All rights reserved.</p>
      </footer>
    </div>
  )
}
