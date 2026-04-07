# IMPLEMENTATION_PLAN: proposals-20260401-4

> **Sprint 4 — Canvas 崩溃修复 + Accessibility 合规 + E2E 稳定性**
>
> **日期**: 2026-04-01
> **总工时**: 9h
> **Epic 数量**: 3
> **并行度**: 3 Epic 可完全并行（不同开发者独立负责）

---

## 1. Sprint 概览

| 字段 | 值 |
|------|-----|
| Sprint | Sprint 4 |
| 总工时 | 9h（约 2 人天） |
| Epic 数 | 3 |
| 并行策略 | Dev × 3 并行（E1/E2/E3 各自独立） |
| Sprint 长度 | 0.5 周（1-2 天） |
| Sprint 目标 | 消除 Critical Bug、WCAG AA 合规、稳定 E2E 基线 |

---

## 2. Sprint 日程（建议）

```
Day 1
  上午 (4h): E1-T1 (根因定位, 1.5h) + E1-T2 (修复, 1h) + E2-T1 (Playwright, 0.5h) + E2-T2 (Homepage对比度, 1.5h)
  下午 (3h): E1-T3 (验证, 0.5h) + E2-T3 (Canvas对比度, 1h) + E2-T4 (Export对比度, 1h)
Day 2
  上午 (1h): E2-T5 (axe验证, 0h实际上线前验证) + E3-T1 (afterEach, 1h)
  下午 (1.5h): E3-T2 (waitForResponse, 0.5h) + E3-T3 (CI blocking, 0.5h) + 收尾
```

---

## 3. 任务详细列表

### 3.1 E1 — Canvas 运行时崩溃修复（3h, P0）

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|----------|----------|
| E1-T1 | **根因定位** — grep 搜索 canvas 相关 `.length` 调用，定位 `undefined` 属性访问来源 | 1.5h | — | `grep -rn '\.length' components/canvas/ stores/ --include='*.ts' --include='*.tsx'` 找到所有 .length 调用点，确认根因文件 |
| E1-T2 | **修复** — 对所有 canvas 相关 `.length` 调用添加可选链 `?.` 或 null 检查 | 1h | 修改的文件（如 `components/canvas/*.tsx`, `stores/*.ts`） | Canvas 页面加载无 `undefined.length` 错误；`npx tsc --noEmit` 0 error |
| E1-T3 | **验证** — Playwright E2E 验证无 `undefined.length` 崩溃 | 0.5h | `tests/e2e/canvas-crash.spec.ts`（新建） | `page.goto('/canvas')` 后 3s 内 console 无 `Cannot read properties of undefined (reading 'length')` |

**E1 DoD**:
- [ ] Canvas 页面加载无 `Cannot read properties of undefined` 错误
- [ ] ErrorBoundary 崩溃率 < 0.1%（staging 监控）
- [ ] `npm run lint` 无 error
- [ ] `npx tsc --noEmit` 0 error

---

### 3.2 E2 — 颜色对比度 WCAG 2.1 AA 修复（4h, P1）

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|----------|----------|
| E2-T1 | **Playwright browser 安装** — 在 `.github/workflows/a11y-ci.yml` 添加 `npx playwright install chromium` | 0.5h | `.github/workflows/a11y-ci.yml` | CI workflow 文件包含 `npx playwright install`；`npx playwright install --check` 成功 |
| E2-T2 | **Homepage 对比度修复** — 调整 CSS 变量（`--color-primary-text`, `--color-bg`），确保 ≥ 4.5:1 | 1.5h | `src/styles/variables.css` 或相关 CSS 文件 | axe-core 检测 Homepage 按钮/导航对比度 0 违规；`expect(contrastRatio).toBeGreaterThanOrEqual(4.5)` |
| E2-T3 | **Canvas 对比度修复** — 调整 `--canvas-panel-*` CSS 变量 | 1h | Canvas 相关 CSS 文件 | axe-core 检测 Canvas 面板对比度 0 违规 |
| E2-T4 | **Export 对比度修复** — 调整 `--export-btn-*` CSS 变量 | 1h | Export 相关 CSS 文件 | axe-core 检测 Export 按钮对比度 0 违规 |
| E2-T5 | **axe-core 完整验证** — 运行 `npx playwright test tests/a11y --project=chromium` | 0h（验证） | `tests/a11y/*.spec.ts`（已有或新建） | Critical/Serious 违规 = 0；`npx playwright test tests/a11y --project=chromium` 全通过 |

