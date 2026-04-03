# 架构文档: VibeX 页面结构整合

**项目**: vibex-page-structure-consolidation  
**版本**: 1.0  
**日期**: 2026-03-21  
**架构师**: Architect Agent  
**状态**: In Progress

---

## 1. 架构决策摘要

| ADR | 决策 | 权衡 |
|-----|------|------|
| ADR-001 | 路由层通过 Next.js Middleware 实现 301 重定向 | Middleware 比 next.config.js 更灵活，支持运行时判断 |
| ADR-002 | `/design` 流程保持独立，不合并到 Homepage | UI Generation 是 Design 工具核心功能，合并成本过高 |
| ADR-003 | 状态管理保持双 Store 架构 | confirmationStore (Homepage) + designStore (Design) 各自独立，共享关键数据 |
| ADR-004 | Phase 3 迁移采用渐进式，不破坏现有 Design 流程 | 低风险，支持回滚 |

---

## 2. 目标架构

### 2.1 路由拓扑（Target State）

```
                    ┌─────────────────────────────────────────┐
                    │           用户入口                        │
                    └───────────────┬─────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
              ┌─────▼─────┐                   ┌─────▼─────┐
              │  / (Home) │                   │ /design/* │
              │  单一入口  │                   │  设计工具  │
              └─────┬─────┘                   └─────┬─────┘
                    │                               │
         ┌──────────┼──────────┐                   │
         │          │          │                   │
    ┌────▼───┐ ┌───▼───┐ ┌───▼──────┐         (独立流程)
    │ Step 1 │ │ Step 2 │ │ Step 3..N│
    │ 需求输入│ │ 上下文 │ │  模型/流程│
    └────────┘ └────────┘ └──────────┘

旧路由重定向:
  /confirm/*  ──301──► /
  /requirements/* ──301──► /
```

### 2.2 架构分层

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
├──────────────┬──────────────┬──────────────┬────────────┤
│  Homepage    │   /design   │  /confirm    │ /require-  │
│  components  │   (独立)     │  (废弃→重定向)│  ments     │
│              │              │              │ (废弃→重定向)│
├──────────────┴──────────────┴──────────────┴────────────┤
│                    Store Layer                           │
├─────────────────────────┬────────────────────────────────┤
│   confirmationStore   │        designStore             │
│   (Homepage 全流程)    │   (/design 独立流程)            │
│   Step1-5 + 新增 Step6 │   clarification → ui-gen       │
│   (clarification)      │   (保持独立)                   │
├─────────────────────────┴────────────────────────────────┤
│                    Service Layer                        │
│   API modules: api/, auth/, services/                    │
├─────────────────────────────────────────────────────────┤
│                    Backend / External APIs               │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 核心组件设计

### 3.1 路由重定向（Phase 1）

**方案**: Next.js Middleware (`src/middleware.ts`)

**Trade-off 分析**:

| 方案 | 优点 | 缺点 |
|------|------|------|
| middleware.ts | 运行时判断，支持条件重定向，性能好 | 需要额外文件 |
| next.config.js redirects | 内置，无需额外文件 | 不支持复杂条件，只能静态配置 |
| **middleware.ts (推荐)** | **灵活，支持 fallback，可扩展** | **边缘函数成本（但 VibeX 已用 static export）** |

⚠️ **已知约束**: `next.config.ts` 设置了 `output: 'export'`（静态导出），这意味着 Middleware 的边缘函数能力受限。建议使用 `next.config.js` 的 `redirects` 配置（SSR 模式下）或在入口页面 (`page.tsx`) 中做客户端重定向作为 fallback。

**建议实现**:

```typescript
// next.config.ts (SSR 模式需要) 或 middleware.ts
// 如果 output: 'export'，则在 /confirm/page.tsx 和 /requirements/page.tsx 中:
import { redirect } from 'next/navigation';
export default function Page() {
  redirect('/');
}
```

**重定向清单**:

| 旧路由 | 新路由 | 状态码 |
|--------|--------|--------|
| `/confirm/context` | `/` | 301 |
| `/confirm/flow` | `/` | 301 |
| `/confirm/model` | `/` | 301 |
| `/confirm/success` | `/` | 301 |
| `/confirm` | `/` | 301 |
| `/requirements` | `/` | 301 |
| `/requirements/new` | `/` | 301 |

### 3.2 状态管理（Phase 2-3）

**架构决策**: 双 Store 长期共存，共享关键数据

```
confirmationStore (Homepage)                    designStore (/design)
┌─────────────────────────────┐              ┌─────────────────────────┐
│ steps: Step[]                │              │ step: DesignStep        │
│ requirementText: string      │◄──共享数据──►│ clarificationRounds[]  │
│ boundedContexts[]            │   (可选同步)  │ domainEntities[]        │
│ domainModels[]               │              │ businessFlow            │
│ businessFlow                 │              │ uiPages[]               │
│ confirmationStore.extended   │              │                         │
│   .clarificationRounds?      │              │                         │
└─────────────────────────────┘              └─────────────────────────┘
```

**扩展方案 (Phase 3)**:

```typescript
// confirmationStore.ts 扩展
export interface ConfirmationState {
  // 现有字段...
  
  // Phase 3 新增: Clarification 支持
  clarificationRounds?: ClarificationRound[];
  
  // Phase 3 新增: UI Generation 触发标记
  uiGenerationTriggered?: boolean;
  uiGenerationData?: UIGenerationSnapshot;
}
```

