# Reviewer SOP — 两阶段门禁评审流程

> **版本**: v1.0
> **日期**: 2026-04-05
> **适用范围**: 所有 Vibex 项目 PR / Merge Request

---

## 1. 概述

本 SOP 定义 Reviewer Agent 的两阶段门禁评审流程，确保代码质量、安全性、测试覆盖率在合并前达标。

### 1.1 两阶段定义

| 阶段 | 名称 | 审查者 | 触发时机 |
|------|------|--------|----------|
| **Phase 1** | 门禁检查 | reviewer-entry.sh (自动) | PR 创建/更新 |
| **Phase 2** | 人工复审 | Reviewer Agent | Phase 1 全部通过 |

### 1.2 通过标准

| 门禁 | 必须通过 | 可选通过 |
|------|----------|----------|
| TypeScript | ✅ | - |
| ESLint (0 warnings) | ✅ | - |
| npm audit | - | ⚠️ 高危必须修复 |
| gitleaks | ✅ | - |
| 单元测试 | ✅ | - |
| 覆盖率 ≥ 70% | ✅ | - |

---

## 2. Phase 1: 自动门禁检查

### 2.1 执行方式

```bash
# 在项目根目录执行
bash /root/.openclaw/scripts/reviewer-entry.sh <project> all
```

### 2.2 检查项

#### E1: 代码审查
- TypeScript 类型检查 (`tsc --noEmit`)
- ESLint (`eslint . --max-warnings=0`)
- npm audit (`npm audit --audit-level=high`)
- gitleaks 敏感信息扫描

#### E2: 测试审查
- 单元测试运行 (`pnpm test`)
- 覆盖率阈值检查 (行覆盖 ≥ 70%)
- 测试输出日志

#### E3: 文档审查
- IMPLEMENTATION_PLAN.md 存在
- CHANGELOG.md 存在
- README.md 存在

### 2.3 Phase 1 输出

```
<project>/
├── E1/
│   ├── ts-check.log
│   ├── eslint.log
│   ├── npm-audit.json
│   ├── gitleaks.json
│   └── E1-code-review-summary.md
├── E2/
│   ├── test-output.log
│   └── E2-test-review-summary.md
├── E3/
│   └── E3-doc-review-summary.md
└── review-report.md          ← 综合报告
```

### 2.4 门禁判定

| 结果 | 含义 | 操作 |
|------|------|------|
| 全部 ✅ | 门禁通过 | 进入 Phase 2 |
| ⚠️ 有警告 | 门禁通过（人工确认） | 进入 Phase 2，报告中标注 |
| ❌ 有错误 | 门禁失败 | **阻塞合并**，Dev 修复 |

---

## 3. Phase 2: 人工复审

### 3.1 复审清单

#### 3.1.1 功能审查
- [ ] 新增代码符合功能需求
- [ ] 无逻辑错误或边界条件遗漏
- [ ] 错误处理完整
- [ ] 无调试代码遗留 (console.log / debugger)

#### 3.1.2 安全审查
- [ ] 无硬编码凭证 (API keys, passwords, tokens)
- [ ] 用户输入有验证
- [ ] SQL/命令注入防护
- [ ] 敏感数据未记录日志

#### 3.1.3 架构审查
- [ ] 无循环依赖
- [ ] 无不必要的全局状态
- [ ] 单个文件 ≤ 500 行
- [ ] 遵循现有代码风格

#### 3.1.4 测试审查
- [ ] 新增代码有测试覆盖
- [ ] 断言有意义（非 `toBe(true)` 无说明）
- [ ] 测试描述清晰
- [ ] 边界条件已覆盖

#### 3.1.5 文档审查
- [ ] CHANGELOG.md 已更新
- [ ] 重大变更有说明
- [ ] API 变更有文档

### 3.2 复审结论

| 结论 | 含义 | 操作 |
|------|------|------|
| **Approved** | 审查通过 | 可以合并 |
| **Request Changes** | 需要修改 | Dev 修复后重新审查 |
| **Blocked** | 阻塞（安全问题等） | 必须修复才能继续 |

### 3.3 复审报告格式

```markdown
## Review Report — <project>

### Phase 1 结果
- [E1] TypeScript: ✅ | ESLint: ✅ | npm audit: ⚠️ 3 高危 | gitleaks: ✅
- [E2] Tests: ✅ (24/24 passed) | Coverage: ✅ (78%)
- [E3] IMPLEMENTATION_PLAN: ✅ | CHANGELOG: ✅

### Phase 2 审查
- [功能] ✅
- [安全] ⚠️ 发现 1 处 XSS 风险 (src/components/XssVuln.tsx:42)
- [架构] ✅
- [测试] ✅
- [文档] ✅

### 结论
**Request Changes** — 请修复 XssVuln.tsx 的输入转义后重新审查

### 详细问题
1. **[Medium]** XSS risk in XssVuln.tsx:42 — 用户输入未转义
   - 建议: 使用 DOMPurify 过滤或 React 的 dangerouslySetInnerHTML 替代
```

---

## 4. 特殊场景处理

### 4.1 紧急合并 (Hotfix)
- 绕过 Phase 2 人工复审
- 需在 PR 描述中标注 `[HOTFIX]`
- 事后补全审查

### 4.2 外部依赖安全漏洞
- npm audit 发现的高危漏洞必须修复
- 中/低危漏洞可选择性修复，但需在 PR 中说明原因

### 4.3 测试覆盖率不足
- 低于 70% 阈值时**阻塞合并**
- 允许例外（如纯文档 PR），需在 PR 中标注并经 Reviewer 批准

---

## 5. 工具使用

### 5.1 reviewer-entry.sh
```bash
# 完整检查
bash /root/.openclaw/scripts/reviewer-entry.sh <project> all

# 仅代码审查
bash /root/.openclaw/scripts/reviewer-entry.sh <project> E1

# 跳过安全扫描（不推荐）
bash /root/.openclaw/scripts/reviewer-entry.sh <project> all --skip-security
```

### 5.2 手动审查命令
```bash
# TypeScript
pnpm exec tsc --noEmit

# ESLint
pnpm lint

# 测试
pnpm test

# 覆盖率
pnpm test:coverage

# 安全审计
npm audit --audit-level=high
```

---

*本文档由 Architect Agent 生成 | 2026-04-05*