**E2 DoD**:
- [ ] `npx playwright test tests/a11y --project=chromium` 全部通过
- [ ] axe-core Critical/Serious 违规 = 0
- [ ] CSS 变量控制颜色（便于主题切换）
- [ ] `npm run lint` 无 error

---

### 3.3 E3 — E2E 测试稳定性加固（2h, P1）

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|----------|----------|
| E3-T1 | **afterEach cleanup** — 为所有 canvas E2E 测试添加 `afterEach` 钩子，清理 localStorage/global state/mock handlers | 1h | `e2e/**/*.spec.ts`（修改） | 每个 canvas E2E 测试文件包含 `afterEach`；`grep -c 'afterEach' e2e/**/canvas*.spec.ts` ≥ 文件数 |
| E3-T2 | **waitForTimeout 移除** — 替换所有 canvas E2E 中的 `waitForTimeout` 为 `waitForResponse` | 0.5h | canvas E2E 测试文件 | canvas E2E 中 `waitForTimeout` 使用次数 = 0；`grep -c 'waitForTimeout' e2e/**/canvas*.spec.ts` = 0 |
| E3-T3 | **CI blocking 验证** — 确认 `.github/workflows/e2e-ci.yml` 无 `continue-on-error: true` | 0.5h | `.github/workflows/e2e-ci.yml` | CI 文件不包含 `continue-on-error: true`；测试失败时 exit 1 |

**E3 DoD**:
- [ ] E2E 测试连续 3 次运行结果一致（flaky = 0）
- [ ] `waitForTimeout` 在 canvas E2E 中使用次数 = 0
- [ ] CI E2E blocking on failure 配置正确
- [ ] 无偶发 timeout 错误

---

## 4. 关键路径分析（Key Path）

```
┌─────────────────────────────────────────────────────────┐
│                    Sprint 4 Key Path                     │
│                                                         │
│  E1: T1(1.5h) → T2(1h) → T3(0.5h)                       │
│       根因定位   修复        验证                        │
│                                                         │
│  E2: T1(0.5h) → T2(1.5h) → T3(1h) → T4(1h) → T5(验证)  │
│       Playwright  Homepage   Canvas    Export   axe验证 │
│                                                         │
│  E3: T1(1h) → T2(0.5h) → T3(0.5h)                       │
│       afterEach  替换timeout  CI验证                    │
│                                                         │
│  → 关键路径：E1-T1 → E1-T2 → E1-T3（3h）                │
│  → E1 为 P0，是 Sprint 4 阻塞项                          │
│  → E2/E3 完全并行，不在关键路径上                        │
└─────────────────────────────────────────────────────────┘
```

**关键路径**: E1（Canvas 崩溃修复）是 Sprint 4 唯一阻塞项，P0 必须优先完成。
**依赖关系**: 3 Epic 完全独立，无相互依赖，可 3 人并行。

---

## 5. 验证命令汇总

```bash
# ========== E1 验证 ==========

# 根因搜索
grep -rn '\.length' components/canvas/ stores/ --include='*.ts' --include='*.tsx'

# 类型检查
cd /root/.openclaw/vibex && npx tsc --noEmit

# Lint 检查
cd /root/.openclaw/vibex && npm run lint

# Canvas 无崩溃 E2E
cd /root/.openclaw/vibex && npx playwright test tests/e2e/canvas-crash.spec.ts --project=chromium

# ========== E2 验证 ==========

# Playwright browser 检查
npx playwright install --check

# axe-core 完整验证
cd /root/.openclaw/vibex && npx playwright test tests/a11y --project=chromium --reporter=line

# 对比度工具验证（手动）
# 访问 http://localhost:3000，DevTools > Lighthouse > Accessibility
# 或使用 axe DevTools 浏览器插件

# ========== E3 验证 ==========

# afterEach 检查
grep -c 'afterEach' /root/.openclaw/vibex/e2e/**/canvas*.spec.ts

# waitForTimeout 检查
grep -c 'waitForTimeout' /root/.openclaw/vibex/e2e/**/canvas*.spec.ts
# 期望输出: 0

# CI blocking 检查
grep 'continue-on-error' /root/.openclaw/vibex/.github/workflows/e2e-ci.yml
# 期望: 无输出

# E2E 连续 3 次验证
cd /root/.openclaw/vibex
npx playwright test --project=chromium > /tmp/e2e-run1.txt 2>&1
npx playwright test --project=chromium > /tmp/e2e-run2.txt 2>&1
npx playwright test --project=chromium > /tmp/e2e-run3.txt 2>&1
# 比较 3 次 passed/failed 数应一致
```

