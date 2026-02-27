'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle auth logic - 安全：不记录敏感信息
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            {isLogin ? '欢迎回来' : '创建账号'}
          </h1>
          <p style={{ color: '#666' }}>
            {isLogin ? '登录你的 VibeX 账号' : '开始你的 AI 构建之旅'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                用户名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入用户名"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {isLogin ? '登录' : '注册'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', color: '#666' }}>
          {isLogin ? (
            <>
              还没有账号？{' '}
              <button
                onClick={() => setIsLogin(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0070f3',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                立即注册
              </button>
            </>
          ) : (
            <>
              已有账号？{' '}
              <button
                onClick={() => setIsLogin(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0070f3',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                立即登录
              </button>
            </>
          )}
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <Link href="/landing" style={{ color: '#999', textDecoration: 'none', fontSize: '14px' }}>
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
