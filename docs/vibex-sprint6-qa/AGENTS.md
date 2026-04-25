# AGENTS.md — vibex-sprint6-qa / design-architecture

**项目**: vibex-sprint6-qa
**角色**: Architect（开发约束）
**日期**: 2026-04-25
**上游**: architecture.md + IMPLEMENTATION_PLAN.md
**状态**: ✅ 设计完成

---

## 1. 开发约束总览

### 1.1 语言与框架

- **语言**: TypeScript（严格模式）
- **前端框架**: Next.js 16 + React 19
- **测试框架**: Vitest（单元/集成）+ Playwright（UI 集成）
- **测试库**: @testing-library/react ^16.3.2 + @testing-library/user-event ^14.5.2
- **HTTP Mock**: MSW ^2.12.10

### 1.2 代码质量门槛

| 检查项 | 标准 | 命令 |
|--------|------|------|
| TypeScript 类型 | 0 errors | `pnpm exec tsc --noEmit` |
| ESLint | 0 warnings | `pnpm lint` |
| 单元测试通过 | 100% | `pnpm test:unit` |
| 测试覆盖率 | ≥ 80% | `pnpm test:unit:coverage` |
| Playwright E2E | 0 failures | `pnpm test:e2e:qa` |

### 1.3 关键约束

**约束 1: E2 Stub 禁止交付**
- CodingAgent.ts 源码中不得包含 `mockAgentCall` 字符串
- 不得包含 `// TODO: Replace with real agent code` 注释
- 必须调用 `sessions_spawn({ runtime: 'acp' })` 或等效 HTTP AI 服务

**约束 2: 测试文件按 Epic 分类**
- 测试文件路径：`tests/unit/services/`, `tests/unit/stores/`, `tests/e2e/sprint6-qa/`
- 不得按测试类型混合文件（同 Epic 可能同时需要 Vitest 和 Playwright）

**约束 3: 四态必须全部覆盖**
- 每个组件/页面的四态（理想态/空状态/加载态/错误态）必须有独立测试用例
- 禁止只测试 Happy path

**约束 4: diff 计算必须精确**
- jsondiffpatch computeVersionDiff 的 added/removed/modified 分类必须精确
- 无差异场景必须返回空对象 `{}`，不是 `{ nodes: {} }`

**约束 5: MSW Mock 覆盖所有外部 API**
- Figma API / AI 生成 API / prototype-snapshots API 必须使用 MSW 拦截
- 禁止使用真实网络请求

---

## 2. 技术规范

### 2.1 测试文件命名

```
tests/unit/
  services/
    CodingAgent.test.ts           # F2.1
    CodingAgent.stub-check.test.ts # F2.3
    computeVersionDiff.test.ts     # F4.2
  stores/
    prototypeVersionStore.test.ts   # F3.1
  docs/
    coverage-map.test.ts           # F5.1
    dod-checklist.test.ts          # F5.2
    prd-format.test.ts             # F5.3

tests/e2e/sprint6-qa/
  E1-import-flow.spec.ts           # F1.1 F1.2 F1.3
  E2-ai-coding-panel.spec.ts      # F2.2
  E3-version-history.spec.ts      # F3.2
  E4-version-diff.spec.ts          # F4.1
```

### 2.2 测试数据约定

**GeneratedCode 工厂函数**:
```typescript
function createMockGeneratedCode(overrides: Partial<GeneratedCode> = {}): GeneratedCode {
  return {
    componentId: 'n1',
    componentName: 'Button',
    code: 'export const Button = () => <button>Click</button>',
    language: 'tsx',
    model: 'claude',
    ...overrides,
  };
}
```

**ProtoNode 工厂函数**:
```typescript
function createMockNode(overrides: Partial<ProtoNode> = {}): ProtoNode {
  return {
    id: `node-${Date.now()}`,
    type: 'Button',
    props: { text: 'Click' },
    position: { x: 100, y: 100 },
    ...overrides,
  };
}
```

### 2.3 MSW Handler 结构

```typescript
// tests/unit/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

// E2: AI 生成 Mock
export const aiGenerateHandlers = [
  http.post('/api/ai/generate', async () => {
    return HttpResponse.json([{
      componentId: 'n1',
      componentName: 'Button',
      code: 'export const Button = () => <button>Generated</button>',
      language: 'tsx',
      model: 'claude',
    }]);
  }),
];

// E3: Snapshot Mock
export const snapshotHandlers = [
  http.get('/api/prototypes/:id/snapshots', () => {
    return HttpResponse.json([/* snapshots */]);
  }),
  http.post('/api/prototypes/:id/snapshots', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 'snap-1', ...body });
  }),
];
```

