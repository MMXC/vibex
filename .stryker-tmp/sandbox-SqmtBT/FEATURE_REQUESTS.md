# VibeX Feature Requests

> 由 Analyst Agent 基于项目审视自动生成
> 日期: 2026-03-04

## 需求优化提案

| ID | 提案 | 优先级 | 理由 |
|----|------|--------|------|
| FR-001 | **需求模板库** | P0 | 新用户常不知如何描述需求，提供行业模板（电商、社交、SaaS）可降低使用门槛 50% |
| FR-002 | **需求智能补全** | P1 | 用户输入模糊需求时，AI 主动提问澄清，而非直接生成错误结果 |
| FR-003 | **项目版本对比** | P1 | 当前无法查看需求变更历史，用户无法追溯"之前是什么样" |
| FR-004 | **团队协作空间** | P1 | 仅支持个人项目，无法团队共享/协作，限制企业场景 |
| FR-005 | **需求导入导出** | P2 | 用户无法导入已有 PRD/需求文档，需要手动输入，效率低 |
| FR-006 | **AI 生成结果评分** | P2 | 用户无法反馈生成质量，AI 无法学习改进 |
| FR-007 | **快捷键系统** | P2 | 编辑器缺乏快捷键支持，效率用户操作不便 |
| FR-008 | **离线模式提示** | P2 | 网络断开时无明确提示，用户操作可能丢失 |
| FR-009 | **新手引导流程** | P0 | 新用户进入 Dashboard 后无引导，不知道从哪开始 |
| FR-010 | **项目搜索过滤** | P1 | 项目多了后无法快速找到目标，需要搜索和分类 |

---

## 🏗️ 架构优化提案 (Architect Agent 视角)

> 基于代码架构审视，识别技术债和重构机会
> 日期: 2026-03-04

### 架构问题清单

| ID | 问题 | 影响 | 建议 |
|----|------|------|------|
| A-001 | **API 服务文件过大** | `api.ts` 1512 行，维护困难，职责不清 | 拆分为领域服务 |
| A-002 | **Store 职责过重** | `confirmationStore.ts` 承担所有确认流程状态 | 按步骤拆分 Store |
| A-003 | **Hooks 数量不足** | 仅 3 个 hooks，业务逻辑耦合在组件中 | 提取更多自定义 Hooks |
| A-004 | **缺少错误边界策略** | 仅有 `ErrorBoundary` 组件，无统一错误处理 | 建立错误处理中间件 |
| A-005 | **组件库未统一导出** | UI 组件散落在各处，导入路径不一致 | 建立统一组件索引 |

---

### A-001: API 服务重构 (P0)

**现状问题**:
```
src/services/api.ts  (1512 行)
├── 类型定义 (~300 行)
├── ApiService 类 (~1200 行)
│   ├── 认证方法
│   ├── 项目方法
│   ├── 消息方法
│   ├── 流程图方法
│   ├── 需求方法
│   └── ...更多
```

**建议架构**:
```
src/services/
├── api/
│   ├── client.ts          # Axios 实例 + 拦截器
│   ├── types.ts           # 共享类型定义
│   ├── auth.api.ts        # 认证服务
│   ├── project.api.ts     # 项目服务
│   ├── message.api.ts     # 消息服务
│   ├── flow.api.ts        # 流程图服务
│   └── index.ts           # 统一导出
```

**收益**:
- 单文件代码量 < 300 行
- 职责单一，易于测试
- 支持按需加载

---

### A-002: Store 拆分重构 (P1)

**现状问题**:
```typescript
// confirmationStore.ts 承担了所有状态
interface ConfirmationFlowState {
  currentStep: ConfirmationStep
  stepHistory: ConfirmationStep[]
  requirementText: string
  boundedContexts: BoundedContext[]
  selectedContextIds: string[]
  contextMermaidCode: string
  domainModels: DomainModel[]
  modelMermaidCode: string
  businessFlow: BusinessFlow
  flowMermaidCode: string
  createdProjectId: string | null
  history: ConfirmationSnapshot[]
  historyIndex: number
  // ... 30+ actions
}
```

