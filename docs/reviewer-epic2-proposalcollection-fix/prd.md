# PRD: reviewer-epic2-proposalcollection-fix — reviewer 提案路径修复

**状态**: Draft  
**版本**: 1.0  
**日期**: 2026-03-23  
**PM**: PM Agent  
**目标**: 修复 reviewer 提案路径不匹配问题，确保协调层可见

---

## 1. 执行摘要

### 问题
reviewer agent 在 2026-03-23 提案自检中，将提案文件保存到了错误的路径：
- **预期**：`/root/.openclaw/vibex/docs/proposals/20260323/reviewer.md`
- **实际**：`/root/.openclaw/workspace-reviewer/proposals/20260323/reviewer-self-check.md`

导致 `proposals-summary-20260323.md` 中 reviewer 状态显示"⚠️ 未知"。

### 根因
reviewer workspace 隔离 vs 共享存储路径契约不明确。

### 目标
1. 立即修复：补录提案到正确路径
2. 防止回退：修改 reviewer heartbeat 脚本强制路径契约
3. 验证：确保汇总脚本可见

---

## 2. Epic 拆分

### Epic 1: 立即修复 — 补录提案到正确路径
**目标**: 将 reviewer 提案立即同步到协调层可见路径

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S1.1 | 复制 `workspace-reviewer/proposals/20260323/reviewer-self-check.md` 到 `vibex/docs/proposals/20260323/reviewer.md` | ✅ `test -f /root/.openclaw/vibex/docs/proposals/20260323/reviewer.md` |
| S1.2 | 更新 `proposals-summary-20260323.md` 中 reviewer 状态为 ✅ | ✅ `grep -q "reviewer.*✅" /root/.openclaw/vibex/docs/proposals/summary/proposals-summary-20260323.md` |
| S1.3 | 验证复制后的文件内容与原始文件一致 | ✅ `diff workspace-reviewer/proposals/20260323/reviewer-self-check.md vibex/docs/proposals/20260323/reviewer.md` 无输出 |

**DoD**: 提案文件在 vibex 共享目录存在，汇总脚本可见。

---

### Epic 2: 路径契约强制化 — 修改 reviewer heartbeat 脚本
**目标**: 修改 reviewer 心跳脚本，确保未来提案写入正确路径

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S2.1 | 找到 reviewer heartbeat 脚本的提案收集代码 | ✅ `grep -n "proposal\|PROPOSAL\|proposals" /root/.openclaw/scripts/heartbeats/reviewer-heartbeat.sh` 有输出 |
| S2.2 | 修改脚本：定义 `PROPOSAL_OUT` 变量指向 `vibex/docs/proposals/$(date +%Y%m%d)/reviewer.md` | ✅ `grep -q "vibex/docs/proposals" /root/.openclaw/scripts/heartbeats/reviewer-heartbeat.sh` |
| S2.3 | 修改脚本：提案写入前创建目录 `mkdir -p "$(dirname "$PROPOSAL_OUT")"` | ✅ 脚本包含目录创建逻辑 |
| S2.4 | 修改后脚本语法检查通过 | ✅ `bash -n /root/.openclaw/scripts/heartbeats/reviewer-heartbeat.sh` 退出码 0 |

**DoD**: reviewer heartbeat 脚本写入 vibex 共享路径，经语法验证。

---

### Epic 3: 验证修复效果
**目标**: 确保修复有效，汇总脚本能感知 reviewer 提案

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S3.1 | `proposals-summary-20260323.md` 中 reviewer 行状态为 ✅ | ✅ `grep "reviewer.*✅" proposals-summary-20260323.md` 有输出 |
| S3.2 | reviewer 提案内容在汇总中完整（包含 Epic 完成状态、SSE 延迟建议等） | ✅ `grep -q "Epic.*完成\|SSE" proposals-summary-20260323.md` |
| S3.3 | coord 协调层感知 reviewer 提案为"已提交"（非"⚠️ 未知"） | ✅ `grep -v "⚠️" proposals-summary-20260323.md \| grep reviewer` |

**DoD**: 协调层正确感知 reviewer 提案状态。

---

### Epic 4: 防止回退 — 建立跨 agent 路径规范
**目标**: 定义统一的提案路径规范，防止类似问题在其他 agent 重现

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S4.1 | 更新 reviewer heartbeat 脚本：添加注释说明路径契约 | ✅ 脚本包含 `# Proposals must be saved to vibex/docs/proposals/YYYYMMDD/reviewer.md` 注释 |
| S4.2 | 将路径契约写入 `docs/AGENT_CONVENTIONS.md`（如不存在则创建） | ✅ `test -f docs/AGENT_CONVENTIONS.md` 且包含提案路径规范 |
| S4.3 | 其他 agent（dev, architect）heartbeat 脚本包含相同路径契约注释 | ✅ `grep -l "vibex/docs/proposals" /root/.openclaw/scripts/heartbeats/*-heartbeat.sh` 数量 ≥ 2 |

**DoD**: 路径规范文档化，其他 agent 可见。

---

## 3. 验收标准（expect 断言格式）

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | 原始文件存在 | 执行复制命令 | `expect(fs.existsSync('/root/.openclaw/vibex/docs/proposals/20260323/reviewer.md')).toBe(true)` |
| AC-2 | proposals-summary 文件 | `grep reviewer` | `expect(output).toMatch(/reviewer.*✅/)` |
| AC-3 | reviewer heartbeat 脚本 | `bash -n` 语法检查 | `expect(exitCode).toBe(0)` |
| AC-4 | 脚本执行后 | 检查 `vibex/docs/proposals/20260324/` | `expect(fs.existsSync('vibex/docs/proposals/' + today + '/reviewer.md')).toBe(true)` |
| AC-5 | AGENT_CONVENTIONS.md | 内容检查 | `expect(content).toMatch(/proposals.*YYYYMMDD.*agent.*md/)` |

---

## 4. 非功能需求

| 类别 | 要求 |
|------|------|
| **安全性** | reviewer agent 对 vibex/docs/ 有写入权限 |
| **可维护性** | 路径契约有注释说明，文档化 |
| **向后兼容** | workspace 本地副本保留，脚本可同时写入两处 |
| **可验证性** | 修复效果可通过单条命令验证 |

---

## 5. 实施计划

| 阶段 | 内容 | 负责 |
|------|------|------|
| Phase 1 | 立即修复：复制提案 + 更新汇总 | Dev |
| Phase 2 | 修改 reviewer heartbeat 脚本 | Dev |
| Phase 3 | 验证修复：汇总脚本可见性 | PM/Coord |
| Phase 4 | 文档化路径规范 | PM |

---

## 6. 风险与缓解

| 风险 | 影响 | 概率 | 缓解 |
|------|------|------|------|
| reviewer 无 vibex 写权限 | 高 | 低 | 修改前验证 `test -w vibex/docs/` |
| 脚本语法错误 | 高 | 低 | `bash -n` 验证后再部署 |
| 其他 agent 未同步规范 | 中 | 中 | 统一在 AGENT_CONVENTIONS.md 中声明 |

---

*PRD v1.0 — 2026-03-23*
