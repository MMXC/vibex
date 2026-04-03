# 实施计划: vibex-jest-vitest-mismatch

> **architect**: design | **date**: 2026-03-29  
> **项目**: vibex-jest-vitest-mismatch  
> **方案**: A — 锁定 Jest 环境，修复 axios mock

---

## 📋 实施概览

| 步骤 | 负责人 | 预估工时 | 依赖 |
|------|--------|----------|------|
| 1. 修复 jest.setup.ts | dev | 0.15h | 无 |
| 2. 添加 vitest 占位脚本 | dev | 0.05h | 步骤1 |
| 3. 单独验证 6 个失败套件 | tester | 0.1h | 步骤1 |
| 4. 完整回归（2829 测试） | tester | 0.1h | 步骤3 |

**总工时: 0.4h（< 30 分钟）**

---

## 📁 文件变更清单

### F1: jest.setup.ts — 添加 axios interceptors mock

**路径**: `/root/.openclaw/vibex/vibex-fronted/jest.setup.ts`

**变更类型**: 修改现有代码

**具体改动**:
在 `return { ... }` 中的 `default` export 对象内，在 `create: jest.fn(...)` **之前**添加：

```typescript
const mockInterceptors = {
  request: { use: jest.fn(() => ({ eject: jest.fn() })) },
  response: { use: jest.fn(() => ({ eject: jest.fn() })) },
};

// ...

default: {
  // ← 新增
  interceptors: { ...mockInterceptors },
  create: jest.fn(() => ({
    interceptors: { ...mockInterceptors },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
},
```

**关键约束**:
- 只修改 `default` export 部分
- `create()` 返回值保持不变（已包含 interceptors）
- 不修改 `MockAxiosError` 类
- 不修改其他 mock（localStorage, ResizeObserver 等）

### F2: package.json — 添加 vitest 占位脚本

**路径**: `/root/.openclaw/vibex/vibex-fronted/package.json`

**变更类型**: 新增字段

**具体改动**: 在 `scripts` 对象中添加：

```json
"vitest": "echo 'Use npm test for Jest tests'"
```

**位置**: 建议放在 `"test"` script 附近，便于发现。

---

## ✅ 验收标准（严格）

| # | 标准 | 验证命令 |
|---|------|----------|
| AC1 | 6 个失败套件单独运行全部通过 | `npm test -- --testPathPattern="diagnosis/index|api-config|InputAreaEpic2|InputArea\.test|RequirementInput|page\.test" --silent` → **0 failures** |
| AC2 | `npx vitest run` 输出提示信息 | `npx vitest run 2>&1` → 输出包含 **"Use npm test"** |
| AC3 | 完整测试套件无新增失败 | `npm test -- --silent` → 退出码 0，**Test Suites: N passed** |

---

## 🧪 测试执行计划

### Phase 1: 修复验证（dev 阶段）

```bash
# 1. 修复后，单独运行 6 个失败套件
cd /root/.openclaw/vibex/vibex-fronted
npm test -- --testPathPattern="diagnosis/index" --silent
npm test -- --testPathPattern="api-config" --silent
npm test -- --testPathPattern="InputAreaEpic2" --silent
npm test -- --testPathPattern="InputArea\.test" --silent
npm test -- --testPathPattern="RequirementInput" --silent
npm test -- --testPathPattern="page\.test" --silent
```

每个命令应输出: `Test Suites: 1 passed`

### Phase 2: 回归验证（tester 阶段）

```bash
# 完整套件回归
npm test -- --silent

# vitest 占位脚本验证
npx vitest run 2>&1 | grep "Use npm test"
```

### Phase 3: 提交

```bash
git add jest.setup.ts package.json
git commit -m "fix(axios-mock): add interceptors to axios default export

Fix 6 Jest test suites failing with:
  TypeError: Cannot read properties of undefined (reading 'request')

Root cause: axios mock default export was missing top-level interceptors.
Only create() return value had interceptors, but direct calls to
axios.interceptors.request.use() on the default export were undefined.

Changes:
- jest.setup.ts: add interceptors to axios default export
- package.json: add vitest placeholder script

Fixes: vibex-jest-vitest-mismatch
Refs: #prd-vibex-jest-vitest-mismatch"
```

---

## ⚠️ 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 修复后仍有测试失败 | 低 | 中 | 检查测试代码是否使用非标准 axios 调用方式 |
| vitest 占位脚本被绕过 | 中 | 低 | npx vitest 可绕过，但实际场景极少发生 |
| 回归引入新失败 | 低 | 高 | 完整套件回归覆盖 2829 测试 |

---

## 📦 交付物检查清单

- [ ] `jest.setup.ts` 中 `default` export 顶层包含 `interceptors.request.use` 和 `interceptors.response.use`
- [ ] `package.json` 中 `scripts.vitest` 指向占位脚本
- [ ] 6 个失败套件单独运行全部通过
- [ ] `npm test -- --silent` 完整回归通过
- [ ] `npx vitest run` 输出包含 "Use npm test"
- [ ] git commit 包含上述两个文件的变更
