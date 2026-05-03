# 需求分析报告 — VibeX Sprint 2

**项目**: vibex-sprint2-20260415
**日期**: 2026-04-16
**分析人**: Analyst
**状态**: 有条件推荐

---

## 1. 业务场景分析

### E1 — Tab State 残留修复

**业务背景**：用户在 Canvas 中切换 phase tab（如从 prototype 切换到 context）时，phase 状态未重置，Prototype accordion 保持展开，导致 UI 状态与用户预期不符。

**目标用户**：Canvas 用户（所有使用 Canvas 编辑流程/组件的用户）

**JTBD**：
1. 用户切换 tab 时，UI 状态应立即跟随切换，不遗留上一状态的 UI 残留
2. Prototype accordion 在离开 prototype tab 时应自动关闭

**根因**（代码级）：`CanvasPage.tsx` Line 217-218 的 `useEffect` 在 `activeTab` 变化时调用 `resetPanelState()`，但不重置 `phase` 状态。`phase` 决定 accordion 展开，`phase` 不重置导致 accordion 残留。

---

### E2 — 版本历史集成

**业务背景**：CanvasSnapshot table（migration 0006）已建立，`useVersionHistory` hook 有完整测试，但 UI 未集成。用户无法查看/回滚历史版本。

**目标用户**：Canvas 用户（需要版本管理能力）

**JTBD**：
3. 用户需能查看项目的所有历史快照（版本列表 + 时间戳）
4. 用户需能对比任意两个版本的差异（diff）
5. 用户需能从历史版本恢复

**现状**：`useVersionHistory` hook 存在（17 tests），Snapshot API 已实现（learnings 记录）。剩余工作：UI dialog + API 集成。

---

### E3 — 导入导出

**业务背景**：无任何实现痕迹。无 PRD 可查，无代码可参考。属于从零开始的需求。

**目标用户**：需要迁移项目、备份配置、与外部工具交换数据的用户

**JTBD**：
6. 用户需能导出项目为可移植格式（JSON/YAML）
7. 导出的文件可重新导入，数据完整无损（round-trip）

**问题**：PRD 有规格（引用了但实际不存在于 docs 目录）。约束明确：5MB 限制，禁止解析外部 URL。

---

### E4 — 三树数据持久化

**业务背景**：`CanvasSnapshot` table 的 `data` 字段为 JSON，已设计存储 `{contexts, flows, components}`。前端需实现序列化逻辑，D1 需验证迁移。

**目标用户**：Canvas + Dashboard 用户（跨 session 保持工作状态）

**JTBD**：
8. 用户在 Canvas 创建的项目，三树数据随项目一起保存
9. 用户在 Dashboard 打开项目时，三树状态正确恢复

---

## 2. 技术方案选项

### E1 技术方案

#### 方案一（推荐）：useEffect 扩展
在 `resetPanelState` effect 中增加 `setPhase('input')` 调用。

```typescript
// CanvasPage.tsx
useEffect(() => {
  resetPanelState();
  setPhase('input'); // 重置 phase，关闭 prototype accordion
}, [activeTab, resetPanelState]);
```

**优点**：改动最小，一行代码
**缺点**：需确认 `setPhase` 在 scope 内

#### 方案二：resetPanelState 扩展
将 `setPhase('input')` 封装进 `resetPanelState` 函数。

```typescript
// canvasStore 中
const resetPanelState = () => {
  // 原有逻辑
  setPhase('input');
}
```

**优点**：逻辑内聚，reset 语义完整
**缺点**：需修改 store，违反"不碰 canvasStore 核心逻辑"约束

**结论**：方案一，与约束一致。

---

### E2 技术方案

#### 方案一（推荐）：Version History Dialog + hook 集成
基于已有 `useVersionHistory` hook，新增 Dialog 组件，调用 API 拉取版本列表。

**优点**：hook 已就绪，测试完整；工作量集中在 UI
**缺点**：hook 与 API 集成点需验证

#### 方案二：从零实现 Snapshot UI
不依赖现有 hook，重新实现版本历史功能。

**优点**：不受旧实现约束
**缺点**：浪费已有资产，重复造轮子

**结论**：方案一。需先验证 `useVersionHistory` 与实际 Snapshot API 的接口匹配性。

---

### E3 技术方案

#### 方案一（推荐）：JSON Schema + 序列化
定义项目的 JSON Schema，导出时将三树数据序列化，导入时反序列化验证。

**优点**：标准化，工具链支持好（JSON Schema validation）
**缺点**：YAML 支持需额外库

#### 方案二：YAML 原生格式
直接使用 YAML 格式，利用 YAML 的结构化优势。

**优点**：人类可读性好
**缺点**：YAML 解析库增加依赖；round-trip 容易出现空白/注释丢失

**结论**：方案一。JSON 优先，YAML 作为第二阶段。先实现 JSON，验证 round-trip。

**关键约束**：5MB 限制（可在前端做文件大小检查）；禁止解析外部 URL（可使用 fetch 但不解析内容）。

---

### E4 技术方案

#### 方案一（推荐）：CanvasSnapshot 扩展
复用 `CanvasSnapshot` table，`data` 字段存储 `{contexts, flows, components, ui}` JSON。

**优点**：schema 已就绪，只需实现序列化/反序列化
**缺点**：需 D1 migration 验证

