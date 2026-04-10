# Canvas 按钮审查需求澄清报告

> **项目**: vibex-canvas-button-audit-proposal
> **阶段**: analyze-requirements
> **角色**: Analyst
> **日期**: 2026-04-10
> **输入**: analysis.md (HEARTBEAT.md 按钮图谱)
> **Research**: docs/learnings/ 历史文档 + git history 分析

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: 无（Analyst 评审阶段，待 Coord 决策后分配）
- **执行日期**: 待定

---

## 一、需求澄清

### 1.1 任务背景

Canvas 页（/canvas）经多 Epic 迭代后存在按钮功能重叠、UX 不一致、冗余交互问题。本次审查已有完整按钮图谱（HEARTBEAT.md），识别出 6 大问题。

### 1.2 当前按钮规模

| 区域 | 按钮数 | 状态 |
|------|--------|------|
| ProjectBar（顶部） | 12 | ✅ 基本正常 |
| TabBar（三树切换） | 3 | ✅ 正常 |
| TreeToolbar × 3 树 | 9（每树3） | ⚠️ 6项待澄清 |
| LeftDrawer | 2 | ✅ 正常 |
| **合计** | **~35** | **6项问题需修复** |

### 1.3 识别的 6 大问题（来源 HEARTBEAT.md）

| # | 问题 | 严重度 | 根因 |
|---|------|--------|------|
| P1 | 全选/取消/清空语义不清（选中 vs 激活混淆） | P1 | 概念模型不统一 |
| P2 | 清空操作无二次确认 | P1 | 高危操作缺保护 |
| P3 | Flow 树删除无 undo | P0 | historySlice 未覆盖 |
| P4 | 重新生成按钮语义不清 | P2 | 文案与实际行为不符 |
| P5 | Context 树重置语义不明 | P2 | 功能边界模糊 |
| P6 | ProjectBar 按钮过于拥挤 | P2 | 布局问题 |

---

## 二、历史经验（Research 汇总）

### 2.1 前期已识别问题（2026-04-06 三次审查）

经 `canvas-button-cleanup`、`canvas-button-consolidation`、`tree-toolbar-consolidation` 三轮分析，历史结论：

**核心矛盾**：同一功能在 2-3 处各实现一遍，事件绑定不一致。

| 根因类型 | 数量 |
|----------|------|
| 按钮重复实现 | 14 处 |
| Store flow 分支空实现 | 3 处 |
| 跳过 history 快照 | 3 处 |
| 空函数按钮 | 2 处 |

**关键发现**：
- `BoundedContextTree.tsx` 完全没有 `recordSnapshot` 调用（对比 Flow/Component 树均有）
- `flowStore` 缺少 `selectAllNodes`、`clearNodeSelection`、`deleteSelectedNodes` 方法
- 清空操作直接 `setXxxNodes([])` 绕过了带 history 的 `clearXxxCanvas()` 方法

### 2.2 目标体系

前次审查建议：每树保留 6 个按钮（TreeToolbar 统一管理，删除层级 2/3 的硬编码按钮）。

### 2.3 Git History 验证

```
a56ed085 refactor: extract renderContextTreeToolbar helper
fab64ec8 remove REMOVED comment blocks
88abb85b integrate TemplateSelector + PhaseIndicator into CanvasPage
5fa36c7b restore usePresence + PresenceLayer
de829cd5 storybook: Canvas 组件 Story 覆盖
74eef272 merge ShortcutHintPanel + ShortcutHelpPanel into ShortcutPanel
```

近期 Canvas 重构聚焦于 Toolbar 提取和 Panel 合并，与按钮清理方向一致。

---

## 三、技术可行性评估

### 3.1 复杂度：中等

- **P0/P1 问题（5项）**：有明确的代码路径，历史经验充分，修复风险低
- **P2 问题（2项）**：UX 优化，改动边界清晰
- **无新依赖**：不引入新库，不改变 API 契约

### 3.2 依赖分析

