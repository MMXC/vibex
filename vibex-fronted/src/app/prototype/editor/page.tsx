'use client';

import React, {
  Suspense,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './prototype.module.css';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

import {
  apiService,
  UIPage,
  PrototypeSnapshot,
  UIComponent,
} from '@/services/api';

// 版本历史类型
interface VersionHistory {
  id: string;
  version: number;
  name: string;
  description?: string;
  createdAt: string;
  author?: string;
  content?: string;
}

// 版本对比类型
interface VersionCompare {
  left: VersionHistory;
  right: VersionHistory;
}

// 聊天消息类型
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 组件状态类型
interface ComponentState {
  [componentId: string]: {
    [key: string]: unknown;
  };
}

// 流式响应状态
interface StreamingState {
  isStreaming: boolean;
  currentContent: string;
}

// 设备类型
const devices = [
  { id: 'desktop', name: '桌面端', width: '100%', icon: '🖥️' },
  { id: 'tablet', name: '平板', width: '768px', icon: '📱' },
  { id: 'mobile', name: '手机', width: '375px', icon: '📲' },
];

// 版本对比预览组件
function PreviewContent({ content }: { content: string }) {
  try {
    const data = JSON.parse(content);
    const page = data.pages?.[0];
    if (!page) return <div className={styles.compareEmpty}>空页面</div>;

    return (
      <div className={styles.comparePreview}>
        <div className={styles.comparePageName}>{page.name}</div>
        <div className={styles.compareComponentList}>
          {page.components?.map((comp: UIComponent, idx: number) => (
            <div key={comp.id || idx} className={styles.compareComponent}>
              <span className={styles.compareComponentType}>{comp.type}</span>
              <span className={styles.compareComponentProps}>
                {String(
                  comp.props?.text ||
                    comp.props?.title ||
                    comp.props?.label ||
                    '-'
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  } catch {
    return <div className={styles.compareEmpty}>解析失败</div>;
  }
}

// 交互式组件渲染器
function InteractiveRenderer({
  component,
  componentState,
  onStateChange,
  onComponentClick,
}: {
  component: UIComponent;
  componentState: ComponentState;
  onStateChange: (componentId: string, key: string, value: unknown) => void;
  onComponentClick: (component: UIComponent) => void;
}) {
  const state = componentState[component.id] || {};
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const baseStyle: React.CSSProperties = useMemo(
    () => ({
      position: 'relative',
      cursor: component.props?.disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      transform:
        hovered && !component.props?.disabled ? 'scale(1.02)' : 'scale(1)',
      boxShadow:
        hovered && !component.props?.disabled
          ? '0 4px 12px rgba(0, 212, 255, 0.3)'
          : 'none',
    }),
    [hovered, component.props?.disabled]
  );

  const handleClick = () => {
    if (component.props?.disabled) return;

    // 触发点击事件
    if (component.props?.onClick) {
      onComponentClick(component);
    }

    // 更新组件状态
    if (component.type === 'button') {
      onStateChange(component.id, 'clicked', !state.clicked);
      onStateChange(component.id, 'lastClick', Date.now());
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onStateChange(component.id, 'value', e.target.value);
  };

  const handleToggleChange = () => {
    onStateChange(component.id, 'checked', !state.checked);
  };

  switch (component.type) {
    // 导航组件
    case 'navigation':
      const navState = state as {
        theme?: { backgroundColor?: string };
        activeItem?: number;
      };
      return (
        <nav
          key={component.id}
          style={{
            ...baseStyle,
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 24px',
            backgroundColor:
              navState.theme?.backgroundColor || '#1a1a2e',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            minHeight: '48px',
            alignItems: 'center',
          }}
          onClick={() => onComponentClick(component)}
        >
          <div
            style={{ fontSize: '18px', fontWeight: 'bold', color: '#00d4ff' }}
          >
            {String(component.props?.title || 'Vibex App')}
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            {((component.props?.items as string[]) || []).map(
              (item: string, i: number) => (
                <span
                  key={i}
                  style={{
                    color: navState.activeItem === i ? '#00d4ff' : '#94a3b8',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStateChange(component.id, 'activeItem', i);
                    onComponentClick({
                      ...component,
                      selectedItem: item,
                    } as UIComponent);
                  }}
                >
                  {item}
                </span>
              )
            )}
          </div>
        </nav>
      );

    // 文本组件
    case 'text':
      const textProps = component.props as {
        variant?: string;
        color?: string;
        margin?: string;
        padding?: string;
        text?: string;
      };
      const TextTag =
        textProps.variant === 'h1'
          ? 'h1'
          : textProps.variant === 'h2'
            ? 'h2'
            : 'p';
      const textStyles: React.CSSProperties = {
        ...baseStyle,
        fontSize:
          textProps.variant === 'h1'
            ? '32px'
            : textProps.variant === 'h2'
              ? '24px'
              : '16px',
        fontWeight:
          textProps.variant === 'h1' || textProps.variant === 'h2'
            ? 'bold'
            : 'normal',
        color: textProps.color || '#e2e8f0',
        margin: textProps.margin || '0',
        padding: textProps.padding || '0',
      };
      return (
        <TextTag
          key={component.id}
          style={textStyles}
          onClick={() => onComponentClick(component)}
        >
          {String(textProps.text || '')}
        </TextTag>
      );

    // 按钮组件
    case 'button':
      return (
        <button
          key={component.id}
          style={{
            ...baseStyle,
            padding:
              component.props?.size === 'small'
                ? '8px 16px'
                : component.props?.size === 'large'
                  ? '16px 32px'
                  : '12px 24px',
            backgroundColor: state.clicked
              ? '#00a8cc'
              : component.props?.variant === 'primary'
                ? '#00d4ff'
                : component.props?.variant === 'danger'
                  ? '#ef4444'
                  : 'transparent',
            color: component.props?.variant ? '#fff' : '#00d4ff',
            border: component.props?.variant ? 'none' : '2px solid #00d4ff',
            borderRadius: component.props?.round ? '24px' : '8px',
            fontSize: '14px',
            fontWeight: '600',
            opacity: component.props?.disabled ? 0.5 : 1,
          }}
          onClick={handleClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          disabled={component.props?.disabled}
        >
          {component.props?.text || 'Button'}
        </button>
      );

    // 输入框组件
    case 'input':
      const inputProps = component.props as {
        label?: string;
        type?: string;
        placeholder?: string;
        showCount?: boolean;
        maxLength?: number;
      };
      const inputState = state as { value?: string };
      return (
        <div
          key={component.id}
          style={{
            ...baseStyle,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {inputProps.label && (
            <label style={{ color: '#94a3b8', fontSize: '14px' }}>
              {inputProps.label}
            </label>
          )}
          <input
            type={inputProps.type || 'text'}
            placeholder={inputProps.placeholder || '请输入...'}
            value={inputState.value || ''}
            onChange={handleInputChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onClick={() => onComponentClick(component)}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: focused ? '2px solid #00d4ff' : '1px solid #334155',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              fontSize: '14px',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          {inputProps.showCount && inputState.value && (
            <span style={{ color: '#64748b', fontSize: '12px' }}>
              {String(inputState.value).length} / {inputProps.maxLength || 100}
            </span>
          )}
        </div>
      );

    // 文本域组件
    case 'textarea':
      const textareaProps = component.props as {
        label?: string;
        placeholder?: string;
        rows?: number;
      };
      const textareaState = state as { value?: string };
      return (
        <div
          key={component.id}
          style={{
            ...baseStyle,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {textareaProps.label && (
            <label style={{ color: '#94a3b8', fontSize: '14px' }}>
              {textareaProps.label}
            </label>
          )}
          <textarea
            placeholder={textareaProps.placeholder || '请输入...'}
            value={textareaState.value || ''}
            onChange={handleInputChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onClick={() => onComponentClick(component)}
            rows={textareaProps.rows || 4}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: focused ? '2px solid #00d4ff' : '1px solid #334155',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              fontSize: '14px',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>
      );

    // 开关组件
    case 'toggle':
      return (
        <div
          key={component.id}
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
          }}
          onClick={handleClick}
        >
          <div
            style={{
              width: '48px',
              height: '24px',
              borderRadius: '12px',
              backgroundColor: state.checked ? '#00d4ff' : '#334155',
              position: 'relative',
              transition: 'background-color 0.2s',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                position: 'absolute',
                top: '2px',
                left: state.checked ? '26px' : '2px',
                transition: 'left 0.2s',
              }}
            />
          </div>
          {component.props?.label && (
            <span style={{ color: '#e2e8f0', fontSize: '14px' }}>
              {component.props.label}
            </span>
          )}
        </div>
      );

    // 卡片组件
    case 'card':
      return (
        <div
          key={component.id}
          style={{
            ...baseStyle,
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: component.props?.padding || '20px',
            border: hovered ? '1px solid #00d4ff' : '1px solid #334155',
          }}
          onClick={() => onComponentClick(component)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {component.props?.title && (
            <h3
              style={{
                color: '#e2e8f0',
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '12px',
              }}
            >
              {component.props.title}
            </h3>
          )}
          {component.props?.content && (
            <p
              style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}
            >
              {component.props.content}
            </p>
          )}
          {component.props?.children}
        </div>
      );

    // 列表组件
    case 'list':
      const listProps = component.props as {
        items?: unknown[];
        showArrow?: boolean;
      };
      return (
        <div key={component.id} style={{ ...baseStyle }}>
          {(listProps.items || []).map((item: unknown, index: number) => (
            <div
              key={index}
              style={{
                padding: '12px 16px',
                borderBottom:
                  index < (listProps.items?.length || 0) - 1
                    ? '1px solid #334155'
                    : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={() =>
                onComponentClick({
                  ...component,
                  selectedItem: item,
                  index,
                } as UIComponent)
              }
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#1e293b')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              <span style={{ color: '#e2e8f0', fontSize: '14px' }}>
                {typeof item === 'string'
                  ? item
                  : (item as { label?: string }).label}
              </span>
              {listProps.showArrow !== false && (
                <span style={{ color: '#64748b' }}>›</span>
              )}
            </div>
          ))}
        </div>
      );

    // 分隔线
    case 'divider':
      return (
        <div
          key={component.id}
          style={{
            height: component.props?.thick ? '2px' : '1px',
            backgroundColor: '#334155',
            margin: component.props?.margin || '16px 0',
          }}
        />
      );

    // 头像组件
    case 'avatar':
      const size = component.props?.size || 'medium';
      const sizeMap = { small: '32px', medium: '48px', large: '64px' };
      return (
        <div
          key={component.id}
          style={{
            ...baseStyle,
            width: sizeMap[size as keyof typeof sizeMap] || '48px',
            height: sizeMap[size as keyof typeof sizeMap] || '48px',
            borderRadius: '50%',
            backgroundColor: '#334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize:
              size === 'small' ? '14px' : size === 'large' ? '24px' : '18px',
            color: '#94a3b8',
            overflow: 'hidden',
          }}
          onClick={() => onComponentClick(component)}
        >
          {component.props?.src ? (
            <img
              src={component.props.src}
              alt={component.props.alt || ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            component.props?.fallback || '👤'
          )}
        </div>
      );

    // 标签组件
    case 'badge':
      const badgeColors: Record<string, string> = {
        primary: '#00d4ff',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#8b5cf6',
      };
      return (
        <span
          key={component.id}
          style={{
            ...baseStyle,
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor:
              badgeColors[component.props?.color || 'primary'] + '20',
            color: badgeColors[component.props?.color || 'primary'],
          }}
          onClick={() => onComponentClick(component)}
        >
          {component.props?.text || 'Badge'}
        </span>
      );

    // 进度条组件
    case 'progress':
      return (
        <div key={component.id} style={{ ...baseStyle }}>
          {component.props?.label && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                {component.props.label}
              </span>
              <span style={{ color: '#e2e8f0', fontSize: '14px' }}>
                {state.value || component.props?.value || 0}%
              </span>
            </div>
          )}
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#334155',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${state.value || component.props?.value || 0}%`,
                height: '100%',
                backgroundColor:
                  component.props?.color === 'success' ? '#22c55e' : '#00d4ff',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      );

    // 图片组件
    case 'image':
      return (
        <div
          key={component.id}
          style={{
            ...baseStyle,
            borderRadius: component.props?.radius ? '12px' : '0',
            overflow: 'hidden',
            backgroundColor: '#334155',
          }}
          onClick={() => onComponentClick(component)}
        >
          {component.props?.src ? (
            <img
              src={component.props.src}
              alt={component.props.alt || ''}
              style={{
                width: '100%',
                height: component.props?.height || 'auto',
                objectFit: component.props?.fit || 'cover',
              }}
            />
          ) : (
            <div
              style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}
            >
              🖼️ 点击添加图片
            </div>
          )}
        </div>
      );

    // 默认渲染
    default:
      return (
        <div
          key={component.id}
          style={{
            ...baseStyle,
            padding: '12px',
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            color: '#94a3b8',
          }}
          onClick={() => onComponentClick(component)}
        >
          {component.type}:{' '}
          {component.props?.text || component.props?.title || '未配置'}
        </div>
      );
  }
}

function EditorContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const snapshotId = searchParams.get('snapshotId');

  const [selectedPage, setSelectedPage] = useState<UIPage | null>(null);
  const [selectedDevice, setSelectedDevice] = useState('desktop');
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [componentState, setComponentState] = useState<ComponentState>({});
  const [lastInteraction, setLastInteraction] = useState<string>('');
  const [interactionCount, setInteractionCount] = useState(0);

  // 版本历史相关状态
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);
  const [versionList, setVersionList] = useState<VersionHistory[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState<VersionCompare | null>(
    null
  );
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [rollingBack, setRollingBack] = useState(false);

  // 聊天相关状态
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '你好！我是 AI 助手，可以帮你分析和优化这个原型设计。有什么问题尽管问我！',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // 加载原型数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (snapshotId) {
          const snapshot = await apiService.getPrototypeSnapshot(snapshotId);
          if (snapshot.content) {
            const content = JSON.parse(snapshot.content);
            const pages = content.pages || [];
            if (pages.length > 0) {
              setSelectedPage(pages[0]);
            }
          }
        } else if (projectId) {
          const snapshots = await apiService.getPrototypeSnapshots(projectId);
          if (snapshots.length > 0 && snapshots[0].content) {
            const content = JSON.parse(snapshots[0].content);
            const pages = content.pages || [];
            if (pages.length > 0) {
              setSelectedPage(pages[0]);
            }
          }
        }
      } catch (err) {
        canvasLogger.default.error('Failed to load prototype:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId, snapshotId]);

  // 加载版本历史
  const loadVersionHistory = useCallback(async () => {
    if (!projectId) return;
    setLoadingVersions(true);
    try {
      const snapshots = await apiService.getPrototypeSnapshots(projectId);
      // 转换为版本历史格式
      const versions: VersionHistory[] = snapshots.map(
        (s: PrototypeSnapshot) => ({
          id: s.id,
          version: s.version || 1,
          name: s.name || `版本 ${s.version || 1}`,
          description: s.description,
          createdAt: s.createdAt || new Date().toISOString(),
          content: s.content,
        })
      );
      // 按版本号倒序排列
      versions.sort((a, b) => b.version - a.version);
      setVersionList(versions);
    } catch (err) {
      canvasLogger.default.error('Failed to load version history:', err);
    } finally {
      setLoadingVersions(false);
    }
  }, [projectId]);

  // 打开版本面板时加载历史
  useEffect(() => {
    if (versionPanelOpen && projectId) {
      loadVersionHistory();
    }
  }, [versionPanelOpen, projectId, loadVersionHistory]);

  // 选择版本进行对比
  const handleVersionSelect = useCallback((versionId: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  }, []);

  // 打开版本对比
  const openCompare = useCallback(() => {
    if (selectedVersions.length !== 2) return;
    const left = versionList.find((v) => v.id === selectedVersions[0]);
    const right = versionList.find((v) => v.id === selectedVersions[1]);
    if (left && right) {
      setCompareVersions({ left, right });
      setCompareModalOpen(true);
    }
  }, [selectedVersions, versionList]);

  // 回滚到指定版本
  const handleRollback = useCallback(
    async (version: VersionHistory) => {
      if (!projectId || !version.content) return;

      if (
        !confirm(
          `确定要回滚到 "${version.name}" 吗？当前未保存的更改将会丢失。`
        )
      ) {
        return;
      }

      setRollingBack(true);
      try {
        // 创建新快照（基于旧版本）
        await apiService.createPrototypeSnapshot({
          projectId,
          version: versionList.length + 1,
          name: `回滚到 ${version.name}`,
          description: `从 ${versionList[0]?.name || '当前版本'} 回滚到 ${version.name}`,
          content: version.content,
        });

        // 重新加载页面数据
        const content = JSON.parse(version.content);
        const pages = content.pages || [];
        if (pages.length > 0) {
          setSelectedPage(pages[0]);
        }

        // 刷新版本历史
        await loadVersionHistory();

        alert('回滚成功！');
      } catch (err) {
        canvasLogger.default.error('Failed to rollback:', err);
        alert('回滚失败，请重试');
      } finally {
        setRollingBack(false);
      }
    },
    [projectId, versionList, loadVersionHistory]
  );

  // 保存当前版本
  const handleSaveVersion = useCallback(async () => {
    const pageToSave = selectedPage || getSamplePage();
    if (!projectId || !pageToSave) return;

    const versionName = prompt(
      '请输入版本名称：',
      `版本 ${versionList.length + 1}`
    );
    if (!versionName) return;

    try {
      const content = JSON.stringify({ pages: [pageToSave] });
      await apiService.createPrototypeSnapshot({
        projectId,
        version: versionList.length + 1,
        name: versionName,
        description: '手动保存',
        content,
      });

      await loadVersionHistory();
      alert('版本保存成功！');
    } catch (err) {
      canvasLogger.default.error('Failed to save version:', err);
      alert('保存失败，请重试');
    }
  }, [projectId, selectedPage, versionList.length, loadVersionHistory]);

  // 更新组件状态
  const handleStateChange = useCallback(
    (componentId: string, key: string, value: unknown) => {
      setComponentState((prev) => ({
        ...prev,
        [componentId]: {
          ...prev[componentId],
          [key]: value,
        },
      }));
      setInteractionCount((prev) => prev + 1);
    },
    []
  );

  // 处理组件点击
  const handleComponentClick = useCallback((component: UIComponent) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN');
    setLastInteraction(
      `[${timestamp}] ${component.type}: ${component.props?.text || component.props?.title || '点击事件'}`
    );
    setInteractionCount((prev) => prev + 1);
  }, []);

  // 发送消息并处理流式响应
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);
    setStreamingContent('');

    // 调用 AI API 获取流式响应
    const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: inputValue.trim() }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('登录已过期，请重新登录');
        }
        throw new Error('API request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setStreamingContent((prev) => prev + chunk);
      }

      setIsStreaming(false);

      // 添加完整的助手消息
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: streamingContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error) {
      canvasLogger.default.error('Chat API error:', error);
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [inputValue, isStreaming, streamingContent]);

  // 处理 Enter 键发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 清除历史记录
  const clearHistory = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '历史记录已清除。有什么新问题吗？',
        timestamp: new Date(),
      },
    ]);
  };

  // 重置组件状态
  const resetComponentState = () => {
    setComponentState({});
    setLastInteraction('');
    setInteractionCount(0);
  };

  // 获取示例页面数据
  const getSamplePage = useCallback(() => {
    return {
      id: 'sample-1',
      name: '首页',
      route: '/home',
      components: [
        {
          id: 'nav-1',
          type: 'navigation',
          props: {
            title: 'Vibex Dashboard',
            items: ['首页', '项目', '团队', '设置'],
          },
        },
        {
          id: 'text-1',
          type: 'text',
          props: {
            variant: 'h1',
            text: '欢迎回来',
          },
        },
        {
          id: 'card-1',
          type: 'card',
          props: {
            title: '快速开始',
            content: '点击下方按钮开始创建你的第一个项目',
          },
        },
        {
          id: 'btn-1',
          type: 'button',
          props: {
            text: '创建新项目',
            variant: 'primary',
            size: 'large',
          },
        },
        {
          id: 'input-1',
          type: 'input',
          props: {
            label: '搜索项目',
            placeholder: '输入项目名称...',
            showCount: true,
            maxLength: 50,
          },
        },
        {
          id: 'toggle-1',
          type: 'toggle',
          props: {
            label: '深色模式',
          },
        },
        {
          id: 'divider-1',
          type: 'divider',
          props: {},
        },
        {
          id: 'list-1',
          type: 'list',
          props: {
            items: [
              { label: '项目 A', id: 1 },
              { label: '项目 B', id: 2 },
              { label: '项目 C', id: 3 },
            ],
            showArrow: true,
          },
        },
        {
          id: 'progress-1',
          type: 'progress',
          props: {
            label: '项目进度',
            value: 65,
          },
        },
        {
          id: 'badge-1',
          type: 'badge',
          props: {
            text: '进行中',
            color: 'primary',
          },
        },
      ],
    };
  }, []);

  // 使用示例页面或加载的页面
  const displayPage = selectedPage || getSamplePage();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard" className={styles.backBtn}>
            <span>←</span>
            <span>返回</span>
          </Link>
          <h1 className={styles.title}>原型编辑器</h1>
          {displayPage && (
            <span className={styles.pageLabel}>{displayPage.name}</span>
          )}
        </div>
        <div className={styles.headerCenter}>
          <div className={styles.deviceTabs}>
            {devices.map((device) => (
              <button
                key={device.id}
                className={`${styles.deviceTab} ${selectedDevice === device.id ? styles.active : ''}`}
                onClick={() => setSelectedDevice(device.id)}
              >
                <span>{device.icon}</span>
                <span>{device.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            className={`${styles.toggleBtn} ${versionPanelOpen ? styles.active : ''}`}
            onClick={() => setVersionPanelOpen(!versionPanelOpen)}
            title="版本历史"
          >
            📜
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSaveVersion}
            title="保存版本"
          >
            💾 保存
          </button>
          <div className={styles.zoomControl}>
            <button onClick={() => setZoom(Math.max(25, zoom - 25))}>−</button>
            <span>{zoom}%</span>
            <button onClick={() => setZoom(Math.min(200, zoom + 25))}>+</button>
          </div>
          <button
            className={styles.interactionInfo}
            onClick={resetComponentState}
            title="重置组件状态"
          >
            🔄 {interactionCount}
          </button>
          <button
            className={`${styles.toggleBtn} ${chatOpen ? styles.active : ''}`}
            onClick={() => setChatOpen(!chatOpen)}
            title={chatOpen ? '关闭对话' : '打开对话'}
          >
            💬
          </button>
        </div>
      </header>

      {/* 交互提示 */}
      {lastInteraction && (
        <div className={styles.interactionToast}>
          <span className={styles.toastIcon}>👆</span>
          <span className={styles.toastText}>{lastInteraction}</span>
          <button
            className={styles.toastClose}
            onClick={() => setLastInteraction('')}
          >
            ✕
          </button>
        </div>
      )}

      <div className={styles.mainContainer}>
        {/* 版本历史面板 */}
        {versionPanelOpen && (
          <aside className={styles.versionPanel}>
            <div className={styles.versionPanelHeader}>
              <div className={styles.versionPanelTitle}>
                <span className={styles.versionIcon}>📜</span>
                <span>版本历史</span>
              </div>
              <div className={styles.versionPanelActions}>
                <button
                  className={styles.versionActionBtn}
                  onClick={openCompare}
                  disabled={selectedVersions.length !== 2}
                  title="对比选中版本"
                >
                  🔍 对比
                </button>
                <button
                  className={styles.versionActionBtn}
                  onClick={() => setVersionPanelOpen(false)}
                  title="关闭面板"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={styles.versionList}>
              {loadingVersions ? (
                <div className={styles.versionLoading}>
                  <span className={styles.spinner}></span>
                  <span>加载中...</span>
                </div>
              ) : versionList.length === 0 ? (
                <div className={styles.versionEmpty}>
                  <span>暂无版本记录</span>
                  <span className={styles.versionEmptyHint}>
                    点击"保存"创建第一个版本
                  </span>
                </div>
              ) : (
                versionList.map((version, index) => (
                  <div
                    key={version.id}
                    className={`${styles.versionItem} ${selectedVersions.includes(version.id) ? styles.versionItemSelected : ''} ${index === 0 ? styles.versionItemCurrent : ''}`}
                  >
                    <div className={styles.versionSelect}>
                      <input
                        type="checkbox"
                        checked={selectedVersions.includes(version.id)}
                        onChange={() => handleVersionSelect(version.id)}
                      />
                    </div>
                    <div className={styles.versionInfo}>
                      <div className={styles.versionName}>
                        {version.name}
                        {index === 0 && (
                          <span className={styles.currentBadge}>当前</span>
                        )}
                      </div>
                      <div className={styles.versionMeta}>
                        <span className={styles.versionTime}>
                          {new Date(version.createdAt).toLocaleString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {version.description && (
                        <div className={styles.versionDesc}>
                          {version.description}
                        </div>
                      )}
                    </div>
                    <div className={styles.versionActions}>
                      <button
                        className={styles.rollbackBtn}
                        onClick={() => handleRollback(version)}
                        disabled={rollingBack || index === 0}
                        title="回滚到此版本"
                      >
                        ↩️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedVersions.length > 0 && (
              <div className={styles.versionCompareHint}>
                已选择 {selectedVersions.length}/2 个版本
              </div>
            )}
          </aside>
        )}

        <main className={styles.previewArea}>
          <div
            style={{
              width: devices.find((d) => d.id === selectedDevice)?.width,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'width 0.3s ease',
            }}
          >
            <div className={styles.browserFrame}>
              <div className={styles.browserHeader}>
                <div className={styles.browserDots}>
                  <span style={{ backgroundColor: '#ff5f56' }}></span>
                  <span style={{ backgroundColor: '#ffbd2e' }}></span>
                  <span style={{ backgroundColor: '#27ca40' }}></span>
                </div>
                <div className={styles.browserUrl}>
                  🔒 vibex.app{displayPage?.route || '/preview'}
                </div>
              </div>
              <div className={styles.browserContent}>
                {/* 实时预览区域 */}
                <div className={styles.previewContainer}>
                  {displayPage?.components?.map((comp: UIComponent) => (
                    <InteractiveRenderer
                      key={comp.id}
                      component={comp}
                      componentState={componentState}
                      onStateChange={handleStateChange}
                      onComponentClick={handleComponentClick}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* 聊天面板 */}
        {chatOpen && (
          <aside className={styles.chatPanel}>
            <div className={styles.chatHeader}>
              <div className={styles.chatTitle}>
                <span className={styles.chatIcon}>🤖</span>
                <span>AI 助手</span>
              </div>
              <div className={styles.chatActions}>
                <button
                  className={styles.chatActionBtn}
                  onClick={clearHistory}
                  title="清除历史"
                >
                  🗑️
                </button>
                <button
                  className={styles.chatActionBtn}
                  onClick={() => setChatOpen(false)}
                  title="关闭面板"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={styles.chatMessages}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.chatMessage} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                >
                  <div className={styles.messageAvatar}>
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageText}>{msg.content}</div>
                    <div className={styles.messageTime}>
                      {msg.timestamp.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* 流式响应显示 */}
              {isStreaming && streamingContent && (
                <div
                  className={`${styles.chatMessage} ${styles.assistantMessage}`}
                >
                  <div className={styles.messageAvatar}>🤖</div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageText}>
                      {streamingContent}
                      <span className={styles.cursor}>▊</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 加载状态 */}
              {isStreaming && !streamingContent && (
                <div
                  className={`${styles.chatMessage} ${styles.assistantMessage}`}
                >
                  <div className={styles.messageAvatar}>🤖</div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageText}>
                      <span className={styles.typingIndicator}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className={styles.chatInputArea}>
              <textarea
                ref={inputRef}
                className={styles.chatInput}
                placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                rows={1}
              />
              <button
                className={styles.sendButton}
                onClick={sendMessage}
                disabled={!inputValue.trim() || isStreaming}
              >
                {isStreaming ? '⏳' : '➤'}
              </button>
            </div>
          </aside>
        )}

        {/* 版本对比模态框 */}
        {compareModalOpen && compareVersions && (
          <div
            className={styles.compareModal}
            onClick={() => setCompareModalOpen(false)}
          >
            <div
              className={styles.compareModalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.compareModalHeader}>
                <h2 className={styles.compareModalTitle}>🔍 版本对比</h2>
                <button
                  className={styles.compareModalClose}
                  onClick={() => setCompareModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className={styles.compareVersions}>
                <div className={styles.compareVersionPanel}>
                  <div className={styles.compareVersionHeader}>
                    <span className={styles.compareVersionLabel}>旧版本</span>
                    <span className={styles.compareVersionName}>
                      {compareVersions.left.name}
                    </span>
                    <span className={styles.compareVersionTime}>
                      {new Date(compareVersions.left.createdAt).toLocaleString(
                        'zh-CN'
                      )}
                    </span>
                  </div>
                  <div className={styles.compareVersionContent}>
                    {compareVersions.left.content ? (
                      <PreviewContent content={compareVersions.left.content} />
                    ) : (
                      <div className={styles.compareEmpty}>无内容</div>
                    )}
                  </div>
                </div>

                <div className={styles.compareDivider}>
                  <span>VS</span>
                </div>

                <div className={styles.compareVersionPanel}>
                  <div className={styles.compareVersionHeader}>
                    <span className={styles.compareVersionLabel}>新版本</span>
                    <span className={styles.compareVersionName}>
                      {compareVersions.right.name}
                    </span>
                    <span className={styles.compareVersionTime}>
                      {new Date(compareVersions.right.createdAt).toLocaleString(
                        'zh-CN'
                      )}
                    </span>
                  </div>
                  <div className={styles.compareVersionContent}>
                    {compareVersions.right.content ? (
                      <PreviewContent content={compareVersions.right.content} />
                    ) : (
                      <div className={styles.compareEmpty}>无内容</div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.compareModalFooter}>
                <button
                  className={styles.compareRollbackBtn}
                  onClick={() => {
                    handleRollback(compareVersions.left);
                    setCompareModalOpen(false);
                  }}
                >
                  ↩️ 回滚到旧版本
                </button>
                <button
                  className={styles.compareCloseBtn}
                  onClick={() => setCompareModalOpen(false)}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrototypeEditor() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
