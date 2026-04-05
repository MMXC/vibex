# VibeX Proposals 2026-04-06 — Agent 开发约束

> **项目**: vibex-architect-proposals-vibex-proposals-20260406  
> **类型**: Bug Fix Sprint Dev Constraints  
> **作者**: architect agent  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 1. 代码风格规范

### 1.1 TypeScript

| 规范 | 说明 | 违反示例 | 正确示例 |
|------|------|----------|----------|
| 严格模式 | 所有文件启用 `strict: true` | `function foo(x?)` | `function foo(x: string)` |
| 类型推断 | 优先让 TS 推断，必要时显式标注 | `const x: string = 'a'` | `const x = 'a'` |
| 接口 vs 类型别名 | 简单对象用 `interface`，复杂用 `type` | `type A = { a: number }` | `interface A { a: number }` |
| Zod 优先 | 运行时验证用 Zod，不用 `as` | `data as Type` | `TypeSchema.parse(data)` |
| 无 `any` | 禁止使用 `any`，用 `unknown` + 类型守卫 | `x: any` | `x: unknown` |
| 函数签名 | 导出的函数必须有完整类型签名 | `export function chat()` | `export function chat(options: ChatOptions): Promise<ReadableStream>` |

### 1.2 React / Next.js

| 规范 | 说明 | 违反示例 | 正确示例 |
|------|------|----------|----------|
| 组件文件 | 一个文件一个组件 | 多个组件塞一个文件 | `BoundedContextTree.tsx` |
| Props 类型 | 组件必须有 `Props` 接口 | 无类型 props | `interface Props { ... }` |
| hooks 规范 | hooks 必须遵守命名约定（use 前缀） | `const getData = () => {}` | `const useData = () => {}` |
| 无内联 style | 禁止内联 style，用 CSS Modules | `style={{ color: 'red' }}` | `className={styles.label}` |
| 事件处理 | onChange/onClick 箭头函数简洁 | `onChange={() => { fn(); set(); }}` | `onChange={handleChange}` |

### 1.3 Jest 测试

| 规范 | 说明 | 违反示例 | 正确示例 |
|------|------|----------|----------|
| 描述结构 | `describe` 按模块/Epic 分组 | 随机 describe | `describe('E1 OPTIONS', () => {...})` |
| 断言清晰 | 每个 it 只测一个行为 | 多个 expect | `it('returns 204', () => { expect(...).toBe(204); })` |
| Mock 隔离 | 每个测试前 reset mocks | mock 残留 | `beforeEach(() => { jest.clearAllMocks(); })` |
| 异步测试 | 用 `async/await` + `await expect().rejects` | `.catch()` | `await expect(promise).rejects.toThrow()` |
| 假定时器 | 超时测试必须用 `jest.useFakeTimers()` | 真实 10s 等待 | `jest.useFakeTimers()` → `advanceTimersByTimeAsync(10000)` |

### 1.4 文件命名

```
vibex-backend/src/
├── app/
│   └── gateway.ts              ✅ 路由注册
├── services/
│   ├── aiService.ts            ✅ 单一服务
│   └── aiService.test.ts       ✅ 测试文件同目录
├── lib/
│   ├── rateLimit.ts           ✅ 工具库
│   ├── dedup.ts                ✅ 独立模块
│   └── dedup.test.ts
├── schemas/
│   ├── ai-component.ts        ✅ schema 定义
│   └── ai-component.test.ts
└── routes/
    └── test-notify.ts

vibex-fronted/src/
└── components/
    └── BoundedContextTree/
        ├── BoundedContextTree.tsx    ✅ 组件
        ├── BoundedContextTree.module.css
        └── BoundedContextTree.test.tsx ✅ 测试
```

---

## 2. 禁止事项

### 2.1 绝对禁止

| # | 禁止行为 | 原因 | 替代方案 |
|---|----------|------|----------|
| B1 | 使用 `as` 类型断言 | 运行时崩溃风险 | Zod schema 验证 |
| B2 | 使用 `any` 类型 | 类型安全丧失 | `unknown` + 类型守卫 |
| B3 | 在循环中调用 `await`（无缓存） | 性能灾难 | `Promise.all()` |
| B4 | 全局变量跨请求共享 | Workers 环境不稳定 | 使用 `caches.default` 或 D1 |
| B5 | 手动设置 `setTimeout` 不清理 | 内存泄漏 | `clearTimeout` + `AbortController` |
| B6 | 提交包含 `console.log`（调试用） | 生产环境污染 | `console.warn` for warnings, structured logging |
| B7 | 直接修改 `node_modules` | 不可维护 | package.json overrides |
| B8 | 内联 SQL 字符串 | SQL 注入风险 | Prisma ORM |
| B9 | 在 `finally` 块外不清理资源 | Worker 泄漏 | try-finally 模式 |
| B10 | 直接操作 DOM（非 React） | 维护性差 | React 状态管理 |

