# PRD: vibex-internal-tools

**Project**: vibex-internal-tools  
**Stage**: create-prd  
**PM**: PM  
**Date**: 2026-04-07  
**Status**: Draft

---

## 1. 执行摘要

### 背景

当前项目存在三个内部工具问题：
1. **Reviewer Dedup 未集成** — 提案去重工具未被集成到 reviewer agent 工作流，可能导致重复项目被批准
2. **Tester Loop 缺失** — 缺少自动化 retry 机制，flaky-detector 有 bug 且未集成到 CI
3. **Test Commands 碎片化** — npm scripts 重复别名多、命名歧义、职责边界不清

### 目标

| 主题 | 目标 | 推荐方案 |
|------|------|----------|
| Reviewer Dedup | 集成 dedup 到 reviewer 工作流 | Option A: 轻量集成 |
| Tester Loop | 修复 flaky-detector + 标准化 CI retry | Option A: 修复 + 标准化 |
| Test Commands | 清理重复 + 语义化重命名 | Option A: 清理 + 重命名 |

### 成功指标

| 指标 | 目标值 |
|------|--------|
| Reviewer Dedup | dedup 检查自动触发，severity=high 时评审意见包含警告 |
| Tester Loop | flaky-detector 正常生成报告，CI 内置 retry=2 |
| Test Commands | 无重复别名，命名语义化，入口统一 |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 描述 | 工时 | 优先级 | Stories |
|------|------|------|--------|---------|
| E1 | Reviewer Dedup 集成 | 1.5h | P0 | S1.1, S1.2 |
| E2 | Tester Loop 修复 | 2.5h | P0 | S2.1, S2.2, S2.3 |
| E3 | Test Commands 清理 | 1.5h | P1 | S3.1, S3.2, S3.3 |
| E4 | 文档更新 | 0.5h | P1 | S4.1 |

**总工时**: 6h

---

### Epic 1: Reviewer Dedup 集成

**目标**: 将提案去重工具集成到 reviewer agent 工作流，实现自动检查和告警。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | dedup 集成到 reviewer prompt | 0.5h | reviewer 评审时调用 dedup 脚本 |
| S1.2 | dedup 结果写入任务 JSON | 1h | 任务 JSON 包含 dedup 字段 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | reviewer dedup 调用 | reviewer agent 评审时自动调用 `check_with_rules()` | `expect(reviewerOutput).toContain('dedup')` | 【需页面集成】reviewer prompt |
| F1.2 | dedup 告警 | severity=high 时评审意见包含 "⚠️ 潜在重复项目" | `expect(意见).toMatch(/⚠️ 潜在重复项目/)` | 否 |
| F1.3 | dedup 结果写入 JSON | dedup 结果写入任务 JSON 的 `dedup` 字段 | `expect(taskJson.dedup).toBeDefined()` | 【需页面集成】task_manager.py |

---

### Epic 2: Tester Loop 修复

**目标**: 修复 flaky-detector bug，标准化 CI retry 策略。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 修复 flaky-detector | 修复 Python 分析逻辑（改用文件传递参数） | flaky-tests.json 正常生成 |
| S2.2 | CI retry 策略 | Playwright 内置 retry=2 | CI 配置正确 |
| S2.3 | 测试失败分类 | 区分 flaky vs 真失败 | 失败报告包含分类 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 修复 flaky-detector | Python 分析逻辑改用文件传递参数，生成 flaky-tests.json | `expect(flakyTests).toBeValidJson()` | 否 |
| F2.2 | CI playwright retry | Playwright 配置 `retries: 2` | `expect(config.retries).toBe(2)` | 否 |
| F2.3 | 失败分类报告 | 失败输出包含 flaky/real-failure 分类 | `expect(report).toMatch(/flaky|real failure/)` | 否 |
| F2.4 | CI 集成 | flaky-detector 在 CI 中触发 | `expect(CI_JOB).toContain('flaky-detector')` | 否 |

---

### Epic 3: Test Commands 清理

