'use client'

import { useState } from 'react'

export default function ProjectSettings() {
  const [name, setName] = useState('我的第一个应用')
  const [description, setDescription] = useState('AI 驱动的博客系统')
  const [visibility, setVisibility] = useState('private')

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '32px' }}>项目设置</h1>
      
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>项目名称</label>
        <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>项目描述</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ width: '100%', padding: '12px', border: '1px solid #e5e5e5', borderRadius: '8px', resize: 'vertical' }} />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>可见性</label>
        <select value={visibility} onChange={e => setVisibility(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
          <option value="private">私有</option>
          <option value="public">公开</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button style={{ padding: '12px 24px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px' }}>保存</button>
        <button style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid #e5e5e5', borderRadius: '8px' }}>取消</button>
      </div>
    </div>
  )
}
