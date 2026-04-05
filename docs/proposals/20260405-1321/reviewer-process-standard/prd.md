# PRD: Reviewer Process Standardization

> **项目**: reviewer-process-standard  
> **目标**: 统一代码审查流程和报告格式  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
代码审查流程存在多层不一致：入口分散（ce:review skill vs 心跳脚本）、报告格式混乱（review.md vs review-report.md）、安全扫描时机不统一。

### 目标
- P0: 统一评审入口（单一入口）
- P1: 统一报告格式
- P1: 标准化安全扫描流程
- P2: 文档化两阶段门禁 SOP

### 成功指标
- AC1: 单一评审入口存在
- AC2: 报告格式统一
- AC3: 安全扫描自动化

---

## 2. Epic 拆分

| Epic | 名称 | 优先级 | 工时 |
|------|------|--------|------|
| E1 | 统一评审入口 | P0 | 2h |
| E2 | 报告格式标准化 | P1 | 1h |
| E3 | 安全扫描流程 | P1 | 1h |
| E4 | 两阶段门禁 SOP | P2 | 1h |
| **合计** | | | **5h** |

---

### E1: 统一评审入口

**问题根因**: ce:review skill 与 reviewer 心跳脚本并行，reviewer 实际使用心跳脚本。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 统一入口脚本 | 2h | 单一入口存在 ✓ |

**验收标准**:
- `expect(entryPoint).toBeDefined()` ✓
- `expect(entryPoint).toContain('reviewer')` ✓

---

### E2: 报告格式标准化

**问题根因**: review.md / review-report.md / proposals/*/reviewer.md 并存。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 统一报告模板 | 1h | 格式统一 ✓ |

**验收标准**:
- `expect(reportFormat).toMatch(/\{\{template\}\}/)` ✓
- 模板包含所有必需字段 ✓

---

### E3: 安全扫描流程

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | 自动化安全扫描 | 1h | CI 集成 ✓ |

**验收标准**:
- `expect(ci.includes('npm audit')).toBe(true)` ✓
- `expect(ci.includes('gitleaks')).toBe(true)` ✓

---

### E4: 两阶段门禁 SOP

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | SOP 文档 | 1h | 文档存在 ✓ |

**验收标准**:
- `expect(sopDoc).toContain('Phase 1')` ✓
- `expect(sopDoc).toContain('Phase 2')` ✓

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 统一评审入口 | E1 | expect(entryPoint).toBeDefined() | 无 |
| F2.1 | 报告模板 | E2 | expect(template).toMatch(/\{\{.*\}\}/) | 无 |
| F3.1 | CI 安全扫描 | E3 | expect(ci).toContain('audit') | 无 |
| F4.1 | SOP 文档 | E4 | expect(sop).toBeDefined() | 无 |

---

## 4. DoD

- [ ] 单一评审入口脚本存在
- [ ] 报告模板标准化
- [ ] CI 集成安全扫描
- [ ] 两阶段门禁 SOP 文档

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
