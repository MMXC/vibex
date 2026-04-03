# 架构文档: vibex-flowtree-step-overflow

> **文档版本**: v1.0
> **创建时间**: 2026-03-29
> **项目状态**: 已实施（dev commit `510ed216`）
> **Architect 审查**: 确认修复质量，补录架构产物

---

## 1. 问题概述

### 1.1 业务场景
用户在 Vibex 画布页展开业务流程卡片（FlowCard）时，内部的步骤列表（StepsList）被固定高度裁剪，只能显示约 2 张步骤卡片，即使实际有更多步骤。

### 1.2 根因定位

| 组件 | CSS 属性 | 影响 |
|------|---------|------|
| `.flowCard` | `overflow: hidden` | 虚线框容器截断所有溢出内容 |
| `.stepsList` | `max-height: 300px; overflow-y: auto` | 步骤列表最大高度 300px，超出部分隐藏 |

**计算**：每个 `SortableStepRow` ≈ 50-70px，300px ÷ 140px ≈ **2 个步骤卡片**，与问题描述完全吻合。

**代码位置**：`vibex-fronted/src/components/canvas/canvas.module.css`

---

## 2. 修复审查

### 2.1 代码审查结论

**Commit**: `510ed216 fix: 流程树展开后虚线框高度自适应内容`

| 审查维度 | 结论 | 说明 |
|---------|------|------|
| **改动范围** | ✅ 合规 | 仅删除了 3 行 CSS，无新增代码 |
| **修复逻辑** | ✅ 正确 | 直接移除高度约束，符合根因分析 |
| **影响评估** | ✅ 低风险 | `.flowCard` 内无非溢出依赖元素 |
| **可回滚性** | ✅ 安全 | 纯 CSS 删除，回滚代价极低 |
| **性能影响** | ✅ 无 | 无 JS 变更，无性能影响 |

### 2.2 修复详情

**文件**: `vibex-fronted/src/components/canvas/canvas.module.css`

```diff
 // .flowCard (line ~1181)
 .flowCard {
   border: 2px dashed var(--color-border);
   border-radius: 8px;
   background: var(--color-bg-secondary);
-  overflow: hidden;
   transition: border-color 0.2s ease;
   position: relative;
 }

 // .stepsList (line ~1287-1293)
 .stepsList {
   border-top: 1px solid var(--color-border);
   padding: 0.5rem;
   display: flex;
   flex-direction: column;
   gap: 0.375rem;
-  max-height: 300px;
-  overflow-y: auto;
 }
```

### 2.3 副作用分析

| 潜在副作用 | 风险等级 | 分析 |
|-----------|---------|------|
| `.flowCard` 移除 `overflow:hidden` 后内容溢出 | 🟡 低 | `.flowCard` 内所有子元素均为 flex 布局或 inline 元素，不会主动产生固定宽度溢出 |
| 步骤数量过多（>20）导致卡片过长 | 🟡 低 | 极端场景，可接受；后续可考虑虚拟滚动（不纳入本次范围） |
| 嵌套 FlowCard 可能受影响 | ✅ 无风险 | 每个 FlowCard 是独立渲染单元，无嵌套关系 |

---

## 3. 架构决策

### 3.1 方案选择

| 方案 | 描述 | 状态 |
|------|------|------|
| **方案 A: 移除高度约束** | 删除 3 行 CSS，让虚线框自然扩展 | ✅ 已实施（推荐） |
| 方案 B: 滚动容器隔离 | 将 `overflow` 移到内层 wrapper | ❌ 不采用（需改 JSX 结构） |

**选择理由**：方案 A 改动极小（3 行删除），完全对症根因，无副作用风险。

### 3.2 架构约束

1. **CSS Modules 隔离**：修复在 `canvas.module.css` 内，不影响全局样式
2. **无 JS 变更**：纯样式修复，无需修改组件逻辑
3. **向后兼容**：不影响未展开的 FlowCard 渲染

---

## 4. 技术债务记录

| 类型 | 描述 | 后续建议 |
|------|------|---------|
| 步骤过多场景 | FlowCard 展开后可能过长 | 步骤 > 10 时考虑虚拟滚动 |
| 缺少 CSS 审查规范 | 高度约束未在 Code Review 中发现 | 建议 reviewer 关注 `max-height`/`overflow` 组合 |

---

## 5. 变更历史

| 版本 | 日期 | 修改内容 |
|------|------|---------|
| v1.0 | 2026-03-29 | 初稿，审查 dev 修复质量，补录架构文档 |
