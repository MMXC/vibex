# 首页 ThinkingPanel 集成需求分析报告

**项目**: vibex-homepage-thinking-panel
**日期**: 2026-03-13
**分析师**: Analyst Agent

---

## 执行摘要

**问题**：`useDDDStream` Hook 使用相对路径 `/api/ddd/bounded-context/stream`，导致请求发到前端域名而非后端 API。**ThinkingPanel** 应集成到首页实现单页五步流程。**推荐修改 useDDDStream 使用环境变量配置的 baseURL**，将 ThinkingPanel 从 `/confirm` 迁移到首页。

---

## 1. 问题诊断

### 1.1 API URL 问题

**当前代码** (`useDDDStream.ts`):
```typescript
const response = await fetch('/api/ddd/bounded-context/stream', {
  method: 'POST',
  // ...
})
```

**问题**：
- 相对路径 `/api/ddd/bounded-context/stream`
- 前端部署在 `vibex-app.pages.dev`
- 请求会发到 `vibex-app.pages.dev/api/ddd/bounded-context/stream`
- 后端 API 在 `api.vibex.top`

**环境变量配置**：
```
# .env.development
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1

# .env.production
NEXT_PUBLIC_API_BASE_URL=https://api.vibex.top/api/v1
```

**正确 URL 应为**:
- 开发环境: `http://localhost:3001/api/v1/ddd/bounded-context/stream`
- 生产环境: `https://api.vibex.top/api/v1/ddd/bounded-context/stream`

### 1.2 ThinkingPanel 集成位置问题

**当前状态**:
| 页面 | ThinkingPanel | 状态 |
|------|---------------|------|
| `/confirm` | ✅ 已集成 | 正确位置？ |
| `/` (首页) | ❌ 未集成 | **应该是这里** |

**用户需求**:
> 首页完成全流程（需求输入→限界上下文→领域模型→业务流程→项目创建）

**分析**:
- 首页已实现五步流程框架
- ThinkingPanel 应作为右侧面板
- 点击"开始生成"后在首页内展示 AI 思考过程

---

## 2. 首页现有架构

### 2.1 当前首页结构

```typescript
// app/page.tsx 结构
export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* 背景特效 */}
      <ParticleBackground />
      
      {/* 导航 */}
      <Navbar />
      
      {/* Hero 区域 */}
      <HeroSection />
      
      {/* 差异化展示 */}
      <FeatureCards />
      
      {/* 三栏布局 */}
      <div className={styles.mainContent}>
        {/* 左栏：流程指示器 */}
        <ProcessIndicator steps={STEPS} />
        
        {/* 中栏：输入/预览区 */}
        <MainContent>
          {currentStep === 'input' && <RequirementInput />}
          {currentStep !== 'input' && <MermaidPreview />}
        </MainContent>
        
        {/* 右栏：AI 助手 */}
        <AIPanel />
      </div>
    </div>
  );
}
```

### 2.2 五步流程定义

```typescript
const STEPS = [
  { id: 1, label: '需求输入' },
  { id: 2, label: '限界上下文' },
  { id: 3, label: '领域模型' },
  { id: 4, label: '业务流程' },
  { id: 5, label: '项目创建' },
];
```

### 2.3 首页状态管理

```typescript
// 首页内部状态
const [currentStep, setCurrentStep] = useState(1);
const [requirementText, setRequirementText] = useState('');
const [boundedContexts, setBoundedContexts] = useState([]);
const [domainModels, setDomainModels] = useState([]);
const [businessFlow, setBusinessFlow] = useState(null);
const [mermaidCode, setMermaidCode] = useState('');
```

---

## 3. 集成方案

### 3.1 方案 A：首页集成 ThinkingPanel（推荐）

