# vibex-jest-vitest-mismatch 分析报告

## 📋 业务场景分析

### 问题背景
- **项目**: vibex-fronted
- **测试框架**: Jest (`"test": "jest"` in package.json)
- **当前状态**: 229 test suites, 6 failing, 223 passing; 2829 tests total

### 核心问题
`src/services/api/diagnosis/index.ts` 模块在**顶层作用域**执行以下代码：

```typescript
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: 30000,
})

// 添加认证拦截器
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined'
    ? sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
    : null;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});
```

当任何测试文件导入此模块（直接或间接）时，Jest 执行此顶层代码，但 `jest.setup.ts` 中的 axios mock 未提供 `interceptors` 属性，导致：
```
TypeError: Cannot read properties of undefined (reading 'request')
```

### 受影响的测试
| 测试文件 | 失败原因 |
|---------|---------|
| `diagnosis/index.test.ts` | 直接导入 diagnosis 模块 |
| `api-config.test.ts` | API endpoint 断言失败（次要问题） |
| `InputAreaEpic2.test.tsx` | 导入依赖 diagnosis 的组件 |
| `InputArea.test.tsx` | 同上 |
| `RequirementInput.test.tsx` | 同上 |
| `page.test.tsx` | 导入 HomePage → InputArea |

### 关于 "describe is not defined" 的说明
任务描述提到 "283 tests report 'describe is not defined'"，但实际测试运行结果为：
- 2824 passed, 1 failed, 3 skipped, 1 todo
- 实际错误为 `TypeError: Cannot read properties of undefined`

"Jest vs Vitest" 场景在当前代码库中**未复现**。test 命令运行的是 jest，无 vitest 配置文件。

---

## 🔧 技术方案选项

### 方案 A: 修复 axios mock（推荐）

**思路**: 修改 `jest.setup.ts` 中的 axios mock，使其提供 `interceptors` 属性

**修改文件**: `jest.setup.ts`

```typescript
// 修改前
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
  AxiosError: jest.fn().mockImplementation((message) => {
    const err = new Error(message);
    err.name = 'AxiosError';
    return err;
  }),
}));

// 修改后
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  AxiosError: jest.fn().mockImplementation((message) => {
    const err = new Error(message);
    err.name = 'AxiosError';
    return err;
  }),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
}));
```

**优点**:
- 最小的代码改动
- 保持现有测试结构

**缺点**:
- 需要维护 mock 的完整性

### 方案 B: 延迟初始化 axios 实例

**思路**: 将 axios 实例创建延迟到函数调用时，而非模块顶层

**修改文件**: `src/services/api/diagnosis/index.ts`

```typescript
// 修改前（模块顶层）
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: 30000,
})
api.interceptors.request.use(...)

// 修改后（延迟初始化）
let api: ReturnType<typeof axios.create> | null = null;

function getApiClient() {
  if (!api) {
    api = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: 30000,
    })
    api.interceptors.request.use(...)
  }
  return api;
}
```

**优点**:
- 完全避免模块顶层执行问题
- 更好的测试隔离

**缺点**:
- 需要修改生产代码
- 需要更新所有调用点

---

## ✅ 可行性评估

| 方案 | 复杂度 | 风险 | 兼容性 |
|------|--------|------|--------|
| A: 修复 mock | 低 | 低 | 高 |
| B: 延迟初始化 | 中 | 中 | 中（需改调用点） |

**推荐方案**: A（修复 axios mock）

---

## ⚠️ 初步风险识别

1. **其他 axios 使用点**: 其他 modules 可能使用相同的 mock 模式，如果也有顶层 interceptors，需要同步修复
2. **测试覆盖率**: 修复后需确认 6 个失败的测试 suites 全部通过
3. **回归风险**: 修改 jest.setup.ts 可能影响其他使用 axios mock 的测试

---

## 📝 验收标准

### Acceptance Criteria

| ID | 标准 | 验证方式 |
|----|------|---------|
| AC1 | `npm test` 运行后 6 个失败测试 suites 全部通过 | Jest 输出显示 229 passed, 0 failed |
| AC2 | 2829 tests 全部通过 (允许 skipped/todo) | `expect(failed).toBe(0)` |
| AC3 | `diagnosis/index.test.ts` 不再报 `TypeError` | 测试日志无 `TypeError: Cannot read properties` |
| AC4 | `RequirementInput.test.tsx` 测试通过 | 测试通过 |
| AC5 | `InputArea.test.tsx` 测试通过 | 测试通过 |
| AC6 | `page.test.tsx` 测试通过 | 测试通过 |

### 执行命令
```bash
cd /root/.openclaw/vibex/vibex-fronted
npm test
```

### 期望结果
```
Test Suites: 229 passed, 0 failed, 229 total
Tests:     2824 passed, 4 skipped, 1 todo, 2829 total
```