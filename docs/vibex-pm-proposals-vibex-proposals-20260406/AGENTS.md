# VibeX Proposals 2026-04-06 — AGENTS.md

> **项目**: vibex-pm-proposals-vibex-proposals-20260406  
> **角色**: Architect  
> **日期**: 2026-04-06  
> **版本**: v1.0

> **所有 Agent 在操作此项目前必须阅读本文档。**

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: vibex-pm-proposals-vibex-proposals-20260406
- **执行日期**: 2026-04-06

---

## 1. 代码风格规范

### 1.1 TypeScript / JavaScript 通用规范

- **缩进**: 2 空格（不许用 Tab）
- **引号**: 单引号 `'`（JS/TS），双引号（JSX attributes）
- **分号**: 始终使用分号
- **类型**: 显式类型声明，不使用 `any`（除非不可避免）
- **空行**: 单个空行分隔逻辑块，不使用多余空行

```typescript
// ✅ 正确
async function checkDedup(key: string): Promise<{ skipped: boolean; remaining: number }> {
  const cache = readCache();
  const lastSent = cache[key];
  if (!lastSent) return { skipped: false, remaining: 0 };
  return { skipped: false, remaining: 0 };
}

// ❌ 错误
async function checkDedup(key) {   // ← 缺少类型
    const cache = readCache();      // ← 4 空格缩进
    if(!lastSent)                  // ← 缺少空格
        return {skipped:false};    // ← 缺少空格
}
```

### 1.2 Hono / Workers 规范

- **路由注册顺序**: OPTIONS 路由必须在所有中间件之前
- **错误处理**: 始终使用 `c.text()` / `c.json()` 返回响应，不直接 `throw`
- **异步**: 所有 handler 必须 `async`，使用 `await`
- **AbortController**: SSE 流必须处理 cancel，超时必须清理

```typescript
// ✅ 正确
v1.options('/*', (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  return c.text('', 204);
});
protected_.use('*', authMiddleware);

// ❌ 错误（OPTIONS 在 authMiddleware 之后）
const protected_ = new Hono();
protected_.use('*', authMiddleware);
protected_.options('/*', (c) => c.text('', 204)); // ← 太晚了！
```

### 1.3 React / Next.js 规范

- **组件**: 使用函数组件，`'use client'` 声明（客户端组件）
- **状态**: Zustand `useContextStore`，避免 useState 过度使用
- **样式**: CSS Modules，禁用在 JSX 中使用 `style={{}}`（DESIGN.md 变量除外）
- **事件处理**: 显式 `onChange` / `onClick` 回调签名

```tsx
// ✅ 正确
interface ContextCardProps {
  selected?: boolean;
  onToggleSelect?: (nodeId: string) => void;
}

// ❌ 错误：隐式类型
function ContextCard({ selected, onToggleSelect }) { ... }
```

### 1.4 测试规范

- **文件命名**: `*.test.ts` / `*.test.tsx` / `*.test.js`
- **描述**: 中文描述测试场景，使用 `describe` + `it`
- **覆盖率**: 核心文件 > 80%
- **Mock**: 使用 `jest.mock()` 或 `jest.spyOn()`，不修改原始模块

```typescript
// ✅ 正确
describe('checkDedup', () => {
  it('返回 skipped=false 对于新 key', () => {
    const result = checkDedup(generateKey('passed'));
    expect(result.skipped).toBe(false);
  });
});

// ❌ 错误：描述不清晰
describe('dedup', () => {
  it('works', () => {
    expect(checkDedup('key').skipped).toBe(false);
  });
});
```

---

## 2. 禁止事项

### 🚫 禁止在 E1 中修改

- **禁止** 修改 `v1.options('/*')` 之后的任何中间件链（仅调整顺序）
- **禁止** 在 OPTIONS handler 中调用 `authMiddleware` 或其他中间件
- **禁止** 在 OPTIONS 响应中添加 body（必须是 204 空响应）

### 🚫 禁止在 E2 中修改

- **禁止** 在 checkbox `onChange` 中同时调用 `toggleContextNode` 和 `onToggleSelect`
  - `toggleContextNode` 仅用于"确认"状态，不用于选择
  - 选择应通过 `onToggleSelect` 独立处理
