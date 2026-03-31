# Tester 提案 — 测试质量与自动化改进

**Agent**: tester
**日期**: 2026-03-30
**项目**: proposals
**仓库**: /root/.openclaw/vibex
**远程**: git@github.com:MMXC/vibex.git

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | feat | 建立 E2E Playwright 测试规范 | canvas/e2e | P1 |
| P002 | feat | CI 测试质量 Gate 机制 | ci/testing | P1 |
| P003 | process | 测试报告标准化与告警 | testing/reporting | P2 |

---

## 2. 提案详情

### P001: 建立 E2E Playwright 测试规范

**问题描述**:
当前 Canvas 功能依赖单元测试 + 人工验证，F11/ESC 等键盘快捷键在 useEffect 中实现，单元测试无法覆盖。人工验证成本高且易遗漏。

**根因分析**:
缺少 headless 浏览器级别的 E2E 测试基础设施，无法验证真实的用户交互路径。

**影响范围**:
Canvas 全流程交互、快捷键、模态框等 UI 行为。

**建议方案**:
1. 在 `vibex-fronted/e2e/` 建立 Playwright 测试目录
2. 覆盖关键路径：F11 全屏、ESC 退出、Click outside 退出、Checkbox toggle
3. 接入 CI，blocking merge on E2E failure
4. 工作量：6h

**验收标准**:
- 至少 5 个 E2E 测试用例覆盖核心交互
- CI pipeline 中 E2E 测试失败则 blocking merge
- 测试报告自动生成截图附件

---

### P002: CI 测试质量 Gate 机制

**问题描述**:
当前 npm test 通过率依赖人工巡检，测试通过率下降时发现滞后（约 4-8h）。测试失败传播到生产环境的风险高。

**根因分析**:
缺少 CI 级别的测试质量 gate，当覆盖率低于阈值或 suite 失败时不自动告警。

**影响范围**:
全部 240+ 测试 suites，任何回归都会影响。

**建议方案**:
1. 在 CI 中集成测试质量 gate：
   - 任何 suite 失败 → blocking merge + Slack @tester @dev
   - 覆盖率 < 80% → Slack 告警
   - 覆盖率下降 > 5% → blocking merge
2. 每日生成测试健康度报告到 #tester-channel
3. 工作量：3h

**验收标准**:
- CI 中测试失败时 Slack 通知 < 5 分钟
- 覆盖率 < 80% 自动 blocking merge
- 每日测试健康度报告

---

### P003: 测试报告标准化与告警

**问题描述**:
当前测试报告格式不统一，tester 人工整理报告成本高。不同项目的测试结果无法横向比较。

**根因分析**:
缺少统一的测试报告模板和自动化报告生成工具。

**影响范围**:
所有 agent 的测试报告，影响团队协作效率。

**建议方案**:
1. 建立标准化测试报告模板（JSON + Markdown）
2. 在 `task_manager.py` 中增加 `test-report` 命令，自动生成测试结果摘要
3. 报告包含：pass/fail count、coverage diff、performance metrics
4. 工作量：4h

**验收标准**:
- `task_manager.py test-report <project>` 输出标准化报告
- 报告包含所有关键指标
- 与 team-tasks 集成，报告自动归档

---

## 3. 实施计划

| 阶段 | 内容 | 工作量 | 依赖 |
|------|------|--------|------|
| Phase 1 | E2E Playwright 基础设施 + 5 个核心测试 | 6h | P002 |
| Phase 2 | CI 测试质量 Gate | 3h | — |
| Phase 3 | 测试报告标准化 | 4h | P002 |

---

## 4. 当前测试状态

| 指标 | 值 |
|------|-----|
| Unit tests | 240+ suites |
| Canvas tests | 530+ tests |
| E2E tests | 0 (缺失) |
| Coverage | ~63% |

---

**提交时间**: 2026-03-30 21:35 GMT+8
