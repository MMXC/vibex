# PM Proposals — 2026-04-08

**Prepared by:** PM Agent  
**Date:** 2026-04-08  
**Cycle:** 2026-04-08  
**Based on:** VibeX project审视 (Git history 2026-04-05, FEATURE_REQUESTS.md, Previous PM proposals, recent changelog)

---

## Executive Summary

今日 PM 审视聚焦于 Canvas 画布可用性与 AI 生成管道稳定性。核心发现：
- **P0 Bug**: 组件生成 API (E3) 偶发失败，缺少空数据兜底；删除已选节点功能未绑定
- **P0 Feature Gap**: 模板库缺失，用户冷启动摩擦大（FEATURE_REQUESTS FR-001）
- **P1 UX Debt**: 新手引导断链（FEATURE_REQUESTS FR-009）、项目搜索缺失（FR-010）
- **P2 架构债**: 三树组件各自独立超过 3700 行代码，缺乏统一抽象

---

## 提案列表

| ID | 类别 | 问题/优化点 | 优先级 |
|----|------|-------------|--------|
| P-P0-1 | Bug | 组件树生成空数据兜底缺失，flowId 回退逻辑不健壮 | P0 |
| P-P0-2 | Bug | 删除已选节点功能（deleteSelectedNodes）未绑定到 toolbar 按钮 | P0 |
| P-P1-1 | UX | 新手引导流程缺失，用户进入 Canvas 后不知道从哪开始 | P1 |
| P-P1-2 | UX | 项目搜索/过滤缺失，项目增多后无法快速定位 | P1 |
| P-P1-3 | Feature | 需求模板库缺失，新用户不知道如何描述业务需求 | P1 |
| P-P2-1 | TechDebt | 三树组件各自 >3700 行代码，缺乏统一 DedupeButton 等共享抽象 | P2 |
| P-P2-2 | Feature | Canvas 操作历史（Undo/Redo）功能缺失或不稳定 | P2 |

---

## 详细提案

### P-P0-1: 组件树生成空数据兜底缺失

**问题描述**:
`generateComponents` API 调用后，若返回空数组或网络失败，`componentStore` 没有兜底逻辑。Git history 显示 E3 (`canvas-flowtree-api-fix`) 虽添加了 `flowId` 回退逻辑，但 `flowId = ''` 时仍会调用 API 并显示空结果，用户体验是"点了按钮但什么都没发生"。

**影响范围**:
- 用户在 Flow 阶段勾选了流程，但组件树显示为空
- 错误边界未覆盖 API 失败的场景（HTTP 500/网络超时）
- `componentError` state 虽存在，但未在 UI 层展示为友好提示

**建议方案**:
1. **前端兜底**: `generateComponents` 调用后，检测 `components.length === 0`，显示 EmptyState 而非空树
2. **错误展示**: 将 `componentError` 通过 Toast 通知用户，而非静默失败
3. **重试机制**: EmptyState 组件添加"重试"按钮，允许用户重新触发生成
4. **flowId 验证**: `flowId` 为空时禁用"继续·组件树"按钮，而非发起无效请求

**验收标准**:
- [ ] `flowId` 为空时，"继续·组件树"按钮显示 disabled 状态
- [ ] API 返回空数据时，组件树显示 EmptyState 提示（包含"重试"按钮）
- [ ] API 返回 HTTP 错误时，显示 Toast 错误提示（不超过 5 秒自动消失）
- [ ] E2E 测试：选中 flow → 点击生成组件 → 验证空数据和错误数据的兜底 UI

---

### P-P0-2: 删除已选节点功能未绑定 toolbar 按钮

**问题描述**:
Git commit `573f6e0c` 添加了 `deleteAllNodes` + `replace` 方法（E4），commit `3570e2b7` 添加了 `onDelete` / `onReset` 按钮到 Flow panel 的 TreeToolbar，但 `onDelete` 可能未正确连接到 `canvasApi` 的删除方法。用户点击"删除已选"后没有任何响应。

**影响范围**:
- 三树（Context / Flow / Component）的 TreeToolbar 删除按钮
- 用户误选节点后无法批量清理，造成脏数据残留
- Canvas 删除操作的 AuditTrail（snapshot 记录）可能未触发