- **禁止** 修改 `BoundedContextGroup` 的接口签名（除非 PR 包含迁移）
- **禁止** 在 `BoundedContextTree.tsx` 中添加新的 Zustand store

### 🚫 禁止在 E3 中修改

- **禁止** 移除或修改 `GeneratedComponent` 中除 `flowId` 以外的其他字段
- **禁止** 修改 AI prompt 中的其他指令（仅添加 flowId 要求）
- **禁止** 在 component-generator 路由中添加新的参数校验

### 🚫 禁止在 E4 中修改

- **禁止** 移除 `clearTimeout` 调用（任何路径都必须清理）
- **禁止** 在 `finally` 块之外清理计时器（必须覆盖正常结束和异常）
- **禁止** 减少超时时间（10 秒是已确定的验收标准）
- **禁止** 在 `cancel()` 中直接 `throw`，使用 `controller.error()` 替代

### 🚫 禁止在 E5 中修改

- **禁止** 移除原有的 rate limit 接口（保持向后兼容）
- **禁止** 在 Cache API 失败时静默吞掉错误（必须 fallback 到内存）
- **禁止** 修改 `rateLimit` middleware 的 `options` 接口
- **禁止** 将 `caches.default` 替换为 Durable Objects（复杂度不匹配）

### 🚫 禁止在 E6 中修改

- **禁止** 修改 `dedup.js` 的 `DEDUP_WINDOW_MS`（5 分钟是固定值）
- **禁止** 修改 `generateKey` 的格式（`test:{status}:{hash}`）
- **禁止** 在 `recordSend` 中删除活跃 key（只清理过期 key）
- **禁止** 在 CI 环境下绕过 dedup（生产必须生效）

### 🚫 全局禁止

- **禁止** 使用 `// @ts-ignore` 或 `// @ts-expect-error` 除非附上 TSDoc 说明
- **禁止** 添加 `console.log` 调试语句（使用 `canvasLogger` 或删除）
- **禁止** 引入新的 npm 依赖（`pnpm add` 需先审批）
- **禁止** 硬编码任何凭证、API Key、Token（使用环境变量）
- **禁止** 修改 `CLAUDE.md` / `AGENTS.md` / `DESIGN.md`（除非经过 PM 审批）
- **禁止** 在 `node_modules` 目录内进行任何修改
- **禁止** 提交包含 `TODO` / `FIXME` / `HACK` 的代码

---

## 3. 测试要求

### 3.1 覆盖率要求

| 层级 | 文件 | 覆盖率要求 |
|------|------|-----------|
| Backend | `gateway.ts` | > 80% |
| Backend | `ai-service.ts` | > 80% |
| Backend | `rateLimit.ts` | > 80% |
| Backend | `component-generator.ts` | > 70% |
| Frontend | `BoundedContextTree.tsx` | > 80% |
| Scripts | `dedup.js` | > 80% |

### 3.2 必需测试用例

#### E1: OPTIONS
```typescript
describe('OPTIONS Preflight', () => {
  it('OPTIONS /v1/projects 返回 204', async () => { ... });
  it('包含 CORS headers', async () => { ... });
  it('不被 auth 拦截（不返回 401）', async () => { ... });
  it('GET 请求不受影响', async () => { ... });
  it('POST 请求不受影响', async () => { ... });
});
```

#### E2: Canvas Checkbox
```typescript
describe('ContextCard Checkbox', () => {
  it('onChange 调用 onToggleSelect', () => { ... });
  it('不调用 toggleContextNode', () => { ... });
  it('selected=true 时 checkbox 选中', () => { ... });
  it('selected=false 时 checkbox 未选中', () => { ... });
});
```

#### E3: flowId
```typescript
describe('generate-components flowId', () => {
  it('schema 包含 flowId 字段', () => { ... });
  it('flowId 格式为 flow-xxx', () => { ... });
  it('flowId 不是 unknown', () => { ... });
  it('schema 拒绝无效 flowId', () => { ... });
});
```

#### E4: SSE Timeout
```typescript
describe('SSE Timeout', () => {
  it('10 秒无响应触发 abort', async () => { ... });
  it('clearTimeout 在 finally 中调用', () => { ... });
  it('cancel() 清理计时器', async () => { ... });
  it('Worker 不挂死', async () => { ... });
});
```

