# PRD: Canvas Epic3 测试补充

> **项目**: canvas-epic3-test-fill
> **创建日期**: 2026-03-30
> **类型**: 测试补充
> **状态**: Draft
> **负责人**: PM Agent

---

## 1. 执行摘要

### 背景
Canvas Epic3 代码已完成但缺少 E2E 测试用例，需要补充测试确保质量。

### 目标
- 测试用例 ≥ 10 个
- 覆盖率 ≥ 80%
- npm test 通过

### 关键指标
| 指标 | 目标 |
|------|------|
| 测试用例数 | ≥ 10 |
| 测试覆盖率 | ≥ 80% |
| npm test | 通过 |

---

## 2. Epic 拆分

### Epic 1: canvas-expand.spec.ts 补充

**目标**: 补充 canvas-expand 测试用例

**故事点**: 4h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F1.1 | 全屏展开测试 | 测试 `expand-both` 模式下三栏同时展开 | `expect(layout).toShowThreeColumns()` | P0 |
| F1.2 | 最大化模式测试 | 测试 `maximize` 模式工具栏隐藏 | `expect(toolbar).toBeHidden()` | P0 |
| F1.3 | F11 快捷键测试 | 测试 F11 进入/退出全屏 | `expect(fullscreen).toToggleOn(F11)` | P0 |
| F1.4 | ESC 退出测试 | 测试 ESC 退出全屏 | `expect(fullscreen).toExitOn(ESC)` | P0 |
| F1.5 | 状态持久化测试 | 测试 localStorage 保存状态 | `expect(localStorage).toContain('fullscreen')` | P0 |

**DoD for Epic 1**:
- [ ] 5 个以上测试用例
- [ ] F11/ESC 快捷键测试
- [ ] 状态持久化测试

---

### Epic 2: 增量测试覆盖

**目标**: 补充增量测试用例

**故事点**: 2h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F2.1 | 交集高亮测试 | 测试虚线框交集高亮 | `expect(highlight).toShowOnOverlap()` | P1 |
| F2.2 | 起止节点标记测试 | 测试起止节点特殊标记 | `expect(startEndMarker).toBeVisible()` | P1 |
| F2.3 | 卡片连线测试 | 测试卡片间连线渲染 | `expect(connector).toBeDrawn()` | P1 |

**DoD for Epic 2**:
- [ ] 3 个以上增量测试用例
- [ ] 覆盖边界情况

---

### Epic 3: 测试验证

**目标**: 确保所有测试通过

**故事点**: 1h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F3.1 | npm test 执行 | 执行 `npm test` | `expect(exit_code).toBe(0)` | P0 |
| F3.2 | 覆盖率检查 | 检查覆盖率报告 | `expect(coverage).toBeGreaterThanOrEqual(80)` | P0 |
| F3.3 | CI 集成 | 确保 CI 中测试通过 | `expect(ci_test).toPass()` | P1 |

**DoD for Epic 3**:
- [ ] npm test 通过
- [ ] 覆盖率 ≥ 80%
- [ ] CI 测试通过

---

## 3. 验收标准汇总

### P0
| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 全屏展开 | expand-both 模式 | 三栏同时展开 |
| AC1.2 | 最大化 | maximize 模式 | 工具栏隐藏 |
| AC1.3 | F11 按键 | 按下 F11 | 进入全屏 |
| AC1.4 | ESC 按键 | 按下 ESC | 退出全屏 |
| AC1.5 | localStorage | 刷新页面 | 全屏状态恢复 |
| AC3.1 | npm test | 执行 | 退出码 0 |
| AC3.2 | 覆盖率 | 检查报告 | ≥ 80% |

### P1
| ID | Given | When | Then |
|----|-------|------|------|
| AC2.1 | 交集高亮 | 重叠卡片 | 显示高亮 |
| AC2.2 | 起止节点 | 流程起止 | 特殊标记可见 |
| AC2.3 | 卡片连线 | 多个卡片 | 连线正确渲染 |

---

## 4. 快速验收单

```bash
# 运行测试
npm test -- --grep "canvas-expand"

# 检查覆盖率
npm test -- --coverage | grep "codecov"

# CI 测试
git push && gitlab-ci || github-actions
```

---

## 5. 工作量估算

| Epic | 工时 |
|------|------|
| Epic 1: canvas-expand.spec.ts 补充 | 4h |
| Epic 2: 增量测试覆盖 | 2h |
| Epic 3: 测试验证 | 1h |
| **总计** | **7h** |

---

**文档版本**: v1.0
**下次审查**: 2026-03-31