---

## 6. 风险与缓解（Risk / Mitigation）

| # | 风险 | 概率 | 影响 | 缓解措施 |
|---|------|------|------|----------|
| R1 | **E1 根因定位失败** — `.length` 调用点过多或错误来自异步时序 | 中 | 高（P0 阻塞） | T1 阶段先用 grep 缩小范围；如无法定位，改用 ErrorBoundary 增加更多边界日志 |
| R2 | **E2 对比度修复破坏现有设计** — 颜色调整可能影响品牌视觉 | 低 | 中 | 优先调整 CSS 变量而非硬编码颜色；修改后截图对比；团队 review |
| R3 | **E3 waitForTimeout 替换引入新问题** — 某些场景无法用 waitForResponse 替代 | 低 | 中 | 先识别所有 waitForTimeout 使用点；无法替代的场景用 `waitForSelector` 或 `waitForLoadState` |
| R4 | **E2 axe-core CI 仍然失败** — Playwright browser 安装后仍有环境问题 | 低 | 中 | T1 确保 CI 环境正确；本地运行 `npx playwright install chromium`；参考其他成功 CI workflow |
| R5 | **修复引入新的 TypeScript 错误** — 可选链 `?.` 改变类型推断 | 低 | 中 | 修复后运行 `npx tsc --noEmit`；IDE 实时检查 |

---

## 7. 工时汇总表

| Epic | 任务 | 工时 | 占比 |
|------|------|------|------|
| E1 | E1-T1 根因定位 | 1.5h | 17% |
| E1 | E1-T2 修复 | 1.0h | 11% |
| E1 | E1-T3 验证 | 0.5h | 6% |
| **E1 小计** | | **3.0h** | **33%** |
| E2 | E2-T1 Playwright 安装 | 0.5h | 6% |
| E2 | E2-T2 Homepage 对比度 | 1.5h | 17% |
| E2 | E2-T3 Canvas 对比度 | 1.0h | 11% |
| E2 | E2-T4 Export 对比度 | 1.0h | 11% |
| E2 | E2-T5 axe-core 验证 | 0.0h | 0% |
| **E2 小计** | | **4.0h** | **44%** |
| E3 | E3-T1 afterEach cleanup | 1.0h | 11% |
| E3 | E3-T2 waitForTimeout 移除 | 0.5h | 6% |
| E3 | E3-T3 CI blocking 验证 | 0.5h | 6% |
| **E3 小计** | | **2.0h** | **22%** |
| **总计** | | **9.0h** | **100%** |

---

## 8. 验收清单（Pre-Merge Checklist）

- [ ] `npm run lint` → 0 error
- [ ] `npx tsc --noEmit` → 0 error
- [ ] `npx playwright test tests/a11y --project=chromium` → 全通过（Critical/Serious = 0）
- [ ] Canvas 页面加载无 `undefined.length` 错误
- [ ] E2E 连续 3 次运行结果一致（flaky = 0）
- [ ] `waitForTimeout` 在 canvas E2E 中使用次数 = 0
- [ ] `.github/workflows/e2e-ci.yml` 无 `continue-on-error: true`
- [ ] PR 经过两阶段 reviewer 审查

---

## 9. 产出文件清单

| 文件 | 操作 | 归属 Epic |
|------|------|----------|
| `components/canvas/*.tsx` | 修改 | E1 |
| `stores/*.ts` | 修改 | E1 |
| `tests/e2e/canvas-crash.spec.ts` | 新建 | E1 |
| `.github/workflows/a11y-ci.yml` | 修改 | E2 |
| `src/styles/variables.css` | 修改 | E2 |
| Canvas 相关 CSS | 修改 | E2 |
| Export 相关 CSS | 修改 | E2 |
| `tests/a11y/*.spec.ts` | 新建/修改 | E2 |
| `e2e/**/*.spec.ts`（canvas） | 修改 | E3 |
| `.github/workflows/e2e-ci.yml` | 修改 | E3 |

---

*文档版本: v1.0 | Architect | 2026-04-01*
