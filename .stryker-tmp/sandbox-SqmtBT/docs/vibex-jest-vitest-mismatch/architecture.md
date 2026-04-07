# 架构文档: vibex-jest-vitest-mismatch

> **architect**: design | **date**: 2026-03-29  
> **项目**: vibex-jest-vitest-mismatch  
> **方案**: A — 锁定 Jest 环境，修复 axios mock

---

## 📋 问题概述

### 根因分析

`jest.setup.ts` 中 axios mock 的 `default` export **顶层缺少 `interceptors`**。

**当前 `default` export 结构**（不完整）:
```typescript
default: {
  create: jest.fn(() => ({
    interceptors: { ... }, // ← interceptors 仅在 create() 返回值中
    get: jest.fn(),
    ...
  })),
},
```

**缺失**: `axios.interceptors.request` 和 `axios.interceptors.response` 在 default export 顶层不存在。

当测试代码调用 `axios.interceptors.request.use(...)` 时，直接访问 default export 的顶层属性，由于缺少 `interceptors`，导致：

```
TypeError: Cannot read properties of undefined (reading 'request')
```

### 受影响测试套件（6个）

| 文件 | 测试数 |
|------|--------|
| `src/services/api/diagnosis/index.test.ts` | 1 |
| `src/lib/__tests__/api-config.test.ts` | 1 |
| `src/components/homepage/InputArea/InputAreaEpic2.test.tsx` | 1 |
| `src/components/homepage/InputArea/InputArea.test.tsx` | 1 |
| `src/components/requirement-input/RequirementInput.test.tsx` | 1 |
| `src/app/page.test.tsx` | 1 |

---

## 🏗️ 架构设计

### 方案 A: 最小修复（推荐）

**原则**: 最小改动，只修复缺失的 interceptors，不改动任何其他逻辑。

#### 1. jest.setup.ts — axios mock 修复

**修改位置**: `vibex-fronted/jest.setup.ts`

**改动逻辑**: 在 `default` export 顶层添加 `interceptors`，与 `create()` 返回值保持一致。

```typescript
jest.mock('axios', () => {
  class MockAxiosError extends Error {
    code?: string;
    response?: { status?: number };
    isAxiosError: boolean = true;
    config: any = {};
    request: any = {};

    constructor(
      message: string,
      code?: string,
      config?: any,
      response?: { status?: number }
    ) {
      super(message);
      this.name = 'AxiosError';
      this.code = code;
      this.config = config;
      this.response = response;
    }
  }

  const mockInterceptors = {
    request: { use: jest.fn(() => ({ eject: jest.fn() })) },
    response: { use: jest.fn(() => ({ eject: jest.fn() })) },
  };

  return {
    __esModule: true,
    AxiosError: MockAxiosError,
    default: {
      // ← 修复：添加顶层 interceptors
      interceptors: { ...mockInterceptors },
      create: jest.fn(() => ({
        interceptors: { ...mockInterceptors },
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      })),
    },
    create: jest.fn(() => ({
      interceptors: { ...mockInterceptors },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  };
});
```

#### 2. package.json — vitest 占位脚本

**修改位置**: `vibex-fronted/package.json` `scripts` 字段

**新增**:
```json
"vitest": "echo 'Use npm test for Jest tests'"
```

> **说明**: `npx vitest` 会优先使用 package.json 中的 `vitest` script。由于 vitest 是 transitive dep（来自 `@storybook/addon-interactions`），直接 `npx vitest` 仍可绕过。但此占位脚本可以拦截常见的 `npm run vitest` 误用场景，并提供清晰提示。

---

## 📊 性能影响评估

| 维度 | 影响 | 说明 |
|------|------|------|
| Jest 启动时间 | **无影响** | 仅增加 2 个 mock 函数，无计算密集操作 |
| 测试执行时间 | **极小** (< 1ms/测试) | interceptors mock 是惰性求值 |
| 内存占用 | **可忽略** | 仅多 2 个 jest.fn() 实例 |
| 构建产物 | **无影响** | jest.setup.ts 不进入生产构建 |

---

## 🔗 接口变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `jest.setup.ts` | 修改现有 mock | 为 axios mock 添加 interceptors |
| `package.json` | 新增 script | 添加 vitest 占位脚本 |

**无新增依赖，无新增文件，无接口破坏性变更。**

---

## ✅ 回归策略

1. 单独运行 6 个失败套件，验证全部通过
2. 完整测试套件回归（2829 测试）
3. 验证 `npx vitest run` 输出包含提示信息
