# PRD: VibeX Canvas Phase1 — 样式统一 + 导航修复

**项目名称**: vibex-canvas-evolution-roadmap  
**版本**: 1.0.0  
**创建日期**: 2026-03-29  
**负责人**: PM Agent  
**Architect**: Architect Agent  
**状态**: Ready for Implementation

---

## 1. 问题陈述

### 1.1 核心问题

| # | 问题 | 影响 |
|---|------|------|
| Q1 | 画布组件使用 emoji（✓○×）作为 checkbox，用户体验不一致，且无障碍支持不足 | 用户体验、Accessibility 合规 |
| Q2 | 限界上下文分组（BoundedGroupOverlay）缺少视觉样式，无法区分核心/支撑/通用/外部域 | DDD 领域驱动设计可视化体验 |
| Q3 | example-canvas.json 缺少 `previewUrl` 字段，导入后 componentNodes 无法导航到预览 | 导入后节点不可点击，功能缺失 |
| Q4 | 画布面板无法一键全屏（expand-both），影响大屏使用体验 | 高级用户/演示场景体验 |

### 1.2 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|---------|
| Checkbox 无 emoji | emoji 出现次数 = 0 | Playwright E2E 检查 |
| 4 色领域分组 | 页面上可见 4 种不同领域颜色 | E2E CSS 颜色提取验证 |
| 导入后节点可点击 | componentNodes 导入后 100% 可点击跳转 | Playwright 遍历测试 |
| expand-both 切换 | 点击按钮可在全屏/默认状态间切换 | E2E 点击测试 |
| 深色模式支持 | 4 种领域颜色在深色模式下符合 WCAG AA | 颜色对比度验证 |
| 单元测试覆盖 | utils.ts 覆盖率 > 80% | Vitest coverage |

---

## 2. 用户故事

### Epic 1: 样式系统统一

| ID | 作为一个... | 我想要... | 以便于... | 优先级 |
|----|---------|---------|---------|--------|
| US1.1 | Canvas 用户 | 在 ComponentSelectionStep 中看到统一的 Checkbox 图标 | 获得一致的视觉体验 | P0 |
| US1.2 | Canvas 用户 | 删除已选组件时有明确的删除按钮 | 避免误操作 | P0 |
| US1.3 | DDD 用户 | 限界上下文分组按类型显示不同颜色（橙/蓝/灰/紫） | 快速识别系统边界 | P0 |
| US1.4 | Canvas 用户 | 深色模式下领域颜色自动适配 | 在深色模式下正常浏览 | P1 |

### Epic 2: 导入导航增强

| ID | 作为一个... | 我想要... | 以便于... | 优先级 |
|----|---------|---------|---------|--------|
| US2.1 | Canvas 用户 | 导入 example-canvas.json 后点击节点跳转到预览页 | 完整体验画布→预览流程 | P0 |
| US2.2 | Canvas 用户 | 即使 previewUrl 缺失也能看到降级提示 | 知道功能不可用的原因 | P1 |

### Epic 3: 全屏画布模式

| ID | 作为一个... | 我想要... | 以便于... | 优先级 |
|----|---------|---------|---------|--------|
| US3.1 | Canvas 用户 | 一键全屏（隐藏左右面板） | 专注查看中间画布内容 | P1 |
| US3.2 | Canvas 用户 | 从全屏状态快速退出 | 恢复正常的编辑布局 | P1 |

### Epic 4: 推导能力（向后兼容）

| ID | 作为一个... | 我想要... | 以便于... | 优先级 |
|----|---------|---------|---------|--------|
| US4.1 | 数据工程师 | 历史数据（无 type 字段）能自动推导领域类型 | 无需手动补充所有旧数据 | P1 |
| US4.2 | 数据工程师 | 分支/循环步骤能自动识别类型 | 无需手动标注每种步骤类型 | P2 |

---

## 3. 功能需求详述

### 3.1 Checkbox 统一（Epic 1, US1.1-US1.2）

**修改文件**: `ComponentSelectionStep.tsx`, `ComponentSelectionStep.module.css`

