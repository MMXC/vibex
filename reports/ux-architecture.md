# VibeX UX 改进 - 技术架构方案

**版本**: 1.0  
**创建时间**: 2026-03-01  
**作者**: Analyst Agent

---

## 一、架构概览

### 1.1 设计原则

| 原则 | 说明 |
|------|------|
| 渐进式增强 | 核心功能在 JS 禁用时可降级 |
| 组件复用 | 所有 UI 组件可跨页面复用 |
| 性能优先 | 首屏 < 3s，交互响应 < 100ms |
| 可访问性 | WCAG 2.1 AA 合规 |
| 移动优先 | 响应式设计，触摸优化 |

### 1.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 框架 | Next.js 14+ (App Router) | SSR/SSG 支持 |
| 语言 | TypeScript 5+ | 类型安全 |
| 样式 | Tailwind CSS | 原子化 CSS |
| 状态 | React Context + SWR | 轻量级状态管理 |
| 测试 | Jest + Playwright | 单元测试 + E2E |
| 构建 | Turbopack | 快速构建 |

---

## 二、前端组件架构

### 2.1 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证相关页面
│   │   ├── login/
│   │   └── register/
│   ├── (main)/                   # 主应用页面
│   │   ├── chat/
│   │   ├── projects/
│   │   └── settings/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                   # 组件库
│   ├── ui/                       # 基础 UI 组件
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Card/
│   │   └── index.ts
│   │
│   ├── feedback/                 # 反馈组件 (P0)
│   │   ├── Skeleton/
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Skeleton.test.tsx
│   │   │   └── variants.ts
│   │   ├── Progress/
│   │   ├── Toast/
│   │   ├── Spinner/
│   │   └── index.ts
│   │
│   ├── navigation/               # 导航组件 (P0)
│   │   ├── Stepper/
│   │   │   ├── Stepper.tsx
│   │   │   ├── Stepper.test.tsx
│   │   │   ├── StepperStep.tsx
│   │   │   └── types.ts
│   │   ├── Breadcrumb/
│   │   ├── Tabs/
│   │   └── index.ts
│   │
│   ├── input/                    # 输入组件 (P1)
│   │   ├── GuidedInput/
│   │   │   ├── GuidedInput.tsx
│   │   │   ├── GuidedInput.test.tsx
│   │   │   ├── examples.ts
│   │   │   └── hooks.ts
│   │   ├── FileUpload/
│   │   ├── NodeSelector/
│   │   ├── ClarificationDialog/
│   │   └── index.ts
│   │
│   ├── error/                    # 错误处理 (P0)
│   │   ├── ErrorBoundary/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ErrorBoundary.test.tsx
│   │   │   └── ErrorFallback.tsx
│   │   ├── ErrorPage/
│   │   └── index.ts
│   │
│   └── layout/                   # 布局组件
│       ├── Header/
│       ├── Sidebar/
│       ├── MobileNav/
│       └── index.ts
│
├── hooks/                        # 自定义 Hooks
│   ├── useLoading.ts
│   ├── useToast.ts
│   ├── useUndo.ts
│   ├── useMediaQuery.ts
│   └── index.ts
│
├── contexts/                     # React Context
│   ├── AppContext.tsx
│   ├── ThemeContext.tsx
│   ├── ToastContext.tsx
│   └── index.ts
│
├── services/                     # API 服务
│   ├── api.ts
│   ├── chat.ts
│   └── project.ts
│
├── utils/                        # 工具函数
│   ├── cn.ts                     # classnames
│   ├── debounce.ts
│   ├── format.ts
│   └── validation.ts
│
└── types/                        # 类型定义
    ├── api.ts
    ├── components.ts
    └── global.d.ts
