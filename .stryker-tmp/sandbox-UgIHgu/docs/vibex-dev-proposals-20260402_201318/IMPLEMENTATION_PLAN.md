# Implementation Plan: VibeX Dev 提案 Sprint 路线图

**项目**: vibex-dev-proposals-20260402_201318
**版本**: v2.0
**日期**: 2026-04-02
**状态**: 🚀 实施中

---

## Sprint 排期

| Sprint | Epic | 工时 | 优先级 | 状态 |
|--------|------|------|--------|------|
| Sprint 0 | E1 + E2 | 3h | P0 | ✅ 完成 |
| Sprint 1 | E3 Phase1 | 8-12h | P0 | ✅ 完成 |
| Sprint 2 | E4 + E5 + E7 | 3.5h | P1 | 🔄 进行中 |
| Sprint 3 | E6 | 6-9 人天 | P1 | ⏳ 待开始 |
| **总计** | | **20.5h + 6-9 人天** | | |

---

## ✅ 已完成

### Sprint 0: 紧急修复 ✅

**E1: Sprint 0 紧急修复**
- ✅ TS 错误清理 - `vibex-p0-quick-fixes`
- ✅ DOMPurify Override - `vibex-p0-quick-fixes`
- ✅ 依赖安全审计 - `vibex-p0-quick-fixes`

**E2: 三树 checkbox UX ✅**
- ✅ BoundedContextTree checkbox 合并 - `canvas-checkbox-ux-fix`
- ✅ ComponentTree checkbox 位置修正 - `canvas-checkbox-ux-fix`
- ✅ API Zod Schema 修复 - `canvas-component-validate-fix`

### Sprint 1: canvasStore 拆分 ✅

**E3: contextStore 拆分 ✅** - `vibex-canvasstore-refactor`
- ✅ Epic1 contextStore
- ✅ Epic2 uiStore
- ✅ Epic3 flowStore
- ✅ Epic4 componentStore
- ✅ Epic5 sessionStore

---

## 🔄 进行中

### Sprint 2: 收尾

**E4: Migration 修复** - ⏳ 待开始
```typescript
// Migration 2→3
if (node.confirmed) {
  node.isActive = true;
  node.status = 'confirmed';
}
```

**E5: API 防御性解析** - ⏳ 待开始
- 实现 `parseComponentResponse`
- 替换 `generateComponentFromFlow` 调用

**E7: Vitest 优化** - ⏳ 待开始
- 路径别名优化
- 覆盖率报告配置

### E8: Checkbox 持久化 🔄 - `checkbox-persist-bug`
- 勾选状态持久化到 JSON
- 请求时从 JSON 读取勾选状态

---

## ⏳ 待开始

### Sprint 3: E2E 建设

**E6: 3 个核心旅程**

| Journey | 文件 | 状态 |
|---------|------|------|
| 创建上下文 | journey-create-context.spec.ts | ⏳ |
| 生成流程 | journey-generate-flow.spec.ts | ⏳ |
| 多选 | journey-multi-select.spec.ts | ⏳ |

---

## 验收清单

- [x] Sprint 0: npm run build 无 TS 错误
- [x] Sprint 0: DOMPurify override 生效
- [x] Sprint 0: BoundedContextTree 1 个 checkbox
- [x] Sprint 0: FlowCard 级联确认
- [x] Sprint 1: canvasStore 拆分完成 (5/5 Epic)
- [ ] Sprint 2: Migration status 映射正确
- [ ] Sprint 2: ZodError = 0
- [ ] Sprint 2: Checkbox 持久化
- [ ] Sprint 3: 3 个 E2E journey 通过

---

## 最新进展 (2026-04-02)

- ✅ canvas 页到组件树完全跑通
- ✅ canvasStore 5 个 store 拆分完成
- ✅ checkbox UI 修复完成
- 🔄 checkbox 持久化修复进行中
