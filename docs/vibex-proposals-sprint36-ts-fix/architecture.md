# 架构文档：Sprint36 TypeScript 编译错误修复

## 修复方案

### 1. `middleware.ts` — 添加状态接口
```typescript
// 为空对象 {} 添加类型
interface NodeExtra {
  modelMermaidCode?: string;
  selectedModelIds?: string[];
  [key: string]: unknown;
}
const node: NodeExtra = {};
```

### 2. `prototypeStore.ts` — 修正泛型约束
```typescript
// 移除或修正 EmptyNodeExtra 的使用
type NodeExtra = Record<string, unknown>;
// 或调整 getNode 泛型
```

### 3. `fallbackStrategy.ts` — 添加 config 类型
```typescript
// 为空对象 config 添加接口
interface FallbackConfig {
  length?: number;
  [key: string]: unknown;
}
const config: FallbackConfig = {};
```

## 验证流程
1. `cd /root/.openclaw/vibex/vibex-fronted && pnpm exec tsc --noEmit` → 零错误
2. `pnpm test` → 原有测试通过
3. `git push origin main`
