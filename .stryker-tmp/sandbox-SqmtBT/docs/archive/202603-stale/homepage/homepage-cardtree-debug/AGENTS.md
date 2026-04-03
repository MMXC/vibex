# AGENTS.md — Agent 职责

**项目**: homepage-cardtree-debug
**Architect**: architect
**日期**: 2026-03-24
**状态**: ✅ 完成

---

## 1. Agent 职责矩阵

| Agent | 职责 | 任务 |
|-------|------|------|
| **dev** | 数据传递 + 本地数据模式 + UI | Phase 1-3 |
| **tester** | E2E 测试 + 构建验证 | Phase 3-4 |
| **reviewer** | 代码审查 | Phase 2-3 |
| **pm** | PM 验收 | Phase 5 |

---

## 2. 验收标准（expect 断言格式）

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | useCardTree=true | PreviewArea | `expect(screen.queryByTestId('card-tree-view')).toBeTruthy()` |
| AC-2 | 输入需求后 | CardTree loaded | `expect(cardTreeNodes.length).toBeGreaterThan(0)` |
| AC-3 | 节点展开 | click | `expect(children.visible).toBe(true)` |
| AC-4 | npm run build | after changes | `expect(exitCode).toBe(0)` |
| AC-5 | npm test | CardTree tests | `expect(failures).toBe(0)` |
| AC-6 | useCardTree=false | Mermaid mode | `expect(screen.queryByTestId('mermaid-preview')).toBeTruthy()` |

---

**AGENTS.md 完成**: 2026-03-24 01:53 (Asia/Shanghai)
