# PRD: Vibex Tester Proposals — Quality Assurance Sprint

**Project**: vibex-tester-proposals-20260414_143000
**Date**: 2026-04-14
**Status**: Draft
**Owner**: PM

---

## 1. 执行摘要

本次提案聚焦 **CI 质量门禁修复** 与 **Sprint1 功能配套测试**，解决 tsconfig 配置错误、测试文件排除不完整等 P0 级阻断问题，并为 Playwright E2E 测试建立基线。

**核心目标**:
- 修复 `tsc --noEmit` 前后端报错，确保 CI 类型检查通过
- 修复 Vitest 测试文件 exclude 配置，消除误报
- Sprint1 功能（Auth 视觉 + Canvas Phase 边界）配套测试就绪
- Bundle size 阈值测试就绪，监控体积膨胀
- Playwright E2E 环境就绪，主流程测试覆盖

**投入估算**: E1 3h + E2 4h + E3 8h = **15h**（E3 属 Sprint2 范围）

---

## 2. Feature List

| ID | 功能描述 | 类型 | 优先级 |
|----|---------|------|--------|
| F1 | tsconfig 配置修复（前后端均无 tsc 错误）| Dev | P0 |
| F2 | 测试文件 exclude 配置修复（Vitest 不误跑无关文件）| Dev | P0 |
| F3 | Auth dark theme 视觉回归测试 ×2 | Test | P1 |
| F4 | Canvas Phase 边界测试（刷新/导入/Phase切换）×3 | Test | P1 |
| F5 | Bundle size 阈值测试（增长 < 200KB）| Test | P1 |
| F6 | Playwright E2E 环境配置 | Infra | P2 |
| F7 | E2E 主流程测试（登录 → 创建 → 保存）| Test | P2 |

---

## 3. Epic / Story 拆分

### E1: CI 质量门禁修复
**目标**: `tsc --noEmit` 前后端均无错误，Vitest 退出码 0
**时间盒**: 3h

#### E1.S1: 前端 tsconfig 修复
- **E1.S1.F1.1**: 修复 `tsconfig.json` 中的路径映射（paths/baseUrl）或缺失的 `include` 字段
- **E1.S1.F1.2**: 验证 `tsc --noEmit` 前端退出码 0
- **E1.S1.F1.3**: 前端类型错误全部清零

#### E1.S2: 后端 tsconfig 修复
- **E1.S2.F2.1**: 修复后端 `tsconfig.json` 中的配置问题
- **E1.S2.F2.2**: 验证 `tsc --noEmit` 后端退出码 0
- **E1.S2.F2.3**: 后端类型错误全部清零

#### E1.S3: Vitest exclude 配置修复
- **E1.S3.F3.1**: 检查 `vite.config.ts` 中 `test.exclude` 数组，确保非测试文件（e.g. `**/node_modules/**`, `**/dist/**`）已排除
- **E1.S3.F3.2**: 验证 `vitest run` 退出码 0，无误报测试用例

---

### E2: Sprint1 提案配套测试
**目标**: Auth + Canvas Phase 功能有对应测试保护
**时间盒**: 4h

#### E2.S1: Auth 视觉回归测试
- **E2.S1.F1.1**: Auth dark theme 视觉回归测试（登录页 dark mode）
- **E2.S1.F1.2**: Auth dark theme 视觉回归测试（注册页 dark mode）
- **验收**: 截图 diff 无视觉 regression，或 CI 报告可读的 diff URL

#### E2.S2: Canvas Phase 边界测试
- **E2.S2.F1.1**: Canvas 页面刷新后 Phase 状态保持测试
- **E2.S2.F1.2**: Canvas 导入文件后 Phase 状态正确初始化测试
- **E2.S2.F1.3**: Canvas Phase 切换（如 Draft → Review → Published）功能测试
- **验收**: 3 个边界 case 均 `expect` 通过

#### E2.S3: Bundle size 阈值测试
- **E2.S3.F1.1**: 配置 `size-limit` 或 `bundlesize` 工具
- **E2.S3.F1.2**: 设置单次构建体积增长阈值 < 200KB
- **E2.S3.F1.3**: CI 中集成 bundle size 检测，PR 级别报警

---

### E3: E2E 测试基线（Sprint2 范围）
**目标**: Playwright 就绪，主流程覆盖
**时间盒**: 8h

