# 架构设计：首页进度条与 Mermaid 渲染问题修复

**项目**: vibex-mermaid-progress-bug  
**架构师**: Architect Agent  
**日期**: 2026-03-16  
**状态**: 完成

---

## 一、执行摘要

| 问题 | 根因 | 解决方案 | 影响范围 |
|------|------|----------|----------|
| 进度条 67% | `ThinkingPanel` 硬编码 `totalSteps=3`，后端事件数不匹配 | 动态计算 + 状态优先 | 前端组件 |
| Mermaid 未渲染 | `HomePage` 同步条件过严 `streamContexts.length > 0` | 放宽条件，依赖 status | 前端页面 |

---

## 二、现有架构分析

### 2.1 技术栈

| 组件 | 技术选型 | 版本 |
|------|----------|------|
| 前端框架 | Next.js | 14.x |
| 状态管理 | React Hooks | 18.x |
| 流式通信 | SSE (Server-Sent Events) | - |
| 图表渲染 | Mermaid | 10.x |
| 后端框架 | Hono | 4.x |

### 2.2 数据流架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              SSE 数据流                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Backend (ddd.ts)                    Frontend (useDDDStream.ts)         │
│  ┌─────────────────┐                 ┌─────────────────────────────┐    │
│  │ POST /stream    │                 │ generateContexts()          │    │
│  │                 │   SSE Events    │                             │    │
│  │ send('thinking')├────────────────►│ setThinkingMessages()       │    │
│  │ send('context') │                 │ setContexts()               │    │
│  │ send('done')    │                 │ setMermaidCode()            │    │
│  │                 │                 │ setStatus('done')           │    │
│  └─────────────────┘                 └─────────────────────────────┘    │
│                                               │                          │
│                                               ▼                          │
│                                    HomePage.tsx                          │
│                                    ┌─────────────────────────────┐       │
│                                    │ useEffect (sync)            │       │
│                                    │ setBoundedContexts()        │       │
│                                    │ setContextMermaidCode()     │       │
│                                    └─────────────────────────────┘       │
│                                               │                          │
│                                               ▼                          │
│                                    ThinkingPanel.tsx                     │
│                                    ┌─────────────────────────────┐       │
│                                    │ progressPercent 计算        │       │
│                                    │ MermaidPreview 渲染         │       │
│                                    └─────────────────────────────┘       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 组件依赖关系

```mermaid
graph TD
    subgraph Frontend
        A[HomePage.tsx] --> B[useDDDStream hook]
        A --> C[ThinkingPanel.tsx]
        A --> D[MermaidPreview.tsx]
        
        B --> E[SSE Connection]
        E --> F[/ddd/bounded-context/stream]
        
        C --> G[Progress Calculation]
        C --> H[Context Cards]
        C --> D
    end
    
    subgraph Backend
        F --> I[AI Service]
        I --> J[generateJSON]
    end
    
    style A fill:#4ade80
    style C fill:#f87171
    style B fill:#60a5fa
```

---

## 三、问题详细分析

### 3.1 进度条 67% 问题

**代码位置**: `vibex-fronted/src/components/ui/ThinkingPanel.tsx`

```tsx
// 问题代码
const totalSteps = 3 // 硬编码
const currentStepIndex = displayedSteps.length > 0 
  ? Math.min(displayedSteps.length - 1, totalSteps - 1) 
  : -1
const progressPercent = currentStepIndex >= 0 
  ? Math.round(((currentStepIndex + 1) / totalSteps) * 100) 
  : 0
```

**后端发送的 thinking 事件** (`ddd.ts`):

| 条件 | 事件序列 | 数量 |
|------|----------|------|
| 有 planResult | `analyzing` → `using-plan` → `calling-ai` | 3 |
| 无 planResult | `analyzing` → `identifying-core` → `calling-ai` | 3 |

**问题根因**:
1. `stepLabels` 只定义了 `analyzing`, `identifying-core`, `calling-ai`
2. `using-plan` 事件没有对应标签，显示原始 step 名称
3. 如果后端实际发送少于 3 个事件，进度计算错误

### 3.2 Mermaid 未渲染问题

**代码位置**: `vibex-fronted/src/components/homepage/HomePage.tsx`

```tsx
// 问题代码：条件过严
useEffect(() => {
  if (streamStatus === 'done' && streamContexts.length > 0) {
    setBoundedContexts(streamContexts);
    setContextMermaidCode(streamMermaidCode);
    // ...
  }
}, [streamStatus, streamContexts, streamMermaidCode]);
```

