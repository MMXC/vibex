# 首页模块化重构分析报告

**项目**: vibex-homepage-modular-refactor  
**分析师**: Analyst Agent  
**日期**: 2026-03-15  
**状态**: 分析完成

---

## 1. 执行摘要

**核心发现**: 
- 首页 `page.tsx` 共 **1142 行**，CSS 文件 **1297 行**，代码臃肿
- 存在 **5 个可独立拆分的模块**，当前全部耦合在单文件中
- 空间利用率约 **75%**，存在优化空间
- 发现 **3 个潜在功能报错点**

**建议**: 按区域拆分为 5 个独立组件文件，实现模块化测试和组装

---

## 2. 首页区域划分分析

### 2.1 当前布局结构

```
┌─────────────────────────────────────────────────────────────┐
│                         NAVBAR (固定)                       │
├──────────────┬─────────────────────────────┬───────────────┤
│   SIDEBAR    │        CONTENT (60%)        │   AI PANEL    │
│    (15%)     │  ┌───────────────────────┐  │    (25%)      │
│              │  │  Preview 画布 (60%)   │  │               │
│  设计流程    │  │  - Mermaid 图表       │  │  ThinkingPanel│
│              │  │  - 节点勾选           │  │  或           │
│  ① 需求输入  │  └───────────────────────┘  │  AI 助手      │
│  ② 限界上下文│  ┌───────────────────────┐  │               │
│  ③ 领域模型  │  │  Input 录入区 (40%)  │  │               │
│  ④ 业务流程  │  │  - 需求输入框         │  │               │
│  ⑤ 项目创建  │  │  - GitHub/Figma导入   │  │               │
│              │  │  - Plan/Build 选择    │  │               │
│              │  │  - 示例按钮           │  │               │
└──────────────┴──┴───────────────────────┴──┴───────────────┘
```

### 2.2 逐区域分析表

| 区域 | 样式 | 大小 | 功能 | 空白浪费 | 问题 |
|------|------|------|------|----------|------|
| **Navbar** | ✅ 合理 | 固定 60px | ✅ 正常 | ❌ 无 | 无 |
| **Sidebar** | ✅ 合理 | 15% | ✅ 正常 | ⚠️ 底部空白 | 步骤列表下方未利用 |
| **Preview** | ✅ 合理 | 可调整 | ✅ 正常 | ⚠️ 空状态浪费 | 无需求时显示空白提示 |
| **Input** | ⚠️ 略挤 | 可调整 | ⚠️ 有问题 | ⚠️ 溢出 | 内容过多时滚动不便 |
| **AI Panel** | ⚠️ 偏宽 | 25% | ✅ 正常 | ⚠️ 消息区空白 | 初始状态利用率低 |

### 2.3 详细区域问题

#### 2.3.1 Sidebar 区域 (15%)

**代码位置**: `page.tsx` 第 710-750 行

**问题**:
```tsx
// 当前代码 - 底部空白未利用
<aside className={styles.sidebar}>
  <div>
    <div className={styles.sidebarTitle}>设计流程</div>
    <div className={styles.stepList}>
      {/* 5 个步骤 */}
    </div>
    {/* ❌ 底部无任何内容，空白浪费 */}
  </div>
</aside>
```

**优化建议**:
- 底部添加「进度统计」或「快捷操作」
- 或缩小 Sidebar 宽度至 12%

#### 2.3.2 Preview 区域 (可调整 30%-70%)

**代码位置**: `page.tsx` 第 755-880 行

**问题**:
```tsx
// 空状态时占用大量空间
{mermaidCode ? (
  <MermaidPreview ... />
) : (
  <div className={styles.previewEmpty}>
    {/* 仅显示提示文字，空间浪费 */}
  </div>
)}
```

**优化建议**:
- 空状态时显示示例图或引导
- 或默认收起 Preview，输入后再展开

#### 2.3.3 Input 区域 (可调整 30%-70%)

