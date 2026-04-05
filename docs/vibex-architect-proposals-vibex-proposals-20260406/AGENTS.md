# AGENTS.md — VibeX 开发规范

> **项目**: vibex-architect-proposals-vibex-proposals-20260406  
> **版本**: v1.0  
> **日期**: 2026-04-06  
> **作者**: architect agent

---

## 目的

本文档为 VibeX 项目所有参与 agent 定义强制规范、禁止事项和审查清单。所有 agent 在执行任务时必须遵守本规范。

---

## 强制规范

### 1. 代码质量规范

#### 1.1 TypeScript 类型安全
- **所有新增代码必须显式声明类型**，禁止使用 `any`
- 函数参数和返回值必须有类型注解
- 接口和类型别名优先于重复的对象类型定义

```typescript
// ✅ 正确
function getProject(id: string): Promise<Project | null> {
  return db.query('SELECT * FROM projects WHERE id = ?', [id]);
}

// ❌ 错误
function getProject(id: any): any {
  return db.query('SELECT * FROM projects WHERE id = ?', [id]);
}
```

#### 1.2 错误处理
- 所有 async 函数必须使用 try-catch 或 `.catch()`
- 禁止裸露的 `throw new Error()`，使用自定义错误类型
- API 端点必须返回统一的 `APIResponse` 格式

```typescript
// ✅ 正确
try {
  const result = await fetchProject(id);
  return c.json({ success: true, data: result, timestamp: new Date().toISOString() });
} catch (error) {
  return c.json({ 
    success: false, 
    error: { code: 'NOT_FOUND', message: 'Project not found' },
    timestamp: new Date().toISOString()
  }, 404);
}
```

#### 1.3 测试要求
- **核心业务逻辑必须有单元测试**
- P0/P1 Bug 修复必须附带回归测试
- 新功能必须有对应的测试用例
- 测试覆盖率目标: 单元测试 80%，集成测试 60%

```typescript
// ✅ 每个新 service 必须有测试文件
// src/lib/stream/streamService.ts → tests/services/streamService.test.ts
```

---

### 2. Git 协作规范

#### 2.1 Commit 规范
- Commit 信息必须清晰描述改动内容
- 使用 feat/fix/docs/style/refactor/test/chore 前缀
- 每个 commit 应该是原子性的（一个改动 = 一个 commit）

```
feat: add SSE timeout control with AbortController
fix: resolve OPTIONS preflight being intercepted by auth middleware
refactor: consolidate duplicate generate-components implementations
test: add flowId output validation test
```

#### 2.2 分支命名
- `fix/<issue-id>-<short-description>`
- `feat/<feature-name>`
- `refactor/<module-name>`
- `chore/<task-name>`

#### 2.3 PR 规范
- PR 必须有清晰的描述（改了什么、为什么改、如何测试）
- PR 必须通过所有 CI 检查
- 至少一个 reviewer 批准才能合并
- 合并使用 **Squash and Merge**

---

### 3. 状态管理规范

#### 3.1 Zustand Store 规范
- 每个 store 必须有唯一的命名，前缀 `use{Entity}Store`
- 必须导出类型化的 selector
- 禁止在组件内直接调用 `store.getState().xxx`
- 跨 store 同步通过 middleware 或事件总线，禁止直接引用其他 store

```typescript
// ✅ 正确
export const useDesignStore = create<DesignStore>()(
  subscribeWithSelector(
    devtools((set, get) => ({
      // ...
    }))
  )
);

// ✅ 必须导出 selector
export const selectDesignId = (state: DesignStore) => state.designId;
export const selectDesignById = (id: string) => (state: DesignStore) => 
  state.designs.find(d => d.id === id);

// ❌ 禁止
const store = useDesignStore.getState();
store.designId = '123';
```

#### 3.2 冗余 Store 合并
- `simplifiedFlowStore` 和 `flowStore` **禁止同时使用**
- 合并冗余 store 前必须确认所有调用方已迁移
- 合并后必须运行完整测试套件

---

### 4. API 设计规范

#### 4.1 路由规范
- **所有新 API 必须使用 `/v1/*` 路由**
- 禁止新建 `/api/*` 路由（仅允许维护现有）
- RESTful 风格：GET 查询、POST 创建、PUT 更新、DELETE 删除

#### 4.2 响应格式
- 所有 `/v1/*` 端点必须返回 `APIResponse<T>` 格式
- 禁止混用不同响应格式

```typescript
// ✅ 统一响应格式
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}
```

#### 4.3 错误码规范
- `VALIDATION_ERROR` (400)
- `AUTH_ERROR` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `RATE_LIMITED` (429)
- `INTERNAL_ERROR` (500)

