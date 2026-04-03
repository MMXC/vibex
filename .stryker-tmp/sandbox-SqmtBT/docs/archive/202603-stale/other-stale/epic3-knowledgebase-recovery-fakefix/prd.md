# PRD: Epic3 KnowledgeBase 虚假完成修复 — fakefix

**项目名称**: epic3-knowledgebase-recovery-fakefix  
**版本**: 1.0  
**创建日期**: 2026-03-22  
**类型**: 虚假完成复盘 + 文档补全  
**负责人**: PM Agent

---

## 1. 执行摘要

### 背景
`epic3-knowledgebase-recovery` 项目经历了**两轮虚假完成**，Dev/Test 两个阶段均出现验证失效：

| 阶段 | 问题 | 症状 |
|------|------|------|
| Recovery dev-epic1 | 文件放错位置 | 知识库实现在 `vibex/docs/knowledge/`，但 recovery 项目 docs/ 目录缺少 AGENTS.md / IMPLEMENTATION_PLAN.md |
| Recovery tester-epic1 | 错误测试命令 | `npm test` 但 package.json 中无 test 脚本 → Missing script |
| Recovery reviewer-epic1 | 被阻塞 | 依赖 tester 通过，但 tester 阶段失败 |

**实际状态**：
- ✅ `vibex/docs/knowledge/` 已存在（patterns/ 4个 + templates/ 3个）
- ❌ `docs/epic3-knowledgebase-recovery/AGENTS.md` 不存在
- ❌ `docs/epic3-knowledgebase-recovery/IMPLEMENTATION_PLAN.md` 不存在

### 目标
1. 补全 recovery 项目缺失文档
2. 建立正确的验证方法（文件存在性验证替代 npm test）
3. 制定防止虚假完成的系统性措施

### 成功指标
- `test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/AGENTS.md` → 返回 0
- `test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/IMPLEMENTATION_PLAN.md` → 返回 0
- tester 阶段使用正确的文档项目验证命令（文件存在性），不再依赖 npm test
- 建立提案落地检查清单，包含 expected-location 字段

---

## 2. 问题链路分析

### 2.1 虚假完成传递链

```
epic3-knowledgebase-recovery
  ├─ [Phase 1] analyze-requirements ✅
  ├─ [Phase 2] create-prd ✅ / design-architecture ✅
  ├─ [Phase 3] dev-epic1 ✅ (虚假完成)
  │   ├─ 声称: "knowledge/ patterns 4个 + templates 3个"
  │   ├─ 实际: knowledge/ 在 vibex/docs/knowledge/ ✅
  │   ├─ 但: recovery 项目 docs/ 缺少 AGENTS.md / IMPLEMENTATION_PLAN.md ❌
  │   └─ 根因: Dev 以 vibex 根为上下文，未在 recovery 项目目录创建文档
  ├─ [Phase 4] tester-epic1 ❌
  │   ├─ 命令: npm test -- --coverage=false
  │   ├─ 错误: Missing script: "test"
  │   └─ 根因: AGENTS.md 测试命令模板与文档项目不匹配
  └─ [Phase 5] reviewer-epic1 ⏸ BLOCKED
```

### 2.2 根因分析

| 层级 | 根因 | 类别 |
|------|------|------|
| Layer 1 | Dev 以 vibex 根为上下文创建文件，非 recovery 项目目录 | 执行错误 |
| Layer 2 | AGENTS.md 测试命令从代码项目模板复制，不适用文档项目 | 模板错误 |
| Layer 3 | Verification 只检查文件存在，不检查文件位置 | 机制漏洞 |
| Layer 4 | 缺乏文件位置与项目目录一致性验证 | 机制漏洞 |

---

## 3. 功能需求

### F1: 补全 Recovery 项目缺失文档

| 属性 | 值 |
|------|-----|
| **功能ID** | F1.1 |
| **功能点** | 创建 AGENTS.md 文档 |
| **描述** | 在 `docs/epic3-knowledgebase-recovery/` 目录创建 AGENTS.md，包含项目角色定义、约束、验证方法 |
| **验收标准** | `expect(test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/AGENTS.md).toBe(true)` |
| **DoD** | 文件存在且包含 AGENTS 模板核心字段 |
| **页面集成** | ❌ 无需页面集成 |

