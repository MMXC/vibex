'use client'

import Link from 'next/link'

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 48px',
        borderBottom: '1px solid #e5e5e5',
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        zIndex: 100,
      }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3' }}>
          VibeX
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <Link href="#features" style={{ color: '#666', textDecoration: 'none' }}>功能</Link>
          <Link href="#pricing" style={{ color: '#666', textDecoration: 'none' }}>价格</Link>
          <Link href="/auth" style={{
            padding: '8px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
          }}>
            开始使用
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '120px 48px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #f8f9fa 0%, white 100%)',
      }}>
        <h1 style={{
          fontSize: '56px',
          fontWeight: '800',
          marginBottom: '24px',
          lineHeight: '1.2',
        }}>
          用 AI 轻松构建<br />你的 Web 应用
        </h1>
        <p style={{
          fontSize: '20px',
          color: '#666',
          marginBottom: '40px',
          maxWidth: '600px',
          margin: '0 auto 40px',
        }}>
          VibeX 是一个 AI 驱动的应用构建平台，通过自然语言描述即可生成完整的 Web 应用界面和功能。
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/auth" style={{
            padding: '16px 32px',
            backgroundColor: '#0070f3',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '18px',
            fontWeight: '600',
          }}>
            免费开始
          </Link>
          <Link href="/chat" style={{
            padding: '16px 32px',
            backgroundColor: 'white',
            color: '#333',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '18px',
          }}>
            查看演示
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '80px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '40px', textAlign: 'center', marginBottom: '48px' }}>
          强大功能
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '32px',
        }}>
          {[
            { title: 'AI 对话生成', desc: '用自然语言描述需求，AI 自动生成完整页面' },
            { title: '可视化编辑', desc: '拖拽式流程图编辑器，所见即所得' },
            { title: '一键导出', desc: '支持导出 React、Vue 等多种代码' },
          ].map((feature, i) => (
            <div key={i} style={{
              padding: '32px',
              border: '1px solid #e5e5e5',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>
                {i === 0 ? '🤖' : i === 1 ? '✏️' : '📦'}
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>{feature.title}</h3>
              <p style={{ color: '#666' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '80px 48px',
        backgroundColor: '#0070f3',
        color: 'white',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '36px', marginBottom: '16px' }}>
          准备好开始了吗？
        </h2>
        <p style={{ fontSize: '18px', marginBottom: '32px', opacity: 0.9 }}>
          免费注册，立即体验 AI 构建应用的乐趣
        </p>
        <Link href="/auth" style={{
          padding: '16px 40px',
          backgroundColor: 'white',
          color: '#0070f3',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '18px',
          fontWeight: '600',
        }}>
          立即免费注册
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px 48px',
        borderTop: '1px solid #e5e5e5',
        textAlign: 'center',
        color: '#999',
      }}>
        <p>© 2026 VibeX. All rights reserved.</p>
      </footer>
    </div>
  )
}