| 验收条件 | Given | When | Then |
|---------|-------|------|------|
| AC1.1 | 用户在 ComponentSelectionStep | 查看组件列表 | 所有 checkbox 使用 CheckboxIcon 组件，无 emoji |
| AC1.2 | 用户在 ComponentSelectionStep | 查看已选组件列表 | 每个选中项有独立的 CheckboxIcon，无 emoji |
| AC1.3 | 用户点击删除按钮 | 查看组件详情 | 显示 `<button aria-label="删除">` 而非 emoji × |

**实现要点**:
- `CheckboxIcon` 组件已存在于 `components/common/CheckboxIcon.tsx`，直接复用
- 删除按钮使用 SVG XIcon，禁止使用 emoji ×
- 保持现有的 `ariaLabel` 无障碍支持

### 3.2 领域 4 色分组（Epic 1, US1.3-US1.4）

**修改文件**: `canvas.module.css`, `BoundedGroupOverlay.tsx`（如存在）

| 验收条件 | Given | When | Then |
|---------|-------|------|------|
| AC2.1 | 用户打开 Canvas | 查看限界上下文分组 | 分组背景为半透明色（rgba），边框为虚线 |
| AC2.2 | 用户打开 Canvas | 查看分组标签 | 标签显示中文名称（核心域/支撑域/通用域/外部域） |
| AC2.3 | 用户切换到深色模式 | 查看领域分组 | 颜色自动适配，亮度提升，透明度调整 |
| AC2.4 | 分组边框颜色 | 4 种领域类型 | 橙(#F97316)/蓝(#3B82F6)/灰(#6B7280)/紫(#8B5CF6) |

**实现要点**:
- 使用 CSS Custom Properties + `data-type` 属性选择器
- 深色模式通过 `prefers-color-scheme: dark` 媒体查询实现
- 无需新建组件文件，复用现有 overlay 组件

### 3.3 导入预览导航（Epic 2, US2.1-US2.2）

**修改文件**: `example-canvas.json`, `preview/page.tsx`（如需修改）

| 验收条件 | Given | When | Then |
|---------|-------|------|------|
| AC3.1 | 用户导入 example-canvas.json | 导入完成 | 所有 componentNodes 包含 previewUrl 字段 |
| AC3.2 | 用户点击有 previewUrl 的节点 | 点击节点 | URL 跳转到 `/preview?component=<id>` |
| AC3.3 | 用户点击无 previewUrl 的节点 | 点击节点 | 显示 "previewUrl 缺失" 提示（已有降级逻辑） |

**实现要点**:
- `previewUrl` 生成规则: `/preview?component=${nodeId.replace(/^comp-/, '')}`
- 只需修改 JSON 数据文件，无需改动 TSX 代码（降级逻辑已存在）

### 3.4 expand-both 全屏模式（Epic 3, US3.1-US3.2）

**修改文件**: `canvasStore.ts`, `canvas.module.css`, `CanvasPage.tsx`

| 验收条件 | Given | When | Then |
|---------|-------|------|------|
| AC4.1 | 用户在 CanvasPage | 点击全屏按钮 | 左右面板折叠，中间面板占满视口 |
| AC4.2 | 用户在全屏模式 | 点击退出全屏按钮 | 恢复默认三栏布局 |
| AC4.3 | 用户在 expand-both | 切换时 | CSS transition 动画平滑过渡（0.3s） |
| AC4.4 | 移动端 (<768px) | 进入 expand-both | 保持单栏布局，不破坏现有响应式 |

**实现要点**:
- Store 新增 `expandToBoth` 和 `collapseToDefault` actions
- CSS Grid `grid-template-columns` 动态切换
- 按钮图标使用现有的 MaximizeIcon/MinimizeIcon

### 3.5 推导函数（Epic 4, US4.1-US4.2）

**修改文件**: `lib/canvas/utils.ts`（新建）

| 验收条件 | Given | When | Then |
|---------|-------|------|------|
| AC5.1 | 节点有有效 type 字段 | 调用 deriveDomainType | 直接返回该 type |
| AC5.2 | 节点无 type 字段 | 调用 deriveDomainType | 根据关键词推导（如"订单"→core，"通知"→supporting） |
| AC5.3 | 节点无匹配关键词 | 调用 deriveDomainType | 返回默认值 'core' |
| AC5.4 | 步骤无 type 字段 | 调用 deriveStepType | 根据关键词推导（"分支"/"if"→branch，"循环"/"遍历"→loop） |
| AC5.5 | 步骤无匹配关键词 | 调用 deriveStepType | 返回默认值 'normal' |
| AC5.6 | 调用 getDomainLabel | 输入 'core'/'supporting'/'generic'/'external' | 返回 '核心域'/'支撑域'/'通用域'/'外部域' |
| AC5.7 | 调用 getStepTypeInfo | 输入 'branch'/'loop'/'normal' | 返回对应的 label 和 icon |

---

## 4. 非功能需求

| 类别 | 需求 |
|------|------|
| **性能** | utils.ts 推导函数执行时间 < 1ms/节点 |
| **兼容性** | 历史 JSON 数据（无 type 字段）100% 向后兼容 |
| **无障碍** | 所有交互元素必须有 `aria-*` 属性 |
| **测试覆盖** | utils.ts 单元测试覆盖率 > 80%；至少 4 个 E2E 测试用例 |
| **CSS 约束** | 禁止引入新的 CSS 方案（仅 CSS Modules + CSS Custom Properties） |
| **深色模式** | 符合 WCAG AA 对比度要求（4.5:1） |
| **动画** | expand-both 过渡动画时长 0.3s，ease 缓动 |

---

## 5. 验收标准总览

| Epic | 状态 | 关键验收点 |
|------|------|----------|
| Epic 1: 样式系统统一 | 🔄 进行中 | 无 emoji checkbox，4 色领域分组，深色模式适配 |
| Epic 2: 导入导航增强 | 🔄 进行中 | previewUrl 字段存在，点击可跳转 |
| Epic 3: 全屏画布模式 | 🔄 进行中 | expand-both 切换正常，响应式不破坏 |
| Epic 4: 推导能力 | 🔄 进行中 | 推导函数测试通过，向后兼容 |

### 量化验收

```typescript
// E2E 测试断言（Playwright）
expect(page.locator('[data-type="core"]')).toBeVisible();
expect(page.locator('[data-type="supporting"]')).toBeVisible();
expect(page.locator('[data-type="generic"]')).toBeVisible();
expect(page.locator('[data-type="external"]')).toBeVisible();

// 无 emoji 检查
const emojiInComponentSelection = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="component-selection-step"]');
  return (el?.textContent?.match(/[✓○×]/g) || []).length;
});
expect(emojiInComponentSelection).toBe(0);
```

---

## 6. 优先级矩阵

| Story | 价值 | 努力 | 风险 | RICE 分数 | 决策 |
|-------|------|------|------|-----------|------|
| US1.1 Checkbox 统一 | 高 | 低 | 低 | 32 | 🚀 P0 实现 |
| US1.3 领域4色分组 | 高 | 中 | 低 | 24 | 🚀 P0 实现 |
| US2.1 previewUrl 导航 | 高 | 低 | 低 | 32 | 🚀 P0 实现 |
| US3.1 expand-both 全屏 | 中 | 中 | 中 | 16 | P1 下期 |
| US1.4 深色模式 | 中 | 低 | 低 | 24 | P1 与 US1.3 合并 |
| US4.1 推导函数 | 中 | 中 | 低 | 16 | P1 与 US1.3 合并 |
| US2.2 降级提示 | 低 | 低 | 低 | 16 | P1 随 US2.1 |
| US1.2 删除按钮 | 低 | 低 | 低 | 24 | P0 随 US1.1 |
| US3.2 退出全屏 | 中 | 低 | 低 | 24 | P1 随 US3.1 |
| US4.2 步骤类型推导 | 低 | 低 | 低 | 16 | P2 后续迭代 |

---

## 7. 依赖关系

```
开发顺序建议：
1. utils.ts（新建）— 被多处依赖，需优先实现
2. canvas.module.css — CSS 变量定义
3. ComponentSelectionStep.tsx — Checkbox 替换
4. example-canvas.json — previewUrl 补充
5. canvasStore.ts — expand-both action
6. CanvasPage.tsx — 全屏按钮 + data 属性
7. 单元测试 utils.test.ts
8. E2E 测试 canvas-phase1.spec.ts
```

---

*本 PRD 由 PM Agent 生成，基于 Architect Agent 提供的架构文档 `vibex-canvas-evolution.md`。*
