# AGENTS.md — VibeX Dev 提案评审与扩展开发约束

**项目**: vibex-dev-proposals-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03
**角色**: Architect

---

## 1. TypeScript 约束

### 1.1 编译约束

| 约束 | 描述 | 验证 |
|------|------|------|
| **零 TS 错误** | `npx tsc --noEmit` 必须零错误 | CI gate |
| **禁止 @ts-ignore** | 除非在 TODO 注释中，且标注原因 | ESLint |
| **禁止 any** | 严格类型，所有字段显式声明 | `tsconfig.json` strict: true |
| **禁止 duplicate type** | 同文件禁止同名 interface/type | E1-S2 ESLint 规则 |

### 1.2 防复发规则

```javascript
// .eslintrc.js 必需规则
rules: {
  'import/no-duplicates': ['error', { 'useInline': true }],
  'no-duplicate-imports': 'error',
}
```

---

## 2. canvasStore 退役约束

### 2.1 兼容层规范

```typescript
// src/lib/canvas/canvasStore.ts 必须满足
// 1. 行数 < 50
// 2. 仅包含 re-export 语句
// 3. 禁止 setState / action / dispatch
// 4. 禁止业务逻辑

// 示例
export { useContextStore } from './stores/contextStore';
export { useFlowStore } from './stores/flowStore';
export { useComponentStore } from './stores/componentStore';
export { useUIStore } from './stores/uiStore';
export { useSessionStore } from './stores/sessionStore';
```

### 2.2 迁移约束

| 约束 | 描述 |
|------|------|
| **单向依赖** | 子 store 不能反向引用 canvasStore |
| **单一职责** | 每个子 store < 300 行 |
| **无循环依赖** | `npx madge --circular src/lib/canvas/stores/` 返回 0 |
| **Consumer 更新** | 所有引用 canvasStore 的组件必须迁移到子 store |

### 2.3 import 替换规范

```bash
# 替换规则
# 旧: import { useCanvasStore } from '@/lib/canvas/canvasStore'
# 新: import { useContextStore } from '@/lib/canvas/stores/contextStore'

# 替换规则
# 旧: useCanvasStore((s) => s.contextNodes)
# 新: useContextStore((s) => s.contextNodes)

# 替换规则
# 旧: useCanvasStore((s) => s.flowNodes)
# 新: useFlowStore((s) => s.flowNodes)
```

---

## 3. Sync Protocol 约束

### 3.1 乐观锁规范

```typescript
// 保存请求必须携带 version
interface SaveRequest {
  data: string;
  version: number;
  force?: boolean;  // 可选，force=true 时强制覆盖
}

// 409 响应格式必须包含
interface ConflictResponse {
  error: string;
  code: 'VERSION_CONFLICT';
  serverVersion: number;
  clientVersion: number;
}
```

### 3.2 ConflictDialog 约束

| 约束 | 描述 |
|------|------|
| **不得自动选择** | 冲突时必须用户主动选择，不能自动覆盖 |
| **不得删除数据** | 任何操作都不能删除已有数据 |
| **按钮文案本地化** | "保留本地" / "使用服务端" / "放弃本地修改" |
| **DOMPurify 防护** | 用户输入的版本名必须 sanitize |

### 3.3 useAutoSave 约束

```typescript
// useAutoSave 必须处理以下场景
// 1. 保存成功 → 更新本地 version
// 2. 收到 409 → 触发 onConflict
// 3. beacon 失败 → fallback XHR
// 4. debounce 防抖 → 2000ms

interface UseAutoSaveOptions {
  debounceMs: 2000,  // 必须默认 2000
  onConflict: (serverVersion: number, clientVersion: number) => void,
  onError: (error: Error) => void,
}
```

---

## 4. Playwright E2E 约束

### 4.1 测试文件规范

```
tests/e2e/
├── canvas-autosave.spec.ts        # E3-S2 + E3-S3
├── canvas-conflict.spec.ts        # E2-S3
├── canvas-version-history.spec.ts  # E3-S4
└── fixtures/
    └── canvas.ts                  # E3-S1
```

### 4.2 稳定性约束

| 约束 | 描述 |
|------|------|
| **禁止硬编码 sleep** | 使用 `waitForResponse` / `waitForSelector` |
| **waitForLoadState** | 每个 page.goto 后加 `page.waitForLoadState('networkidle')` |
| **retry 配置** | playwright.config.ts retries=2（已在 E1-S1 中配置）|
| **trace on failure** | 失败时保留 trace（已配置） |

---

## 5. Git 约束

| 约束 | 描述 |
|------|------|
| **Commit 消息** | `[E{Epic}-{Story}] {描述}` (如 `[E2-S1] sync: add version optimistic lock`) |
| **Branch 命名** | `feat/{epic}-{story}` (如 `feat/E2-sync-protocol`) |
| **PR 要求** | 每个 Epic 单独 PR |
| **PR 内容** | 包含测试结果截图 + madge 循环依赖报告 |

---

## 6. CI 约束

### 6.1 必须的 CI Gates

```yaml
# typescript.yml (新增 ESLint)
- name: TypeScript Check
  run: npx tsc --noEmit
- name: ESLint
  run: npm run lint

# playwright.yml (已有 stability report)
- name: E2E Tests
  run: npx playwright test

# madge 循环依赖检查
- name: Circular Dependency Check
  run: npx madge --circular src/lib/canvas/stores/
```

### 6.2 通过条件

| Gate | 通过条件 |
|------|---------|
| `tsc --noEmit` | 0 errors |
| `npm run lint` | 0 errors |
| `npx madge --circular` | 0 circular dependencies |
| E2E tests | passRate >= 95% |

---

## 7. 安全约束

| 约束 | 描述 |
|------|------|
| **force flag 安全** | force=true 仅在用户主动点击"保留本地"时设置 |
| **version 不可预测** | version 是内部数字，不暴露于 URL |
| **XSS 防护** | 版本名、用户输入必须 DOMPurify sanitize |
| **数据不删除** | 冲突解决任何路径都不删除数据 |

---

## 8. Feature Flag 约束

| Epic | Feature Flag | 说明 |
|------|------------|------|
| E2 ConflictDialog | `ENABLE_CONFLICT_DIALOG` | 默认开启 |
| E4 canvasStore 退役 | `ENABLE_CANVAS_STORE_MIGRATION` | 阶段式开启 |
