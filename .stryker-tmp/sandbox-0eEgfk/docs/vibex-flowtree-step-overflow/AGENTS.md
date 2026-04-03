# AGENTS.md - 开发约束

> **项目**: vibex-flowtree-step-overflow
> **问题类型**: CSS Bug 修复
> **修复状态**: 已实施（commit `510ed216`）

---

## 🔴 红线约束

### 禁止事项
- ❌ **禁止修改** `.flowCard` 的 `overflow` 属性（除非移除 `hidden`）
- ❌ **禁止修改** `.stepsList` 的 `max-height` / `overflow-y`（除非移除约束）
- ❌ **禁止添加** 新的 CSS 规则到 `canvas.module.css`
- ❌ **禁止修改** 组件 JSX 结构（本次修复为纯 CSS）
- ❌ **禁止硬编码** 高度值

### 强制事项
- ✅ 仅删除 CSS，不新增
- ✅ 测试验证需使用 gstack browse 截图对比
- ✅ npm test 必须通过
- ✅ git diff 验证仅 3 行变更

---

## 👥 角色约束

### dev
- 仅执行 PRD 中定义的功能点（F1、F2）
- 提交信息格式：`fix: <描述>`
- 修改文件仅限 `canvas.module.css`

### tester
- 使用 gstack browse 验证截图（修复前后对比）
- 验证 `npm test` 通过
- 验证面板整体布局无异常

### reviewer
- 确认 diff 仅 3 行删除
- 确认无副作用
- 确认无新 CSS 规则引入

---

## 📁 文件路径

```
vibex-fronted/src/components/canvas/canvas.module.css
```

## 验证检查清单

- [ ] `git diff` 仅 3 行删除
- [ ] `npm test -- --testPathPattern="canvas"` 通过
- [ ] gstack browse 截图：FlowCard 展开高度自适应
- [ ] gstack browse 截图：所有步骤卡片完整展示（3+ 步骤）
- [ ] gstack browse 截图：面板整体布局无异常
