# Architect 提案 — 2026-03-30

**Agent**: architect
**日期**: 2026-03-30
**项目**: proposals/20260330

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | architecture | canvasStore 模块化拆分 | canvasStore.ts | P0 |
| P002 | scalability | Canvas 节点列表虚拟化 | ComponentTree.tsx | P1 |
| P003 | dev-quality | TypeScript 严格模式升级 | tsconfig.json | P1 |

---

## 2. 提案详情

### P001: canvasStore 模块化拆分

**问题描述**:
canvasStore.ts 代码超过 900 行，承载所有状态管理逻辑，新增功能时难以定位和测试。

**根因分析**:
状态管理未按领域（context/flow/component）划分，所有节点类型共享同一 store。

**影响范围**:
canvasStore.ts、相关组件、新功能开发效率

**建议方案**:
```
src/lib/canvas/stores/
├── contextStore.ts   # 上下文节点
├── flowStore.ts     # 流程节点
├── componentStore.ts # 组件节点
└── uiStore.ts       # UI 状态
canvasStore.ts        # 聚合层
```

**验收标准**:
- 每个 store 覆盖率 > 80%
- 现有组件无需修改

---

### P002: Canvas 节点列表虚拟化

**问题描述**:
节点数量 > 100 时，ComponentTree 和 BusinessFlowTree 渲染卡顿。

**根因分析**:
未使用虚拟化列表技术，全量渲染所有节点。

**影响范围**:
ComponentTree.tsx、BusinessFlowTree.tsx、用户体验

**建议方案**:
引入 `@tanstack/react-virtual` 实现虚拟列表：
```typescript
const virtualizer = useVirtualizer({
  count: nodes.length,
  getScrollElement: () => ref.current,
  estimateSize: () => 48,
});
```

**验收标准**:
- 100 节点渲染 < 100ms
- 500 节点滚动 60fps

---

### P003: TypeScript 严格模式升级

**问题描述**:
当前 TypeScript 配置未启用严格模式，存在 `any` 类型和隐式 any。

**根因分析**:
项目初期为快速迭代关闭了严格检查，技术债务累积。

**影响范围**:
tsconfig.json、全局类型、遗留代码

**建议方案**:
分阶段启用：
1. `strict: true` + `noImplicitAny: true`
2. `strictNullChecks: true`
3. `strictFunctionTypes: true`

**验收标准**:
- strict 模式无编译错误
- 新增 any 需经 review

---

## 3. 今日工作回顾

| 任务 | 项目 | 状态 |
|------|------|------|
| design-architecture | vibex-exec-sandbox-freeze | ✅ |
| design-architecture | vibex-canvas-checkbox-unify | ✅ |
| design-architecture | task-manager-current-report | ✅ |
| design-architecture | coord-decision-report | ✅ |

---

## 4. 做得好的

1. 架构文档模板化，提高产出效率
2. 复用已有模块减少重复工作
3. 问题分析覆盖全面

## 5. 需要改进的

| # | 问题 | 改进方向 |
|---|------|----------|
| 1 | canvasStore 过大 | 模块化拆分 |
| 2 | 列表性能问题 | 虚拟化 |

---

*本文档由 Architect Agent 生成于 2026-03-30 23:18 GMT+8*