**问题**: 如果 AI 返回空的 `boundedContexts` 但有 `mermaidCode`，图表不会渲染。

---

## 四、架构设计决策

### ADR-001: 进度条状态优先策略

**状态**: Accepted

**上下文**:
用户反馈进度条停留在 67%，产生困惑。当前实现依赖 steps 数量计算进度，但后端事件数量可能变化。

**决策**:
采用"状态优先"策略：当 `status === 'done'` 时直接显示 100%，不再依赖 steps 数量。

**理由**:
1. 用户关心的是"完成"而非精确进度
2. 避免 steps 数量不匹配导致的显示问题
3. 简化逻辑，提高可维护性

**后果**:
- 进度条在完成前最多显示 99%
- 完成时瞬间跳到 100%
- 牺牲精确进度换取稳定性

### ADR-002: Mermaid 同步条件放宽

**状态**: Accepted

**上下文**:
Mermaid 图表有时不渲染，原因是同步条件要求 `streamContexts.length > 0`。

**决策**:
移除 `streamContexts.length > 0` 条件，仅依赖 `streamStatus === 'done'`。

**理由**:
1. `mermaidCode` 与 `contexts` 是独立数据
2. 空结果时图表仍可渲染（显示默认结构）
3. 用户应始终看到生成结果

**后果**:
- 空结果时显示空图表（需优雅处理）
- 减少边界条件判断
- 提高渲染可靠性

---

## 五、技术方案

### 5.1 模块修改清单

| 文件 | 修改类型 | 优先级 |
|------|----------|--------|
| `ThinkingPanel.tsx` | 进度计算逻辑 | P0 |
| `HomePage.tsx` | 同步条件放宽 | P0 |
| `useDDDStream.ts` | 日志增强（可选） | P2 |

### 5.2 接口定义

#### 5.2.1 ThinkingPanel Props（无变更）

```tsx
export interface ThinkingPanelProps {
  thinkingMessages: ThinkingStep[]
  contexts: BoundedContext[]
  mermaidCode: string
  status: DDDStreamStatus
  errorMessage: string | null
  onAbort?: () => void
  onRetry?: () => void
  onUseDefault?: () => void
}
```

#### 5.2.2 进度计算函数（新增）

```tsx
/**
 * 计算进度百分比
 * 策略：状态优先，完成时直接返回 100%
 */
function calculateProgress(
  status: DDDStreamStatus,
  displayedSteps: ThinkingStep[],
  totalSteps: number
): number {
  // 状态优先：完成时直接返回 100%
  if (status === 'done') return 100;
  
  // 错误时重置
  if (status === 'error') return 0;
  
  // 空状态
  if (status === 'idle' || displayedSteps.length === 0) return 0;
  
  // 动态计算：最多 99%，完成时才 100%
  const progress = (displayedSteps.length / totalSteps) * 100;
  return Math.min(Math.round(progress), 99);
}
```

### 5.3 代码修改详情

#### 5.3.1 ThinkingPanel.tsx 进度计算修复

```tsx
// ==================== Progress Calculation ====================

const STEP_LABELS: Record<string, string> = {
  'analyzing': '分析需求',
  'identifying-core': '识别核心领域',
  'calling-ai': '调用 AI 分析',
  'using-plan': '基于 Plan 分析',
}

function getStepLabel(step: string): string {
  return STEP_LABELS[step] || step
}

function calculateProgress(
  status: DDDStreamStatus,
  displayedSteps: ThinkingStep[],
  totalSteps: number
): number {
  if (status === 'done') return 100
  if (status === 'error') return 0
  if (status === 'idle' || displayedSteps.length === 0) return 0
  return Math.min(Math.round((displayedSteps.length / totalSteps) * 100), 99)
}

// 在组件中使用
const totalSteps = Math.max(displayedSteps.length, 3)
const progressPercent = calculateProgress(status, displayedSteps, totalSteps)
```

#### 5.3.2 HomePage.tsx 同步条件修复

```tsx
// 修复前
useEffect(() => {
  if (streamStatus === 'done' && streamContexts.length > 0) {
    setBoundedContexts(streamContexts);
    setContextMermaidCode(streamMermaidCode);
    setCurrentStep(2);
    setCompletedStep(2);
  }
}, [streamStatus, streamContexts, streamMermaidCode]);

// 修复后
useEffect(() => {
  if (streamStatus === 'done') {
    // 放宽条件：即使 contexts 为空也同步数据
    setBoundedContexts(streamContexts);
    setContextMermaidCode(streamMermaidCode);
    // 仅在有结果时推进步骤
    if (streamContexts.length > 0 || streamMermaidCode) {
      setCurrentStep(2);
      setCompletedStep(2);
    }
  }
}, [streamStatus, streamContexts, streamMermaidCode]);
```