**建议架构**:
```
src/stores/
├── confirmation/
│   ├── index.ts                    # 组合 Store
│   ├── requirementStore.ts         # Step 1: 需求输入
│   ├── boundedContextStore.ts      # Step 2: 限界上下文
│   ├── domainModelStore.ts         # Step 3: 领域模型
│   ├── businessFlowStore.ts        # Step 4: 业务流程
│   └── confirmationSessionStore.ts # 会话管理 (历史/撤销)
```

**收益**:
- 每个 Store 职责单一
- 独立测试更容易
- 可按需持久化

---

### A-003: 提取自定义 Hooks (P1)

**现状问题**:
业务逻辑直接写在组件中，难以复用和测试。

**建议新增 Hooks**:
```typescript
// hooks/
├── useAuth.ts              # 认证状态 + 登录/登出
├── useProject.ts           # 项目 CRUD + 列表
├── useRequirement.ts       # 需求输入 + 草稿保存
├── useAIGeneration.ts      # AI 生成 + 流式响应
├── useMermaidRender.ts     # Mermaid 渲染 + 缓存
├── useConfirmationGuard.ts # 确认流程守卫
├── useStepProgress.ts      # 步骤进度追踪
├── useToast.ts             # Toast 通知
└── useDraft.ts             # 草稿自动保存
```

**示例实现**:
```typescript
// hooks/useAIGeneration.ts
export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const generate = useCallback(async (prompt: string) => {
    setIsGenerating(true)
    setError(null)
    try {
      const result = await apiClient.generate(prompt)
      return result
    } catch (e) {
      setError(e as Error)
      throw e
    } finally {
      setIsGenerating(false)
    }
  }, [])
  
  return { generate, isGenerating, error }
}
```

---

### A-004: 统一错误处理策略 (P0)

**现状问题**:
- 各组件独立处理错误
- 错误格式不统一
- 用户提示不一致

**建议架构** (已在 `vibex-api-error-middleware` 架构设计中):
```
src/lib/
├── errorMiddleware.ts      # 错误拦截中间件
├── errorClassifier.ts      # 错误分类器
├── errorCodeMapper.ts      # 错误码映射
└── retryHandler.ts         # 重试处理器

src/stores/
└── toastStore.ts           # Toast 状态管理
```

---

### A-005: 组件库统一导出 (P2)

**现状问题**:
```typescript
// 各种导入路径
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
```

**建议改进**:
```typescript
// src/components/ui/index.ts
export { Button } from './Button'
export { Card } from './Card'
export { Modal } from './Modal'
// ... 所有组件

// 使用时
import { Button, Card, Modal } from '@/components/ui'
```

---

### A-006: 引入依赖注入模式 (P2)

**现状问题**:
服务实例直接导入，难以测试和替换。

**建议架构**:
```typescript
// lib/di/container.ts
import { Container } from 'inversify'

const container = new Container()

container.bind(TYPES.ApiClient).to(ApiService)
container.bind(TYPES.AuthStore).to(AuthStore)
container.bind(TYPES.ToastService).to(ToastService)

export { container }

// 使用时
@injectable()
class ProjectComponent {
  constructor(
    @inject(TYPES.ApiClient) private api: ApiService
  ) {}
}
```

---

### A-007: 添加架构决策记录 (ADR) (P2)

**建议**:
在 `docs/adr/` 目录记录关键架构决策：
```
docs/adr/
├── 001-use-zustand-for-state.md
├── 002-use-nextjs-app-router.md
├── 003-cloudflare-workers-backend.md
├── 004-mermaid-for-diagrams.md
└── 005-reactflow-for-editors.md
```

---

## 下一步行动

