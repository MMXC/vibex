# AGENTS.md: vibex-homepage-module-fix

## 任务分配

| Agent | 阶段 | 任务 | 依赖 |
|-------|------|------|------|
| analyst | 1 | 需求分析，根因定位 | — |
| pm | 2 | PRD 细化，Epic/Story 拆分 | analyst |
| **architect** | 3 | 架构设计，技术方案 | pm |
| dev | 4 | Phase 1 快速修复 + Phase 2 源码修改 | architect, tester |
| tester | 5 | 测试用例修复，验证稳定性 | dev |
| reviewer | 6 | 代码审查，最终验收 | tester |
| coord | 决策 | 判断是否进入 Phase 2 | architect |

---

## Architect 职责（当前阶段）

### 产出物
- `docs/docs/vibex-homepage-module-fix/architecture.md` — 技术方案
- `docs/docs/vibex-homepage-module-fix/IMPLEMENTATION_PLAN.md` — 执行计划
- `docs/docs/vibex-homepage-module-fix/AGENTS.md` — 任务分配表（本文档）

### 技术结论

**根因**：CSS Module 哈希类名硬编码导致测试脆弱

**方案**：
- Phase 1: 用 `[class*="container"]` 等通用选择器替代哈希类名（无需改源码）
- Phase 2: 添加 `data-testid` 稳定锚点 + PageObject 模式

**验证**：4 个测试用例通过 + 连续 3 次构建后测试仍稳定

---

## Dev 任务清单

### Phase 1（立即执行，30 分钟）
- [ ] 修改 `step-switch.spec.ts` 选择器
- [ ] 运行 Playwright 测试验证通过
- [ ] 提交 PR 并通知 tester

### Phase 2（需 coord 确认，2 小时）
- [ ] 添加 `data-testid` 到 `Steps.tsx`
- [ ] 添加 `data-testid` 到 `PreviewArea.tsx`
- [ ] 添加 `data-testid` 到 `ActionButtons.tsx`
- [ ] 更新 `step-switch.spec.ts` 使用 `data-testid`
- [ ] 创建 `StepSwitchPage.ts` PageObject
- [ ] 验证所有相关测试通过

---

## Tester 验证清单

### 测试用例覆盖
- [ ] T2.3.1: Step navigation visible
- [ ] T2.3.2: Switching step updates preview area
- [ ] T2.3.3: Step switching supports undo operation
- [ ] T2.3.4: Switching to same step is no-op
- [ ] T2.3.5: Accessing final step without data
- [ ] T2.3.6: Generate button exists and clickable
- [ ] T2.3.7: Can navigate back to previous step

### 稳定性验证
- [ ] 连续 3 次构建测试套件均通过
- [ ] CSS Module 哈希变化后测试仍通过

---

## Reviewer 审查清单

- [ ] 选择器修复符合 Playwright 最佳实践
- [ ] `data-testid` 命名语义清晰、无重复
- [ ] PageObject 模式正确使用
- [ ] 未引入新的脆弱选择器
- [ ] 测试覆盖度满足要求