### 2.4 Vitest 环境配置

```typescript
// tests/unit/setup.ts
import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { aiGenerateHandlers, snapshotHandlers } from './mocks/handlers';

// 全局 MSW server（仅在 Node 环境）
let server: ReturnType<typeof setupServer>;
beforeAll(() => { server = setupServer(...aiGenerateHandlers, ...snapshotHandlers); server.listen(); });
afterEach(() => { server.resetHandlers(); });
afterAll(() => { server.close(); });
```

### 2.5 Playwright 测试配置

```typescript
// tests/e2e/sprint6-qa/playwright.config.ts（新建）
import { defineConfig } from '@playwright/test';
import baseConfig from '../../playwright.config.ts';

export default defineConfig({
  ...baseConfig,
  testDir: './tests/e2e/sprint6-qa',
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```

---

## 3. 关键检查清单

### 3.1 每个 Unit 必须完成

- [ ] 创建测试文件
- [ ] 编写四态（或指定场景）测试用例
- [ ] 所有 `expect()` 断言可执行（无假阳性）
- [ ] 运行 `pnpm vitest run <test-file>` 通过
- [ ] 在 IMPLEMENTATION_PLAN.md 更新 Status 为 `✅`

### 3.2 E2 Stub 验证必须通过

- [ ] `src/services/ai-coding/CodingAgent.ts` 源码读取成功
- [ ] 源码不包含 `mockAgentCall`
- [ ] 源码不包含 `// TODO: Replace with real agent`
- [ ] `sessions_spawn` 调用包含 `runtime: 'acp'` 参数

### 3.3 diff 计算测试必须精确

- [ ] added 场景：`diff.nodes.added[0].id` 正确
- [ ] removed 场景：`diff.nodes.removed[0].id` 正确
- [ ] modified 场景：`diff.nodes.modified[0].before.props` 和 `.after.props` 正确
- [ ] 无差异场景：`diff === {}`（严格相等，不是 `!diff.nodes`）

### 3.4 Playwright E2E 必须覆盖

- [ ] QA server 自动启停（`qa:server` 脚本）
- [ ] 真实浏览器渲染（文件拖拽、剪贴板操作）
- [ ] 错误状态验证（toast 显示、重试按钮可用）
- [ ] 骨架屏验证（testId: code-skeleton / version-skeleton / diff-skeleton）

---

## 4. 禁止事项

- ❌ 禁止在测试中使用 `fireEvent` 替代 `@testing-library/user-event`
- ❌ 禁止使用 `any` 类型绕过 TypeScript 检查
- ❌ 禁止提交 `// @ts-ignore` 或 `// @ts-nocheck`
- ❌ 禁止跳过四态中的任何一态（即使是 P2 Epic）
- ❌ 禁止在 CI 环境使用真实网络请求（必须 MSW 拦截）
- ❌ 禁止在 Stub 检测测试中使用运行时 mock（必须静态分析源码）

---

## 5. 依赖关系与执行顺序

```
E2-U1 (CodingAgent 服务层验证)
    ↓
E2-U2 (ProtoAttrPanel AI Tab) + E2-U3 (Stub 决策验证)
    ↓
E3-U1 (prototypeVersionStore) → E3-U2 (version-history 页面)
    ↓
E4-U2 (computeVersionDiff) → E4-U1 (VersionDiff 组件)
    ↓
E5-U1 + E5-U2 + E5-U3 (质量保障)
    ↓
E1-U1 (FigmaImport) → E1-U2 (ImageImport) → E1-U3 (ImportConfirmDialog)
```

**说明**: E1 放在最后，因为 E1 Specs 已完整，可由 Tester 独立完成。Architect 优先确保 E2 Stub 验证和 E3/E4 核心逻辑。

---

## 6. 验收命令

```bash
# 1. 类型检查
pnpm exec tsc --noEmit

# 2. Lint
pnpm lint

# 3. 单元测试 + 覆盖率
pnpm test:unit:coverage

# 4. E2E QA 完整测试
pnpm test:e2e:qa

# 5. 最终检查
pnpm test
```

**全部通过后，更新 task status 为 done。**

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint6-qa
- **执行日期**: 2026-04-25

---

*约束文件时间: 2026-04-25 12:00 GMT+8*