**目标**: 清理重复别名，语义化重命名，统一入口。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | 删除重复别名 | 删除 test/vitest/pretest-check 等重复别名 | package.json 无重复 |
| S3.2 | 语义化重命名 | test:contract → test:unit:verbose | npm run test:contract 删除 |
| S3.3 | 职责边界清理 | test:notify 移入 scripts/test/ | npm scripts 无 test:notify |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 删除重复别名 | test/test:unit/vitest 只保留 test:unit | `expect(scripts.test).toBeUndefined()` | 否 |
| F3.2 | test:contract 重命名 | 删除 test:contract，保留 test:unit:verbose | `expect(scripts['test:contract']).toBeUndefined()` | 否 |
| F3.3 | test:notify 移除 | test:notify 从 npm scripts 移入 scripts/test/ | `expect(scripts['test:notify']).toBeUndefined()` | 否 |
| F3.4 | pretest 保留 | pretest 保留（作为唯一 pre-test 入口） | `expect(scripts.pretest).toBeDefined()` | 否 |

---

### Epic 4: 文档更新

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | CONTRIBUTING.md 更新 | 更新 scripts 文档，附上关系图 | 文档包含关系图 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | CONTRIBUTING.md scripts 关系图 | 文档包含 scripts 关系图 | `expect(doc).toMatch(/关系图/)` | 否 |

---

## 3. 验收标准汇总

| ID | Given | When | Then | 优先级 |
|----|-------|------|------|--------|
| AC1 | reviewer 评审提案 | dedup 有 match | 评审意见包含 "⚠️ 潜在重复项目" | P0 |
| AC2 | dedup 检查完成 | 任意情况 | 任务 JSON 包含 dedup 字段 | P0 |
| AC3 | 运行 flaky-detector | 分析完成 | flaky-tests.json 正常生成 | P0 |
| AC4 | CI Playwright 配置 | 检查配置 | retries: 2 | P0 |
| AC5 | 测试失败报告 | 查看报告 | 包含 flaky/real-failure 分类 | P0 |
| AC6 | package.json | 清理后 | 无 test/vitest/pretest-check 重复 | P1 |
| AC7 | package.json | 清理后 | 无 test:contract | P1 |
| AC8 | package.json | 清理后 | 无 test:notify | P1 |
| AC9 | CONTRIBUTING.md | 更新后 | 包含 scripts 关系图 | P1 |

---

## 4. DoD (Definition of Done)

### 代码完成标准

- [ ] reviewer agent 调用 dedup 脚本，输出包含 dedup 结果
- [ ] dedup 结果写入任务 JSON 的 `dedup` 字段
- [ ] flaky-detector.py 修复，flaky-tests.json 正常生成
- [ ] Playwright CI 配置 `retries: 2`
- [ ] package.json 删除重复别名（test/vitest/pretest-check）
- [ ] package.json 删除 test:contract
- [ ] package.json 移除 test:notify（保留 scripts/test/notify.js）
- [ ] CONTRIBUTING.md 更新 scripts 关系图

### 测试完成标准

- [ ] reviewer dedup 集成测试（mock dedup 输出）
- [ ] flaky-detector 输出验证测试
- [ ] package.json scripts 清理验证

---

## 5. 依赖

| 依赖 | 说明 | 状态 |
|------|------|------|
| dedup.py | 已有，需集成 | 已存在 |
| dedup_rules.py | 已有，需集成 | 已存在 |
| flaky-detector.sh | 已有，需修复 | 有 bug |
| test-stability-report.sh | 已有 | 已存在 |
| package.json | 修改 | 已存在 |

---

## 6. 实施计划

| 阶段 | 内容 | 工时 | 输出 |
|------|------|------|------|
| Phase 1 | Reviewer Dedup 集成 | 1.5h | reviewer prompt + task_manager.py |
| Phase 2 | Tester Loop 修复 | 2.5h | flaky-detector.py + CI config |
| Phase 3 | Test Commands 清理 | 1.5h | package.json |
| Phase 4 | 文档更新 | 0.5h | CONTRIBUTING.md |
| **Total** | | **6h** | |

---

*PRD Version: 1.0*  
*Created by: PM Agent*  
*Last Updated: 2026-04-07*