**Trade-off**:

| 方案 | 优点 | 缺点 |
|------|------|------|
| 单一 Store | 状态统一，易追踪 | confirmationStore 膨胀，职责不清 |
| 双 Store 共享引用 | 职责分离，渐进迁移 | 同步复杂性 |
| **双 Store + 事件桥接 (推荐)** | **低耦合，可回滚** | **需要事件同步** |

### 3.3 组件迁移策略（Phase 2-3）

```
现有: src/components/homepage/steps/
├── StepRequirementInput.tsx    ← 已有，评估覆盖度
├── StepBoundedContext.tsx     ← 已有，评估覆盖度  
├── StepDomainModel.tsx         ← 已有，评估覆盖度
├── StepBusinessFlow.tsx       ← 已有，评估覆盖度
├── StepProjectCreate.tsx       ← 已有
└── (新增) StepClarification.tsx    ← Phase 3 从 /design/clarification 迁移
└── (新增) StepUIGeneration.tsx      ← Phase 3 从 /design/ui-generation 迁移
```

**迁移组件命名规范**:
- `StepClarification.tsx` - 需求澄清步骤（新增）
- `StepUIGeneration.tsx` - UI 生成步骤（新增，作为可选步骤）

---

## 4. API 定义

### 4.1 核心 API 接口

**Redirect API (Next.js Middleware/Config)**

```typescript
// Middleware 重定向配置
interface RedirectRule {
  source: string;      // e.g., '/confirm/:path*'
  destination: string; // e.g., '/'
  permanent: boolean;  // true = 301
}
```

**State Sharing API (可选)**

```typescript
// confirmationStore 与 designStore 共享接口
interface SharedStateBridge {
  // 从 confirmationStore 读取
  getRequirementContext(): {
    requirementText: string;
    boundedContexts: BoundedContext[];
    domainModels: DomainModel[];
  };
  
  // 写入 designStore 触发
  syncToDesignFlow(): void;
  
  // 从 designStore 读取 UI 生成结果
  getUIGenerationData(): UIPage[] | null;
}
```

### 4.2 Store 扩展类型

```typescript
// confirmationStore.ts 扩展类型
interface ClarificationRound {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  isAccepted: boolean;
}

interface UIGenerationSnapshot {
  pages: UIPage[];
  generatedAt: number;
  triggeredBy: 'homepage' | 'design';
}
```

---

## 5. 数据模型

### 5.1 实体关系

```
User
  └── ConfirmationSession (confirmationStore)
        ├── requirementText: string
        ├── boundedContexts: BoundedContext[]
        │     └── ContextRelationship[]
        ├── domainModels: DomainModel[]
        │     └── DomainProperty[]
        ├── businessFlow: BusinessFlow
        │     └── FlowState[], FlowTransition[]
        ├── clarificationRounds?: ClarificationRound[]  (Phase 3)
        └── uiGenerationSnapshot?: UIGenerationSnapshot  (Phase 3)

User
  └── DesignSession (designStore)
        ├── currentStep: DesignStep
        ├── clarificationRounds: ClarificationRound[]
        ├── domainEntities: DomainEntity[]
        ├── businessFlow: BusinessFlow
        └── uiPages: UIPage[]
```

---

## 6. 性能影响评估

### 6.1 潜在性能影响

| 变更 | 影响 | 评估 |
|------|------|------|
| Middleware/重定向 | 301 响应，无额外计算 | 🟢 无负面影响 |
| confirmationStore 扩展 | Zustand 状态，内存影响极小 | 🟢 可忽略 |
| 新增 StepClarification 组件 | 懒加载，无初始影响 | 🟢 按需加载 |
| 新增 StepUIGeneration 组件 | 较大（编辑器+预览），需懒加载 | 🟡 需 code-splitting |
| 废弃代码删除 | 构建产物减小 | 🟢 积极影响 |

### 6.2 优化建议

1. **StepUIGeneration 使用动态导入**:
   ```typescript
   const StepUIGeneration = dynamic(() => import('@/components/homepage/steps/StepUIGeneration'), {
     loading: () => <StepLoading />,
   });
   ```

2. **废弃代码删除后**: 运行 `npm run build` 验证产物减小

---

## 7. 技术债务记录

| ID | 技术债务 | 优先级 | 预计解决 |
|----|----------|--------|----------|
| TD-001 | designStore 和 confirmationStore 存在功能重叠（bounded-context, domain-model） | P1 | Phase 3 后评估合并可能 |
| TD-002 | `/design` 的 clarification 组件与 Homepage 逻辑重复 | P2 | Phase 3 迁移后删除副本 |
| TD-003 | 多个页面使用 localStorage 直接读取 store 而非通过 hook | P2 | 清理阶段处理 |

---

## 8. 验收检查清单

- [ ] 重定向规则配置完成，所有旧路由返回 301
- [ ] 导航栏移除废弃入口
- [ ] `@deprecated` 注释添加到废弃文件
- [ ] Homepage 步骤覆盖度 ≥ 95%（E2E 验证）
- [ ] Clarification 评估报告产出
- [ ] UI Generation 评估报告产出
- [ ] confirmationStore 扩展类型定义完整
- [ ] 性能影响评估通过（无新增 bundle size 问题）
- [ ] IMPLEMENTATION_PLAN.md 产出
- [ ] AGENTS.md 产出

---

*Architect Agent | 2026-03-21*