### 2.2 强烈不建议

| # | 不建议行为 | 原因 | 建议 |
|---|------------|------|------|
| W1 | 超过 3 层嵌套回调 | 回调地狱 | async/await |
| W2 | 超过 200 行的单一函数 | 可读性差 | 拆分为多个函数 |
| W3 | 魔法数字/字符串 | 可维护性差 | 提取为常量 |
| W4 | 缺少错误边界的异步调用 | 静默失败 | try-catch + 明确错误处理 |
| W5 | 缺少 JSDoc 的公开 API | 文档缺失 | JSDoc + TypeScript 类型 |

---

## 3. 测试要求

### 3.1 覆盖率标准

| Epic | 文件 | 行覆盖 | 分支覆盖 | 备注 |
|------|------|--------|----------|------|
| E1 | `gateway.ts` | > 90% | > 80% | OPTIONS 特定分支 |
| E2 | `BoundedContextTree.tsx` | > 90% | > 80% | checkbox 交互逻辑 |
| E3 | `schemas/ai-component.ts` | > 80% | > 70% | flowId 验证 |
| E4 | `aiService.ts` | > 90% | > 80% | 超时 + cancel |
| E5 | `rateLimit.ts` | > 80% | > 80% | Cache API + fallback |
| E6 | `dedup.ts` | > 90% | > 90% | 5 分钟窗口 |
| **整体** | **所有涉及文件** | **> 80%** | **> 80%** | — |

### 3.2 测试命令

```bash
# 完整测试 + 覆盖率阈值
pnpm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'

# 后端单测
pnpm --filter vibex-backend test

# 前端单测
pnpm --filter vibex-fronted test

# E2E 测试
pnpm --filter vibex-fronted test:e2e

# 单独运行某个 Epic 的测试
pnpm test -- --testPathPattern="E1|options-handler"
```

### 3.3 测试用例命名规范

```typescript
// ✅ Good: 描述行为而非实现
it('returns 204 for OPTIONS requests')
it('skips duplicate within 5 minute window')
it('clears timer on ReadableStream.cancel()')

// ❌ Bad: 描述实现细节
it('checks the array includes')
it('calls setTimeout with 10000')
```

### 3.4 测试数据规范

```typescript
// ✅ Good: 真实感测试数据
const mockProject = {
  id: 'proj-001',
  name: 'Test Project',
  flowId: 'flow-abc123',
};

// ❌ Bad: 模糊测试数据
const mockProject = { a: 'test', b: 123 };
```

---

## 4. PR 审查清单

### 4.1 开发者自检（PR 创建前）

