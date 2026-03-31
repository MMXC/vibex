'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SimpleSteps } from '@/components/ui/Steps';
import { TemplateSelector } from '@/components/templates';
import { useConfirmationStore } from '@/stores/confirmationStore';
import type { BusinessFlow as ConfirmationBusinessFlow } from '@/stores/confirmationStore';
import styles from './preview.module.css';

// Type alias for BusinessFlow - use any to bypass strict union type issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBusinessFlow = any;

// 4步设计流程
const designSteps = ['需求输入', '限界上下文', '领域模型', '业务流程'];

// 模拟预览页面数据
const previewPages = [
  { id: 1, name: '首页', thumbnail: '🏠' },
  { id: 2, name: '关于', thumbnail: '📄' },
  { id: 3, name: '产品', thumbnail: '📦' },
  { id: 4, name: '联系', thumbnail: '📧' },
  { id: 5, name: '博客', thumbnail: '📝' },
  { id: 6, name: '定价', thumbnail: '💰' },
];

// 模拟设备尺寸
const devices = [
  { id: 'desktop', name: '桌面端', width: '100%', icon: '🖥️' },
  { id: 'tablet', name: '平板', width: '768px', icon: '📱' },
  { id: 'mobile', name: '手机', width: '375px', icon: '📲' },
];