#### E5: Rate Limit
```typescript
describe('Rate Limit Cache', () => {
  it('使用 caches.default', async () => { ... });
  it('100 请求后第 101 返回 429', async () => { ... });
  it('Cache 不可用时 fallback 到内存', async () => { ... });
  it('正确设置 X-RateLimit-* headers', () => { ... });
});
```

#### E6: Dedup
```typescript
describe('test-notify dedup', () => {
  it('5 分钟内重复跳过', () => { ... });
  it('不同 status 不跳过', () => { ... });
  it('过期后重新发送', () => { ... });
  it('清理过期缓存条目', () => { ... });
});
```

### 3.3 测试运行命令

```bash
# 全量测试
pnpm test

# Backend 测试
pnpm --filter vibex-backend test

# Frontend 测试
pnpm --filter vibex-fronted test

# 覆盖率报告
pnpm --filter vibex-backend test --coverage --coverageReporters=lcov
pnpm --filter vibex-fronted test --coverage --coverageReporters=lcov

# Playwright E2E
pnpm --filter vibex-fronted playwright test

# Lint
pnpm lint
```

---

## 4. PR 审查清单

### 4.1 代码质量检查

- [ ] **类型安全**: 无 `any` 类型，所有接口有类型声明
- [ ] **编译通过**: `pnpm --filter vibex-backend build` 无错误
- [ ] **Lint 通过**: `pnpm lint` 无 warning / error
- [ ] **无硬编码**: 无凭证、Key、Token 硬编码
- [ ] **无调试语句**: 无 `console.log`、`TODO`、`FIXME`
- [ ] **代码风格**: 符合本文件的规范（2 空格缩进、分号、引号）
- [ ] **测试覆盖**: 核心文件覆盖率 > 80%

### 4.2 Epic 专项检查

#### E1: OPTIONS 路由
- [ ] `protected_.options('/*')` 在 `protected_.use('*', authMiddleware)` 之前
- [ ] `v1.options('/*')` 和 `protected_.options('/*')` 同时存在
- [ ] OPTIONS 返回 204（无 body）
- [ ] CORS headers 正确（Allow-Origin、Allow-Methods、Allow-Headers）
- [ ] GET/POST 不受影响（401、200 均正常）

#### E2: Canvas Checkbox
- [ ] `onChange` 仅调用 `onToggleSelect`
- [ ] `toggleContextNode` 不在 checkbox onChange 中调用
- [ ] `checked={selected}` 而非 `checked={node.status === 'confirmed'}`
- [ ] `BoundedContextTree.test.tsx` 新增或更新相关测试
- [ ] Playwright 测试通过

#### E3: flowId
- [ ] `GeneratedComponent` 接口包含 `flowId: string`
- [ ] AI prompt 明确要求 `flowId`
- [ ] `expect(component.flowId).toMatch(/^flow-/)` 测试通过
- [ ] schema 验证拒绝 `unknown`

#### E4: SSE Timeout
- [ ] `setTimeout` 10 秒后 abort
- [ ] `clearTimeout` 在 `finally` 块中
- [ ] `ReadableStream.cancel()` 中有 `clearTimeout`
- [ ] 无计时器泄漏
- [ ] 测试覆盖 timeout 和 cancel 路径

#### E5: Rate Limit Cache
- [ ] `caches.default` 引用存在
- [ ] `cache.match()` 读取限流计数
- [ ] `cache.put()` 写入限流计数
- [ ] fallback 到内存 Map（dev / Cache API 不可用）
- [ ] 原有 rateLimit 接口不变（向后兼容）

#### E6: Dedup
- [ ] `dedup.js` 导入正确（`require('./dedup')`）
- [ ] `checkDedup(key)` 在发送前调用
- [ ] `recordSend(key)` 在发送后调用
- [ ] `generateKey` 使用 `status` 参数
- [ ] `dedup.test.js` 覆盖率 > 80%

### 4.3 回归测试

- [ ] **E1 回归**: `curl -X OPTIONS -I /v1/projects` → 204
- [ ] **E1 回归**: `curl GET /v1/projects` → 不返回 500
- [ ] **E2 回归**: Canvas 页面 checkbox 选择功能正常
- [ ] **E3 回归**: 组件生成 API 不返回 500
- [ ] **E4 回归**: SSE 流正常（超时外）
- [ ] **E5 回归**: 限流不漏过（< limit 的请求正常）
- [ ] **E6 回归**: 通知在 5 分钟间隔后重新发送