**代码位置**: `page.tsx` 第 885-1000 行

**问题**:
```tsx
// 内容过多，滚动体验差
<details className={styles.importOptions}>
  <summary>🐙 从 GitHub 导入项目</summary>
  {/* 展开后占用大量空间 */}
</details>
<details className={styles.importOptions}>
  <summary>🎨 从 Figma 导入设计</summary>
  {/* 展开后占用大量空间 */}
</details>
```

**优化建议**:
- GitHub/Figma 导入合并为一个「导入」按钮
- 弹窗形式展示导入选项

#### 2.3.4 AI Panel 区域 (25%)

**代码位置**: `page.tsx` 第 1010-1142 行

**问题**:
- 25% 宽度过宽，挤压 Content 空间
- 初始状态消息区空白

**优化建议**:
- 缩小至 18-20%
- 添加默认引导消息

---

## 3. 模块化拆分方案

### 3.1 当前代码结构

```
page.tsx (1142 行)
├── 类型定义 (约 50 行)
├── 常量定义 (约 50 行)
├── useIsAuthenticated Hook (约 15 行)
├── generatePreviewMermaid 函数 (约 50 行)
├── HomePage 组件 (约 977 行)
│   ├── 状态定义 (约 100 行)
│   ├── Effects (约 80 行)
│   ├── 回调函数 (约 150 行)
│   └── JSX 渲染 (约 650 行)
└── exports
```

### 3.2 拆分方案

#### 拆分为 5 个独立组件

| 组件名 | 文件路径 | 行数 | 职责 |
|--------|----------|------|------|
| `HomePageNavbar` | `components/homepage/Navbar.tsx` | ~50 | 顶部导航 |
| `HomePageSidebar` | `components/homepage/Sidebar.tsx` | ~80 | 左侧步骤导航 |
| `PreviewCanvas` | `components/homepage/PreviewCanvas.tsx` | ~200 | 预览画布 |
| `InputArea` | `components/homepage/InputArea.tsx` | ~200 | 需求录入区 |
| `AIPanel` | `components/homepage/AIPanel.tsx` | ~150 | AI 助手面板 |

#### 拆分为 3 个 Hooks

| Hook 名 | 文件路径 | 行数 | 职责 |
|---------|----------|------|------|
| `useHomeState` | `hooks/useHomeState.ts` | ~100 | 状态管理 |
| `useHomeGeneration` | `hooks/useHomeGeneration.ts` | ~80 | 生成逻辑 |
| `useHomePanel` | `hooks/useHomePanel.ts` | ~60 | 面板控制 |

#### 拆分类型和常量

| 文件 | 路径 | 行数 | 内容 |
|------|------|------|------|
| `types.ts` | `types/homepage.ts` | ~50 | 类型定义 |
| `constants.ts` | `constants/homepage.ts` | ~50 | 常量定义 |

### 3.3 组件接口设计

```tsx
// components/homepage/Navbar.tsx
interface NavbarProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

// components/homepage/Sidebar.tsx
interface SidebarProps {
  currentStep: number;
  completedStep: number;
  onStepClick: (step: number) => void;
  isStepCompleted: (step: number) => boolean;
  isStepClickable: (step: number) => boolean;
}

// components/homepage/PreviewCanvas.tsx
interface PreviewCanvasProps {
  currentStep: number;
  mermaidCode: string;
  contextMermaidCode: string;
  modelMermaidCode: string;
  flowMermaidCode: string;
  boundedContexts: BoundedContext[];
  domainModels: DomainModel[];
  businessFlow: BusinessFlow | null;
  selectedNodes: Set<string>;
  onNodeToggle: (nodeId: string) => void;
  panelSizes: number[];
  onPanelResize: (sizes: number[]) => void;
  maximizedPanel: string | null;
  minimizedPanel: string | null;
  onMaximize: (panelId: string) => void;
  onMinimize: (panelId: string) => void;
}

// components/homepage/InputArea.tsx
interface InputAreaProps {
  currentStep: number;
  requirementText: string;
  onRequirementChange: (text: string) => void;
  onGenerate: () => void;
  onGenerateDomainModel: () => void;
  onGenerateBusinessFlow: () => void;
  onCreateProject: () => void;
  isGenerating: boolean;
  boundedContexts: BoundedContext[];
  domainModels: DomainModel[];
  businessFlow: BusinessFlow | null;
}

// components/homepage/AIPanel.tsx
interface AIPanelProps {
  messages: Array<{ role: string; content: string }>;
  onSendMessage: (message: string) => void;
  // ThinkingPanel props
  thinkingMessages: string[];
  streamStatus: string;
  onAbort: () => void;
  onRetry: () => void;
}
```

