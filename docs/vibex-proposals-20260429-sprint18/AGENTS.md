# AGENTS.md - VibeX Sprint 18 开发约束

**版本**: v1.0
**日期**: 2026-04-30
**Agent**: architect
**Sprint**: vibex-sprint18

---

## 1. TypeScript 类型修复约束

### 1.1 禁止事项

```typescript
// ❌ 禁止使用 as any 绕过类型检查
const result = data as any;  // 除非在 Prisma → internal boundary 且附注释

// ❌ 禁止在 module boundary 使用 any
function processData(input: any): any { }  // 任何公共接口都禁止

// ❌ 禁止关闭严格模式
// tsconfig.json 中禁止设置:
// "strict": false
// "noImplicitAny": false
// "strictNullChecks": false

// ❌ 禁止 @ts-ignore 用于新代码
// @ts-ignore 仅允许用于 legacy third-party 库的类型补丁
// 必须附注释: // TODO: remove after lib upgrade

// ❌ 禁止使用 require() 导入（ESM 规范）
const foo = require('./foo');  // 必须用 import
```

### 1.2 允许的例外模式

```typescript
// ✅ 允许: Prisma DB model → internal type boundary
// src/lib/prisma.ts 或 data access layer 中
const user = await prisma.user.findUnique({ where: { id } });
return user as unknown as User; // 明确标注 boundary

// ✅ 允许: 外部 API response 类型未知时
// 需创建对应 interface，禁止 any
interface ExternalAPIResponse {
  data: unknown;
  status: number;
}
// 不能直接用 any 承接
```

### 1.3 类型定义规范

```typescript
// ✅ 每个 shared type 必须有 JSDoc
/**
 * User session representation.
 * @remarks Immutable after creation. Use Config for mutable settings.
 */
export interface Session {
  id: string;
  userId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Readonly<Record<string, unknown>>;
}

// ✅ route 参数使用 Zod schema 推断类型
import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// ✅ 禁止 type 和 interface 混用同一概念
// 在 @vibex/types 中统一用 interface
// 在 route schemas 中统一用 Zod schema
```

---

## 2. 代码质量约束

### 2.1 Lint & Format

```bash
# 每次提交前必须执行
pnpm run lint        # ESLint 检查
pnpm run format      # Prettier 格式化
pnpm exec tsc --noEmit  # TS 类型检查（必须在 lint 通过后执行）
```

### 2.2 测试约束

```bash
# 新功能必须有测试
# 测试文件命名: *.test.ts（非 *.spec.ts）

# 类型测试必须在 packages/types 中
# 覆盖率要求: 行覆盖 ≥ 80%

# Mock 规范
// ✅ 正确
jest.mock('@/lib/llm', () => ({
// ❌ 错误: 硬编码 mock 数据
const mockData = { id: '123', name: 'Test' };
```

### 2.3 提交规范

```bash
# commit message 格式
<type>(<scope>): <short description>

# type: feat | fix | refactor | test | docs | chore | types
# scope: mcp-server | backend | types | e3-u2 | e3-u3

# 示例
git commit -m "types(mcp-server): fix health route ServerResponse type"
git commit -m "types(backend): add Zod schemas for chat routes"
git commit -m "fix(e3-u3): resolve implicit any in flows service"

# 禁止
git commit -m "fix types"          # 无 scope
git commit -m "WIP"                # WIP 不允许
git commit -m "update stuff"       # 无意义描述
```

---

## 3. 文件组织约束

### 3.1 @vibex/types 包结构

```
packages/types/src/
├── index.ts          # 主导出（所有 shared types）
├── guards.ts         # 类型守卫
├── schemas.ts        # Zod schemas（与 TS types 一一对应）
├── api.ts            # API response types
├── events.ts         # 事件类型
└── __tests__/
    ├── guards.test.ts
    └── schemas.test.ts
```

### 3.2 Route Schema 文件约定

```
vibex-backend/src/routes/
├── projects.ts           # route handler
└── projects.schema.ts   # Zod schema（必须分离）
```

### 3.3 禁止的文件变更

- `vibex-backend/tsconfig.json` 的 `strict: false`
- `packages/mcp-server/tsconfig.json` 的 `skipLibCheck: true` 之外的消错
- `package.json` 的 `type` 字段从 `"module"` 改为 `"commonjs"`
- 删除 `packages/types` 包

---

## 4. CI 门禁

```yaml
# 必须通过的 CI 检查（任何失败 = PR 被 block）
jobs:
  lint:
    run: pnpm run lint
  type-check-mcp:
    run: cd packages/mcp-server && pnpm exec tsc --noEmit
  type-check-backend:
    run: cd vibex-backend && pnpm exec tsc --noEmit --strict
  test:
    run: pnpm run test -- --passWithNoTests
  coverage:
    run: pnpm exec jest --coverage --coverageThreshold='{"global":{"lines":80}}'
```

---

## 5. CHANGELOG 规范

### 更新时机

- **必须更新**: 每个 Story 完成（Reviewer 验收通过后）
- **无需更新**: 纯实验性 PR（标记 `[skip-changelog]`）

### 格式

```markdown
## [E18-TSFIX] TypeScript 类型系统修复 (2026-04-30)

- types(mcp-server): 修复 health route ServerResponse 类型错误
- types(backend): 为 chat/projects/flows routes 添加 Zod schema
- types(@vibex/types): 新增 isSession/isConfig/isResponse 类型守卫

类型: types
影响: packages/mcp-server, vibex-backend, packages/types
```

---

## 6. Sprint 18 特殊规则

### 6.1 TS Error 处理优先级

当遇到 `error TS` 时，按以下顺序处理：

1. **先分析后动手**: 运行 `tsc --noEmit` 确认错误存在，不要猜测原因
2. **从根因修复**: 不是 `as any` 兜底，而是补全缺失的类型定义
3. **同文件错误批量处理**: 避免修复一个再跑 tsc 的循环
4. **PR 越小越好**: 每个 TS error 修复单独 commit，方便回滚

### 6.2 E18-CORE-1 协作要求

- **Analyst** 在完成 backlog 梳理后，必须在 Slack #vibex 发消息通知团队
- backlog 文档路径: `vibex-backend/docs/backlog-sprint17.md`
- 每个功能点的 RICE 评分必须计算公式透明（Reach × Impact × Confidence ÷ Effort）

### 6.3 团队通讯

- **Standup**: 每日 10:00 在 Slack #vibex 更新进度
- **Blocker**: 立即在 Slack @ 小羊 通报，不等到 standup
- **PR Review**: 所有 PR 必须有 reviewer 批准才能合并

---

## 7. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint18
- **执行日期**: 2026-04-30
