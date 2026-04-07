# 实施计划: vibex-flowtree-step-overflow

> **文档版本**: v1.0
> **创建时间**: 2026-03-29
> **项目状态**: 已完成

---

## 1. 实施概况

| 项目 | 值 |
|------|-----|
| **问题类型** | Bug（CSS 布局） |
| **影响范围** | Canvas 画布页 → FlowCard 展开 → StepsList |
| **严重程度** | P1 |
| **修复方式** | dev 旁路直接修复（commit `510ed216`） |
| **架构审查** | architect 补录产物（本文档） |
| **预计工时** | 5 分钟（dev）+ 10 分钟（architect 审查） |

---

## 2. 实施阶段

### Phase 1: Dev 修复 ✅

**状态**: 已完成

- **Commit**: `510ed216`
- **文件**: `vibex-fronted/src/components/canvas/canvas.module.css`
- **变更**: 删除 3 行 CSS
  - `.flowCard` → 删除 `overflow: hidden`
  - `.stepsList` → 删除 `max-height: 300px`
  - `.stepsList` → 删除 `overflow-y: auto`
- **验证**: `git diff --stat` → `1 file changed, 3 deletions`

### Phase 2: Architect 架构审查 ✅

**状态**: 已完成

- **审查内容**:
  - [x] 确认修复对症根因
  - [x] 评估副作用风险
  - [x] 验证 CSS 规则无副作用
  - [x] 补录架构文档（architecture.md）
  - [x] 补录实施计划（IMPLEMENTATION_PLAN.md）
  - [x] 补录开发约束（AGENTS.md）

### Phase 3: Tester 验收 ⏳

**状态**: 待执行

| 验收项 | 验证方式 | 负责 |
|--------|---------|------|
| FlowCard 展开后高度自适应 | gstack browse 截图 | tester |
| 所有步骤卡片完整展示（3+ 步骤） | gstack browse 截图 | tester |
| 面板整体布局无异常 | gstack browse 截图 | tester |
| npm test 通过 | exec | tester |

### Phase 4: Reviewer 审查 ⏳

**状态**: 待执行

- 审查 commit `510ed216` 代码质量
- 确认无回归风险

---

## 3. 验收标准

| ID | 验收条件 | 验证方式 | 状态 |
|----|---------|---------|------|
| AC-1 | `.flowCard` 不含 `overflow: hidden` | git diff | ✅ |
| AC-2 | `.stepsList` 不含 `max-height: 300px` | git diff | ✅ |
| AC-3 | FlowCard 展开后高度随内容自适应 | gstack browse | ⏳ |
| AC-4 | 所有步骤卡片完整展示（无截断） | gstack browse | ⏳ |
| AC-5 | 面板整体布局无溢出或错位 | gstack browse | ⏳ |
| AC-6 | npm test 通过 | exec | ⏳ |

---

## 4. 后续优化建议

| 优化项 | 描述 | 优先级 |
|--------|------|--------|
| 虚拟滚动 | 步骤 > 10 时考虑虚拟滚动，避免卡片过长 | P3 |
| CSS 审查规范 | Code Review 中增加 `max-height`/`overflow` 组合检查 | P2 |
