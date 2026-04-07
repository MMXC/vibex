# Spec: E1 - Playwright 双重配置统一

**Epic**: E1
**来源**: T-P0-1
**工时**: 1.5h
**状态**: Draft

---

## 1. Overview

统一 VibeX Playwright 测试配置，删除 `tests/e2e/playwright.config.ts`，所有配置迁移到根 `playwright.config.ts`。

## 2. Problem Statement

根目录 `playwright.config.ts` 设置 `expect.timeout = 30000ms`，但 `tests/e2e/playwright.config.ts` 设置 `expect.timeout = 10000ms`。CI 实际加载后者，导致 E2E 测试不稳定。

## 3. Technical Spec

### 3.1 删除 tests/e2e/playwright.config.ts

**操作**:
```bash
rm tests/e2e/playwright.config.ts
```

**变更前**:
- 根配置: `expect: { timeout: 30000 }`
- 子配置: `expect: { timeout: 10000 }`, `webServer: {...}`, `grepInvert: /@ci-blocking/`

**变更后**:
- 根配置: `expect: { timeout: 30000 }`, `webServer: {...}`（从子配置迁移）
- 子配置: 删除

### 3.2 根配置迁移字段

从 `tests/e2e/playwright.config.ts` 迁移到根 `playwright.config.ts`:

| 字段 | 当前值（子配置） | 迁移动作 |
|------|-----------------|----------|
| `webServer` | `{ command, url, reuseExistingServer, timeout }` | 迁移到根配置 |
| `grepInvert` | `/@ci-blocking/` | **删除**（E3 任务） |
| `expect.timeout` | `10000` | **不迁移**，统一用根配置 30000 |

### 3.3 CI Workflow 更新（如需要）

检查 `.github/workflows/*.yml` 中是否有显式指定 `--config tests/e2e/playwright.config.ts`，若有则移除，显式使用根配置。

## 4. Acceptance Criteria

### S1.1: 配置文件删除
```typescript
// 验证 tests/e2e/playwright.config.ts 不存在
expect(fs.existsSync('tests/e2e/playwright.config.ts')).toBe(false);
```

### S1.2: 配置字段迁移
```typescript
// 验证根配置包含 webServer
const config = require('./playwright.config');
expect(config.webServer).toBeDefined();
expect(config.webServer.url).toBeTruthy();
```

### S1.3: CI 验证 expect timeout
```bash
npx playwright test --list | grep "timeout"
// 期望: 所有测试 expect timeout >= 30000ms
```

## 5. Out of Scope

- E2E 测试用例本身的重写
- CI/CD pipeline 其他步骤的修改
- 根配置其他字段（如 reporter、use）的调整

## 6. Dependencies

- 无外部依赖
- 需在 E2 之前完成（S2 依赖根配置存在）

## 7. Rollback Plan

如有问题，恢复 `tests/e2e/playwright.config.ts` 文件即可回退。
