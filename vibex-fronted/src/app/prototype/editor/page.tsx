'use client'

import React, { Suspense, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './prototype.module.css'

const mockPrototypePages = [
  { id: 'page-1', name: '首页', route: '/', components: [
    { id: 'comp-1', type: 'navigation', props: { title: '我的应用', items: ['首页', '产品', '关于'] } },
    { id: 'comp-2', type: 'text', props: { text: '欢迎使用 AI 原型', variant: 'h1' } },
  ]},
]

const devices = [
  { id: 'desktop', name: '桌面端', width: '100%', icon: '🖥️' },
  { id: 'tablet', name: '平板', width: '768px', icon: '📱' },
  { id: 'mobile', name: '手机', width: '375px', icon: '📲' },
]

function EditorContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const [selectedPage] = useState(mockPrototypePages[0])
  const [selectedDevice, setSelectedDevice] = useState('desktop')
  const [zoom, setZoom] = useState(100)

  const renderComponent = useCallback((component: any) => {
    const baseStyle = { position: 'relative' as const, cursor: 'pointer' as const }
    switch (component.type) {
      case 'navigation':
        return (
          <nav key={component.id} style={{ ...baseStyle, display: 'flex', justifyContent: 'space-between', padding: '12px 24px', backgroundColor: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00d4ff' }}>{component.props.title}</div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {(component.props.items || []).map((item: string, i: number) => <span key={i} style={{ color: '#94a3b8', fontSize: '14px' }}>{item}</span>)}
            </div>
          </nav>
        )
      case 'text':
        const TextTag = component.props.variant === 'h1' ? 'h1' : 'p'
        return <TextTag key={component.id} style={baseStyle}>{component.props.text}</TextTag>
      default:
        return <div key={component.id} style={baseStyle}>{component.type}</div>
    }
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard" className={styles.backBtn}><span>←</span><span>返回</span></Link>
          <h1 className={styles.title}>原型编辑器</h1>
        </div>
        <div className={styles.headerCenter}>
          <div className={styles.deviceTabs}>
            {devices.map(device => (
              <button key={device.id} className={`${styles.deviceTab} ${selectedDevice === device.id ? styles.active : ''}`} onClick={() => setSelectedDevice(device.id)}>
                <span>{device.icon}</span><span>{device.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.zoomControl}>
            <button onClick={() => setZoom(Math.max(25, zoom - 25))}>−</button>
            <span>{zoom}%</span>
            <button onClick={() => setZoom(Math.min(200, zoom + 25))}>+</button>
          </div>
        </div>
      </header>
      <div className={styles.mainContainer}>
        <main className={styles.previewArea}>
          <div style={{ width: devices.find(d => d.id === selectedDevice)?.width, transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
            <div className={styles.browserFrame}>
              <div className={styles.browserHeader}>
                <div className={styles.browserDots}>
                  <span style={{ backgroundColor: '#ff5f56' }}></span>
                  <span style={{ backgroundColor: '#ffbd2e' }}></span>
                  <span style={{ backgroundColor: '#27ca40' }}></span>
                </div>
                <div className={styles.browserUrl}>vibex.app{selectedPage?.route}</div>
              </div>
              <div className={styles.browserContent}>
                {selectedPage?.components?.map((comp: any) => renderComponent(comp))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function PrototypeEditor() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <EditorContent />
    </Suspense>
  )
}
