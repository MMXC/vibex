# E3-Firebase-Cursor 实现方案

## 背景

Sprint 23 Epic E3: Firebase Cursor Sync 基础，当前状态：
- `presence.ts` 已有 cursor 字段（x/y），缺少 nodeId 和 timestamp
- RemoteCursor 组件：**不存在，需创建**
- useCursorSync hook：**不存在，需创建**
- cursor 写入无 throttle

## 分析

### 现有代码结构

| 文件 | 状态 |
|------|------|
| `vibex-fronted/src/lib/firebase/presence.ts` | 存在，cursor 有 x/y，缺 nodeId/timestamp |
| `vibex-fronted/src/components/presence/RemoteCursor.tsx` | **不存在，需创建** |
| `vibex-fronted/src/hooks/useCursorSync.ts` | **不存在，需创建** |

### 约束

- RemoteCursor: `isMockMode` prop 控制，mock 模式下不渲染
- cursor 写入：100ms debounce
- cursor 类型：`{ x, y, nodeId, timestamp }`
- CSS Modules

## 方案设计

### S3.1: presence.ts cursor 字段扩展

```typescript
cursor?: {
  x: number;
  y: number;
  nodeId: string | null;
  timestamp: number;
}
```

### S3.2: RemoteCursor 组件

Props:
```typescript
interface RemoteCursorProps {
  userId: string;
  userName: string;
  position: { x: number; y: number };
  nodeId?: string | null;
  isMockMode?: boolean;
}
```

- 渲染 cursor icon (SVG arrow)
- 渲染 username label
- 跟随 position 移动
- `isMockMode=true` 时返回 null

### S3.3: useCursorSync hook

- 100ms debounce 包裹 cursor 写入
- 订阅其他用户 cursor 变化
- 返回 { cursors: RemoteCursorData[] }

## 实施步骤

1. `presence.ts` — 扩展 cursor 类型（含 nodeId/timestamp）
2. `RemoteCursor.tsx` + `RemoteCursor.module.css`
3. `useCursorSync.ts` — 100ms debounce cursor 写入
4. TypeScript 验证
5. commit

## 验收标准

- [ ] `data-testid` on RemoteCursor（root element）
- [ ] `isMockMode=true` 时返回 null
- [ ] `pnpm exec tsc --noEmit` → 0 errors
- [ ] IMPLEMENTATION_PLAN.md E3 Epic Unit 状态更新为 ✅
- [ ] commit message 包含 `E3` 标识
