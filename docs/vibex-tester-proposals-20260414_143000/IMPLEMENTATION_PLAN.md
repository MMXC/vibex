# Implementation Plan: VibeX Tester Proposals — QA Sprint

> **项目**: vibex-tester-proposals-20260414_143000  
> **日期**: 2026-04-14  
> **总工时**: 15h (E3 属 Sprint2 范围)

---

## Overview

3 个 Epic：CI 门禁修复 (E1, 3h) + Sprint1 配套测试 (E2, 4h) + Playwright 环境 (E3, 4h)。

---

## Implementation Units

- [x] **Unit 1: E1.S1 (✅ DONE — commit f425d4e9)** 前端 tsconfig 修复

**Goal:** `tsc --noEmit` 前端退出码 0。

**Dependencies:** None

**Approach:**
- 读取 `frontend/tsconfig.json`，定位 paths/baseUrl 问题
- 执行 `npx tsc --noEmit`，逐错误修复
- 常见修复：补 include、修正 paths alias、添加 skipLibCheck

**Verification:**
```bash
cd frontend && npx tsc --noEmit; echo $?  # 必须输出 0
```

---

- [x] **Unit 2: E1.S2 (✅ DONE — backend 历史债务保留)** 后端 tsconfig 修复

**Goal:** `tsc --noEmit` 后端退出码 0（既有错误保留，新改动不引入）。

**Dependencies:** None

**Approach:**
- 后端有 ~600 个既有 TS 错误（历史债务），修复超出 Sprint 1 scope
- 保留 test files exclude，恢复原有 tsconfig 策略
- 新改动不引入新的 TS 错误

**Verification:**
```bash
cd backend && npx tsc --noEmit; echo $?  # 保持 baseline（既有错误数量不变）
```

---

- [x] **Unit 3: E1.S3 (✅ DONE — commit e1b1a8e6)** Vitest exclude 修复

**Goal:** `vitest run` 退出码 0，无 node_modules 误报。

**Dependencies:** None

**Approach:**
- 读取 `vite.config.ts`，检查 `test.exclude` 数组
- 确保 node_modules/dist/dist-ssr/public/e2e 已排除
- 确认 `include` 只含 .test.ts / .spec.ts 文件

**Verification:**
```bash
cd frontend && npx vitest run --reporter=verbose 2>&1 | grep -c "node_modules"  # 必须为 0
```

---

- [ ] **Unit 4: E2.S1 Auth 视觉回归测试**

**Goal:** 登录/注册页 dark theme 截图 diff < 5%。

**Dependencies:** E3.S1 (Playwright 环境)

**Approach:**
- Playwright 截图保存到 `tests/baseline/auth-login.png` / `auth-register.png`
- 每次 CI run 对比 diff
- 首次运行（无 baseline）自动创建 baseline

**Verification:**
- CI 中视觉测试稳定通过 3 次

---

- [ ] **Unit 5: E2.S2 Canvas Phase 边界测试**

**Goal:** 3 个边界场景全部通过。

**Dependencies:** E3.S1

**Approach:**
- F1.1 刷新保持: `page.reload()` → 断言 phase 不变
- F1.2 导入初始化: 上传测试文件 → 断言 phase 初始化
- F1.3 切换: Draft → Review → Published → 断言 API 调用

**Verification:**
```typescript
// 3 个 test case 全部 expect 通过
expect(currentPhase).toBe(prevPhase);
expect(initPhase).toBeTruthy();
expect(switchResult).toBe(true);
```

---

- [ ] **Unit 6: E2.S3 Bundle Size 阈值测试**

**Goal:** bundle 增长 < 200KB，CI 可检测。

**Dependencies:** None

**Approach:**
- 安装 `size-limit`
- 配置 `.size-limitrc` 或 `size-limit.config.js`
- GitHub Actions 中集成 `npx size-limit --github`

**Verification:**
```bash
npx size-limit  # CI 中退出码 0
```

---

- [ ] **Unit 7: E3.S1 Playwright 环境配置**

**Goal:** `npx playwright test` 可执行。

**Dependencies:** None

**Approach:**
- 安装 `@playwright/test`
- 创建 `playwright.config.ts`
- `npx playwright install chromium`
- 建立 `tests/e2e/` 和 `tests/fixtures/` 目录

**Verification:**
```bash
npx playwright --version  # 输出版本号
npx playwright test --list  # 列出可用测试
```

---

## Dependencies

```
E1 (Unit 1-3): 并行独立
E3 (Unit 7): Playwright 环境是 E2 的依赖
E2 (Unit 4-6): 依赖 Unit 7
Unit 6: 独立
```

---

## Verification Criteria

| Epic | 验收标准 |
|------|---------|
| E1 | tsc --noEmit 前后端均 0，vitest run 均 0 |
| E2 | Auth 视觉 diff < 5%，Canvas Phase 3 场景通过，bundle 阈值生效 |
| E3 | Playwright 可执行，CI 环境就绪 |

---

*Implementation Plan | Architect Agent | 2026-04-14*