| 依赖 | 状态 | 说明 |
|------|------|------|
| historySlice.ts | ✅ 可用 | 已有完整 undo/redo 机制 |
| contextStore.ts | ⚠️ 需修复 | flow 分支空实现需补充 |
| flowStore.ts | ⚠️ 需修复 | 缺少批量选择/删除方法 |
| componentStore.ts | ✅ 基本完整 | 有 clearCanvas，需确认清空路径 |
| TreeToolbar.tsx | ✅ 可扩展 | 当前 3 按钮，可扩展为 6 按钮 |

### 3.3 工期估算

| 问题 | 预估工时 | 说明 |
|------|----------|------|
| P1: 语义统一（选中/激活） | 2h | Store 方法重构 + 文案修改 |
| P1: 清空二次确认 | 1.5h | 添加 confirm 对话框 |
| P0: Flow 删除 undo | 1h | 补充 historySlice 调用 |
| P2: 重新生成文案 | 0.5h | 文案修改 |
| P2: 重置语义明确化 | 1h | 删除或补充文档 |
| P2: ProjectBar 按钮折叠 | 2h | 下拉菜单 UI |
| **合计** | **8h** | 约 2 天（8h/天） |

---

## 四、风险矩阵

| 风险 | 可能性 | 影响 | 缓解方案 |
|------|--------|------|----------|
| 清空误操作（无确认） | 高 | 高 | ✅ 已在 P1 修复计划 |
| history 覆盖不完整导致撤销失效 | 中 | 高 | 修复 P0 后全面回归测试 |
| 三树按钮语义统一破坏现有流程 | 低 | 高 | 增量修复 + 回归测试 |
| ProjectBar 按钮收拢导致可发现性下降 | 低 | 中 | 保留核心按钮，收拢次要按钮 |
| Store 重构引入回归 | 中 | 中 | 使用现有 store 方法而非重写 |

---

## 五、需求完整性评估

### 5.1 需求输入质量：✅ 充分

- 按钮图谱完整（35 个按钮全覆盖）
- 问题识别明确（6 项问题含严重度）
- 根因已有历史上下文

### 5.2 缺口项

| 缺口 | 影响 | 建议 |
|------|------|------|
| 未确认"选中 vs 激活"概念模型 | 高 | 需 PM 或 UX 确认语义定义 |
| Context 树"重置"是清空还是重置缩放未明确 | 中 | 建议删除此按钮或补充文档 |
| 目标按钮数量未明确 | 中 | 建议沿用"每树 6 按钮"目标 |

### 5.3 建议澄清问题（阻塞项）

- [ ] Q1: "选中"和"激活"是同一概念还是两个独立概念？
- [ ] Q2: Context 树的"重置"按钮预期行为是什么？
- [ ] Q3: ProjectBar 按钮收拢方案是否需要 Figma 设计稿？

---

## 六、评审结论

**推荐：有条件推荐进入开发阶段**

**理由**：
1. ✅ P0 问题（Flow 删除无 undo）必须修复，影响用户数据安全
2. ✅ P1 问题（语义不清 + 无二次确认）影响日常使用体验
3. ✅ 历史经验充分，修复路径清晰，无新风险
4. ⚠️ Q1-Q3 需在开发前由 PM/UX 澄清

**前置条件**：Coord 推动 PM 澄清 Q1-Q3 后方可进入开发。

---

## 七、后续建议

1. **立即行动**：P0/P1 问题可直接进入开发，无需等待 Q1-Q3 澄清
2. **独立 Epic**：P2 问题（ProjectBar 按钮拥挤）可独立 Epic，与 P0/P1 并行
3. **回归测试**：开发完成后，必须覆盖三树完整 undo/redo 路径

---

## 附录：关键参考文件

| 文件 | 用途 |
|------|------|
| `docs/canvas-button-cleanup/analysis.md` | 2026-04-06 第一次按钮清理分析 |
| `docs/canvas-button-consolidation/analysis.md` | 2026-04-06 按钮整合方案 |
| `docs/tree-toolbar-consolidation/analysis.md` | 2026-04-04 Toolbar 集成分析 |
| `HEARTBEAT.md` | 当前按钮图谱（输入） |