### 4.4 文档检查

- [ ] PR 描述包含 Epic 关联（E1-E6）
- [ ] PR 描述包含测试覆盖率变化（before/after）
- [ ] PR 描述包含手动验证步骤（curl / 截图）
- [ ] CHANGELOG.md 更新（如适用）
- [ ] 无新增 `AGENTS.md` / `CLAUDE.md` 违规内容

### 4.5 安全检查

- [ ] 无新引入的 XSS 风险（用户输入未正确转义）
- [ ] 无 CSRF 风险（CORS 配置正确）
- [ ] 无敏感信息泄露（log 中无凭证）
- [ ] Rate limit 不被绕过
- [ ] Webhook URL 验证（非钓鱼 URL）

### 4.6 审查者 Checklist（供 Reviewer Agent 使用）

```
## 审查清单

### 代码质量
- [ ] 类型安全（无 any）
- [ ] 编译通过
- [ ] Lint 通过
- [ ] 无硬编码
- [ ] 无调试语句
- [ ] 测试覆盖率 > 80%

### Epic 专项
- [ ] E1: OPTIONS 顺序正确
- [ ] E2: checkbox onChange 正确
- [ ] E3: flowId schema + prompt
- [ ] E4: timeout + cancel 清理
- [ ] E5: Cache API 集成 + fallback
- [ ] E6: dedup 集成正确

### 回归
- [ ] 全量测试通过
- [ ] 手动验证通过

### 文档
- [ ] PR 描述完整
- [ ] CHANGELOG 更新

### 安全
- [ ] 无注入风险
- [ ] 无信息泄露
- [ ] 限流不被绕过

## 审查结果
[ ] 通过 / [ ] 需修改 / [ ] 拒绝

## 意见
<具体修改意见>
```

---

## 5. 文件权限与路径规范

### 5.1 允许修改的路径

| 前缀 | 允许操作 | 说明 |
|------|----------|------|
| `vibex-backend/src/routes/v1/` | 修改 | E1, E3 |
| `vibex-backend/src/services/` | 修改 | E4 |
| `vibex-backend/src/lib/rateLimit.ts` | 修改 | E5 |
| `vibex-fronted/src/components/canvas/` | 修改 | E2 |
| `vibex-fronted/scripts/dedup.js` | 验证（不修改） | E6 |
| `vibex-fronted/scripts/test-notify.js` | 验证（不修改） | E6 |
| `vibex-fronted/scripts/__tests__/` | 新增 | E6 |

### 5.2 禁止修改的路径

| 路径 | 原因 |
|------|------|
| `vibex-backend/src/lib/auth.ts` | 不在本次 Epic 范围内 |
| `vibex-fronted/src/stores/` | 新增 store 需 PM 审批 |
| `node_modules/` | 禁止 |
| `vibex-backend/wrangler.toml` | 需 DevOps 审批 |
| `DESIGN.md` | 需设计审批 |
| `CLAUDE.md` | 需架构审批 |

---

## 6. 协作流程

### 6.1 提交规范

```bash
# 格式: <Epic>-<简短描述>
git commit -m "E1: fix OPTIONS preflight route order"
git commit -m "E2: fix checkbox onChange to call onToggleSelect"
git commit -m "E3: add flowId to GeneratedComponent schema"
git commit -m "E4: add AbortController timeout and cancel cleanup"
git commit -m "E5: use Cache API for distributed rate limit"
git commit -m "E6: verify dedup.js integration in test-notify"
```

### 6.2 分支命名

```bash
# 格式: fix/epics-e1-e6-YYYYMMDD
git checkout -b fix/epics-e1-e6-20260406
```

### 6.3 PR 创建

```bash
# 确保所有测试通过
pnpm test

# 确保覆盖率
pnpm --filter vibex-backend test --coverage
pnpm --filter vibex-fronted test --coverage

# 推送
git push origin fix/epics-e1-e6-20260406

# 创建 PR（使用 skill: git-commit-push-pr）
```

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