---

## 六、数据模型

### 6.1 ThinkingStep（无变更）

```ts
interface ThinkingStep {
  step: string
  message: string
}
```

### 6.2 DDDStreamStatus（无变更）

```ts
type DDDStreamStatus = 'idle' | 'thinking' | 'done' | 'error'
```

---

## 七、测试策略

### 7.1 测试框架

| 类型 | 框架 | 覆盖率目标 |
|------|------|------------|
| 单元测试 | Jest + React Testing Library | > 80% |
| E2E 测试 | Playwright（可选） | 关键路径 |

### 7.2 测试用例

#### 7.2.1 ThinkingPanel 进度计算测试

```tsx
describe('calculateProgress', () => {
  it('should return 100% when status is done', () => {
    expect(calculateProgress('done', [], 3)).toBe(100)
  })

  it('should return 0% when status is error', () => {
    expect(calculateProgress('error', [step1, step2], 3)).toBe(0)
  })

  it('should return 0% when status is idle', () => {
    expect(calculateProgress('idle', [], 3)).toBe(0)
  })

  it('should cap at 99% when thinking', () => {
    expect(calculateProgress('thinking', [step1, step2, step3], 3)).toBe(99)
  })

  it('should calculate progress correctly with fewer steps', () => {
    expect(calculateProgress('thinking', [step1], 3)).toBe(33)
  })
})
```

#### 7.2.2 HomePage 同步测试

```tsx
describe('HomePage SSE sync', () => {
  it('should sync mermaidCode when contexts are empty', () => {
    const { result } = renderHook(() => useHomePage())
    
    act(() => {
      // 模拟 SSE 完成，contexts 为空
      result.current.handleSSEDone({
        boundedContexts: [],
        mermaidCode: 'graph TD\n  A --> B'
      })
    })
    
    expect(result.current.contextMermaidCode).toBe('graph TD\n  A --> B')
  })
})
```

### 7.3 验收标准

| ID | 验收条件 | 验证方法 |
|----|----------|----------|
| AC1 | 生成完成后进度条显示 100% | 手动测试 + 自动化 |
| AC2 | 生成完成后 Mermaid 图表正确渲染 | 手动测试 + 自动化 |
| AC3 | 空结果时显示友好提示 | 手动测试 |
| AC4 | 错误时进度条重置为 0% | 手动测试 |
| AC5 | 单元测试覆盖率 > 80% | Jest --coverage |

---

## 八、风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 修改影响其他页面 | 低 | 中 | 完整回归测试 |
| 进度条跳跃感 | 中 | 低 | 添加动画过渡 |
| 空结果体验差 | 低 | 中 | 添加空状态提示 |

---

## 九、性能影响评估

| 修改项 | 性能影响 | 说明 |
|--------|----------|------|
| 进度计算逻辑 | 无 | 纯计算，无 I/O |
| 同步条件放宽 | 无 | 仅移除条件判断 |
| 新增 STEP_LABELS | 可忽略 | 静态对象，内存占用极小 |

---

## 十、部署建议

### 10.1 发布顺序

1. **阶段一**: 修复 ThinkingPanel 进度计算
2. **阶段二**: 修复 HomePage 同步条件
3. **阶段三**: 添加空状态 UI 优化

### 10.2 回滚策略

如果发现问题，可快速回滚单个文件：
```bash
git checkout HEAD~1 -- src/components/ui/ThinkingPanel.tsx
git checkout HEAD~1 -- src/components/homepage/HomePage.tsx
```

---

## 十一、相关文件索引

| 文件路径 | 说明 |
|----------|------|
| `vibex-fronted/src/components/ui/ThinkingPanel.tsx` | 进度条组件 |
| `vibex-fronted/src/hooks/useDDDStream.ts` | SSE Hook |
| `vibex-fronted/src/components/homepage/HomePage.tsx` | 主页面 |
| `vibex-backend/src/routes/ddd.ts` | 后端 SSE 接口 |

---

## 十二、总结

本次架构设计针对两个问题提供了明确的技术方案：

1. **进度条问题**: 采用"状态优先"策略，简化逻辑并确保正确性
2. **Mermaid 渲染问题**: 放宽同步条件，确保图表始终渲染

两个修改都是低风险、高收益的局部优化，不涉及架构重构。

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-mermaid-progress-bug/architecture.md`  
**架构师**: Architect Agent  
**日期**: 2026-03-16