| 属性 | 值 |
|------|-----|
| **功能ID** | F1.2 |
| **功能点** | 创建 IMPLEMENTATION_PLAN.md 文档 |
| **描述** | 在 `docs/epic3-knowledgebase-recovery/` 目录创建 IMPLEMENTATION_PLAN.md，包含实施计划与进度跟踪 |
| **验收标准** | `expect(test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/IMPLEMENTATION_PLAN.md).toBe(true)` |
| **DoD** | 文件存在且包含实施计划核心字段 |
| **页面集成** | ❌ 无需页面集成 |

### F2: 修复文档项目验证方法

| 属性 | 值 |
|------|-----|
| **功能ID** | F2.1 |
| **功能点** | 制定文档项目专用验证命令 |
| **描述** | 针对无 package.json 的文档类项目，制定文件存在性验证脚本替代 npm test |
| **验收标准** | AGENTS.md 中测试命令不包含 `npm test`，使用 `test -f` / `ls ... | wc -l` 等文件验证 |
| **DoD** | 验证命令在文档项目目录下执行成功 |
| **页面集成** | ❌ 无需页面集成 |

| 属性 | 值 |
|------|-----|
| **功能ID** | F2.2 |
| **功能点** | 验证知识库 patterns 文件数量 |
| **描述** | 验证 `docs/knowledge/patterns/` 目录包含 ≥4 个非空 .md 文件 |
| **验收标准** | `expect($(ls /root/.openclaw/vibex/docs/knowledge/patterns/*.md 2>/dev/null | wc -l)).toBeGreaterThanOrEqual(4)` |
| **DoD** | patterns/ 目录包含 4 个以上非空 markdown 文件 |
| **页面集成** | ❌ 无需页面集成 |

| 属性 | 值 |
|------|-----|
| **功能ID** | F2.3 |
| **功能点** | 验证知识库 templates 文件数量 |
| **描述** | 验证 `docs/knowledge/templates/` 目录包含 ≥3 个非空 .md 文件 |
| **验收标准** | `expect($(ls /root/.openclaw/vibex/docs/knowledge/templates/*.md 2>/dev/null | wc -l)).toBeGreaterThanOrEqual(3)` |
| **DoD** | templates/ 目录包含 3 个以上非空 markdown 文件 |
| **页面集成** | ❌ 无需页面集成 |

### F3: 防止虚假完成机制

| 属性 | 值 |
|------|-----|
| **功能ID** | F3.1 |
| **功能点** | 建立提案落地检查清单 |
| **描述** | 在 `vibex-proposals-YYYYMMDD` 提案流程中增加 expected-location 字段，验证时检查文件是否在正确位置 |
| **验收标准** | 提案文档包含 expected-location 字段，且验证时检查该路径 |
| **DoD** | 提案 → 落地 检查链完整 |
| **页面集成** | ❌ 无需页面集成 |

| 属性 | 值 |
|------|-----|
| **功能ID** | F3.2 |
| **功能点** | Workspace 约束显式化 |
| **描述** | 在 team-tasks 任务约束中明确 workspace 字段，Dev 必须在指定 workspace 创建文件 |
| **验收标准** | team-tasks 任务约束包含 workspace 字段，验证时对比实际创建位置 |
| **DoD** | workspace 约束存在且可被验证 |
| **页面集成** | ❌ 无需页面集成 |

---

## 4. Epic 拆分

### Epic 1: Recovery 文档补全
**目标**: 补全 epic3-knowledgebase-recovery 项目缺失的 AGENTS.md 和 IMPLEMENTATION_PLAN.md

| Story ID | Story 名称 | 验收标准 |
|----------|-----------|----------|
| S1.1 | 创建 AGENTS.md | `test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/AGENTS.md` → 0 |
| S1.2 | 创建 IMPLEMENTATION_PLAN.md | `test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/IMPLEMENTATION_PLAN.md` → 0 |
| S1.3 | 验证 specs/ 目录存在 | `test -d /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/specs/` → 0 |