```
首页布局调整:
┌─────────────────────────────────────────────────────────────────┐
│  导航栏                                                         │
├─────────────────────────────────────────────────────────────────┤
│  Hero 区域（精简）                                              │
│  "协作式设计，你主导每一步"                                      │
├──────────┬───────────────────────────────────┬──────────────────┤
│  流程指示器 │      输入/预览区                 │  ThinkingPanel  │
│   (15%)   │        (60%)                    │     (25%)       │
│           │                                  │                 │
│  Step 1-5 │  需求输入 / Mermaid 图           │  AI 思考过程     │
│           │                                  │  上下文卡片      │
│           │                                  │  进度条          │
└──────────┴───────────────────────────────────┴──────────────────┘
```

**优点**:
- ✅ 单页完成全流程
- ✅ 无页面跳转
- ✅ 用户体验流畅

### 3.2 方案 B：/confirm 保持，首页仅入口

```
首页 → 点击"开始生成" → 跳转到 /confirm → ThinkingPanel 在 /confirm
```

**优点**:
- ✅ 改动最小
- ✅ 职责分离

**缺点**:
- ❌ 需要页面跳转
- ❌ 用户体验不连贯

### 3.3 推荐方案

**推荐方案 A**，理由：
1. 符合用户需求（首页完成全流程）
2. 与 V0.dev、Bolt.new 竞品体验一致
3. 减少页面跳转，提高转化率

---

## 4. API URL 修复方案

### 4.1 修改 useDDDStream.ts

```typescript
// hooks/useDDDStream.ts - 修复后
export function useDDDStream(): UseDDDStreamReturn {
  // 获取 API baseURL
  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api/v1';
  
  // 构建完整 URL
  const streamUrl = `${baseURL}/ddd/bounded-context/stream`;
  
  const generateContexts = useCallback((requirementText: string) => {
    // ...
    const fetchSSE = async () => {
      try {
        const response = await fetch(streamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requirementText }),
          signal: abortControllerRef.current?.signal,
        });
        // ...
      } catch (error: any) {
        // ...
      }
    };
    fetchSSE();
  }, [streamUrl]);
  
  // ...
}
```

### 4.2 环境变量配置验证

```typescript
// 在 useDDDStream.ts 开头添加验证
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn('NEXT_PUBLIC_API_BASE_URL 未设置，使用默认值');
}

// 构建完整 URL
const getStreamUrl = () => {
  const base = API_BASE_URL || 'https://api.vibex.top/api/v1';
  return `${base}/ddd/bounded-context/stream`;
};
```

### 4.3 CORS 配置

**后端需要配置 CORS**:
```typescript
// backend CORS 配置
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'https://vibex-app.pages.dev',
    'https://vibex.top',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Type'],
  credentials: true,
}));
```

---

## 5. ThinkingPanel 集成实现

### 5.1 首页集成代码

```typescript
// app/page.tsx - 集成后
import { ThinkingPanel } from '@/components/ui/ThinkingPanel';
import { useDDDStream } from '@/hooks/useDDDStream';

export default function HomePage() {
  // 使用 DDD Stream Hook
  const {
    thinkingMessages,
    contexts,
    mermaidCode: streamMermaidCode,
    status,
    errorMessage,
    generateContexts,
    abort,
    reset,
  } = useDDDStream();
  
  // 当前步骤
  const [currentStep, setCurrentStep] = useState(1);
  
  // 点击"开始生成"
  const handleGenerate = () => {
    if (!requirementText.trim()) return;
    generateContexts(requirementText);
  };
  
  // 完成时进入下一步
  useEffect(() => {
    if (status === 'done' && contexts.length > 0) {
      setBoundedContexts(contexts);
      setMermaidCode(streamMermaidCode);
      setCurrentStep(2); // 进入限界上下文步骤
    }
  }, [status, contexts, streamMermaidCode]);
  
  return (
    <div className={styles.page}>
      {/* ... */}
      
      <div className={styles.mainContent}>
        <ProcessIndicator currentStep={currentStep} />
        
        <MainContent>
          {currentStep === 1 && status === 'idle' && (
            <RequirementInput 
              value={requirementText}
              onChange={setRequirementText}
              onSubmit={handleGenerate}
            />
          )}
          
          {currentStep === 1 && status !== 'idle' && (
            <MermaidPreview code={streamMermaidCode} />
          )}
          
          {currentStep > 1 && (
            <MermaidPreview code={mermaidCode} />
          )}
        </MainContent>
        
        {/* 替换 AI Panel 为 ThinkingPanel */}
        <ThinkingPanel
          thinkingMessages={thinkingMessages}
          contexts={contexts}
          mermaidCode={streamMermaidCode}
          status={status}
          errorMessage={errorMessage}
          onAbort={abort}
          onRetry={handleGenerate}
        />
      </div>
    </div>
  );
}
```

