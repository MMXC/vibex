# 开发约束: vibex-jest-vitest-mismatch

> **architect**: design | **date**: 2026-03-29  
> **项目**: vibex-jest-vitest-mismatch  
> **方案**: A — 锁定 Jest 环境，修复 axios mock

---

## 🎯 dev 任务: impl-axios-mock-fix

### 📁 工作目录
- 项目路径: `/root/.openclaw/vibex/vibex-fronted`

### 📋 功能点

| ID | 功能 | 描述 | 验收标准 |
|----|------|------|----------|
| F1 | 修复 axios interceptors mock | 在 `jest.setup.ts` 的 axios mock `default` export 顶层添加 `interceptors` | `npm test -- --testPathPattern="diagnosis/index|api-config|InputAreaEpic2|InputArea\.test|RequirementInput|page\.test" --silent` → 0 failures |
| F2 | 添加 vitest 占位脚本 | 在 `package.json` scripts 添加 `"vitest": "echo 'Use npm test for Jest tests'"` | `npx vitest run 2>&1` → 输出包含 "Use npm test" |

### 🔴 红线约束

- **不得修改** `MockAxiosError` 类
- **不得删除** 任何现有测试用例
- **不得修改** 任何测试的业务逻辑断言
- **不得修改** `jest.setup.ts` 中除 axios mock 外的其他 mock（localStorage, ResizeObserver, next/navigation 等）
- **不得引入** 新的 npm 依赖
- **不得改动** `jest.config.ts` 或其他测试配置文件
- `create()` 返回值中的 `interceptors` 保持不变（已正确）

### 📝 修改参考

**jest.setup.ts 修改点**（精确定位）:

在 `default: {` 和 `create: jest.fn(...)` 之间插入：

```typescript
default: {
  // ← 新增这一行
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
```

**package.json 修改点**（精确定位）:

在 `scripts` 对象中添加：
```json
"vitest": "echo 'Use npm test for Jest tests'"
```

### ✅ 完成后检查清单

1. [ ] `jest.setup.ts` 编译通过（`npx tsc --noEmit jest.setup.ts`）
2. [ ] 6 个失败套件单独运行全部通过
3. [ ] `npx vitest run 2>&1` 输出包含 "Use npm test"
4. [ ] `npm test -- --silent` 完整回归通过
5. [ ] git commit 包含 `jest.setup.ts` 和 `package.json` 两个文件
6. [ ] commit message 遵循语义化格式

### 📤 产出

- 修改后的 `jest.setup.ts`
- 修改后的 `package.json`
- 通过的测试输出截图或命令输出
- git commit URL

---

## 🎯 tester 任务: test-axios-mock-fix

### 📁 工作目录
- 项目路径: `/root/.openclaw/vibex/vibex-fronted`

### 📋 测试点

| ID | 测试点 | 验证方式 | 预期结果 |
|----|--------|----------|----------|
| T1 | 6 个失败套件修复验证 | `npm test -- --testPathPattern="diagnosis/index\|api-config\|InputAreaEpic2\|InputArea\.test\|RequirementInput\|page\.test" --silent` | 0 failures, 6 test suites passed |
| T2 | vitest 占位脚本验证 | `npx vitest run 2>&1 \| grep "Use npm test"` | 输出包含 "Use npm test" |
| T3 | 完整回归（2829 测试） | `npm test -- --silent` | 退出码 0，Test Suites: all passed |

### 🔴 红线约束

- 不得修改任何源代码
- 不得跳过任何测试
- 发现任何新失败立即上报 coord

### ✅ 完成后检查清单

1. [ ] T1: 6 个套件全部通过（单独运行）
2. [ ] T2: vitest 占位脚本输出正确
3. [ ] T3: 完整回归无新增失败
4. [ ] 产出测试报告（命令输出）

### 📤 产出

- 测试执行输出
- 通过/失败详情
- 如发现新问题，立即上报 coord

---

## 📤 上游产物

- PRD: `docs/vibex-jest-vitest-mismatch/prd.md`
- 架构: `docs/vibex-jest-vitest-mismatch/architecture.md`
- 实施计划: `docs/vibex-jest-vitest-mismatch/IMPLEMENTATION_PLAN.md`
- 分析: `docs/vibex-jest-vitest-mismatch/analysis.md`