export default function Preview() {
  const [selectedPage, setSelectedPage] = useState(previewPages[0]);
  const [device, setDevice] = useState('desktop');
  const [zoom, setZoom] = useState(100);
  const [showPageList, setShowPageList] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [requirementText, setRequirementText] = useState('');
  const [mounted, setMounted] = useState(false);

  // 避免 SSR 问题
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取 Store 数据
  const boundedContexts = useConfirmationStore((s) => s.boundedContexts) || [];
  const domainModels = useConfirmationStore((s) => s.domainModels) || [];
  const businessFlow = (useConfirmationStore((s) => s.businessFlow) || { id: '', name: '', states: [], transitions: [] }) as AnyBusinessFlow;

  // 根据数据确定当前步骤
  const getCurrentStep = () => {
    if ((businessFlow as any).states?.length > 0) return 3; // 业务流程
    if (domainModels?.length > 0) return 2; // 领域模型
    if (boundedContexts?.length > 0) return 1; // 限界上下文
    return 0; // 需求输入
  };

  const currentStep = getCurrentStep();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部说明区域 */}
      <header
        style={{
          padding: '16px 24px',
          backgroundColor: '#0a0a0f',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#fff',
            margin: 0,
            background: 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          用 AI 轻松构建你的 Web 应用
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            margin: '8px 0 0',
          }}
        >
          描述需求，AI 实时生成预览
        </p>
      </header>

      {/* 步骤指示器 */}
      <div
        style={{
          padding: '16px 24px',
          backgroundColor: '#1a1a2e',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {mounted && (
          <SimpleSteps
            steps={designSteps}
            current={currentStep}
          />
        )}
      </div>

      {/* 预览画布 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          backgroundColor: '#0f0f1a',
          overflow: 'hidden',
        }}
      >
        {/* 上下文图/模型图/流程图显示区域 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          {currentStep === 0 && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
              <p>输入需求后，AI 将实时生成预览</p>
            </div>
          )}

          {currentStep >= 1 && boundedContexts.length > 0 && (
            <div style={{ 
              width: '100%', 
              maxWidth: '800px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '16px',
            }}>
              <h3 style={{ color: '#fff', margin: '0 0 16px' }}>限界上下文</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {(boundedContexts ?? []).map((ctx: any) => (
                  <div
                    key={ctx.id}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(0,212,255,0.1)',
                      border: '1px solid rgba(0,212,255,0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  >
                    {ctx.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep >= 2 && domainModels.length > 0 && (
            <div style={{ 
              width: '100%', 
              maxWidth: '800px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '16px',
            }}>
              <h3 style={{ color: '#fff', margin: '0 0 16px' }}>领域模型</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {(domainModels ?? []).map((model: any) => (
                  <div
                    key={model.id}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  >
                    {model.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep >= 3 && (businessFlow as any).states?.length > 0 && (
            <div style={{ 
              width: '100%', 
              maxWidth: '800px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              padding: '24px',
            }}>
              <h3 style={{ color: '#fff', margin: '0 0 16px' }}>业务流程</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {((businessFlow as any).states || []).map((state: any) => (
                  <div
                    key={state.id}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  >
                    {state.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 顶部工具栏 */}
      <div
        style={{
          padding: '12px 24px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a
            href="/"
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#0070f3',
              textDecoration: 'none',
            }}
          >
            VibeX
          </a>
          <span style={{ color: '#94a3b8' }}>/</span>
          <span style={{ fontWeight: 500 }}>页面预览</span>
        </div>

        {/* 页面选择 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowPageList(!showPageList)}
            style={{
              padding: '8px 16px',
              backgroundColor: showPageList ? '#eff6ff' : '#f1f5f9',
              color: showPageList ? '#0070f3' : '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            📄 {selectedPage.name}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* 缩放控制 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#f1f5f9',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              -
            </button>
            <span
              style={{
                fontSize: '13px',
                minWidth: '45px',
                textAlign: 'center',
              }}
            >
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#f1f5f9',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              +
            </button>
          </div>

          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            📤 导出
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧设备面板 */}
        <div
          style={{
            width: '180px',
            backgroundColor: 'white',
            borderRight: '1px solid #e2e8f0',
            padding: '16px',
          }}
        >
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '16px',
              color: '#64748b',
            }}
          >
            设备类型
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {devices.map((d) => (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  backgroundColor: device === d.id ? '#eff6ff' : '#f8fafc',
                  border:
                    device === d.id ? '1px solid #0070f3' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '18px' }}>{d.icon}</span>
                <span
                  style={{
                    fontSize: '13px',
                    color: device === d.id ? '#0070f3' : '#64748b',
                  }}
                >
                  {d.name}
                </span>
              </button>
            ))}
          </div>

          {/* 页面列表 */}
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              marginTop: '24px',
              marginBottom: '16px',
              color: '#64748b',
            }}
          >
            页面列表
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {previewPages.map((page) => (
              <button
                key={page.id}
                onClick={() => setSelectedPage(page)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor:
                    selectedPage.id === page.id ? '#eff6ff' : '#f8fafc',
                  border:
                    selectedPage.id === page.id
                      ? '1px solid #0070f3'
                      : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '16px' }}>{page.thumbnail}</span>
                <span
                  style={{
                    fontSize: '13px',
                    color: selectedPage.id === page.id ? '#0070f3' : '#64748b',
                  }}
                >
                  {page.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 中间预览区域 */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#1e293b',
            padding: '32px',
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {/* 预览容器 */}
          <div
            style={{
              width: devices.find((d) => d.id === device)?.width,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'width 0.3s ease',
            }}
          >
            {/* 浏览器地址栏 */}
            <div
              style={{
                backgroundColor: '#334155',
                borderRadius: '8px 8px 0 0',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                  }}
                ></span>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                  }}
                ></span>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                  }}
                ></span>
              </div>
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#1e293b',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  color: '#94a3b8',
                  fontFamily: 'monospace',
                }}
              >
                vibex.app/{selectedPage.name.toLowerCase()}
              </div>
            </div>

            {/* 预览内容 */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '0 0 8px 8px',
                minHeight: '500px',
                overflow: 'hidden',
              }}
            >
              {/* 模拟页面内容 */}
              <div style={{ padding: '32px' }}>
                <h1
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                  }}
                >
                  {selectedPage.name}
                </h1>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>
                  这是 {selectedPage.name} 页面的预览效果。
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    marginBottom: '24px',
                  }}
                >
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        padding: '16px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                        📄
                      </div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>
                        内容块 {i}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  立即体验
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧信息面板 */}
        <div
          style={{
            width: '260px',
            backgroundColor: 'white',
            borderLeft: '1px solid #e2e8f0',
            padding: '16px',
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '16px',
              color: '#64748b',
            }}
          >
            预览信息
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              当前页面
            </label>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>
              {selectedPage.name}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              设备类型
            </label>
            <div style={{ fontSize: '14px' }}>
              {devices.find((d) => d.id === device)?.name}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              缩放比例
            </label>
            <div style={{ fontSize: '14px' }}>{zoom}%</div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              视口宽度
            </label>
            <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>
              {devices.find((d) => d.id === device)?.width}
            </div>
          </div>

          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bae6fd',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                color: '#0369a1',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              💡 提示
            </div>
            <div style={{ fontSize: '12px', color: '#075985' }}>
              点击"导出"按钮可以导出当前页面的 HTML、CSS 代码
            </div>
          </div>
        </div>
      </div>

      {/* 底部输入区域 - 需求输入框 + 生成按钮 */}
      <div
        style={{
          padding: '16px 24px',
          backgroundColor: '#1a1a2e',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          <input
            type="text"
            placeholder="描述你的产品需求，例如：创建一个在线教育平台..."
            value={requirementText}
            onChange={(e) => setRequirementText(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(0, 212, 255, 0.5)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          />
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            📋 模板
          </button>
          <button
            style={{
              padding: '12px 24px',
              backgroundColor: '#00d4ff',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            🎯 开始生成
          </button>
        </div>
        
        {/* 模板选择器 */}
        {showTemplates && (
          <div style={{ maxWidth: '800px', margin: '12px auto 0' }}>
            <TemplateSelector
              isOpen={showTemplates}
              onClose={() => setShowTemplates(false)}
              onSelect={(template) => {
                setRequirementText(template.description || template.content || '');
                setShowTemplates(false);
              }}
            />
          </div>
        )}
        
        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.4)',
            margin: '8px 0 0',
          }}
        >
          登录后可保存和导出项目
        </p>
      </div>
    </div>
  );
}
