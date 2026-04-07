# PRD: Epic3 知识库虚假完成修复

**项目名称**: vibex-proposals-20260322-epic3-fix  
**版本**: 1.0  
**创建日期**: 2026-03-22  
**类型**: 验证假象修复 (Verification Illusion Fix)  
**负责人**: PM Agent

---

## 1. 执行摘要

### 背景
Epic3 知识库（Knowledge Base）在 `vibex-proposals-20260322` 项目中被标记为 ✅ 完成（Story F3.1/F3.2/F3.3），但实际目录创建位置错误：

| 检查项 | 预期位置 | 实际位置 | 状态 |
|--------|----------|----------|------|
| `knowledge/` 目录 | `/root/.openclaw/vibex/docs/knowledge/` | 不存在 | ❌ |
| `patterns/` ≥4 文件 | 同上 | 不存在 | ❌ |
| `templates/` ≥3 文件 | 同上 | 不存在 | ❌ |
| `README.md` | 同上 | 不存在 | ❌ |
| **实际内容位置** | — | `/root/.openclaw/workspace-analyst/knowledge/` | ✅ |

### 目标
将知识库内容从 `workspace-analyst` 迁移到 `vibex` workspace 的正确位置，修复验证假象。

### 成功指标
- `test -d /root/.openclaw/vibex/docs/knowledge/` → 返回 0
- `ls /root/.openclaw/vibex/docs/knowledge/patterns/` 包含 ≥4 个 pattern 文件
- `ls /root/.openclaw/vibex/docs/knowledge/templates/` 包含 ≥3 个 template 文件
- `test -f /root/.openclaw/vibex/docs/knowledge/README.md` → 返回 0

---

## 2. 问题分析（来自 analysis.md）

### 根因
1. **workspace 混淆**: Analyst Agent 在 `/root/.openclaw/workspace-analyst/` 中创建了知识库，而非 vibex 项目 workspace
2. **验证不完整**: team-tasks 验证仅检查 `analysis.md` 存在，未检查 `knowledge/` 目录位置
3. **Commit 验证缺失**: 没有通过 git commit 验证实际文件创建

### 影响
- PRD 标记完成但功能不可访问
- vibex 项目无法引用知识库内容
- 未来开发者可能继续引用错误路径

---

## 3. 功能需求

### F1: 知识库目录迁移
| 属性 | 值 |
|------|-----|
| **功能ID** | F1.1 |
| **功能点** | 将 `knowledge/` 目录完整迁移到 vibex workspace |
| **描述** | 将 `/root/.openclaw/workspace-analyst/knowledge/` 下的 `patterns/`、`templates/`、`README.md` 复制到 `/root/.openclaw/vibex/docs/knowledge/` |
| **验收标准** | `test -d /root/.openclaw/vibex/docs/knowledge/ && [ -d /root/.openclaw/vibex/docs/knowledge/patterns ] && [ -d /root/.openclaw/vibex/docs/knowledge/templates ] && [ -f /root/.openclaw/vibex/docs/knowledge/README.md ]` → 返回 0 |
| **DoD** | cp 命令执行成功，目标路径下所有文件可读 |
| **页面集成** | ❌ 无需页面集成 |

### F2: Pattern 文件完整性验证
| 属性 | 值 |
|------|-----|
| **功能ID** | F2.1 |
| **功能点** | 验证 patterns/ 目录包含所有必需的 pattern 文件 |
| **描述** | 确认从 analyst workspace 迁移过来的 ≥4 个 pattern 文件全部存在于正确路径 |
| **验收标准** | `expect($(ls /root/.openclaw/vibex/docs/knowledge/patterns/ | wc -l).toBeGreaterThanOrEqual(4))` |
| **DoD** | `ls /root/.openclaw/vibex/docs/knowledge/patterns/` 输出 ≥4 个文件 |
| **页面集成** | ❌ 无需页面集成 |

### F3: Template 文件完整性验证
| 属性 | 值 |
|------|-----|
| **功能ID** | F3.1 |
| **功能点** | 验证 templates/ 目录包含所有必需的 template 文件 |
| **描述** | 确认从 analyst workspace 迁移过来的 ≥3 个 template 文件全部存在于正确路径 |
| **验收标准** | `expect($(ls /root/.openclaw/vibex/docs/knowledge/templates/ | wc -l).toBeGreaterThanOrEqual(3))` |
| **DoD** | `ls /root/.openclaw/vibex/docs/knowledge/templates/` 输出 ≥3 个文件 |
| **页面集成** | ❌ 无需页面集成 |

### F4: README 存在性验证
| 属性 | 值 |
|------|-----|
| **功能ID** | F4.1 |
| **功能点** | 验证 README.md 存在于正确位置 |
| **描述** | 确认 README.md 从 analyst workspace 迁移到 vibex workspace |
| **验收标准** | `expect(test -f /root/.openclaw/vibex/docs/knowledge/README.md).toBe(true)` |
| **DoD** | `test -f /root/.openclaw/vibex/docs/knowledge/README.md` 返回 0 |
| **页面集成** | ❌ 无需页面集成 |

