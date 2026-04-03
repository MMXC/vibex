# PRD: VibeX Canvas Living JSON 重构

**项目**: vibex-canvas-living-json
**日期**: 2026-03-31
**状态**: Draft v2（已根据用户澄清更新）
**优先级**: P0（重大范式变更）

---

## 1. 目标与概述

**目标**：将 VibeX Canvas 从"向导式分步工具"重构为"选择驱动的 Living JSON 可视化编辑器"。

**核心理念**：
- 画布 = 单 JSON 的可视化编辑器
- 初始状态 = 三棵空树
- 对话框输入需求 → AI 填充第一棵 context 树
- 用户选中节点 → 点击命令按钮 → AI 生成/重新生成对应数据
- 修改上游不自动联动下游，用户手动决定是否重新生成

---

## 2. 功能列表

### F1：空树初始状态
- 画布打开时，contextNodes / flowNodes / componentNodes 均为空数组
- JSON 结构完整，但无节点数据
- UI 显示引导文案："在对话框输入需求，开始设计"

### F2：CommandDialog — 原始需求输入
- 对话框文本输入框
- 未选中任何卡片时，回车/发送 → AI 生成 contextNodes
- 生成后自动清空对话框内容

### F3：选中驱动生成 — context → flow
- 用户选中 ≥1 context 卡片（支持多选）
- 工具栏显示"生成业务流程"按钮（仅选中 context 时可用）
- 点击后 AI 根据选中 context + 原始需求生成 flowNodes
- 生成方式：追加到现有 flowNodes（不清空其他 flow）

### F4：选中驱动生成 — flow → component
- 用户选中 ≥1 flow 卡片
- 工具栏显示"生成组件树"按钮（仅选中 flow 时可用）
- 点击后 AI 根据选中 flow + 关联 context 生成 componentNodes
- 生成方式：追加

### F5：重新生成 — context
- 用户选中 ≥1 context 卡片
- 工具栏显示"重新生成上下文"按钮
- 点击后 AI 重新生成选中 context 节点（覆盖模式）

### F6：重新生成 — flow
- 用户选中 ≥1 flow 卡片
- 工具栏显示"重新生成流程"按钮
- 点击后 AI 重新生成选中 flow 节点（覆盖模式）

### F7：无自动联动
- 修改 context 节点 → flow 节点**不受影响**
- 修改 flow 节点 → component 节点**不受影响**
- 用户需手动选中并触发生成命令

### F8：导出 JSON
- 工具栏"导出 JSON"按钮
- 下载 CanvasDocument 为 `.json` 文件

### F9：重置画布
- 工具栏"重置画布"按钮
- 确认后清空三棵树（回到空数组状态）
- 不清空原始需求文本（保留在 CommandDialog）

### F10：模板系统
- [Roadmap，MVP 不包含]
- 预设画布模板（可直接加载示例数据）

---

## 3. 用户流程

### 3.1 完整流程示例

```
1. 用户打开画布
   → 三棵空树，显示引导文案

2. 用户在 CommandDialog 输入需求："我要做一个电商系统，包含用户、订单、商品模块"
   → 按回车，AI 生成 context 树（3个节点：用户管理、订单管理、商品管理）
   → contextNodes 填充，flowNodes / componentNodes 仍为空

3. 用户勾选"用户管理"和"订单管理"两张 context 卡片
   → 工具栏显示"生成业务流程"+"重新生成上下文"

4. 用户点击"生成业务流程"
   → AI 根据选中的 context 生成 flow 树
   → flowNodes 填充，componentNodes 仍为空

5. 用户勾选某个 flow 节点（如"创建订单流程"）
   → 工具栏显示"重新生成流程"+"生成组件树"

6. 用户点击"生成组件树"
   → AI 生成 component 树
   → componentNodes 填充

7. 用户觉得"用户管理"不对，选中它，点击"重新生成上下文"
   → AI 重新生成"用户管理"context 节点
   → flowNodes 和 componentNodes 不受影响（除非用户手动重新生成）
```

### 3.2 异常流程

| 场景 | 处理 |
|------|------|
| 未选中任何卡片就点击生成按钮 | 按钮 disabled，不可点击 |
| 选中 flow 却点击"生成业务流程" | 按钮 disabled |
| AI 生成失败 | 节点标记 `status: error`，显示错误信息，可重试 |
| 导入格式错误的 JSON | 显示错误，不修改当前画布 |

---

## 4. 验收标准

### AC1：空树初始状态
- [ ] 画布打开时，三棵树节点数组均为空
- [ ] 有引导文案提示用户输入需求

### AC2：原始需求 → context
- [ ] 对话框输入需求后，contextNodes 有数据填充
- [ ] flowNodes / componentNodes 不受影响

### AC3：选中 context → 生成 flow
- [ ] 选中 context 卡片后，工具栏出现生成按钮
- [ ] 点击后 flowNodes 追加数据
- [ ] 选中 flow 卡片时，"生成业务流程"按钮 disabled

### AC4：选中 flow → 生成 component
- [ ] 选中 flow 卡片后，工具栏出现"生成组件树"
- [ ] 点击后 componentNodes 追加数据

### AC5：重新生成（覆盖模式）
- [ ] 选中 context → "重新生成上下文"覆盖选中节点
- [ ] 选中 flow → "重新生成流程"覆盖选中节点
- [ ] 覆盖不影响其他树

### AC6：无自动联动
- [ ] 修改 context 后，flowNodes 不自动变化
- [ ] 修改 flow 后，componentNodes 不自动变化

### AC7：导出/重置
- [ ] 导出生成完整 CanvasDocument JSON 文件
- [ ] 重置后三棵树为空数组

---

## 5. 不包含范围（MVP）

- 命令对话框的 slash command 形式（目前只有普通文本输入）
- 模板系统
- 多人协作
- 历史版本回滚
- URL 分享
- 多人实时编辑

---

## 6. Epic 拆分

| Epic | 内容 | 优先级 |
|------|------|--------|
| Epic 1 | JSON Schema v2 定义 + Store 重构（空树初始状态）| P0 |
| Epic 2 | CommandDialog + 原始需求 → context 生成 | P0 |
| Epic 3 | 选中 context → 生成 flow | P0 |
| Epic 4 | 选中 flow → 生成 component + 重新生成 | P0 |
| Epic 5 | 导出 JSON + 重置画布 | P0 |
| Epic 6 | 模板系统 | P2（Roadmap）|

---

## 7. 与 analysis.md / architecture.md 对齐

- [x] 单一 JSON 数据源
- [x] 选择驱动生成（选中 + 按钮）
- [x] 无自动联动
- [x] 空树初始状态
- [x] JSON 导入导出
- [x] phase 完全移除
- [x] confirmed 完全移除
- [x] MVP 命令已定义（原始需求 / 生成下一步 / 重新生成）
