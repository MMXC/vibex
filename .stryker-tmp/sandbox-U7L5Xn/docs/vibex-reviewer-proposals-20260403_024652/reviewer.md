# Reviewer 提案 — canvas-json-persistence 审查总结与改进建议

**日期**: 2026-04-03
**提案人**: reviewer
**项目**: canvas-json-persistence (已完成 Epic1/2/3 审查)

---

## 背景

canvas-json-persistence 项目 Epic1/2 经历了 3 轮审查（E1 两轮，E2 两轮），Epic3 至今 4 轮仍在 CHANGELOG 问题中打转。核心问题是 CHANGELOG 更新流程不规范。

---

## 问题识别

### P0 — 必须修复

#### 1. CHANGELOG 管理机制缺陷

**问题描述**:
- Backend 有独立 CHANGELOG (`vibex-backend/CHANGELOG.md`)
- Frontend 有两个位置：根目录 Markdown (`vibex-fronted/CHANGELOG.md`) 和 App 页面 (`src/app/changelog/page.tsx`)
- Dev 常只更新一个位置，遗漏其他位置导致驳回
- Epic1/2/3 均因 CHANGELOG 遗漏至少经历一次额外审查轮次

**影响**: 每次多浪费 1 轮审查周期，影响交付效率

**根因**: CHANGELOG 分散在多个文件，无统一规范

**建议修复方案**:
- 统一 CHANGELOG 策略：只保留 `vibex-fronted/CHANGELOG.md`（根目录 Markdown），App 页面作为自动渲染（从同一文件生成）
- 或者明确规定：Backend 功能只更新 `vibex-backend/CHANGELOG.md`，Frontend 功能只更新 `vibex-fronted/CHANGELOG.md`，禁止混写
- Reviewer 审查清单中增加 CHANGELOG 检查项，明确指出哪个文件需要更新

#### 2. Epic3 E3 CHANGELOG 遗漏（持续 4 轮）

**问题描述**:
- 88a038f6 将 App 页面当成 CHANGELOG.md 更新，但根目录 `vibex-fronted/CHANGELOG.md` 仍未更新
- Coord 和 Reviewer 对"CHANGELOG"的理解不一致

**建议修复方案**:
- 在 AGENTS.md 中明确定义 CHANGELOG 路径
- 示例约束: `❌ 必须更新 vibex-fronted/CHANGELOG.md（根目录 Markdown 文件）`

---

### P1 — 应该修复

#### 3. 测试覆盖缺口

**问题描述**:
- Epic1 migration 测试文件存在但版本过时（测试 v1 而非 v4）
- Epic3 的 useAutoSave 测试仅 6 个用例，SaveIndicator 仅 7 个

**建议修复方案**:
- Epic1 测试应更新为覆盖 v4 migration 逻辑
- Epic3 测试应增加边界用例（null projectId, network error, concurrent saves）

#### 4. 审查流程效率

**问题描述**:
- 每轮审查 + 驳回 + 修复 = 至少 2 次来回
- Epic1/2 各 2 轮，Epic3 目前 4+ 轮

**建议修复方案**:
- Dev 提交前自查清单（CHANGELOG 检查项）
- Reviewer 驳回时提供完整的修复命令，减少沟通轮次

---

## 提案汇总

| ID | 问题 | 类型 | 优先级 | 影响 |
|----|------|------|--------|------|
| P0-1 | CHANGELOG 分散在多处 | 流程 | P0 | 效率损失 |
| P0-2 | E3 CHANGELOG 遗漏 | Bug | P0 | 交付阻塞 |
| P1-1 | 测试覆盖不足 | 质量 | P1 | 潜在 bug |
| P1-2 | 审查流程效率低 | 流程 | P1 | 交付周期 |

---

## 验收标准

- [ ] AGENTS.md 中明确定义 CHANGELOG 路径规范
- [ ] P0-1 和 P0-2 修复后，Epic3 通过审查
- [ ] Epic1 测试更新为覆盖 v4 migration