### 5.2 状态同步策略

```
useDDDStream (SSE)          首页状态
─────────────────────────────────────────────
thinkingMessages    →       ThinkingPanel 显示
contexts            →       setBoundedContexts()
mermaidCode         →       setMermaidCode()
status === 'done'   →       setCurrentStep(2)
```

---

## 6. 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| CORS 阻止请求 | 中 | 高 | 后端配置 CORS |
| 环境变量未设置 | 低 | 中 | 添加默认值 |
| SSE 连接不稳定 | 中 | 中 | 添加重连机制 |
| ThinkingPanel 样式冲突 | 低 | 低 | 使用 CSS Modules |

---

## 7. 验收标准

### 7.1 API URL 修复验收

```typescript
describe('useDDDStream API URL', () => {
  it('使用环境变量配置的 baseURL', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.vibex.top/api/v1';
    const { result } = renderHook(() => useDDDStream());
    
    // 触发生成
    act(() => result.current.generateContexts('测试需求'));
    
    // 验证请求 URL
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.vibex.top/api/v1/ddd/bounded-context/stream',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('无环境变量时使用默认值', () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    const { result } = renderHook(() => useDDDStream());
    
    act(() => result.current.generateContexts('测试需求'));
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.vibex.top/api/v1/ddd/bounded-context/stream',
      expect.any(Object)
    );
  });
});
```

### 7.2 ThinkingPanel 集成验收

```typescript
describe('首页 ThinkingPanel 集成', () => {
  it('首页显示 ThinkingPanel', () => {
    render(<HomePage />);
    expect(screen.getByText(/AI 思考过程/)).toBeInTheDocument();
  });

  it('点击生成后显示思考过程', async () => {
    render(<HomePage />);
    
    // 输入需求
    fireEvent.change(screen.getByPlaceholderText(/描述您的产品需求/), {
      target: { value: '测试需求' },
    });
    
    // 点击生成
    fireEvent.click(screen.getByText(/开始生成/));
    
    // 验证 ThinkingPanel 显示思考步骤
    await waitFor(() => {
      expect(screen.getByText(/分析需求/)).toBeInTheDocument();
    });
  });

  it('完成后进入下一步', async () => {
    render(<HomePage />);
    
    // 模拟完成
    // ...
    
    await waitFor(() => {
      expect(screen.getByText(/限界上下文/)).toHaveClass('active');
    });
  });
});
```

---

## 8. 工作量估算

| 阶段 | 内容 | 工时 |
|------|------|------|
| 1 | API URL 修复 | 0.5h |
| 2 | ThinkingPanel 迁移到首页 | 2h |
| 3 | 首页状态管理调整 | 1h |
| 4 | 测试验证 | 1h |
| **总计** | | **4.5h** |

---

## 9. 下一步行动

1. **Dev**: 修复 API URL，迁移 ThinkingPanel
2. **Backend**: 确认 CORS 配置
3. **QA**: 验收流式体验

---

**产出物**: 
- 本报告: `docs/vibex-homepage-thinking-panel/analysis.md`