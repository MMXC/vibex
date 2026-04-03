# Canvas 卡片 Checkbox UX 问题分析

## 问题列表

### 问题 1: ContextTree 卡片 UI 问题
**来源**: 小羊反馈 (2026-04-02)

**现状问题**:
1. `<div class="nodeTypeBadge">核心</div>` - 核心/边缘类型标签多余，应移除
2. checkbox 应与标题 h4 并行显示（同一行），而不是在标题上方
3. `<span class="confirmedBadge">` 勾选标记多余（边框颜色已表示确认状态）
4. 所有卡片勾选不是 toggle，需要修复

**涉及文件**: 
- `BoundedContextTree.tsx`

**验收标准**:
- [ ] nodeTypeBadge 已移除
- [ ] checkbox 与标题同行显示
- [ ] confirmedBadge 已移除（边框颜色表示确认状态）
- [ ] checkbox 点击可正常切换状态

### 问题 2: 流程树卡片子步骤勾选逻辑
**来源**: 小羊反馈 (2026-04-02)

**现状问题**:
- 流程树卡片内子流程步骤应跟随流程卡片 checkbox 一起确认
- 不需要单独勾选步骤
- 勾选后步骤确认应该是 0/3 到 3/3
- 现在勾选卡片后步骤依旧是 0/3

**涉及文件**:
- `BusinessFlowTree.tsx`

**验收标准**:
- [ ] 勾选流程卡片时，子步骤同步确认（0/3 → 3/3）
- [ ] 不需要单独勾选子步骤
- [ ] 取消勾选时子步骤同步取消

**技术分析**:
- 需要在 `BusinessFlowTree` 组件中实现联动逻辑
- 卡片 checkbox 状态变化时，批量更新子步骤的 confirmed 状态
- 后端可能需要同步更新 API 支持

## 实施计划

### Epic 1: ContextTree 卡片 UI 修复
- 移除 nodeTypeBadge
- 调整 checkbox 与标题同行
- 移除 confirmedBadge
- 修复 checkbox toggle 逻辑

### Epic 2: 流程树卡片联动逻辑
- 分析 BusinessFlowTree 组件结构
- 实现 checkbox 与子步骤联动
- 后端 API 支持（如需要）
- 测试验证 0/3 → 3/3 逻辑