1. **P0 任务**:
   - [x] 重构 `api.ts` (A-001) ✅ 已完成
   - [x] 建立错误处理中间件 (A-004) ✅ 已完成

2. **P1 任务**:
   - [x] 拆分 Store (A-002) ✅ 已完成
   - [x] 提取自定义 Hooks (A-003) ✅ 已完成 (Mermaid测试)

3. **P2 任务**:
   - [x] 统一组件导出 (A-005) ✅ 已完成
   - [ ] 引入 DI 模式 (A-006)
   - [ ] 建立 ADR 文档 (A-007)

---

## 🔥 新增改进建议 (2026-03-06)

| ID | 提案 | 优先级 | 状态 |
|----|------|--------|------|
| FR-011 | **React Query 缓存层** | P3 | 待完成 |
| FR-012 | **Storybook 组件库** | P3 | 待完成 |
| FR-013 | **MSW Mock 服务** | P3 | ✅ 已完成 |

---

### FR-011: React Query 缓存层 (P3)

**问题**: 当前每次页面加载都重新请求 API，无缓存策略

**建议**:
```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 分钟
      cacheTime: 30 * 60 * 1000, // 30 分钟
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

**收益**: 减少 API 调用 40%+，离线可用

---

### FR-012: Storybook 组件库 (P3)

**问题**: 组件无文档，难以复用和协作

**建议**:
```
.storybook/
├── main.ts
└── preview.ts

src/components/
├── Button/
│   ├── Button.tsx
│   ├── Button.stories.tsx
│   └── Button.test.tsx
```

**收益**: 可视化组件文档，团队协作更高效

---

### FR-013: MSW Mock 服务 (P3) ✅ 已完成

**产出**:
- `src/mocks/handlers.ts` (20 个 API 端点)
- `src/mocks/browser.ts`
- `src/mocks/node.ts`

**覆盖**: Auth(4) | Projects(5) | Messages(3) | Requirements(2) | Agents(2) | Pages(2)

---

## 🏗️ 架构优化提案 (2026-03-09 更新)

> 由 Architect Agent 基于代码审查和测试覆盖率分析
> 日期: 2026-03-09

### 当前状态评估

| 指标 | 当前值 | 目标值 | 状态 |
|------|--------|--------|------|
| 测试覆盖率 (行) | 49.66% | 80% | 🔴 需改进 |
| 测试覆盖率 (函数) | 40.07% | 80% | 🔴 需改进 |
| 测试覆盖率 (分支) | 46.22% | 80% | 🔴 需改进 |
| API 模块测试覆盖率 | 5-22% | 60% | 🔴 需改进 |
| 错误处理覆盖率 | 96%+ | 95% | ✅ 达标 |

### 新增架构提案

| ID | 提案 | 优先级 | 预估工作量 | 收益 |
|----|------|--------|-----------|------|
| A-008 | **API 模块测试补全** | P0 | 2人日 | 覆盖率提升至 60%+ |
| A-009 | **confirmationStore 进一步拆分** | P1 | 1人日 | 可维护性提升 |
| A-010 | **性能监控架构** | P1 | 2人日 | 可观测性提升 |
| A-011 | **WebSocket 重连策略优化** | P2 | 1人日 | 稳定性提升 |
| A-012 | **ADR 文档体系建立** | P2 | 0.5人日 | 知识沉淀 |

---

### A-008: API 模块测试补全 (P0)

**现状问题**:
API 模块测试覆盖率极低，关键模块覆盖率：
- `modules/agent.ts`: 5.55%
- `modules/auth.ts`: 21.42%
- `modules/clarification.ts`: 7.14%
- `modules/project.ts`: 未测试
- `client.ts`: 22.91%

**建议测试策略**:
```typescript
// __tests__/services/api/modules/agent.test.ts
describe('Agent API Module', () => {
  beforeEach(() => {
    mockAxios.reset()
  })

  test('getAgents - 返回 Agent 列表', async () => {
    mockAxios.onGet('/api/agents').reply(200, {
      agents: [{ id: '1', name: 'Test Agent' }]
    })
    
    const result = await agentApi.getAgents()
    expect(result.agents).toHaveLength(1)
  })

  test('createAgent - 创建成功', async () => {
    const newAgent = { name: 'New', prompt: 'Test', model: 'gpt-4', temperature: 0.7 }
    mockAxios.onPost('/api/agents').reply(201, { id: '2', ...newAgent })
    
    const result = await agentApi.createAgent(newAgent)
    expect(result.name).toBe('New')
  })

  test('createAgent - 参数校验失败', async () => {
    await expect(agentApi.createAgent({ name: '', prompt: '', model: '', temperature: 2 }))
      .rejects.toThrow('Invalid temperature')
  })
})
```

**测试优先级**:
1. `auth.ts` - 认证核心，最高优先级
2. `project.ts` - 项目管理核心
3. `agent.ts` - Agent 配置
4. `client.ts` - HTTP 客户端

**验收标准**:
- 每个 API 模块覆盖率 > 60%
- 关键路径 (登录/创建项目) 覆盖率 > 80%

---

### A-009: confirmationStore 进一步拆分 (P1)

**现状问题**:
`confirmationStore.ts` 仍有 350 行，包含多个步骤状态和 30+ actions。

**建议架构**:
```
src/stores/confirmation/
├── index.ts                    # 组合导出
├── types.ts                    # 共享类型定义
├── requirementStore.ts         # Step 1: 需求输入状态
├── boundedContextStore.ts      # Step 2: 限界上下文状态
├── domainModelStore.ts         # Step 3: 领域模型状态
├── businessFlowStore.ts        # Step 4: 业务流程状态
├── sessionStore.ts             # 会话管理 (历史/撤销)
└── __tests__/
    ├── requirementStore.test.ts
    ├── boundedContextStore.test.ts
    └── ...