---

### 5. 前端组件规范

#### 5.1 禁止内联 style
- **严禁使用 `style={{}}` 内联样式**
- 必须使用 CSS Modules (`.module.css`) 或 CSS Variables
- 如有例外，必须在 `white-list.txt` 中记录理由

```bash
# CI 检测命令
grep -rn "style={{" src/ --include="*.tsx" | grep -v node_modules | grep -v ".test." | grep -v "white-list.txt"
```

#### 5.2 组件拆分
- 单个组件文件不超过 **300 行**
- 如超过，必须拆分为子组件或 hooks
- CanvasPage 当前 1120 行，**必须拆分**

#### 5.3 Hooks 规范
- 自定义 hooks 必须以 `use` 开头
- Hooks 职责单一，禁止超大 hooks
- Hooks 必须有 JSDoc 注释

---

### 6. 安全规范

#### 6.1 Prompt 注入防护
- 用户输入必须经过注入检测
- 检测模式参考 `lib/security/prompt-injection.ts`
- 检测到注入时记录日志，不阻塞但标记

#### 6.2 敏感信息
- **禁止硬编码密钥、token、密码**
- 使用环境变量或 Cloudflare Secrets
- `.env` 文件禁止提交到 git

#### 6.3 CORS 配置
- 生产环境禁止 `origin: '*'`
- 必须指定具体域名
- OPTIONS 预检请求必须正确处理

---

### 7. 测试规范

#### 7.1 测试文件位置
- 单元测试: `tests/services/`, `tests/lib/`
- 组件测试: `tests/components/`
- E2E 测试: `tests/e2e/`
- 测试文件名: `<module>.test.ts` 或 `<Component>.test.tsx`

#### 7.2 测试命名
- 测试描述必须清晰表达测试场景
- 使用 `describe` 分组相关测试
- 单个 `it` 只测试一个行为

```typescript
describe('StreamService', () => {
  describe('createStream', () => {
    it('should timeout after specified duration', async () => { /* ... */ });
    it('should cleanup timers on cancel', async () => { /* ... */ });
  });
});
```

#### 7.3 Mock 规范
- AI 服务必须 Mock，不调用真实 API
- D1 数据库使用 Miniflare Mock
- 外部 API 必须 Mock

---

## 禁止事项

### 代码层面

| 禁止 | 替代方案 |
|------|----------|
| 使用 `any` 类型 | 使用具体类型或 `unknown` + 类型守卫 |
| 内联 `style={{}}` | CSS Modules 或 CSS Variables |
| 直接修改其他 store | 事件总线或 middleware |
| 裸露的 `console.log` | 使用日志库或 `wrangler.log` |
| 同步 `setTimeout` | 使用 `async`/`await` 或 `setInterval` 清理 |
| 忽略 Promise | 使用 `await` 或 `.catch()` |
| 硬编码敏感信息 | 环境变量 |
| 创建 `/api/*` 新路由 | 使用 `/v1/*` |

### Git 协作层面

| 禁止 | 替代方案 |
|------|----------|
| Force push 到 main/master | 通过 PR 合并 |
| 合并未通过 CI 的 PR | 修复 CI 后合并 |
| 删除 git 历史 | 使用 revert |
| 大规模重构单次提交 | 分解为多个 commit |
| 直接 push 到 main | 使用 feature branch |

### 测试层面

| 禁止 | 替代方案 |
|------|----------|
| 测试调用真实 AI API | Mock AI 服务 |
| 测试依赖外部服务 | Mock 外部服务 |
| 跳过测试（`xit`/`skip`）| 明确记录原因 |
| 无覆盖率的"测试" | 真实的断言 |
| E2E 测试中的 `sleep` | 使用 `waitFor` 条件等待 |

### 架构层面

| 禁止 | 替代方案 |
|------|----------|
| 绕过 API 路由直接 DB 访问 | 通过 Repository 层 |
| 修改共享常量不通知 | 发起架构讨论 |
| 引入新依赖不评估 | 评估后记录在 ADR |
| 破坏向后兼容性 | 新增而非修改 |

---

## 审查清单

### 代码审查清单（Reviewer）

#### P0 Bug 修复审查

- [ ] **OPTIONS 预检请求处理正确**
  - [ ] OPTIONS 返回 204（非 401/404）
  - [ ] CORS headers 正确
  - [ ] GET/POST 不受影响

- [ ] **Canvas checkbox 功能**
  - [ ] `onChange` 绑定到 `onToggleSelect`
  - [ ] 不再调用 `toggleContextNode`
  - [ ] 状态正确更新

