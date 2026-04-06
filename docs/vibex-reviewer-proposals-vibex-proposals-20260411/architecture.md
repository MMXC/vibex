# Architecture: VibeX Reviewer Proposals — Type Safety & Error Handling 2026-04-11

> **项目**: vibex-reviewer-proposals-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## 执行决策

| 决策 | 状态 | 执行项目 | 执行日期 |
|------|------|----------|----------|
| unknown + 类型守卫替代 any | **已采纳** | vibex-reviewer-proposals-vibex-proposals-20260411 | 2026-04-11 |
| 结构化日志替代空 catch | **已采纳** | vibex-reviewer-proposals-vibex-proposals-20260411 | 2026-04-11 |

---

## 1. Tech Stack

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| **类型校验** | TypeScript strict | 禁 `any` |
| **lint** | ESLint + @typescript-eslint | 强制规则 |
| **日志** | pino | 结构化 JSON |

---

## 2. 类型安全修复

### 2.1 as any 修复策略

```typescript
// 修复前
const data = response as any;

// 修复后（方案1: unknown + 类型守卫）
const data = response as unknown;
if (isCanvasNode(data)) {
  // safe access
}

// 修复后（方案2: 显式接口）
interface CanvasNode {
  id: string;
  type: string;
}
function isCanvasNode(v: unknown): v is CanvasNode {
  return typeof v === 'object' && v !== null && 'id' in v;
}
```

### 2.2 逐文件修复映射

| 文件 | 修复方案 | 工时 |
|------|---------|------|
| catalog.ts | unknown + 类型守卫 | 1h |
| registry.tsx | unknown + 类型守卫 | 1h |
| useDDDStateRestore.ts | 显式接口 | 1.5h |
| RelationshipEdge.tsx | @ts-expect-error | 0.5h |
| export-formats.ts | 显式类型 | 1h |
| 测试文件 | unknown + 类型守卫 | 0.5h |

---

## 3. 空 catch 修复

### 3.1 修复模板

```typescript
// 修复前
try {
  // operation
} catch {}

// 修复后
try {
  // operation
} catch (error) {
  console.error('[ModuleName]', error instanceof Error ? error.message : String(error));
}
```

### 3.2 NotificationService.ts

```typescript
// services/NotificationService.ts
async sendNotification(notification: Notification) {
  try {
    await this.transport.send(notification);
  } catch (error) {
    console.error('[NotificationService] Failed to send notification', {
      notificationId: notification.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
```

---

## 4. ESLint 强制规则

```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

---

## 5. 验收标准

| 检查项 | 命令 | 目标 |
|--------|------|------|
| 无 `as any` | `grep -rn "as any" vibex-fronted/src/ vibex-backend/src/` | 0 结果 |
| 无空 catch | `grep -rn "} catch { }" src/` | 0 结果 |
| tsc 通过 | `pnpm exec tsc --noEmit` | 0 errors |
| lint 通过 | `pnpm run lint` | 0 errors |

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
