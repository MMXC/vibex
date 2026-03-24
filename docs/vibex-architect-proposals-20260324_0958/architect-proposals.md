# Architect 提案 — 2026-03-24

**作者**: Architect Agent
**时间**: 2026-03-24 09:59 (Asia/Shanghai)
**任务**: vibex-architect-proposals-20260324_0958/collect-proposals

---

## 背景

今日心跳巡检于 09:59 执行。扫描了 vibex 项目当前架构状态：

- API 服务已完成模块化重构（`services/api/` 总计 526 行，结构清晰）
- React Query 已引入（hooks/queries, hooks/mutations）
- 仍有多个架构债务点待处理
- 共 290 个 TSX 组件文件，系统复杂度较高

---

## P0: ErrorBoundary 组件重复

### 问题

项目中发现 **两个 ErrorBoundary 组件**：

```
src/components/error-boundary/ErrorBoundary.tsx  ← 业务级
src/components/ui/ErrorBoundary.tsx               ← UI 组件库级
```

同时存在于 `components/ui/` 和 `components/error-boundary/` 两个目录，存在：
- 功能重叠：两者都捕获 JSX 渲染错误
- 使用场景不统一：不同页面引用了不同的 ErrorBoundary
- 测试重复：两个组件都有独立测试文件

### 影响

- 开发者困惑：不知道该用哪个
- 边界不一致：可能导致某些错误未被统一捕获
- 代码冗余：维护两份相似逻辑

### 建议

1. 统一到 `components/ui/ErrorBoundary.tsx`
2. `components/error-boundary/` 作为废弃目录（deprecated）
3. 导出统一索引：`components/ui/index.ts`
4. 建立错误处理策略文档

**工时**: 0.5d | **影响**: 中

---

## P1: confirmationStore.ts 仍然过大

### 问题

`stores/confirmationStore.ts` **461 行**，承担了完整 DDD 确认流程的所有状态：

- 需求输入状态
- 限界上下文选择
- 领域模型编辑
- 业务流程图生成
- 历史快照管理

这违反了**单一职责原则**，且：
- 难以单独测试各子流程
- 状态变更难以追踪
- 新增步骤需要修改整个 Store

### 建议

```
src/stores/confirmation/
├── useConfirmationStore.ts        # 主 Store（精简，路由编排）
├── steps/
│   ├── useRequirementStep.ts      # 需求输入子状态
│   ├── useContextStep.ts          # 上下文选择子状态
│   ├── useModelStep.ts            # 领域模型子状态
│   └── useFlowStep.ts             # 业务流程子状态
└── index.ts                       # 统一导出
```

使用 **Zustand 的 slice pattern** 或 **React Context per step** 拆分。

**工时**: 1.5d | **影响**: 中高

---

## P2: 共享类型包缺失

### 问题

当前架构中，类型定义散落在多个位置：

```
vibex-fronted/src/services/api/types/
vibex-backend/src/types/
vibex-fronted/src/types/
```

存在的问题：
- 前后端类型不同步，手动维护容易出错
- API 契约无强制类型约束
- 难以做 breaking change 检测

### 建议

```
packages/
└── types/
    ├── src/
    │   ├── api.ts          # API 请求/响应类型
    │   ├── domain.ts       # 领域实体类型
    │   └── index.ts
    ├── package.json
    └── tsconfig.json
```

使用 **tRPC** 或 **Pact** 进行 API 类型强制同步。

**工时**: 2d | **影响**: 高

---

## P3: React Query 覆盖率不足

### 问题

当前 hooks 目录结构：
- `queries/`: 6 个 query hooks
- `mutations/`: 1 个 mutation hook
- `use*.ts`: 14 个自定义 hooks

**问题**：直接使用 `api.ts` 的组件仍然很多，React Query 的缓存/失效/乐观更新能力未被充分利用。

### 建议

建立 **API 层覆盖度评估**：
1. 审计所有 `api.ts` 调用点
2. 识别适合 React Query 的场景：
   - 项目列表查询 → useQuery + 缓存
   - 创建/更新项目 → useMutation + invalidate
   - 实时状态 → useQuery + refetchInterval
3. 逐步迁移，每个 sprint 覆盖 2-3 个 API 调用

**工时**: 2d（持续迭代） | **影响**: 中

---

## P4: Landing Page 与主应用解耦风险

### 问题

`landing-page/` 作为独立项目存在，但：
- 视觉风格需与主应用保持一致（ThemeProvider 复用）
- 未来可能需要共享组件（Button, Typography 等）
- 独立部署增加了 CI/CD 复杂度

### 建议

评估两种方案：
1. **Monorepo 整合**：landing-page 作为 workspace package，共享 `@vibex/ui` 组件库
2. **保持独立 + Design Token 同步**：通过 CSS Variables + CDN 发布 design tokens

推荐方案 1，后续可演进为 `packages/ui` 共享组件库。

**工时**: 1d | **影响**: 中

---

## 提案总结

| 优先级 | 提案 | 影响 | 工时 | 风险 |
|--------|------|------|------|------|
| P0 | ErrorBoundary 组件去重 | 中 | 0.5d | 低 |
| P1 | confirmationStore 拆分 | 中高 | 1.5d | 中 |
| P2 | 共享类型包建设 | 高 | 2d | 高 |
| P3 | React Query 覆盖率提升 | 中 | 2d+ | 低 |
| P4 | Landing Page 集成策略 | 中 | 1d | 低 |

---

## 推荐执行顺序

1. **P0** → 最快见效，消除明显重复
2. **P1** → 改善核心流程可维护性
3. **P2** → 为 P3 提供类型基础设施
4. **P3** → 提升数据层健壮性
5. **P4** → 统一品牌体验

**建议本轮先处理 P0（ErrorBoundary 去重）和 P1（Store 拆分），可合并为一个 sprint。**
