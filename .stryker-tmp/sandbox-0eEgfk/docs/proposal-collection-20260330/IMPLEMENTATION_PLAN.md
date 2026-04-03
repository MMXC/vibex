# IMPLEMENTATION_PLAN: 提案收集 20260330 — 下一轮开发规划

> **项目**: proposal-collection-20260330
> **创建日期**: 2026-03-30
> **类型**: 提案汇总

---

## 1. 提案执行顺序

### 推荐 Sprint 规划

```
Week 1 (提案1: Canvas Bug Sprint)
├── Day 1-2: TD-003 BC 树连线布局 (8h)
├── Day 3: TD-001 Checkbox 去重 (2h)
├── Day 4: B1 + B2 遗留 Bug (4h)
└── Day 5: TD-002 组件树分类 (4h)

Week 2 (提案2 + 提案3)
├── 提案2: Task Manager 通知 (7h)
└── 提案3: Canvas Phase2a 全屏展开 (8h)
```

---

## 2. 提案1: Canvas Bug Sprint — 详细计划

### Sprint 目标

消除 product-blocking 问题，为 Canvas Phase2 打好基础。

### Epic 拆分

| Epic | 内容 | 工时 | Dev |
|------|------|------|-----|
| Epic 1 | B1 + B2 遗留 Bug | 4h | dev |
| Epic 2 | Checkbox 去重 + BC 树连线 | 10h | dev |
| Epic 3 | 组件树分类修复 | 4h | dev |

### Epic 1: 遗留 Bug 修复

**B1: disabled 逻辑修复**
- 文件: `BoundedContextTree.tsx`
- 改动: 移除 `disabled={allConfirmed}` 或修改逻辑

**B2.1: OverlapHighlightLayer 集成**
- 文件: `CardTreeRenderer.tsx`
- 改动: 导入并渲染 `OverlapHighlightLayer`

**B2.2: 起止节点标记**
- 文件: `FlowNodeMarkerLayer.tsx` (新建)
- 改动: 实现 start/end 节点特殊标记

### Epic 2: Checkbox + 连线修复

**TD-001: Checkbox 去重**
- 文件: `BoundedContextTree.tsx`
- 改动: 移除 selection checkbox，统一确认 checkbox

**TD-003: BC 树连线布局**
- 文件: `canvas.module.css` + `edgePath.ts`
- 改动: Flex row 布局 + bestAnchor 算法加固

### Epic 3: 组件树分类修复

**TD-002: 组件树 flowId 匹配**
- 文件: `ComponentTree.tsx` + Backend AI prompt
- 改动: 多维分组判断 + AI flowId 填充

---

## 3. 提案2: Task Manager 通知 — 执行计划

### 依赖关系

- Epic 1: 通知模块开发 (2h)
- Epic 2: 命令集成 (4h)
- Epic 3: 环境配置 (1h)

### 并行性

> 提案2 可与提案1 **并行**执行，因为涉及不同代码库。

---

## 4. 提案3: Canvas Phase2 — 执行计划

### 依赖关系

- Phase2a 可在提案1 完成后开始
- Phase2b 依赖 Phase2a 完成

### Phase2a: 全屏展开

**工时**: ~8h
**内容**:
- expand-both 模式
- maximize 模式
- 响应式布局

### Phase2b: 关系可视化

**工时**: ~16h
**内容**:
- BC 连线层
- Flow 连线层
- 交集高亮层

---

## 5. 总工时汇总

| 提案 | 工时 |
|------|------|
| 提案1: Canvas Bug Sprint | 15-20h |
| 提案2: Task Manager 通知 | 7h |
| 提案3: Canvas Phase2 | 24h (8h + 16h) |
| **合计** | **46-51h (~2周)** |

---

## 6. 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| BC 连线涉及布局改动影响其他功能 | 中 | 全量 E2E 测试 |
| AI prompt 改动影响生成质量 | 中 | 保留 fallback |
| Week 1 延期影响 Week 2 | 中 | 提案2 可独立执行 |
