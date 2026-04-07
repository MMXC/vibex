# Epic 11: ADR 规范文档 — Spec

**Epic ID**: E11
**优先级**: P2
**工时**: 1.5h
**页面集成**: docs/adr / CONTRIBUTING.md

---

## 功能点列表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|-------|------|---------|---------|
| E11-S1 | ADR-001 checkbox 语义规范 | 记录 checkbox 在三树中的语义（checked = 选中 / confirmed = 确认） | `docs/adr/ADR-001-checkbox-semantics.md` 存在 | docs/adr/ADR-001-checkbox-semantics.md |
| E11-S2 | PR Review Checklist 纳入 ADR 检查 | PR review checklist 包含 ADR 合规性检查项 | PR checklist 包含 "ADR compliance" 检查项 | CONTRIBUTING.md / .github/pull_request_template.md |

---

## 详细验收条件

### E11-S1: ADR-001 checkbox 语义规范

- [ ] 文件路径：`docs/adr/ADR-001-checkbox-semantics.md`
- [ ] 包含内容：
  - **Title**: ADR-001: Checkbox Semantics in Tree Components
  - **Status**: Accepted
  - **Context**: 三树组件 checkbox 语义不统一的问题
  - **Decision**: checkbox = 选中状态（selected）；confirmed = 确认状态（confirmed，用绿色 ✓ 表示）
  - **Consequences**: 所有新三树实现必须遵循此语义
- [ ] ADR 编号连续（ADR-001, ADR-002...）

### E11-S2: PR Review Checklist 纳入 ADR 检查

- [ ] PR 模板包含「ADR 合规性」检查项
- [ ] 检查项文案：
  ```
  - [ ] ADR 合规性：此 PR 是否遵循已有 ADR 规范？（如涉及新设计决策，是否创建了新的 ADR？）
  ```
- [ ] `CONTRIBUTING.md` PR review 章节包含 ADR 链接

---

## ADR 模板

```markdown
# ADR-XXX: [Title]

**状态**: [Accepted | Deprecated | Superseded by ADR-YYY]

**日期**: YYYY-MM-DD

**决策者**: [团队/个人]

## Context
[问题背景 / 为什么会做这个决定]

## Decision
[最终决定是什么]

## Consequences
### 正面
[好的后果]

### 负面
[不好的后果 / 权衡]

### 备选方案
[考虑过哪些其他方案，为什么没选]
```

---

## 实现注意事项

1. **持续积累**：每个重要设计决策都应创建 ADR
2. **编号连续**：ADR 编号不得重复或跳跃
3. **定期审查**：每个 sprint 回顾时审查 ADR 状态，标记废弃的 ADR