#### 方案二：独立 ProjectTree 表
新建 `ProjectTree` 表存储各树类型。

**优点**：schema 隔离
**缺点**：引入新表增加复杂度；与 CanvasSnapshot 关系不清

**结论**：方案一。复用现有 schema，减少数据模型复杂度。

---

## 3. 可行性评估

### E1 可行性：**高**

| 维度 | 评估 |
|------|------|
| 技术难度 | 极低。改动一行代码 |
| 影响范围 | 仅 CanvasPage.tsx |
| 风险 | 低。需确认 `setPhase` 在 scope |

**工时估算**：1h（包含测试）

### E2 可行性：**高**（剩余工作）

| 维度 | 评估 |
|------|------|
| 技术难度 | 中。前端 UI + API 集成 |
| hook 就绪 | 高（17 tests） |
| API 就绪 | 中（需验证接口匹配性） |
| 风险 | diff 功能复杂度较高，可分步交付 |

**工时估算**：3h（dialog + list + diff）→ 可拆为 1.5h list + 1.5h diff

### E3 可行性：**中**（从零，缺少 PRD）

| 维度 | 评估 |
|------|------|
| 技术难度 | 中。序列化 + 文件 I/O |
| 需求明确性 | 低。PRD 引用不存在 |
| 约束清晰 | 高（5MB，禁止 URL 解析） |
| 风险 | 缺少 PRD 导致实现范围不清 |

**工时估算**：2h（假设 JSON-only，无 diff）
**前置条件**：需 PM 提供导入导出格式 PRD

### E4 可行性：**中**（需验证 D1）

| 维度 | 评估 |
|------|------|
| 技术难度 | 中。序列化 + D1 |
| schema 就绪 | 高 |
| D1 migration | 待验证 |
| 风险 | D1 migration 失败影响部署 |

**工时估算**：5h（序列化 2h + D1 验证 1h + 集成 2h）

---

## 4. 风险矩阵

| 风险 | 可能性 | 影响 | 等级 | 缓解措施 |
|------|--------|------|------|----------|
| E3 缺少 PRD 导致实现范围不清 | 高 | 中 | 🔴 高 | 驳回：要求 PM 在 sprint 开始前提供导入导出 PRD |
| E2 hook 与实际 API 接口不匹配 | 中 | 中 | 🟡 中 | 先验证 API 接口，再写 UI |
| E4 D1 migration 在生产失败 | 低 | 高 | 🟡 中 | 先在 staging 验证 migration；准备好回滚脚本 |
| E1 改动影响其他 tab 行为 | 低 | 中 | 🟢 低 | 加单元测试覆盖 |
| E3 round-trip 精度不足 | 中 | 低 | 🟡 中 | 写自动化 round-trip 测试 |

---

## 5. 验收标准（具体可测试）

### E1 验收标准
- [ ] Tab 从 prototype 切换到 context 时，`phase` 状态变为 `'context'`
- [ ] Tab 从 prototype 切换到 flow 时，`phase` 状态变为 `'flow'`
- [ ] Prototype accordion 在离开 prototype tab 时自动关闭（`phase !== 'prototype'`）
- [ ] `useCanvasRenderer` 测试套件全部通过（确保不引入回归）

### E2 验收标准
- [ ] `useVersionHistory` hook 集成到 `VersionHistoryDialog` 组件
- [ ] GET `/api/v1/canvas/snapshots?projectId=X` 返回版本列表（≥3 条测试数据验证）
- [ ] 版本列表 dialog 显示所有版本，显示 createdAt 和 isAutoSave 标记
- [ ] 点击版本可查看该版本的 diff（或内容预览）
- [ ] hook 与 API 接口匹配性验证通过（无 TypeScript 错误）

### E3 验收标准（JSON-only）
- [ ] 点击"导出"按钮，生成项目 JSON 文件（≤5MB）
- [ ] 导出的 JSON 包含 contexts、flows、components 三个树
- [ ] 导出 JSON 可通过"导入"功能重新加载，数据无损（round-trip）
- [ ] 超过 5MB 的项目导出时给出明确错误提示
- [ ] 导入时不解析、不执行任何 URL 内容

### E4 验收标准
- [ ] 创建新项目后，Canvas 中三树数据写入 `CanvasSnapshot.data`（验证 D1 记录）
- [ ] 从 Dashboard 打开同一项目，三树状态从 `CanvasSnapshot.data` 正确恢复
- [ ] D1 migration 在 staging 环境验证通过
- [ ] 项目列表页面不显示三树数据（仅 Canvas 页面需要）

---

## 6. 驳回条件检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 需求模糊无法实现 | ⚠️ E3 警告 | E3 引用不存在的 PRD，需 PM 补充 |
| 缺少验收标准 | ✅ 通过 | 每个 Epic 都有具体可测试条目 |
| 未执行 Research | ✅ 通过 | git history + learnings 分析已完成 |

---

## 执行决策

- **决策**: 有条件采纳（E1/E2/E4 通过，E3 待 PM 补充 PRD）
- **执行项目**: vibex-sprint2-20260415
- **执行日期**: 待定（Coord 决策）
- **备注**: E3（导入导出）缺少 PRD，属于需求未澄清状态，建议 Coord 通知 PM 补充后再开始实施。Sprint 建议实施顺序：E1(1h) → E4(5h) → E2(3h) → E3（等 PRD）
