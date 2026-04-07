# PRD: proposals-20260401-4 — Sprint 4 扫尾 + 稳定性加固

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

Batches 1-3 全部完成（proposals-20260401 / -2 / -3 共 17 个 Epic）。Sprint 3 E4 Accessibility 测试揭示两个真实 Bug：Canvas 运行时崩溃（Critical）+ 颜色对比度违规（Serious）。20260324 遗留的 E2E 稳定性问题仍未彻底解决。

### 目标

修复 Canvas 运行时崩溃、消除 Accessibility 违规、建立稳定的 E2E 测试基线。总工时 9h。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| Canvas 崩溃率 | < 0.1% | ErrorBoundary 错误日志 |
| Accessibility 违规 | Critical/Serious 0 条 | axe-core 报告 |
| E2E 稳定性 | 连续 3 次运行结果一致 | CI 重复运行 |
| Playwright browser | 已安装，测试可执行 | `npx playwright install --check` |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 工时 | 优先级 | 依赖 | 产出文件 |
|------|------|------|--------|------|----------|
| E1 | Canvas 运行时崩溃修复 | 3h | P0 | 无 | specs/e1-canvas-crash-fix.md |
| E2 | 颜色对比度 WCAG 2.1 AA 修复 | 4h | P1 | 无 | specs/e2-color-contrast.md |
| E3 | E2E 测试稳定性加固 | 2h | P1 | 无 | specs/e3-e2e-stability.md |

**总工时**: 9h（约 0.5 周 1 人月）

---

### Epic 1: Canvas 运行时崩溃修复

**工时**: 3h | **优先级**: P0 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E1-S1 | 根因定位 | 1.5h | 找到 `Cannot read properties of undefined (reading 'length')` 来源 |
| E1-S2 | 修复 | 1h | 修复根因后 Canvas 无崩溃 |
| E1-S3 | ErrorBoundary 验证 | 0.5h | ErrorBoundary 错误率 < 0.1% |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 根因定位 | 搜索 `.length` 调用点，重点检查 panel collapse + store migration | `expect(rootCauseFound).toBe(true)` | ❌ |
| F1.2 | 崩溃修复 | 修复后 Canvas 页面加载无 `undefined.length` 错误 | `expect(canvasCrashRate).toBeLessThan(0.001)` | 【需页面集成】 |
| F1.3 | ErrorBoundary 验证 | AppErrorBoundary 捕获的崩溃错误 < 0.1% | `expect(errorRate).toBeLessThan(0.001)` | ❌ |

#### DoD

- [ ] Canvas 页面加载无 `Cannot read properties of undefined` 错误
- [ ] `ERR-*` 错误码不再出现
- [ ] ErrorBoundary 错误率 < 0.1%（staging 监控）
- [ ] Playwright E2E canvas 场景通过

---

### Epic 2: 颜色对比度 WCAG 2.1 AA 修复

**工时**: 4h | **优先级**: P1 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E2-S1 | Playwright browser 安装 | 0.5h | `npx playwright install` + CI 修复 |
| E2-S2 | Homepage 对比度修复 | 1.5h | 导航/按钮对比度 ≥ 4.5:1 |
| E2-S3 | Canvas 对比度修复 | 1h | 三栏面板对比度修复 |
| E2-S4 | Export 对比度修复 | 1h | 导出按钮对比度修复 |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | Playwright browser | `npx playwright install chromium` CI 步骤存在 | `expect(installStep.exists).toBe(true)` | ❌ |
| F2.2 | Homepage 对比度 | 按钮文本 vs 背景 ≥ 4.5:1 | `expect(contrastRatio).toBeGreaterThanOrEqual(4.5)` | 【需页面集成】 |
| F2.3 | Canvas 对比度 | 面板/按钮对比度 ≥ 4.5:1 | `expect(contrastRatio).toBeGreaterThanOrEqual(4.5)` | 【需页面集成】 |
| F2.4 | Export 对比度 | primary button 对比度 ≥ 4.5:1 | `expect(contrastRatio).toBeGreaterThanOrEqual(4.5)` | 【需页面集成】 |
| F2.5 | axe-core 验证 | `npx playwright test tests/a11y --project=chromium` 全通过 | `expect(violationCount).toBe(0)` | ❌ |