- [ ] **generate-components flowId**
  - [ ] schema 包含 `flowId: string`
  - [ ] prompt 要求输出 flowId
  - [ ] 测试验证 flowId 不为 "unknown"

#### P1 稳定性审查

- [ ] **SSE 超时控制**
  - [ ] 使用 `AbortController.timeout(10000)`
  - [ ] `cancel()` 清理所有 timers
  - [ ] jest 测试覆盖

- [ ] **分布式限流**
  - [ ] 使用 `caches.default` 而非内存 Map
  - [ ] 接口向后兼容
  - [ ] 多 Worker 测试通过

- [ ] **test-notify 去重**
  - [ ] 5 分钟窗口正确实现
  - [ ] 状态持久化
  - [ ] jest 测试覆盖

#### P2 架构审查

- [ ] **E2E 测试**
  - [ ] Playwright in Jest 配置正确
  - [ ] pre-existing 测试已修复或标记
  - [ ] CI gate 生效

- [ ] **API 响应格式**
  - [ ] 所有 `/v1/*` 使用 `APIResponse<T>`
  - [ ] 错误码符合规范
  - [ ] openapi.json 已更新

- [ ] **Store 治理**
  - [ ] 符合 ADR-ARCH-001 规范
  - [ ] 冗余 store 已合并
  - [ ] selector 正确导出

- [ ] **Prompt 注入防护**
  - [ ] 检测模式覆盖主流注入
  - [ ] 检测时记录日志
  - [ ] 不影响正常请求

#### 通用审查

- [ ] **类型安全**
  - [ ] 无 `any` 类型
  - [ ] 类型注解完整
  - [ ] 泛型使用正确

- [ ] **错误处理**
  - [ ] 所有 async 有 try-catch
  - [ ] 错误返回统一格式
  - [ ] 关键操作有日志

- [ ] **测试覆盖**
  - [ ] 核心逻辑有测试
  - [ ] 测试可独立运行
  - [ ] Mock 使用正确

- [ ] **安全**
  - [ ] 无硬编码敏感信息
  - [ ] CORS 配置正确
  - [ ] 输入验证存在

- [ ] **性能**
  - [ ] 无 N+1 查询
  - [ ] 资源正确清理
  - [ ] 无内存泄漏

---

### 自检清单（Dev 执行任务前）

#### 开始前

- [ ] 理解任务目标和验收标准
- [ ] 阅读相关架构文档
- [ ] 确认无阻塞依赖

#### 执行中

- [ ] 代码符合 TypeScript 类型规范
- [ ] 无 `any` 类型
- [ ] 无内联 style
- [ ] 测试覆盖核心逻辑
- [ ] Commit 信息清晰

#### 完成后

- [ ] 本地测试通过
- [ ] TypeScript 编译通过
- [ ] Lint 检查通过
- [ ] PR 描述完整
- [ ] 自检清单全部通过

---

### PR 描述模板

```markdown
## 概述
[简短描述改动了什么，为什么]

## 改动详情
- [ ] 改动 1
- [ ] 改动 2
- [ ] 改动 3

## 测试验证
- [ ] 本地测试: [命令/结果]
- [ ] TypeScript: [命令/结果]
- [ ] Lint: [命令/结果]

## 验收标准
- [ ] AC1: [标准]
- [ ] AC2: [标准]

## 相关文档
- [ ] 架构文档
- [ ] API 文档

## 截图/录屏（如有 UI 改动）
```

---

### CI 检查项

PR 必须通过以下 CI 检查：

| 检查 | 命令 | 阈值 |
|------|------|------|
| TypeScript 编译 | `pnpm typecheck` | 0 错误 |
| Lint | `pnpm lint` | 0 警告 |
| 单元测试 | `pnpm test` | 100% 通过 |
| 测试覆盖率 | `pnpm test:coverage` | 行覆盖 ≥ 70% |
| E2E 测试 | `pnpm test:e2e` | 100% 通过 |
| 内联 style 检测 | `./scripts/check-inline-styles.sh` | 0 新增 |
| 类型检查 | `pnpm typecheck` | 0 错误 |

---

## ADR 索引

| ID | 标题 | 状态 |
|----|------|------|
| ADR-ARCH-001 | Canvas Store 治理规范 | **Proposed** |
| ADR-ARCH-002 | API 版本统一 | **Proposed** |
| ADR-ARCH-003 | SSE 流服务统一抽象 | **Proposed** |
| ADR-ARCH-004 | 统一 API 响应格式 | **Proposed** |
| ADR-ARCH-005 | D1 Repository 层规范 | **Rejected** |

---

*文档版本: v1.0 | Architect | 2026-04-06*