**代码质量**
- [ ] TypeScript 编译无错误 (`pnpm build`)
- [ ] 所有 Jest 测试通过 (`pnpm test`)
- [ ] 覆盖率 > 80%（检查 CI 报告）
- [ ] 无 `any` 类型（`grep -rn "any" src/ --include="*.ts" | grep -v "node_modules"）
- [ ] 无 `console.log`（调试用）
- [ ] 无内联 style（前端文件）
- [ ] 魔法数字提取为常量

**Epic 验收标准**
- [ ] E1: OPTIONS 返回 204
- [ ] E1: 无 401 响应
- [ ] E2: checkbox 调用 `onToggleSelect`
- [ ] E3: flowId 格式 `/^flow-/`
- [ ] E4: 超时 10s 触发
- [ ] E4: cancel 清理 timer
- [ ] E5: 使用 `caches.default`
- [ ] E6: 5 分钟去重窗口

**Git 规范**
- [ ] 提交信息遵循 Conventional Commits (`fix:`, `feat:`, `test:`)
- [ ] 每个 Epic 单独 commit（可 squash merge）
- [ ] 分支名 `fix/vibex-proposals-20260406`

### 4.2 Reviewer 审查要点

#### 逻辑审查
- [ ] 修复真的解决了根因吗？
- [ ] 是否有遗漏的边界情况？
- [ ] 向后兼容性是否保持？
- [ ] 错误处理是否完整？

#### 安全审查
- [ ] 无 SQL 注入风险
- [ ] 无 XSS 风险
- [ ] 无敏感信息泄漏（API key, token）
- [ ] CORS 配置正确

#### 性能审查
- [ ] 无 N+1 查询问题
- [ ] 无内存泄漏（timer, listener）
- [ ] 无不必要的重渲染（前端）
- [ ] 限流不会造成额外延迟

#### 测试审查
- [ ] 测试用例覆盖核心路径
- [ ] 测试用例命名清晰
- [ ] Mock 使用正确（不过度 mock）
- [ ] 边界情况有测试

#### 架构审查
- [ ] 改动符合现有架构模式
- [ ] 无不必要的抽象
- [ ] 模块边界清晰
- [ ] 接口签名向后兼容

### 4.3 Epic 专项审查

#### E1: OPTIONS 审查要点
- [ ] `app.options('*', corsHandler)` 在 `app.use(authMiddleware)` 之前
- [ ] CORS headers 包含必要字段（Origin, Methods, Headers）
- [ ] GET/POST 不受影响（回归测试）
- [ ] 边缘情况：跨域子路径 `/v1/projects/sub-path`

#### E2: Canvas 多选审查要点
- [ ] checkbox onChange → `onToggleSelect`
- [ ] `toggleContextNode` 仍然可用（通过其他交互触发）
- [ ] 多选状态正确（`selectedNodeIds` 是数组）
- [ ] Playwright E2E 测试存在

#### E3: flowId 审查要点
- [ ] Zod schema 包含 `flowId` 必填字段
- [ ] prompt 明确要求 `flowId` 输出
- [ ] 历史数据有向后兼容 fallback
- [ ] 正则 `/^flow-/` 验证通过

#### E4: SSE 超时审查要点
- [ ] `AbortController.timeout(10000)` 正确使用
- [ ] `cancel()` 中有 `clearTimeout`
- [ ] `ReadableStream.cancel()` 调用 `cancel()`
- [ ] 超时时不抛未捕获异常
- [ ] `jest.useFakeTimers()` + `advanceTimersByTimeAsync` 测试

#### E5: 分布式限流审查要点
- [ ] `caches.default` 跨 Worker 共享
- [ ] Cache API 失败时有 fallback
- [ ] 限流计数正确（不丢计数）
- [ ] window 重置逻辑正确

#### E6: test-notify 去重审查要点
- [ ] 内存缓存作为快速路径
- [ ] 文件缓存持久化正确
- [ ] 5 分钟窗口（`5 * 60 * 1000`）正确
- [ ] 并发写入安全（文件锁或 atomic）
- [ ] `hashEvent` 足够散列（无 hash 碰撞）

---

## 5. 开发工作流

### 5.1 分支管理

```bash
# 创建修复分支
git checkout -b fix/vibex-proposals-20260406

# 按 Epic 开发
git checkout -b fix/E1-options-preflight     # E1
git checkout -b fix/E2-canvas-checkbox        # E2
# ... 以此类推

# 合并到主分支（squash）
git checkout fix/vibex-proposals-20260406
git merge --squash fix/E1-options-preflight
git merge --squash fix/E2-canvas-checkbox
# ...
git push origin fix/vibex-proposals-20260406
```

### 5.2 提交规范

```
<type>(<scope>): <description>

Types:
  fix:     Bug 修复
  feat:    新功能
  test:    测试用例
  refactor: 重构
  docs:    文档
  chore:   构建/工具

Examples:
  fix(E1): OPTIONS handler before authMiddleware
  fix(E2): checkbox onChange calls onToggleSelect
  fix(E3): add flowId to AI component schema
  test(E4): add timeout and cancel cleanup tests
  fix(E5): use Cache API for distributed rate limit
  test(E6): add deduplication window tests
```

### 5.3 CI/CD 流程

```
PR 创建
  ↓
CI 检查（并行）
  ├── TypeScript 编译 ✅
  ├── Jest 单元测试 + 覆盖率 ✅
  ├── ESLint 检查 ✅
  ├── Playwright E2E ✅
  └── 安全扫描（npm audit）✅
  ↓
Reviewer 审查
  ↓
Approval ✅
  ↓
Squash Merge → main
  ↓
自动部署 staging
  ↓
手动验证 staging
  ↓
Promote to production
```

---

## 6. 关键约定

### 6.1 不破坏现有 API

- E1 修改不能影响 GET/POST 路由
- E4 修改不能改变 SSE 流格式
- E5 修改不能改变限流接口签名
- E6 修改不能改变 test-notify 的 webhook 格式

### 6.2 向后兼容

- E3 添加 `flowId` 字段时，历史数据有 fallback
- E5 使用 Cache API 时，失败时 fallback 到内存
- E6 缓存文件不存在时正常创建

### 6.3 可观测性

- E4 超时时记录 `warn` 日志
- E5 fallback 时记录 `warn` 日志（可触发告警）
- E6 跳过重复时记录 `info` 日志

### 6.4 错误处理

```typescript
// 标准错误处理模式
try {
  const result = await riskyOperation();
  return result;
} catch (err) {
  console.error('[epic-tag] Operation failed:', err);
  throw new AppError('DESCRIPTIVE_MESSAGE', err);
} finally {
  // ✅ 必须清理
  cleanup();
}
```

---

## 7. 执行决策

- **决策**: 已采纳
- **执行项目**: team-tasks 项目 ID 待分配
- **执行日期**: 2026-04-06
