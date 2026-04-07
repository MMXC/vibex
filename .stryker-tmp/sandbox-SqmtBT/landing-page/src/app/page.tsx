// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Types
interface Feature {
  icon: string
  title: string
  description: string
}

interface Step {
  number: number
  title: string
  description: string
}

interface Testimonial {
  avatar: string
  name: string
  role: string
  content: string
}

// Header Component
function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      backgroundColor: scrolled ? 'rgba(255,255,255,0.9)' : 'transparent',
      backdropFilter: scrolled ? 'blur(10px)' : 'none',
      borderBottom: scrolled ? '1px solid #f0f0f0' : 'none',
      zIndex: 1000,
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1890ff' }}>VibeX</div>
        <nav style={{ display: 'flex', gap: '32px' }}>
          {['功能', '如何使用', '演示', '定价'].map((item) => (
            <a key={item} href={`#${item}`} style={{ color: '#333', textDecoration: 'none' }}>{item}</a>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333' }}>登录</button>
          <button style={{
            background: '#1890ff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 20px',
            cursor: 'pointer',
          }}>立即体验</button>
        </div>
      </div>
    </header>
  )
}

// Hero Section
function HeroSection() {
  return (
    <section style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '80px 24px',
      background: 'linear-gradient(135deg, #f0f7ff 0%, #fff 100%)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: 700,
          lineHeight: 1.2,
          marginBottom: '24px',
          color: '#333',
        }}>
          AI 驱动的下一代低代码平台
        </h1>
        <p style={{
          fontSize: 'clamp(18px, 2vw, 24px)',
          color: '#666',
          marginBottom: '40px',
          maxWidth: '600px',
          margin: '0 auto 40px',
        }}>
          用自然语言描述你的想法，AI 自动生成完整应用
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <motion.button
            whileHover={{ translateY: -2, boxShadow: '0 4px 12px rgba(24,144,255,0.4)' }}
            style={{
              background: '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '16px 40px',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            立即体验
          </motion.button>
          <motion.button
            whileHover={{ background: '#f0f7ff' }}
            style={{
              background: 'transparent',
              color: '#1890ff',
              border: '2px solid #1890ff',
              borderRadius: '8px',
              padding: '16px 40px',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            了解更多
          </motion.button>
        </div>
      </motion.div>
    </section>
  )
}

// Features Section
function FeaturesSection() {
  const features: Feature[] = [
    { icon: '🤖', title: 'AI 对话', description: '自然语言生成页面' },
    { icon: '📊', title: '流程图', description: '可视化业务逻辑' },
    { icon: '💻', title: '低代码编辑器', description: '精细化调整' },
  ]

  return (
    <section style={{ padding: '80px 24px', background: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '60px', color: '#333' }}>核心能力</h2>
        <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ translateY: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
              style={{
                width: '320px',
                padding: '32px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#333' }}>{feature.title}</h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// How It Works Section
function HowItWorksSection() {
  const steps: Step[] = [
    { number: 1, title: '描述你的想法', description: '用自然语言描述你想要的应用' },
    { number: 2, title: 'AI 生成原型', description: '自动生成可交互的页面原型' },
    { number: 3, title: '调整并发布', description: '精细调整后一键部署' },
  ]

  return (
    <section style={{ padding: '80px 24px', background: '#fafafa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '60px', color: '#333' }}>如何使用</h2>
        <div style={{ display: 'flex', gap: '48px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.15 }}
              viewport={{ once: true }}
              style={{ textAlign: 'center' }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#1890ff',
                color: '#fff',
                fontSize: '32px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                {step.number}
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#333' }}>{step.title}</h3>
              <p style={{ color: '#666', maxWidth: '200px' }}>{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Demo Section
function DemoSection() {
  return (
    <section style={{ padding: '80px 24px', background: '#fff' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', marginBottom: '40px', color: '#333' }}>产品演示</h2>
        <div style={{
          aspectRatio: '16/9',
          background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f7ff 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #91d5ff',
        }}>
          <div style={{ textAlign: 'center', color: '#1890ff' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>▶</div>
            <p>点击播放演示视频</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// Social Proof Section
function SocialProofSection() {
  const testimonials: Testimonial[] = [
    { avatar: '', name: '张三', role: '创业者', content: '半天就完成了MVP开发！' },
    { avatar: '', name: '李四', role: '产品经理', content: '团队效率提升了3倍' },
  ]

  return (
    <section style={{ padding: '80px 24px', background: '#fafafa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '60px', color: '#333' }}>用户评价</h2>
        <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              style={{
                width: '300px',
                padding: '24px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <p style={{ fontSize: '16px', lineHeight: 1.6, marginBottom: '20px', color: '#333' }}>"{testimonial.content}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#e6f7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1890ff',
                  fontWeight: 600,
                }}>
                  {testimonial.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#333' }}>{testimonial.name}</div>
                  <div style={{ fontSize: '14px', color: '#999' }}>{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  return (
    <section style={{ padding: '100px 24px', background: '#f0f7ff', textAlign: 'center' }}>
      <h2 style={{ fontSize: '36px', marginBottom: '24px', color: '#333' }}>开始你的第一个 AI 项目</h2>
      <motion.button
        whileHover={{ translateY: -2, boxShadow: '0 4px 12px rgba(24,144,255,0.4)' }}
        style={{
          background: '#1890ff',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '16px 48px',
          fontSize: '18px',
          cursor: 'pointer',
        }}
      >
        立即免费体验
      </motion.button>
      <p style={{ marginTop: '16px', color: '#999' }}>无需信用卡</p>
    </section>
  )
}

// Footer
function Footer() {
  return (
    <footer style={{ padding: '40px 24px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['关于', '文档', '博客', '联系我们'].map((link) => (
            <a key={link} href="#" style={{ color: '#666', textDecoration: 'none' }}>{link}</a>
          ))}
        </div>
        <div style={{ color: '#666' }}>© 2026 VibeX</div>
      </div>
    </footer>
  )
}

// Main Page
export default function Home() {
  return (
    <main>
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoSection />
      <SocialProofSection />
      <CTASection />
      <Footer />
    </main>
  )
}
