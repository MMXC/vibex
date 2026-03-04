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
   - [ ] 重构 `api.ts` (A-001)
   - [ ] 建立错误处理中间件 (A-004)

2. **P1 任务**:
   - [ ] 拆分 Store (A-002)
   - [ ] 提取自定义 Hooks (A-003)

3. **P2 任务**:
   - [ ] 统一组件导出 (A-005)
   - [ ] 引入 DI 模式 (A-006)
   - [ ] 建立 ADR 文档 (A-007)

---

*Generated by: Analyst Agent + Architect Agent*
*Date: 2026-03-04*