### 3.4 重构后文件结构

```
src/
├── app/
│   └── page.tsx                    # 主页面 (约 150 行)
├── components/
│   └── homepage/
│       ├── index.ts                # 统一导出
│       ├── Navbar.tsx              # 顶部导航
│       ├── Sidebar.tsx             # 左侧步骤
│       ├── PreviewCanvas.tsx       # 预览画布
│       ├── InputArea.tsx           # 需求录入
│       └── AIPanel.tsx             # AI 面板
├── hooks/
│   ├── useHomeState.ts             # 状态管理
│   ├── useHomeGeneration.ts        # 生成逻辑
│   └── useHomePanel.ts             # 面板控制
├── types/
│   └── homepage.ts                 # 类型定义
└── constants/
    └── homepage.ts                 # 常量定义
```

### 3.5 测试策略

| 测试类型 | 文件 | 覆盖目标 |
|----------|------|----------|
| 单元测试 | `__tests__/components/homepage/*.test.tsx` | 各组件独立测试 |
| 集成测试 | `__tests__/integration/homepage.test.tsx` | 组件组合测试 |
| E2E 测试 | `tests/e2e/homepage.spec.ts` | 完整流程测试 |

---

## 4. 空间利用优化

### 4.1 空白区域识别

| 区域 | 空白类型 | 占比 | 优化建议 |
|------|----------|------|----------|
| Sidebar 底部 | 持续空白 | 约 30% | 添加进度统计或快捷操作 |
| Preview 空状态 | 条件空白 | 约 100% | 显示示例图或默认收起 |
| AI Panel 初始 | 条件空白 | 约 60% | 添加引导消息 |
| Input 溢出 | 动态空白 | - | 弹窗化导入选项 |

### 4.2 优化方案

#### 方案 A: Sidebar 底部利用

```tsx
// 在步骤列表下方添加
<div className={styles.sidebarFooter}>
  <div className={styles.progress}>
    <div className={styles.progressBar} style={{ width: `${completedStep * 20}%` }} />
  </div>
  <div className={styles.progressText}>
    已完成 {completedStep}/5 步
  </div>
</div>
```

#### 方案 B: Preview 空状态优化

```tsx
// 显示示例图而非空白提示
{!mermaidCode && (
  <div className={styles.previewExample}>
    <img src="/images/example-flow.png" alt="示例流程图" />
    <p>输入需求后，AI 将生成类似的设计图</p>
  </div>
)}
```

#### 方案 C: 布局比例调整

```
当前: Sidebar 15% + Content 60% + AI Panel 25%
建议: Sidebar 12% + Content 68% + AI Panel 20%
```

---

## 5. 功能报错检查

### 5.1 潜在报错点

| # | 报错点 | 位置 | 风险等级 | 原因 | 修复建议 |
|---|--------|------|----------|------|----------|
| 1 | `localStorage` SSR 问题 | 第 210-230 行 | 🔴 高 | 服务端渲染时 `window` 未定义 | 使用 `typeof window !== 'undefined'` 判断 |
| 2 | `Set` 初始化问题 | 第 205 行 | 🟡 中 | SSR 时 localStorage 不可用 | 已有 try-catch，但仍可能返回空 Set |
| 3 | API 调用失败 | 第 380-420 行 | 🟡 中 | 网络问题或 API 错误 | 已有 try-catch，但错误提示不够友好 |