```

**组合模式**:
```typescript
// stores/confirmation/index.ts
import { createRequirementSlice } from './requirementStore'
import { createBoundedContextSlice } from './boundedContextStore'
import { createDomainModelSlice } from './domainModelStore'
import { createBusinessFlowSlice } from './businessFlowStore'
import { createSessionSlice } from './sessionStore'

export const useConfirmationStore = create<ConfirmationState>()(
  devtools(
    persist(
      (...a) => ({
        ...createRequirementSlice(...a),
        ...createBoundedContextSlice(...a),
        ...createDomainModelSlice(...a),
        ...createBusinessFlowSlice(...a),
        ...createSessionSlice(...a),
      }),
      { name: 'confirmation-storage' }
    )
  )
)
```

**收益**:
- 每个 Slice < 100 行
- 独立测试，覆盖率提升
- 按需持久化

---

### A-010: 性能监控架构 (P1)

**目标**: 建立前端性能监控体系，追踪关键指标。

**建议架构**:
```
src/lib/monitoring/
├── PerformanceMonitor.ts       # 性能监控核心
├── metrics/
│   ├── webVitals.ts            # Core Web Vitals
│   ├── apiLatency.ts           # API 延迟追踪
│   ├── renderTime.ts           # 渲染时间追踪
│   └── errorTracking.ts        # 错误追踪
├── reporters/
│   ├── consoleReporter.ts      # 开发环境报告
│   └── analyticsReporter.ts    # 生产环境上报
└── __tests__/
    └── PerformanceMonitor.test.ts