```

### 2.2 组件分层

```
┌─────────────────────────────────────────────────────────────┐
│                        Page Layer                            │
│  (app/page.tsx, app/chat/page.tsx, etc.)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Feature Components                      │
│  (ChatInterface, ProjectManager, NodeEditor)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       UI Components                          │
│  (feedback/*, navigation/*, input/*, error/*)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Base Components                        │
│  (Button, Input, Card, Spinner)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、状态管理方案

### 3.1 状态分类

| 状态类型 | 管理方案 | 示例 |
|----------|----------|------|
| 服务端状态 | SWR | 用户数据、项目列表、聊天记录 |
| 全局 UI 状态 | React Context | 主题、Toast、加载状态 |
| 表单状态 | React Hook Form | 输入表单 |
| 组件局部状态 | useState | 下拉展开、当前步骤 |

### 3.2 Context 设计

```typescript
// contexts/AppContext.tsx
interface AppContextValue {
  // 全局加载状态
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // 当前流程步骤
  currentStep: number;
  setCurrentStep: (step: number) => void;
  
  // 撤销栈
  undoStack: Action[];
  pushUndo: (action: Action) => void;
  undo: () => void;
}

// contexts/ToastContext.tsx
interface ToastContextValue {
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  dismissToast: (id: string) => void;
}
```

### 3.3 SWR 配置

```typescript
// services/api.ts
import useSWR from 'swr';

// 用户数据
export function useUser() {
  return useSWR<User>('/api/user', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}

// 项目列表
export function useProjects() {
  return useSWR<Project[]>('/api/projects', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 30000,
  });
}

// 聊天记录 (实时更新)
export function useChatMessages(projectId: string) {
  return useSWR<Message[]>(`/api/chat/${projectId}`, fetcher, {
    refreshInterval: 5000,
    revalidateOnReconnect: true,
  });
}
```

---

## 四、响应式布局策略

### 4.1 断点系统

```typescript
// utils/breakpoints.ts
export const breakpoints = {
  sm: '640px',   // 手机横屏
  md: '768px',   // 平板竖屏
  lg: '1024px',  // 平板横屏/小笔记本
  xl: '1280px',  // 桌面
  '2xl': '1536px', // 大屏
} as const;

// hooks/useMediaQuery.ts
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  
  return matches;
}
```

### 4.2 响应式组件模式

```tsx
// components/layout/Header.tsx
export function Header() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        {isMobile ? (
          <MobileNav />
        ) : (
          <DesktopNav />
        )}
      </div>
    </header>
  );
}
```

### 4.3 移动端适配要点

| 要点 | 实现 |
|------|------|
| 触摸目标 | 最小 44x44px |
| 字体缩放 | 使用 rem 单位 |
| 避免横向滚动 | overflow-x-hidden |
| 安全区域 | padding-bottom: env(safe-area-inset-bottom) |
| 触摸反馈 | active:scale-95 过渡效果 |

---

## 五、性能优化方案

### 5.1 代码分割

```typescript
// 动态导入大型组件
import dynamic from 'next/dynamic';

const NodeEditor = dynamic(
  () => import('@/components/NodeEditor'),
  { 
    loading: () => <Skeleton height={400} />,
    ssr: false 
  }
);

const ChatInterface = dynamic(
  () => import('@/components/ChatInterface'),
  { 
    loading: () => <ChatSkeleton />
  }
);
```

### 5.2 虚拟列表

```typescript
// 使用 @tanstack/react-virtual 处理大量节点
import { useVirtualizer } from '@tanstack/react-virtual';

function NodeList({ nodes }: { nodes: Node[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(item => (
          <NodeItem 
            key={nodes[item.index].id}
            node={nodes[item.index]}
            style={{ transform: `translateY(${item.start}px)` }}
          />
        ))}
      </div>
    </div>
  );
}
```

### 5.3 防抖与节流

```typescript
// utils/debounce.ts
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// 使用
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    fetchSearchResults(query);
  }, 300),
  []
);
```

### 5.4 骨架屏策略

```tsx
// components/feedback/Skeleton/Skeleton.tsx
interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function Skeleton({ 
  variant = 'rectangular',
  width,
  height,
  className 
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted rounded',
        variant === 'text' && 'h-4 w-full rounded',
        variant === 'circular' && 'rounded-full',
        className
      )}
      style={{ width, height }}
    />
  );
}

// 预设骨架屏
export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton height={60} className="w-3/4" />
      <Skeleton height={80} className="w-full" />
      <Skeleton height={40} className="w-1/2" />
    </div>
  );
}
```

---

## 六、可访问性方案

### 6.1 ARIA 属性

```tsx
// 步骤指示器
<nav aria-label="进度步骤">
  <ol role="list" className="flex items-center">
    {steps.map((step, index) => (
      <li
        key={step.id}
        aria-current={currentStep === index ? 'step' : undefined}
        className={cn(
          currentStep === index && 'font-semibold text-primary'
        )}
      >
        <span className="sr-only">
          {currentStep === index ? '当前步骤: ' : ''}
          步骤 {index + 1}: {step.title}
        </span>
        {step.title}
      </li>
    ))}
  </ol>
</nav>

// 加载状态
<div role="status" aria-live="polite">
  <Spinner />
  <span className="sr-only">加载中...</span>
</div>

// 错误提示
<div role="alert" aria-live="assertive">
  <p>{errorMessage}</p>
</div>
```

### 6.2 键盘导航

```tsx
// 可聚焦组件
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  onClick={handleClick}
>
  {children}
</div>

// 跳过链接
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-50"
>
  跳到主要内容
</a>
```

### 6.3 颜色对比度

```css
/* 确保文本对比度 ≥ 4.5:1 */
:root {
  --foreground: #1a1a1a;      /* 与背景对比度 16:1 */
  --background: #ffffff;
  --muted-foreground: #6b7280; /* 与背景对比度 5:1 */
  --primary: #2563eb;          /* 与白色对比度 4.5:1 */
  --destructive: #dc2626;      /* 与白色对比度 5:1 */
}
```

---

## 七、测试策略

### 7.1 单元测试 (Jest)

```typescript
// components/feedback/Toast/Toast.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renders success message', () => {
    render(<Toast message="操作成功" type="success" />);
    expect(screen.getByText('操作成功')).toBeInTheDocument();
  });
  
  it('auto-dismisses after duration', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<Toast message="测试" type="success" onDismiss={onDismiss} />);
    
    jest.advanceTimersByTime(3000);
    expect(onDismiss).toHaveBeenCalled();
  });
});
```

### 7.2 E2E 测试 (Playwright)

```typescript
// e2e/chat-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete chat flow', async ({ page }) => {
  await page.goto('/');
  
  // 检查加载状态
  await expect(page.getByRole('status')).toBeVisible();
  
  // 等待页面加载
  await expect(page.getByPlaceholder('描述你的需求')).toBeVisible();
  
  // 输入需求
  await page.getByPlaceholder('描述你的需求').fill('创建一个登录页面');
  await page.getByRole('button', { name: '发送' }).click();
  
  // 检查进度指示器
  await expect(page.getByRole('progressbar')).toBeVisible();
  
  // 等待响应
  await expect(page.getByText('登录页面')).toBeVisible({ timeout: 30000 });
});
```

---

## 八、部署架构

### 8.1 构建产物

```
out/
├── _next/
│   ├── static/
│   │   ├── chunks/         # 代码分割块
│   │   └── css/            # CSS 文件
│   └── ...
├── index.html
├── chat/
│   └── index.html
└── ...
```

### 8.2 CDN 配置

```javascript
// next.config.ts
const config = {
  output: 'export',
  images: { unoptimized: true },
  assetPrefix: process.env.CDN_URL || '',
};
```

---

## 九、风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 现有代码耦合 | 渐进式重构，保持 API 兼容 |
| 性能回归 | 性能监控，CI 集成 Lighthouse |
| 移动端兼容 | 真机测试，BrowserStack |
| 可访问性合规 | axe-core 自动化检测 |

---

**产出物验证**:
```bash
test -f reports/ux-architecture.md
```

---

*创建时间: 2026-03-01*  
*作者: Analyst Agent*