# PRD: vibex-reviewer-proposals-20260324_185417

**项目**: vibex-reviewer-proposals-20260324_185417  
**PM**: PM Agent  
**时间**: 2026-03-24 20:06 (UTC+8)  
**状态**: 进行中  
**依赖上游**: analysis.md (Analyst)  
**目标**: 将 Reviewer 提案转化为可执行 PRD

---

## 1. 执行摘要

Reviewer 提出 4 项提案，聚焦：审查质量量化、敏感信息扫描增强、审查知识库建设、TypeScript 类型安全自动化。与 Dev D-005（JSON Schema）有部分重叠，需合并执行。

### 成功指标
- [ ] 审查报告含量化评分字段
- [ ] 敏感信息检测覆盖 3 类新增场景
- [ ] TS 类型安全无新增 `as any`

---

## 2. 功能需求

### F1: 审查报告质量自动化评分 (P2)

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F1.1 | 5 维度评分字段 | 报告新增：代码覆盖/类型安全/安全合规/规范合规/性能 | `expect(reviewReport.scores).toHaveProperty('coverage', 'typeSafety', 'security', 'compliance', 'performance')` |
| F1.2 | 自动化评分生成 | 评分 ≥ 65% 覆盖率 + 0 危险模式 | `expect(automatedScore).toBeGreaterThanOrEqual(65)` |

**DoD**: 审查报告包含完整 5 维度评分字段，可自动化生成

### F2: 敏感信息扫描增强 (P1)

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F2.1 | 注释中 token 检测 | 扫描代码注释内的敏感信息 | `expect(scanResults.comments).toIncludeSecrets()` |
| F2.2 | .env.example 字段检查 | 验证示例文件无实际值泄露 | `expect(envExample.safe).toBe(true)` |
| F2.3 | process.env 默认值泄露检测 | 检测环境变量默认值安全性 | `expect(processEnvDefaults.safe).toBe(true)` |
| F2.4 | 误报率控制 | 3 类检测误报率 < 5% | `expect(falsePositiveRate).toBeLessThan(5)` |

**DoD**: 新增 3 类敏感信息可被检测，误报率 < 5%

### F3: 审查知识库建设 (P3)

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F3.1 | 目录结构建立 | `review-patterns/{security,typescript,performance}/` | `expect(reviewPatternsDir.exists).toBe(true)` |
| F3.2 | Pattern 模板 | 每个 pattern 含：模式描述 + 危险示例 + 安全示例 + 检查命令 | `expect(pattern.fields).toContainAll(['description', 'dangerousExample', 'safeExample', 'checkCommand'])` |

**DoD**: 每个 pattern 包含完整 4 要素，可直接用于审查

### F4: TypeScript 类型安全自动化检查 (P2)

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F4.1 | tsc 0 errors | TypeScript 编译无错误 | `expect(tscErrors.count).toBe(0)` |
| F4.2 | as any 增量检测 | CI 门禁检测新增 `as any` | `expect(newAsAny.count).toBe(0)` |
| F4.3 | 基线建立 | 当前 `as any` 数量记录为基线 | `expect(asAnyBaseline).toBeDefined()` |

**DoD**: `as any` 数量 ≤ 基线且无新增，tsc 0 errors

---

## 3. Epic 拆分

| Epic | Story | 描述 | 优先级 |
|------|-------|------|--------|
| Epic 1 | S1.1 | 5 维度评分字段 | P2 |
| Epic 1 | S1.2 | 自动化评分生成 | P2 |
| Epic 2 | S2.1 | 注释 token 检测 | P1 |
| Epic 2 | S2.2 | .env.example 检查 | P1 |
| Epic 2 | S2.3 | process.env 检测 | P1 |
| Epic 2 | S2.4 | 误报率控制 | P1 |
| Epic 3 | S3.1 | 目录结构 | P3 |
| Epic 3 | S3.2 | Pattern 模板 | P3 |
| Epic 4 | S4.1 | tsc 0 errors | P2 |
| Epic 4 | S4.2 | as any 增量检测 | P2 |
| Epic 4 | S4.3 | 基线建立 | P2 |

---

## 4. 验收标准汇总

| ID | 验收条件 | 验证方法 | 优先级 |
|----|----------|----------|--------|
| V1 | 报告含 5 维度评分字段 | 代码审查 | P2 |
| V2 | 覆盖率 ≥ 65% + 0 危险模式 | 集成测试 | P2 |
| V3 | 注释/token/.env.example 三类检测通过 | 单元测试 | P1 |
| V4 | 误报率 < 5% | 误报率测试 | P1 |
| V5 | review-patterns 目录完整 | 文件检查 | P3 |
| V6 | 每个 pattern 含 4 要素 | 代码审查 | P3 |
| V7 | tsc 0 errors | CI 门禁 | P2 |
| V8 | as any 无新增 | CI 门禁 | P2 |

---

## 5. 与 Dev D-005 合并

| 提案 | 与 D-005 关系 | 合并策略 |
|------|--------------|----------|
| F2 敏感信息扫描 | 互补（不重叠） | 独立执行 |
| F4 TS 类型安全检查 | 部分重叠 | 合并为同一 Epic，共享 CI 门禁 |

---

## 6. 工时估算

| Epic | Dev | Tester | 总计 |
|------|-----|--------|------|
| Epic 1 | 2h | 1h | ~3h |
| Epic 2 | 2h | 1h | ~3h |
| Epic 3 | 3h | 1h | ~4h |
| Epic 4 | 2h | 1h | ~3h |
| **合计** | **~9h** | **~4h** | **~13h** |