### Epic 2: 文档项目验证方法修复
**目标**: 修复 AGENTS.md 中的测试命令，使用文件存在性验证替代 npm test

| Story ID | Story 名称 | 验收标准 |
|----------|-----------|----------|
| S2.1 | 更新 AGENTS.md 测试命令 | AGENTS.md 不含 `npm test`，使用 `test -f` 验证 |
| S2.2 | 验证 patterns ≥4 非空文件 | `expect($(ls docs/knowledge/patterns/*.md | wc -l)).toBeGreaterThanOrEqual(4)` |
| S2.3 | 验证 templates ≥3 非空文件 | `expect($(ls docs/knowledge/templates/*.md | wc -l)).toBeGreaterThanOrEqual(3)` |

### Epic 3: 防止虚假完成系统性措施
**目标**: 在提案流程和 team-tasks 中建立防虚假完成机制

| Story ID | Story 名称 | 验收标准 |
|----------|-----------|----------|
| S3.1 | 建立提案 expected-location 字段 | 提案包含 expected-location 且验证通过 |
| S3.2 | 明确 workspace 约束 | team-tasks 任务约束包含 workspace 字段 |

---

## 5. UI/UX 流程

本次修复不涉及前端 UI/UX 变更，纯后台文档补全与流程改进。

---

## 6. 验收标准汇总

### P0（必须完成）
| ID | 验收项 | 验证命令 |
|----|--------|----------|
| AC-P0-1 | AGENTS.md 存在 | `test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/AGENTS.md` |
| AC-P0-2 | IMPLEMENTATION_PLAN.md 存在 | `test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/IMPLEMENTATION_PLAN.md` |
| AC-P0-3 | specs/ 目录存在 | `test -d /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/specs/` |
| AC-P0-4 | patterns ≥4 非空文件 | `[ "$(ls /root/.openclaw/vibex/docs/knowledge/patterns/*.md 2>/dev/null | wc -l)" -ge 4 ]` |
| AC-P0-5 | templates ≥3 非空文件 | `[ "$(ls /root/.openclaw/vibex/docs/knowledge/templates/*.md 2>/dev/null | wc -l)" -ge 3 ]` |

### P1（建议完成）
| ID | 验收项 | 验证命令 |
|----|--------|----------|
| AC-P1-1 | AGENTS.md 测试命令正确 | `grep -q "npm test" /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/AGENTS.md` → 不应匹配 |
| AC-P1-2 | 提案包含 expected-location | 提案 markdown 包含 `expected-location:` 字段 |

---

## 7. 非功能需求

| 需求类型 | 描述 |
|----------|------|
| **可验证性** | 每个功能点有明确的 `expect()` 断言 |
| **可回滚** | 文档补全操作不影响已存在的知识库内容 |
| **防复发** | 建立 expected-location 和 workspace 约束机制 |

---

## 8. 实施计划

| 阶段 | 任务 | 产出 |
|------|------|------|
| 阶段一 | 分析现有问题 | analysis.md ✅ |
| 阶段二 | 编写 PRD | 本文档 |
| 阶段三 | 补全 AGENTS.md | 文档创建 |
| 阶段四 | 补全 IMPLEMENTATION_PLAN.md | 文档创建 |
| 阶段五 | 验证知识库内容 | 4 patterns + 3 templates |
| 阶段六 | 建立防虚假完成机制 | 检查清单 + 约束字段 |

---

## 9. 依赖项

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| `vibex/docs/knowledge/` 内容 | ✅ 已知存在 | patterns/ 4个 + templates/ 3个 |
| `vibex/docs/epic3-knowledgebase-recovery/` 目录 | ✅ 已知存在 | analysis.md + specs/ 已存在 |
| team-tasks 更新权限 | ✅ 可用 | task_manager.py |

---

## 10. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Dev 再次在错误位置创建文件 | 虚假完成复发 | 明确 workspace 约束 + expected-location 验证 |
| tester 继续使用 npm test | 测试失败 | AGENTS.md 中明确文档项目使用文件验证 |
| 未来提案缺少 expected-location | 位置混淆 | 在提案模板中强制添加该字段 |

---

*PRD 版本: 1.0 | 编写: PM Agent | 2026-03-22*