**建议方案**:
1. **按钮连接验证**: 确认 `TreeToolbar` 的 `onDelete` prop 正确传递到 `BoundedContextTree` / `BusinessFlowTree` / `ComponentTree`
2. **AuditTrail 验证**: 删除操作必须调用 `recordSnapshot`（commit `0c7c2bb6` 已添加），确保操作可回溯
3. **确认对话框**: 批量删除前弹出确认对话框（防止误操作）
4. **边界条件**: 选中节点为空时禁用删除按钮

**验收标准**:
- [ ] 选中任意节点后，点击 TreeToolbar 删除按钮 → 节点从树中移除（前端）
- [ ] 选中节点后，删除前弹出确认对话框（"确认删除 N 个节点？"）
- [ ] 删除后 Canvas 同步刷新，选中节点消失
- [ ] 删除操作触发 `recordSnapshot`，可在历史中回溯
- [ ] 无选中节点时，删除按钮 disabled
- [ ] E2E 测试：选中 2 个节点 → 点击删除 → 验证节点数量减少

---

### P-P1-1: 新手引导流程缺失

**问题描述**:
用户首次进入 Canvas（`/canvas`）后，看到的是空白的三树面板和一堆按钮，没有引导提示。根据 FEATURE_REQUESTS (FR-009)，这是 P0 级别的新手体验问题。用户不知道：① 输入需求在哪里 ② 勾选节点是什么意思 ③ 三树之间的联动关系。

**影响范围**:
- 所有首次访问 Canvas 的未注册用户（主要转化人群）
- 注册用户首次体验也可能受挫，影响留存
- 用户可能直接放弃而不了解产品价值

**建议方案**:
1. **首次访问引导蒙层**: 检测 `localStorage` 中无 `canvas_onboarded` 标记时，显示引导步骤：
   - Step 1: "在左侧输入你的业务需求"（高亮输入框）
   - Step 2: "点击【继续·上下文树】开始 AI 分析"（高亮按钮）
   - Step 3: "勾选你需要的上下文，继续生成下游"（高亮 TreePanel）
2. **可跳过的引导**: 右上角"跳过引导"按钮，点击后设置 `canvas_onboarded = true`
3. **示例数据入口**: 在引导结束后，提供"体验示例"按钮，加载预设业务场景（如"电商系统"）

**验收标准**:
- [ ] 首次访问 Canvas 显示 3 步引导蒙层
- [ ] 每步有明确的操作引导和箭头指向
- [ ] "跳过引导"按钮可取消蒙层并设置 `localStorage` 标记
- [ ] 刷新页面后引导不重复出现
- [ ] E2E 测试：清除 `canvas_onboarded` → 访问 Canvas → 验证引导出现

---

### P-P1-2: 项目搜索/过滤缺失

**问题描述**:
当用户创建超过 10 个项目后，Dashboard 项目列表无法快速定位目标项目。FEATURE_REQUESTS (FR-010) 定义为 P1。用户只能靠记忆或滚动列表，效率低下。

**影响范围**:
- 拥有多个项目的活跃用户
- 团队协作场景下快速找到共享项目
- 搜索功能是所有 SaaS 的基础期望

**建议方案**:
1. **搜索框**: 在 Dashboard 项目列表顶部添加搜索框（支持项目名模糊匹配）
2. **过滤标签**: 添加筛选器（按创建时间/最近更新时间/类型）
3. **键盘导航**: 搜索结果支持上下键导航 + Enter 选中
4. **空结果处理**: 搜索无结果时显示友好提示 + "创建新项目" 入口

**验收标准**:
- [ ] Dashboard 显示搜索输入框
- [ ] 输入项目名后，列表实时过滤（debounce 300ms）
- [ ] 支持按时间/名称排序
- [ ] 键盘可导航搜索结果
- [ ] 搜索无结果时显示空状态 + 创建入口
- [ ] E2E 测试：创建 5 个项目 → 搜索关键词 → 验证过滤结果正确

---

### P-P1-3: 需求模板库缺失

**问题描述**:
新用户进入产品后，不知道如何描述业务需求。VibeX 的核心价值是"对话式需求分析"，但用户连开场白都不会写。FEATURE_REQUESTS (FR-001) 定义为 P0。当前只有一个空白输入框，没有任何提示。

