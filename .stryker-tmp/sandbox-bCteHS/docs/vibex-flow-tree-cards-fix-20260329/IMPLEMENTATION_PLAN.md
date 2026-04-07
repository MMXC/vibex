# Vibex 流程树卡片显示 Bug 修复 — 实施计划

**项目**: vibex-flow-tree-cards-fix-20260329  
**文档类型**: 实施计划  
**日期**: 2026-03-29  
**状态**: ✅ 已实施

---

## 📋 实施状态总览

| 步骤 | 动作 | 状态 | 备注 |
|------|------|------|------|
| Step 1 | 确认修复目标文件 | ✅ | canvas.module.css |
| Step 2 | 确认 CSS 修改 | ✅ | commit `510ed216` 已应用 |
| Step 3 | QA 验证 | 🔄 待执行 | 8 项回归检查 |
| Step 4 | 合并上线 | ⏳ 待触发 | 依赖 QA 通过 |

---

## 🔧 修复详情

### 修改文件

**文件**: `vibex-fronted/src/components/canvas/canvas.module.css`

**变更**:

```diff
@@ .flowCard (line ~1180)
-.flowCard {
-  overflow: hidden;          ← 删除
-}
+.flowCard { /* overflow: hidden 已移除 */ }

@@ .stepsList (line ~1287)
-.stepsList {
-  max-height: 300px;         ← 删除
-  overflow-y: auto;          ← 删除
-}
+.stepsList { /* 高度限制已移除 */ }
```

**已验证**: 修改已提交至 `510ed216`

---

## ✅ 回归检查清单（8 项）

### Pre-flight 检查

- [ ] `git status` 确认 working tree 干净
- [ ] `git log -1 --oneline` 确认最新提交为 `510ed216`
- [ ] `npm run build`（或 `npm run dev`）无报错

### 视觉与交互验证（使用 gstack browse）

| # | 检查项 | 验收标准 | 通过 |
|---|--------|---------|------|
| 1 | 流程树展开/收起功能正常 | 点击展开按钮显示 `.stepsList`，再次点击收起 | ☐ |
| 2 | 流程卡片虚线框样式正常 | border-radius 8px、border 2px dashed、背景色 `#secondary` | ☐ |
| 3 | **展开含 3+ 步骤的卡片，虚线框高度自适应** | 虚线框高度 = header + stepsList，无截断，底部卡片可点击 | ☐ |
| 4 | 步骤拖拽排序功能正常 | 拖拽步骤到新位置，DOM 顺序和 UI 均正确更新 | ☐ |
| 5 | 添加步骤按钮功能正常 | 点击"添加步骤"后，新步骤行出现在列表底部 | ☐ |
| 6 | 收起流程卡片后，容器高度正常回缩 | 收起后虚线框高度 ≈ header 高度，无多余空白 | ☐ |
| 7 | 多流程卡片同时存在时布局正常 | 多个 `.flowCard` 并列，无重叠、无溢出 | ☐ |
| 8 | 大量步骤（20+）滚动验证 | `.flowList` 滚动可查看全部内容，无截断 | ☐ |

### 边界条件检查

- [ ] 展开 → 收起 → 展开循环 5 次，行为一致
- [ ] 无 `console.error` 或 React 警告
- [ ] 页面 resize 后布局正常

---

## 📦 后续步骤

```
当前状态: ✅ 修复已提交 (510ed216)
     │
     ▼
  QA 验证 → 8 项回归检查清单全部通过
     │
     ▼
  Review → Reviewer 确认修改范围合理
     │
     ▼
  合并 → PR 合并至 main/master
     │
     ▼
  完成
```

---

## 📝 实施记录

| 字段 | 值 |
|------|---|
| 提交 SHA | `510ed216` |
| 提交时间 | 2026-03-29 11:02 (GMT+8) |
| 提交者 | dev agent |
| 修改文件 | 1 文件（canvas.module.css） |
| 删除行数 | 3 行 |
| 测试覆盖 | 0 → 8 项回归检查 |
| 预计工时 | ~20 分钟 |