### F5: Analyst Workspace 副本保留
| 属性 | 值 |
|------|-----|
| **功能ID** | F5.1 |
| **功能点** | 决定 analyst workspace 知识库副本保留策略 |
| **描述** | analyst workspace 中的 knowledge/ 目录保留副本，不删除，避免知识丢失 |
| **验收标准** | `expect(test -d /root/.openclaw/workspace-analyst/knowledge/).toBe(true)` |
| **DoD** | analyst workspace knowledge/ 目录保持不变 |
| **页面集成** | ❌ 无需页面集成 |

---

## 4. Epic 拆分

### Epic 1: 知识库迁移实施
**目标**: 将知识库内容迁移到 vibex workspace 正确位置

| Story ID | Story 名称 | 验收标准 |
|----------|-----------|----------|
| S1.1 | 创建目标目录结构 | `mkdir -p /root/.openclaw/vibex/docs/knowledge/patterns /root/.openclaw/vibex/docs/knowledge/templates` 成功 |
| S1.2 | 复制 patterns/ 内容 | `cp -r /root/.openclaw/workspace-analyst/knowledge/patterns/* /root/.openclaw/vibex/docs/knowledge/patterns/` 成功 |
| S1.3 | 复制 templates/ 内容 | `cp -r /root/.openclaw/workspace-analyst/knowledge/templates/* /root/.openclaw/vibex/docs/knowledge/templates/` 成功 |
| S1.4 | 复制 README.md | `cp /root/.openclaw/workspace-analyst/knowledge/README.md /root/.openclaw/vibex/docs/knowledge/` 成功 |

### Epic 2: 完整性验证
**目标**: 验证所有迁移文件数量和内容符合预期

| Story ID | Story 名称 | 验收标准 |
|----------|-----------|----------|
| S2.1 | 验证 patterns/ 文件数量 | `expect($(ls /root/.openclaw/vibex/docs/knowledge/patterns/ | wc -l).toBeGreaterThanOrEqual(4))` |
| S2.2 | 验证 templates/ 文件数量 | `expect($(ls /root/.openclaw/vibex/docs/knowledge/templates/ | wc -l).toBeGreaterThanOrEqual(3))` |
| S2.3 | 验证 README.md 存在 | `expect(test -f /root/.openclaw/vibex/docs/knowledge/README.md).toBe(true)` |

### Epic 3: Workspace 策略确认
**目标**: 明确 analyst workspace 知识库的处理策略

| Story ID | Story 名称 | 验收标准 |
|----------|-----------|----------|
| S3.1 | 确认 analyst 副本保留 | analyst workspace knowledge/ 目录保持不变 |
| S3.2 | 文档化未来 Workspace 约束 | 创建 workspace 约束文档，防止复发 |

---

## 5. UI/UX 流程

本次修复不涉及前端 UI/UX 变更，纯后台文件系统迁移与验证。

---

## 6. 验收标准汇总

### P0（必须完成）
| ID | 验收项 | 验证命令 |
|----|--------|----------|
| AC-P0-1 | `knowledge/` 目录存在于 vibex docs | `test -d /root/.openclaw/vibex/docs/knowledge/` |
| AC-P0-2 | `patterns/` ≥4 文件 | `expect($(ls /root/.openclaw/vibex/docs/knowledge/patterns/ | wc -l) -ge 4)` |
| AC-P0-3 | `templates/` ≥3 文件 | `expect($(ls /root/.openclaw/vibex/docs/knowledge/templates/ | wc -l) -ge 3)` |
| AC-P0-4 | README.md 存在 | `test -f /root/.openclaw/vibex/docs/knowledge/README.md` |

### P1（建议完成）
| ID | 验收项 | 验证命令 |
|----|--------|----------|
| AC-P1-1 | 迁移后 analyst workspace 副本保留 | `test -d /root/.openclaw/workspace-analyst/knowledge/` |

---

## 7. 非功能需求

| 需求类型 | 描述 |
|----------|------|
| **可靠性** | 迁移操作使用 `cp -r` 确保递归复制完整 |
| **原子性** | 迁移完成后立即执行验证，发现缺失立即告警 |
| **可回滚** | analyst workspace 保留副本，支持重新迁移 |
| **防复发** | 后续知识库相关任务需指定 `workspace: vibex` 约束 |

---

## 8. 实施计划

| 阶段 | 任务 | 产出 |
|------|------|------|
| 阶段一 | 读取 analysis.md，理解问题 | 分析报告已存在 ✅ |
| 阶段二 | 编写 PRD | 本文档 |
| 阶段三 | 执行迁移 | 知识库迁移到正确位置 |
| 阶段四 | 验证完整性 | 所有 AC 通过 |
| 阶段五 | 更新任务状态 | team-tasks 标记完成 |

---

## 9. 依赖项

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| analyst workspace knowledge/ 内容 | ✅ 已知存在 | `/root/.openclaw/workspace-analyst/knowledge/` |
| vibex workspace 写权限 | ✅ 已有 | /root/.openclaw/vibex/docs/ 可写 |
| team-tasks 验证脚本 | ✅ 可用 | task_manager.py 支持状态更新 |

---

## 10. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| analyst workspace 知识库被删除 | 无法迁移 | 迁移前先验证副本存在 |
| 文件名冲突覆盖 | 数据丢失 | 使用 `cp -i` 提示确认，或 `cp -n` 不覆盖 |
| 未来 workspace 混淆复发 | 重复修复 | 在 team-tasks 任务约束中明确 workspace 字段 |

---

*PRD 版本: 1.0 | 编写: PM Agent | 2026-03-22*