### 5.2 详细分析

#### 5.2.1 localStorage SSR 问题

**问题代码**:
```tsx
// 第 210-230 行
const [panelSizes, setPanelSizes] = useState<number[]>([60, 40]);

useEffect(() => {
  const saved = localStorage.getItem('vibex-panel-sizes');
  // ...
}, []);
```

**修复方案**:
```tsx
// 使用自定义 Hook 封装
const [panelSizes, setPanelSizes] = useLocalStorage('vibex-panel-sizes', [60, 40]);

// hooks/useLocalStorage.ts
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  // ...
}
```

#### 5.2.2 API 错误处理

**问题**: 当前错误仅打印到控制台，用户看不到

**修复方案**:
```tsx
// 添加全局错误提示
const [errorToast, setErrorToast] = useState<string | null>(null);

// 在 API 调用失败时
catch (err) {
  console.error('生成限界上下文失败:', err);
  setErrorToast(err instanceof Error ? err.message : '生成失败，请重试');
}

// 在页面显示 Toast
{errorToast && (
  <div className={styles.errorToast}>
    {errorToast}
    <button onClick={() => setErrorToast(null)}>✕</button>
  </div>
)}
```

### 5.3 功能检查清单

| 功能 | 状态 | 测试方法 |
|------|------|----------|
| 步骤切换 | ✅ 正常 | 点击步骤项 |
| 需求生成 | ⚠️ 依赖 API | 输入需求后点击生成 |
| GitHub 导入 | ⚠️ 待验证 | 展开 GitHub 导入 |
| Figma 导入 | ⚠️ 待验证 | 展开 Figma 导入 |
| Plan/Build 切换 | ✅ 正常 | 点击按钮切换 |
| 示例需求 | ✅ 正常 | 点击示例按钮 |
| AI 对话 | ⚠️ 模拟数据 | 输入问题发送 |
| 节点勾选 | ✅ 正常 | 勾选限界上下文/领域模型 |
| 面板最大化 | ✅ 正常 | 双击面板标题 |
| 面板最小化 | ✅ 正常 | 点击最小化按钮 |

---

## 6. 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 拆分后状态管理复杂化 | 中 | 高 | 使用 Context 或统一 Hook |
| 样式冲突 | 低 | 中 | 使用 CSS Modules 独立作用域 |
| 测试覆盖不足 | 中 | 中 | 先补充测试再重构 |
| 性能回归 | 低 | 低 | React.memo + useMemo |

---

## 7. 实施建议

### Phase 1: 准备阶段 (0.5 天)
- [ ] 补充单元测试覆盖
- [ ] 创建目标文件结构
- [ ] 定义组件接口

### Phase 2: 拆分阶段 (1.5 天)
- [ ] 拆分 Navbar 组件
- [ ] 拆分 Sidebar 组件
- [ ] 拆分 PreviewCanvas 组件
- [ ] 拆分 InputArea 组件
- [ ] 拆分 AIPanel 组件

### Phase 3: 优化阶段 (1 天)
- [ ] 抽取 Hooks
- [ ] 优化空白区域
- [ ] 修复潜在报错
- [ ] 集成测试验证

---

## 8. 验收标准

### 功能验收
- [ ] 所有现有功能正常工作
- [ ] 无 SSR 水合错误
- [ ] API 错误有友好提示

### 代码质量
- [ ] page.tsx 行数 < 200
- [ ] 单个组件行数 < 250
- [ ] 测试覆盖率 > 70%

### 空间利用
- [ ] 无明显空白浪费
- [ ] 单页模式充分利用空间

---

*分析完成时间: 2026-03-15 01:00*  
*Analyst Agent*