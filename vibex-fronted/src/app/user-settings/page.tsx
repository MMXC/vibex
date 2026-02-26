'use client'

import { useState } from 'react'

export default function UserSettings() {
  const [name, setName] = useState('用户名')
  const [email, setEmail] = useState('user@example.com')

  return (
    <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '32px' }}>用户设置</h1>
      
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>用户名</label>
        <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>邮箱</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" style={{ width: '100%', padding: '12px', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>主题</label>
        <select style={{ width: '100%', padding: '12px', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
          <option>浅色</option>
          <option>深色</option>
          <option>跟随系统</option>
        </select>
      </div>

      <button style={{ padding: '12px 24px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px' }}>保存</button>
    </div>
  )
}
