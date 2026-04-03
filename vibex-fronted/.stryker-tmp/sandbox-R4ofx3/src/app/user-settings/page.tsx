// @ts-nocheck
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Keyboard, User, Palette } from 'lucide-react';

type Tab = 'general' | 'shortcuts';

export default function UserSettings() {
  const [name, setName] = useState('用户名');
  const [email, setEmail] = useState('user@example.com');
  const [activeTab, setActiveTab] = useState<Tab>('general');

  return (
    <div style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '32px' }}>用户设置</h1>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid #e5e5e5',
          paddingBottom: '8px',
        }}
      >
        <button
          onClick={() => setActiveTab('general')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: activeTab === 'general' ? '#0070f3' : 'transparent',
            color: activeTab === 'general' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          <User size={16} />
          通用
        </button>
        <button
          onClick={() => setActiveTab('shortcuts')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: activeTab === 'shortcuts' ? '#0070f3' : 'transparent',
            color: activeTab === 'shortcuts' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          <Keyboard size={16} />
          快捷键
        </button>
      </div>

      {activeTab === 'general' && (
        <>
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}
            >
              用户名
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}
            >
              邮箱
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}
            >
              主题
            </label>
            <select
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
              }}
            >
              <option>浅色</option>
              <option>深色</option>
              <option>跟随系统</option>
            </select>
          </div>

          <button
            style={{
              padding: '12px 24px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
            }}
          >
            保存
          </button>
        </>
      )}

      {activeTab === 'shortcuts' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Keyboard size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600' }}>
            自定义快捷键
          </h3>
          <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '14px' }}>
            配置您习惯的快捷键映射
          </p>
          <Link
            href="/settings/shortcuts"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              backgroundColor: '#0070f3',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            打开快捷键设置
          </Link>
        </div>
      )}
    </div>
  );
}
