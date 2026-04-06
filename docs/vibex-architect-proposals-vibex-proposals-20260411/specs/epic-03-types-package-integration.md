# Spec: Epic 3 — packages/types 类型共享

**Epic ID**: E3
**提案**: A-P1-1
**优先级**: P1
**工时**: 3h
**负责人**: Backend + Frontend Dev

---

## 1. Overview

启用 `packages/types` (@vibex/types) 在 workspace 内部共享，消除手写重复类型定义，防止 Schema drift。

## 2. Scope

### In Scope
- `packages/types/package.json` exports 配置
- `vibex-backend` 依赖 @vibex/types
- `vibex-fronted` 依赖 @vibex/types
- 核心类型（Agent, Canvas, Chat, Flow, Message, Page, Project）的迁移

### Out of Scope
- 发布到私有 npm registry（作为后续独立 Epic）
- 全部类型迁移（仅迁移核心共享类型）

## 3. Technical Approach

采用**方案一：在 workspace 内部启用类型共享**。

### 3.1 packages/types 配置

```json
// packages/types/package.json
{
  "name": "@vibex/types",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./schemas/*": {
      "types": "./dist/schemas/*.d.ts",
      "default": "./dist/schemas/*.js"
    }
  }
}
```

### 3.2 依赖方配置

```json
// vibex-backend/package.json 新增
"@vibex/types": "workspace:*"

// vibex-fronted/package.json 新增
"@vibex/types": "workspace:*"
```

### 3.3 类型迁移示例

```typescript
// packages/types/schemas/canvas.ts
export interface CanvasGenerateRequest {
  prompt: string
  style?: string
  width?: number
  height?: number
}

export interface CanvasGenerateResponse {
  id: string
  imageUrl: string
  thumbnailUrl: string
}
```

## 4. File Changes

```
Modified:
  packages/types/package.json           (exports 字段配置)
  vibex-backend/package.json             (新增 @vibex/types 依赖)
  vibex-fronted/package.json             (新增 @vibex/types 依赖)
  packages/types/src/schemas/*.ts       (核心类型定义)

Migrated:
  vibex-backend/src/lib/types/agent.ts → packages/types/schemas/agent.ts
  vibex-backend/src/lib/types/canvas.ts → packages/types/schemas/canvas.ts
  vibex-backend/src/lib/types/chat.ts → packages/types/schemas/chat.ts
  vibex-backend/src/lib/types/flow.ts → packages/types/schemas/flow.ts
  vibex-backend/src/lib/types/message.ts → packages/types/schemas/message.ts
  vibex-backend/src/lib/types/page.ts → packages/types/schemas/page.ts
  vibex-backend/src/lib/types/project.ts → packages/types/schemas/project.ts
```

## 5. Stories

| Story ID | 描述 | 工时 | 验收条件 |
|----------|------|------|---------|
| E3-S1 | packages/types 导出配置 | 1h | @vibex/types 可被 workspace 内包 import |
| E3-S2 | vibex-backend 依赖共享类型 | 1h | backend 编译通过，无类型错误 |
| E3-S3 | vibex-fronted 依赖共享类型 | 1h | frontend 编译通过，无类型错误 |

## 6. Acceptance Criteria

```typescript
// E3-S1
describe('@vibex/types exports', () => {
  it('should export all schemas', () => {
    const types = require('@vibex/types')
    expect(types.CanvasGenerateRequest).toBeDefined()
    expect(types.CanvasGenerateResponse).toBeDefined()
  })

  it('should export from subpaths', () => {
    const canvas = require('@vibex/types/schemas/canvas')
    expect(canvas.CanvasGenerateRequest).toBeDefined()
  })
})

// E3-S2
it('should build vibex-backend with shared types', () => {
  const result = execSync('pnpm --filter vibex-backend build', { cwd: rootDir })
  expect(result.exitCode).toBe(0)
})

// E3-S3
it('should remove duplicate type definitions from frontend', () => {
  const frontendTypes = glob('vibex-fronted/src/**/*type*.ts')
  // 重复类型应已移除或改为 import from @vibex/types
  const duplicates = frontendTypes.filter(f => containsDuplicateDefs(f))
  expect(duplicates.length).toBe(0)
})
```

## 7. Test Cases

| ID | 输入 | 预期输出 |
|----|------|---------|
| TC01 | import from @vibex/types | 类型定义正确，无 undefined |
| TC02 | pnpm build vibex-backend | 编译成功，exitCode=0 |
| TC03 | pnpm build vibex-fronted | 编译成功，exitCode=0 |
| TC04 | Schema drift 检测 | 同一类型在多处无不一致定义 |

## 8. Edge Cases

- **循环依赖**：如果 @vibex/types 被 backend 的某个被依赖包导入，需先重构依赖关系
- **命名冲突**：shared types 的命名空间需与 local types 区分
- **Build 顺序**：packages/types 需先于 backend/frontend 构建（pnpm workspace 拓扑排序自动处理）

## 9. Definition of Done

- [ ] @vibex/types exports 配置正确
- [ ] vibex-backend import @vibex/types 编译通过
- [ ] vibex-fronted import @vibex/types 编译通过
- [ ] 重复类型定义移除
- [ ] TypeScript 类型检查通过
- [ ] Code review 通过（≥1 reviewer）
