# PRD: reviewer-epic2-fix — reviewer 提案路径修复（合并版）

**状态**: Draft  
**版本**: 1.0  
**日期**: 2026-03-23  
**PM**: PM Agent  
**目标**: 修复 reviewer 提案路径不匹配问题（同 `reviewer-epic2-proposalcollection-fix`）

---

> ⚠️ **注意**: 本项目与 `reviewer-epic2-proposalcollection-fix` 目标完全重复。完整方案见上游项目 PRD。
> 本文档为合并精简版，复用上游产出，唯一新增任务见 Epic 4。

---

## 1. 执行摘要

### 问题（同上游）
reviewer 提案保存路径与协调层期望路径不匹配，导致汇总可见性失败。

### 上游产出复用
| 上游项目 | 产出 | 状态 |
|----------|------|------|
| `reviewer-epic2-proposalcollection-fix` | PRD (4 Epic) | ✅ |
| `reviewer-epic2-proposalcollection-fix` | Architecture | ✅ |
| `dev-fix-reviewscript` | Heartbeat 脚本修改 | ✅ |
| `reviewer-epic2-proposalcollection-fix` | Epic 1-3 方案 | ✅ |

### 本项目增量
完成剩余的 `dev-epic2-reimplement` 任务，验证修复闭环。

---

## 2. Epic 拆分（复用 + 增量）

### Epic 1: 立即修复（复用上游）
**来源**: `reviewer-epic2-proposalcollection-fix/prd.md` Epic 1  
**状态**: ✅ 已完成

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S1.1 | 提案复制到正确路径 | `expect(fs.existsSync('vibex/docs/proposals/20260323/reviewer.md')).toBe(true)` |
| S1.2 | 汇总状态更新为 ✅ | `expect(grep('proposals-summary-20260323.md', 'reviewer')).toMatch(/✅/)` |
| S1.3 | 内容一致性验证 | `expect(diff(orig, copy)).toBe('')` |

---

### Epic 2: 路径契约强制化（复用上游）
**来源**: `reviewer-epic2-proposalcollection-fix/prd.md` Epic 2  
**状态**: ✅ 已完成（dev-fix-reviewscript 脚本已修改）

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S2.1 | Heartbeat 脚本包含路径变量 | `expect(grep('reviewer-heartbeat.sh', 'vibex/docs/proposals')).toBeTruthy()` |
| S2.2 | 目录创建逻辑存在 | `expect(grep('reviewer-heartbeat.sh', 'mkdir -p')).toBeTruthy()` |
| S2.3 | 语法检查通过 | `expect(exec('bash -n reviewer-heartbeat.sh').exitCode).toBe(0)` |

---

### Epic 3: 验证修复效果（复用上游）
**来源**: `reviewer-epic2-proposalcollection-fix/prd.md` Epic 3  
**状态**: 🔄 待验证

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S3.1 | proposals-summary 中 reviewer 为 ✅ | `expect(grep('summary', 'reviewer.*✅')).toBeTruthy()` |
| S3.2 | 提案内容完整（含 Epic/SSE 建议）| `expect(grep('summary', 'Epic.*完成\|SSE')).toBeTruthy()` |
| S3.3 | coord 感知为"已提交"非"⚠️ 未知" | `expect(grep('summary', 'reviewer.*⚠️')).toBeFalsy()` |

---

### Epic 4: 剩余任务执行（增量）
**状态**: ⬜ 待执行（`dev-epic2-reimplement`）

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S4.1 | 执行 `dev-epic2-reimplement` | ✅ `task_manager.py status` 显示 done |
| S4.2 | 最终验证汇总脚本可见性 | ✅ `proposals-summary` 中 reviewer 行无 ⚠️ |

**DoD**: 所有 Epic 验收标准通过，`dev-epic2-reimplement` 任务完成。

---

## 3. 验收标准（expect 断言格式）

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | proposals-summary 文件 | `grep reviewer` | `expect(output).toMatch(/reviewer.*✅/)` |
| AC-2 | `dev-epic2-reimplement` 任务 | `task_manager.py status` | `expect(status).toBe('done')` |
| AC-3 | proposals-summary | `grep reviewer` | `expect(output).not.toMatch(/⚠️/)` |
| AC-4 | 今日（20260324） | reviewer 心跳后 | `expect(fs.existsSync('vibex/docs/proposals/20260324/reviewer.md')).toBe(true)` |
| AC-5 | reviewer-heartbeat.sh | `bash -n` | `expect(exitCode).toBe(0)` |

---

## 4. 非功能需求

| 类别 | 要求 |
|------|------|
| **复用性** | 上游 PRD 复用，避免重复产出 |
| **可验证性** | 单一命令验证修复效果 |
| **可维护性** | 路径契约已在 heartbeat 脚本中声明 |

---

## 5. 实施计划

| 阶段 | 内容 | 负责 | 状态 |
|------|------|------|------|
| Phase 1 | Epic 1-2 已完成（复用） | — | ✅ |
| Phase 2 | Epic 3 验证 | PM | 🔄 |
| Phase 3 | Epic 4 执行 `dev-epic2-reimplement` | Dev | ⬜ |
| Phase 4 | 最终验收 | PM/Coord | ⬜ |

---

*PRD v1.0 — 2026-03-23（合并精简版，复用上游产出）*
