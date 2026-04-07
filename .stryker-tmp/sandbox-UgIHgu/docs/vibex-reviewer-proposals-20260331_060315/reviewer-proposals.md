# Reviewer 提案 — 2026-03-31

**Agent**: reviewer
**日期**: 2026-03-31
**项目**: proposals
**仓库**: /root/.openclaw/workspace-reviewer

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | bug | test-e2e-ignore-pattern 冲突 | vibex-fronted/测试 | P0 |
| P002 | improvement | 审查报告自动归档机制 | reviewer/协作 | P1 |
| P003 | improvement | E2E 测试稳定性提升 | canvas/E2E | P1 |

---

## 2. 提案详情

### P001: test-e2e-ignore-pattern 冲突

**问题描述**: E2E 测试文件 `canvas-expand.spec.ts` 存在于两个位置：
- `tests/e2e/` (Jest 忽略)
- `e2e/` (Playwright 忽略)

ESLint 忽略 `tests/e2e/` 路径导致 Playwright 测试文件无法被 ESLint 检查。

**根因分析**: ESLint 和 Playwright 使用不同的 ignore patterns，未对齐

**影响范围**: vibex-fronted 所有 E2E 测试

**建议方案**: 
1. 统一 E2E 测试目录为 `e2e/`
2. 删除 `tests/e2e/` 中的 Playwright 测试
3. 更新 ESLint ignore pattern

**验收标准**: E2E 测试文件可被 ESLint 检查，Playwright 可独立运行

**工作量**: 0.5h

---

### P002: 审查报告自动归档机制

**问题描述**: 审查报告分散在多个位置（`docs/review-reports/`、`proposals/`），且命名不统一（`review-epic1.md`、`reviewer-epic1-PASSED.md`）

**根因分析**: 无审查报告归档 SOP

**影响范围**: reviewer 所有审查任务

**建议方案**: 
在 `docs/review-reports/` 下按项目名归档：
```
docs/review-reports/
├── 20260331/
│   ├── canvas-epic3-test-fill-epic1.md
│   ├── canvas-epic3-test-fill-epic2.md
│   └── canvas-selection-filter-bug-epic1.md
```

**验收标准**: 任何审查报告可在 3 秒内找到

**工作量**: 1h

---

### P003: E2E 测试稳定性提升

**问题描述**: E2E 测试中存在 flaky 测试（`E2.2-2` 报告 1 flaky test），影响 CI 可靠性

**根因分析**: 
1. 测试依赖 `waitForTimeout(2000)` 等固定等待
2. 无重试机制

**影响范围**: canvas E2E 测试

**建议方案**: 
1. 使用 `waitForSelector` 替代固定等待
2. 添加 Playwright test retries 配置
3. 为 flaky 测试添加 `test.flaky()` 标记

**验收标准**: E2E 测试 flaky rate < 1%

**工作量**: 2h

---

## 3. 审查统计 (2026-03-31)

| 指标 | 数值 |
|------|------|
| 审查任务数 | 3 |
| PASSED | 3 |
| 驳回 | 0 |
| changelog 遗漏 | 1 (Epic1) |

**已审查项目**:
- canvas-epic3-test-fill (Epic1, Epic2)
- canvas-selection-filter-bug (Epic1)

---

## 4. 审查能力提升

**已掌握**:
- E2E + 组件测试双重验证
- 审查 → changelog → push 标准化流程
- team-tasks CLI 状态管理

**待提升**:
- gstack browse 实际页面验证（当前仅依赖测试）
- 覆盖率门禁自动化

---

*文档版本: v1.0*
*下次审查: 2026-04-01*
