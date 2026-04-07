# Architect 提案 — 系统架构/技术选型/可扩展性

**Agent**: architect
**日期**: 2026-03-30
**项目**: proposals/proposal-architect
**仓库**: /root/.openclaw/vibex

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | architecture | 状态管理层模块化 | canvasStore.ts | P0 |
| P002 | scalability | Canvas 虚拟化列表 | ComponentTree/BusinessFlowTree | P1 |
| P003 | tech-select | TypeScript 严格模式升级 | 全局 | P1 |

---

## 2. 提案详情

### P001: 状态管理层模块化

**问题描述**:
`canvasStore.ts` 目前承担所有状态管理职责，代码行数超过 900 行，新增功能时难以定位和测试。

**根因分析**:
状态管理未按领域划分，所有节点类型（context/flow/component）共享同一个 store 实例。

**影响范围**:
- canvasStore.ts
- 所有使用 canvasStore 的组件
- 新功能开发效率

**建议方案**:
将 `canvasStore` 按节点类型拆分为独立模块：
```
src/lib/canvas/
├── stores/
│   ├── contextStore.ts    # 上下文节点状态
│   ├── flowStore.ts       # 流程节点状态
│   ├── componentStore.ts  # 组件节点状态
│   └── uiStore.ts        # UI 状态（选中、布局）
└── canvasStore.ts         # 聚合层
```

**验收标准**:
- [ ] 每个 store 单元测试覆盖率 > 80%
- [ ] 现有组件无需修改（向后兼容）
- [ ] 新增节点类型只需新增 store 文件

---

### P002: Canvas 虚拟化列表

**问题描述**:
当节点数量 > 100 时，ComponentTree 和 BusinessFlowTree 出现明显卡顿。

**根因分析**:
当前实现渲染所有节点，未使用虚拟化列表技术。

**影响范围**:
- ComponentTree.tsx
- BusinessFlowTree.tsx
- 用户体验

**建议方案**:
引入 `@tanstack/react-virtual` 实现虚拟化列表：
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: nodes.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 48, // 预估行高
});
```

**验收标准**:
- [ ] 100 节点渲染时间 < 100ms
- [ ] 500 节点滚动流畅（60fps）
- [ ] 现有功能无影响

---

### P003: TypeScript 严格模式升级

**问题描述**:
当前 TypeScript 配置未启用严格模式，存在大量 `any` 类型和隐式 any。

**根因分析**:
项目初期为快速迭代关闭了严格检查，技术债务累积。

**影响范围**:
- tsconfig.json
- 全局类型定义
- 现有代码（需逐文件修复）

**建议方案**:
1. 分阶段启用严格模式：
   - Phase 1: `strict: true` + `noImplicitAny: true`
   - Phase 2: `strictNullChecks: true`
   - Phase 3: `strictFunctionTypes: true`

2. 修复策略：
   - 新代码必须通过严格检查
   - 遗留代码逐步修复
   - 禁用 `@ts-ignore`

**验收标准**:
- [ ] `strict: true` 启用后无编译错误
- [ ] 新增 `any` 类型需经 review 批准
- [ ] 类型错误数量减少 80%

---

## 3. 技术债务分析

| 债务项 | 紧急度 | 影响 | 建议 |
|--------|--------|------|------|
| canvasStore 行数 > 900 | 高 | 开发效率 | P001 |
| 节点列表无虚拟化 | 中 | 性能 | P002 |
| TypeScript 严格模式 | 中 | 代码质量 | P003 |
| Checkbox 逻辑散落 | 中 | 可维护性 | P001（复用已有提案） |

---

## 4. 做得好的

1. 架构文档模板化，减少重复工作
2. 复用已有分析器模块（task-manager-current-report）
3. 组件抽象（CheckboxCard/CheckboxIcon）

## 5. 需要改进的

| # | 问题 | 改进方向 |
|---|------|----------|
| 1 | canvasStore 过大 | 模块化拆分 |
| 2 | 节点渲染性能 | 虚拟化列表 |
| 3 | 类型安全 | 启用严格模式 |

---

*本文档由 Architect Agent 生成于 2026-03-30 21:34 GMT+8*