```

**核心实现**:
```typescript
// lib/monitoring/PerformanceMonitor.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance() {
    if (!this.instance) {
      this.instance = new PerformanceMonitor()
    }
    return this.instance
  }

  // 追踪 API 延迟
  trackApiLatency(endpoint: string, duration: number) {
    const key = `api:${endpoint}`
    this.recordMetric(key, duration)
    
    // P99 超过 2s 告警
    if (this.getP99(key) > 2000) {
      console.warn(`[Performance] API ${endpoint} P99 latency > 2s`)
    }
  }

  // 追踪渲染时间
  trackRenderTime(component: string, duration: number) {
    this.recordMetric(`render:${component}`, duration)
  }

  // 获取 P99
  getP99(key: string): number {
    const values = this.metrics.get(key) || []
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length * 0.99)]
  }

  private recordMetric(key: string, value: number) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    this.metrics.get(key)!.push(value)
    
    // 保留最近 100 条记录
    const arr = this.metrics.get(key)!
    if (arr.length > 100) {
      arr.shift()
    }
  }
}
```

**关键指标**:
| 指标 | 目标 | 告警阈值 |
|------|------|---------|
| LCP (Largest Contentful Paint) | < 2.5s | > 4s |
| FID (First Input Delay) | < 100ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | > 0.25 |
| API P99 延迟 | < 1s | > 2s |
| 首屏渲染 | < 1.5s | > 3s |

---

### A-011: WebSocket 重连策略优化 (P2)

**现状问题**:
WebSocket 断线后重连策略简单，可能导致连接风暴。

**建议架构**:
```typescript
// lib/websocket/ReconnectionStrategy.ts
export class ReconnectionStrategy {
  private attemptCount = 0
  private readonly maxAttempts = 5
  private readonly baseDelay = 1000 // 1s
  private readonly maxDelay = 30000 // 30s

  getNextDelay(): number {
    if (this.attemptCount >= this.maxAttempts) {
      return -1 // 不再重试
    }
    
    // 指数退避 + 随机抖动
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.attemptCount),
      this.maxDelay
    )
    const jitter = delay * 0.2 * Math.random()
    
    this.attemptCount++
    return delay + jitter
  }

  reset() {
    this.attemptCount = 0
  }
}

// 使用示例
const ws = new WebSocket(url)
const strategy = new ReconnectionStrategy()

ws.onclose = () => {
  const delay = strategy.getNextDelay()
  if (delay > 0) {
    setTimeout(() => reconnect(), delay)
  } else {
    console.error('WebSocket 重连失败，已达最大重试次数')
  }
}

ws.onopen = () => {
  strategy.reset()
}
```

**验收标准**:
- 断线后自动重连
- 重连延迟指数增长
- 最大重试 5 次
- 连接恢复后重置计数

---

### A-012: ADR 文档体系建立 (P2)

**目标**: 建立架构决策记录 (Architecture Decision Records) 体系。

**建议目录结构**:
```
docs/adr/
├── README.md                   # ADR 索引
├── 0001-record-architecture-decisions.md
├── 0002-use-zustand-for-state-management.md
├── 0003-use-nextjs-app-router.md
├── 0004-use-mermaid-for-diagrams.md
├── 0005-use-reactflow-for-flow-editor.md
├── 0006-api-service-modularization.md
├── 0007-error-middleware-pattern.md
├── 0008-websocket-collaboration.md
└── template.md
```

**ADR 模板**:
```markdown
# ADR-NNNN: [决策标题]

## 状态
[提议 | 已接受 | 已废弃 | 已替代]

## 背景
[描述背景和问题]

## 决策
[描述决策内容]

## 后果
[描述决策的影响]

## 替代方案
[描述考虑过的其他方案]
```

**收益**:
- 新成员快速了解架构决策
- 避免重复讨论已决策问题
- 知识沉淀和传承

---

## 下一步行动 (更新)

1. **P0 任务**:
   - [ ] API 模块测试补全 (A-008)

2. **P1 任务**:
   - [ ] confirmationStore 进一步拆分 (A-009)
   - [ ] 性能监控架构 (A-010)

3. **P2 任务**:
   - [ ] WebSocket 重连策略优化 (A-011)
   - [ ] ADR 文档体系建立 (A-012)

---

*Generated by: Analyst Agent + Architect Agent*
*Date: 2026-03-04*
*Updated by: Architect Agent*
*Date: 2026-03-09*