#### DoD

- [ ] `npx playwright test tests/a11y --project=chromium` 全部通过
- [ ] axe-core Critical/Serious 违规 = 0
- [ ] 颜色对比度用 axe DevTools 验证 ≥ 4.5:1
- [ ] CSS 变量控制颜色，便于主题切换

---

### Epic 3: E2E 测试稳定性加固

**工时**: 2h | **优先级**: P1 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E3-S1 | 测试隔离 | 1h | 每个测试独立 mock setup/teardown |
| E3-S2 | 稳定性验证 | 1h | 连续 3 次运行结果一致 |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | afterEach cleanup | 每个测试 `afterEach` 清理全局状态 | `expect(hasCleanup).toBe(true)` | ❌ |
| F3.2 | waitForResponse | canvas E2E 使用 `waitForResponse` 替代 `waitForTimeout` | `expect(timeoutCount).toBe(0)` | ❌ |
| F3.3 | CI blocking | E2E 测试失败时 CI 状态 = failure | `expect(ciBlocksOnFailure).toBe(true)` | ❌ |
| F3.4 | 连续运行验证 | E2E 测试连续 3 次运行结果一致（0 flaky） | `expect(flakyCount).toBe(0)` | ❌ |

#### DoD

- [ ] E2E 测试连续 3 次运行结果一致
- [ ] 无偶发 timeout 错误
- [ ] CI E2E blocking on failure 配置正确
- [ ] `waitForTimeout` 在 canvas E2E 中使用次数 = 0

---

## 3. 验收标准（汇总）

| Epic | Story | expect() 断言 |
|------|-------|--------------|
| E1 | E1-S1 | `expect(rootCauseFound).toBe(true)` |
| E1 | E1-S2 | `expect(canvasCrashRate).toBeLessThan(0.001)` |
| E1 | E1-S3 | `expect(errorRate).toBeLessThan(0.001)` |
| E2 | E2-S1 | `expect(installStep.exists).toBe(true)` |
| E2 | E2-S2/3/4 | `expect(contrastRatio).toBeGreaterThanOrEqual(4.5)` |
| E2 | E2-S5 | `expect(violationCount).toBe(0)` |
| E3 | E3-S1 | `expect(hasCleanup).toBe(true)` |
| E3 | E3-S2 | `expect(timeoutCount).toBe(0)` |
| E3 | E3-S3 | `expect(ciBlocksOnFailure).toBe(true)` |
| E3 | E3-S4 | `expect(flakyCount).toBe(0)` |

---

## 4. DoD (Definition of Done)

### 全局 DoD

1. **代码规范**: `npm run lint` 无 error
2. **TypeScript**: `npx tsc --noEmit` 0 error
3. **测试**: 相关功能有测试覆盖
4. **审查**: PR 经过 reviewer 两阶段审查

### Epic 专属 DoD

| Epic | 专属 DoD |
|------|----------|
| E1 | Canvas 崩溃率 < 0.1%；ERR-* 错误码 0 |
| E2 | axe Critical/Serious = 0；WCAG 2.1 AA 合规 |
| E3 | E2E 3 次连续一致；flaky = 0 |

---

## 5. 优先级矩阵

| 优先级 | Epic | 建议排期 |
|--------|------|----------|
| P0 | E1 | Sprint 4（第 1 天） |
| P1 | E2, E3 | Sprint 4（第 1-2 天） |

### Sprint 4 排期建议

```
Sprint 4（0.5 周，3 Epic 并行）:
  - Dev: E1（3h，Canvas 崩溃修复）
  - Dev: E2（4h，颜色对比度）
  - Dev: E3（2h，E2E 稳定性）
  → 总计 9h，约 2 天完成
```

---

## 6. 非功能需求

| 类别 | 要求 |
|------|------|
| **可靠性** | Canvas 崩溃率 < 0.1%；E2E flaky = 0 |
| **可访问性** | WCAG 2.1 AA 合规（对比度 ≥ 4.5:1） |
| **可维护性** | CSS 变量控制颜色，便于主题切换 |

---

## 7. 依赖关系图

```
[无依赖：3 Epic 全部可并行]

E1 ─┐
E2 ─┼─→ Sprint 4（并行）
E3 ─┘
```

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 14:30 GMT+8*
