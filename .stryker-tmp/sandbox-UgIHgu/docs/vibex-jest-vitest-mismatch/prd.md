# PRD: vibex-jest-vitest-mismatch

> **pm**: create-prd | **date**: 2026-03-29  
> **项目**: vibex-jest-vitest-mismatch  
> **方案**: A — 锁定 Jest 环境，修复 axios mock

---

## 🎯 目标

修复 vibex-fronted 中 **6 个 Jest 测试套件因 axios mock 缺少 interceptors 而失败**的问题，同时防止 `npx vitest` 意外执行干扰测试环境。

---

## 📦 范围

**包含**:
- 修复 `jest.setup.ts` 中 axios mock 的 interceptors（`request` / `response`）
- 添加 `package.json` 占位脚本阻止 `npx vitest` 意外执行
- 验证所有 6 个失败测试套件修复后通过

**不包含**:
- Vitest 迁移（Jest 生态已稳定，无需迁移）
- Playwright E2E 测试配置变更
- 其他测试框架或配置文件修改

---

## 🚫 约束

- 不得删除现有测试用例
- 不得修改任何测试的业务逻辑断言
- 改动必须在 `jest.setup.ts` 和 `package.json` 两个文件内完成
- 不得引入新的 npm 依赖

---

## 📋 功能点

| ID | 功能点 | 描述 | 验收标准 | 集成 |
|----|--------|------|----------|------|
| F1 | 修复 axios mock interceptors | 在 `jest.setup.ts` 的 `default` export 上添加 `interceptors.request.use` 和 `interceptors.response.use` mock | `npm test -- --testPathPattern="diagnosis/index\|api-config\|InputAreaEpic2\|InputArea\.test\|RequirementInput\|page\.test" --silent` 输出 **0 failures** | 无 |
| F2 | 阻止 npx vitest 意外执行 | 在 `package.json` 添加 `"vitest": "echo 'Use npm test for Jest tests'"` 占位脚本 | `npx vitest run 2>&1` 输出包含 **"Use npm test"** | 无 |
| F3 | 回归验证：全部 Jest 测试通过 | 修复后完整回归，确保 2829 个测试无新增失败 | `npm test -- --silent` 退出码 0，输出包含 **"Test Suites: N passed"** | 无 |

---

## ✅ 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| AC1 | `npm test -- --testPathPattern="diagnosis/index\|api-config\|InputAreaEpic2\|InputArea\.test\|RequirementInput\|page\.test"` 输出 **0 failures** | CI / 本地运行 |
| AC2 | `npx vitest run 2>&1 \| grep "Use npm test"` 有输出 | 本地验证 |
| AC3 | `npm test -- --silent` 全部测试通过（2829 total） | CI / 本地运行 |
| AC4 | 6 个失败测试套件逐一通过（单独运行） | `npm test -- --testPathPattern=<file> --silent` × 6 |

---

## ⏱️ 工时估算

| 功能点 | 预估工时 | 说明 |
|--------|----------|------|
| F1 修复 axios mock | 0.25h | 1 处代码改动 |
| F2 添加占位脚本 | 0.05h | package.json 1 行 |
| F3 回归验证 | 0.2h | 运行完整测试套件 |
| **合计** | **0.5h** | — |

---

## 🔄 实施计划

### 步骤 1: 修复 jest.setup.ts（15 分钟）

修改 `/root/.openclaw/vibex/vibex-fronted/jest.setup.ts`，在 axios mock 的 `default` export 上添加 interceptors：

```typescript
jest.mock('axios', () => {
  // ... existing MockAxiosError class ...

  return {
    __esModule: true,
    AxiosError: MockAxiosError,
    default: {
      // ← 新增 interceptors（修复根因）
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      create: jest.fn(() => ({
        interceptors: {
          request: { use: jest.fn(() => ({ eject: jest.fn() })) },
          response: { use: jest.fn(() => ({ eject: jest.fn() })) },
        },
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      })),
    },
    // ← 同时更新 create 函数签名
    create: jest.fn(() => ({ ... })),
  };
});
```

### 步骤 2: 添加 vitest 占位脚本（3 分钟）

在 `/root/.openclaw/vibex/vibex-fronted/package.json` 的 `scripts` 中添加：

```json
"vitest": "echo 'Use npm test for Jest tests'"
```

### 步骤 3: 回归验证（12 分钟）

```bash
# 验证 6 个失败套件修复
npm test -- --testPathPattern="diagnosis/index|api-config|InputAreaEpic2|InputArea\.test|RequirementInput|page\.test" --silent

# 完整回归
npm test -- --silent
```

---

## 📁 产出物

| 产物 | 路径 |
|------|------|
| PRD | `docs/vibex-jest-vitest-mismatch/prd.md` |
| 实施计划 | `docs/vibex-jest-vitest-mismatch/prd.md`（本文件） |

---

## 🔗 上游产物

- 分析报告: `docs/vibex-jest-vitest-mismatch/analysis.md`