**影响范围**:
- 所有新用户，尤其是非技术背景的 PM
- 冷启动转化率：用户可能在第一屏就放弃
- 与竞品对比：缺乏模板降低了产品的"Ready to use"感

**建议方案**:
1. **模板选择器**: 在需求输入前，提供 3-5 个行业模板：
   - 🛒 电商系统（商品/订单/支付/物流）
   - 👥 社交平台（用户/内容/关系/消息）
   - 📊 SaaS 管理后台（组织/角色/权限/报表）
   - 🏥 医疗预约系统（患者/医生/预约/处方）
   - 📱 内容发布平台（作者/文章/审核/发布）
2. **模板展开**: 点击模板后，将需求描述填入输入框 + 高亮关键术语
3. **自定义入口**: "自定义需求"按钮跳过模板直接输入
4. **模板存储**: 模板 JSON 存储在 `templates/` 目录，支持热更新

**验收标准**:
- [ ] Canvas 需求输入区显示 ≥3 个模板卡片
- [ ] 点击模板后，输入框自动填充对应需求描述
- [ ] 每个模板有明确的行业图标和简介
- [ ] "自定义需求"可跳过模板
- [ ] 模板可扩展（未来新增模板无需改代码）
- [ ] E2E 测试：访问 Canvas → 点击"电商系统"模板 → 验证输入框内容

---

### P-P2-1: 三树组件代码重复，缺乏共享抽象

**问题描述**:
Git history 显示三树（`BoundedContextTree` / `BusinessFlowTree` / `ComponentTree`）各自独立实现，很多逻辑高度重复：
- `TreeToolbar` 几乎相同但未抽取
- `DedupeButton` 等交互模式在三个组件中各自实现
- 总计超过 3700 行代码，维护成本高

**影响范围**:
- 开发效率：三树改一处需改三处
- Bug 风险：同一逻辑有三个实现，容易出现不一致
- 新人上手成本高

**建议方案**:
1. **抽取 `TreeToolbar` 为独立组件**: 接收 `title` / `onGenerate` / `onDelete` / `onReset` / `disabled` props
2. **抽取 `DedupeButton` 为共享组件**: 三树共用同一去重逻辑
3. **抽取 `useTreeState` 自定义 Hook**: 三树的状态管理逻辑统一到 Hook 中
4. **目标**: 三树组件各自减少 50% 代码量

**验收标准**:
- [ ] `TreeToolbar` 组件提取为独立文件，供三树共用
- [ ] 三树代码行数各自减少 ≥30%
- [ ] 新增 `useTreeState` Hook，替代重复的状态管理代码
- [ ] 现有功能测试通过，无回归

---

### P-P2-2: Canvas 操作历史（Undo/Redo）功能缺失或不稳定

**问题描述**:
Git history 显示 `UndoBar.tsx` 之前有大量 `as any` 类型问题（`vibex-ts-any-cleanup E2`），说明 Undo/Redo 功能可能存在不稳定性。commit `0c7c2bb6` 添加了 `recordSnapshot` 但未验证完整的 Undo/Redo 链路。

**影响范围**:
- 用户操作失误后无法回退，影响用户信心
- 与竞品（低代码平台）对比，功能完整度不足
- Snapshot 机制存在但 UI 不可用

**建议方案**:
1. **UndoBar 集成验证**: 确认 `UndoBar` 组件正确消费 `recordSnapshot` 数据
2. **撤销粒度设计**: 支持按操作类型撤销（节点增删改分类）
3. **Redo 支持**: 撤销后可 redo，恢复到撤销前状态
4. **快捷键支持**: `Ctrl+Z` 撤销，`Ctrl+Shift+Z` 重做
5. **状态可视化**: UndoBar 显示历史步数（"撤销 3 步"）

**验收标准**:
- [ ] Canvas 操作后，UndoBar 显示可用（高亮）
- [ ] 点击"撤销"后，Canvas 状态回退到上一版本
- [ ] 撤销后可"重做"，恢复到撤销前状态
- [ ] `Ctrl+Z` / `Ctrl+Shift+Z` 快捷键正常工作
- [ ] E2E 测试：添加节点 → 撤销 → 验证节点消失 → 重做 → 验证节点恢复

---

*PM Proposals — VibeX — 2026-04-08*