#### E3.S1: Playwright 环境配置
- **E3.S1.F1.1**: 安装 Playwright 及浏览器依赖
- **E3.S1.F1.2**: 配置 `playwright.config.ts`（baseURL、timeout、reporter）
- **E3.S1.F1.3**: 配置 CI 环境变量（BASE_URL、TEST_USER credentials）

#### E3.S2: E2E 主流程测试
- **E3.S2.F1.1**: 登录流程 E2E 测试（有效/无效凭据）
- **E3.S2.F1.2**: 创建 Canvas 并保存 E2E 测试
- **E3.S2.F1.3**: 主流程冒烟测试（login → create → save）CI 通过

---

## 4. 验收标准（expect 断言级）

| ID | 验收标准 | 断言 |
|----|---------|------|
| AC1 | `tsc --noEmit` 前端无错误 | `expect(exitCode).toBe(0)` |
| AC2 | `tsc --noEmit` 后端无错误 | `expect(exitCode).toBe(0)` |
| AC3 | Vitest 测试全部通过 | `expect(exitCode).toBe(0)` |
| AC4 | Auth dark theme 登录页视觉测试 | `expect(screenshot).toMatchImage()` 或 CI diff URL 存在 |
| AC5 | Auth dark theme 注册页视觉测试 | `expect(screenshot).toMatchImage()` 或 CI diff URL 存在 |
| AC6 | Canvas 刷新后 Phase 保持 | `expect(state.phase).toBe(expected)` |
| AC7 | Canvas 导入后 Phase 初始化正确 | `expect(state.phase).toBe('initialized')` |
| AC8 | Canvas Phase 切换功能正常 | `expect(onSwitch(expectedPhase)).toBe(true)` |
| AC9 | Bundle size 增长 < 200KB | `expect(sizeDiff).toBeLessThan(200 * 1024)` |
| AC10 | E2E 登录流程通过 | `expect(page.locator('...')).toBeVisible()` |
| AC11 | E2E 创建+保存流程通过 | `expect(await page.locator('...').isVisible()).toBe(true)` |
| AC12 | CI 测试总运行时间 < 3min | `expect(totalDuration).toBeLessThan(180 * 1000)` |

---

## 5. 优先级矩阵

| 优先级 | 功能 | RICE 权重 | 理由 |
|--------|-----|-----------|------|
| P0 | E1.S1.F1.1 tsconfig 修复 | — | CI 红锁，所有人 blocked |
| P0 | E1.S3.F3.1 exclude 修复 | — | CI 红锁，测试误报 |
| P1 | E2.S1 Auth 视觉测试 | — | Sprint1 功能保护 |
| P1 | E2.S2 Canvas Phase 测试 | — | Sprint1 功能保护 |
| P1 | E2.S3 Bundle size 测试 | — | 防止体积膨胀失控 |
| P2 | E3.S1 Playwright 配置 | — | Sprint2 前置依赖 |
| P2 | E3.S2 主流程 E2E | — | Sprint2 范围 |

---

## 6. 依赖关系图

```
E1.S1 (tsconfig前端) ← 前置依赖: 无
E1.S2 (tsconfig后端) ← 前置依赖: 无
E1.S3 (exclude)      ← 前置依赖: 无

E2.S1 (Auth视觉)     ← 前置依赖: E1 完成（CI 畅通）
E2.S2 (Canvas测试)   ← 前置依赖: E1 完成
E2.S3 (Bundle)       ← 前置依赖: E1 完成

E3.S1 (Playwright)   ← 前置依赖: 无（Sprint2 先行基础设施）
E3.S2 (E2E主流程)    ← 前置依赖: E3.S1 完成
```

---

## 7. Definition of Done

- [ ] `tsc --noEmit` 前后端退出码均为 0
- [ ] `vitest run` 退出码 0，无误报
- [ ] Auth dark theme 视觉测试 ×2 已提交并在 CI 中通过
- [ ] Canvas Phase 边界测试 ×3 已提交并在 CI 中通过
- [ ] Bundle size 阈值 < 200KB 检测已集成 CI
- [ ] Playwright 配置已提交，可本地 `npx playwright test` 运行
- [ ] E2E 主流程测试已在 CI 通过
- [ ] CI 测试总时长 < 3min
- [ ] 所有 spec 文件已写入 `specs/` 目录
- [ ] PRD 文档已更新，DoD items 已勾选

---

## 8. 执行决策

- **决策**: 已采纳
- **执行项目**: team-tasks 项目 ID 待确认
- **执行日期**: 2026-04-14 起，E1 优先（今日完成），E2 紧随，Sprint2 范围 E3 排入下一 Sprint
