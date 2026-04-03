# VibeX canvasStore 迁移清理 — 实施计划

**项目**: canvas-canvasstore-migration
**版本**: v1.0
**日期**: 2026-04-04

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: 待 coord 创建项目并绑定
- **执行日期**: 2026-04-04

---

## 1. Sprint 排期

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Day 1 AM | E1 canvasStore 清理 | 4h | crossStoreSync + loadExampleData 就绪 |
| Day 1 PM | E2 CanvasPage 迁移 | 2h | import 全部更新 |
| Day 2 AM | E3 废弃 store 删除 | 2h | 死代码清理完毕 |
| Day 2 PM | E4 测试补全 | 5h | split stores 覆盖率 ≥ 80% |
| Day 3 | E5 Integration 测试 | 3h | migration.test.ts + E2E ≥ 95% |

**总工时**: 16h

---

## 2. 开发顺序

```
Day 1 AM（E1，最先）
  → S1.1 审查 canvasStore 剩余业务逻辑
  → S1.2 提取 crossStoreSync.ts
  → S1.3 提取 loadExampleData.ts
  → S1.4 canvasStore.ts 降级为 re-export

Day 1 PM（E2，依赖 E1）
  → S2.1 更新 CanvasPage.tsx import 路径
  → S2.2 全量回归测试

Day 2 AM（E3，依赖 E2）
  → S3.1 删除 canvasHistoryStore.ts（grep 确认后）
  → S3.2 创建 deprecated.ts
  → S3.3 确认 DDD 文件保留

Day 2 PM（E4，依赖 E1）
  → S4.1 contextStore 边界测试
  → S4.2 flowStore cascadeUpdate 测试
  → S4.3 uiStore panel 状态测试
  → S4.4 sessionStore SSE 重连测试
  → S4.5 删除旧 canvasStore.test.ts

Day 3（E5，依赖 E2+E4）
  → S5.1 migration.test.ts
  → S5.2 localStorage 持久化测试
  → S5.3 crossStoreSync 回归测试
  → S5.4 E2E 全量回归
```

---

## 3. 开发约束

### 3.1 crossStoreSync 约束

```typescript
// ✅ 正确：单向订阅，无循环依赖
useContextStore.subscribe(state => state.contextNodes, callback);

// ❌ 错误：双向订阅
contextStore.subscribe(flowStore.set);
flowStore.subscribe(contextStore.set); // 循环！
```

### 3.2 canvasStore 降级约束

```typescript
// ✅ 正确：仅 re-export
export { useContextStore } from './stores';
export type { CanvasStore } from './stores/types';

// ❌ 错误：含业务逻辑
export const setContextNodes = (...) => { ... }; // 删除
```

### 3.3 删除前扫描约束

```bash
# 删除 canvasHistoryStore.ts 前必须执行
grep -rn "canvasHistoryStore" src/ --include="*.ts" --include="*.tsx"
# 预期：无输出
```

---

## 4. 验证命令

```bash
# E1: canvasStore 行数
wc -l src/lib/canvas/canvasStore.ts
# 期望: < 50

# E1: 无循环依赖
npx madge --circular src/lib/canvas/
# 期望: 无 circular output

# E2: 无 canvasStore import
grep -c "from.*canvasStore" src/components/canvas/CanvasPage.tsx
# 期望: 0

# E3: canvasHistoryStore 已删除
ls src/stores/canvasHistoryStore.ts
# 期望: No such file

# E4: contextStore 覆盖率
pnpm test -- --coverage --testPathPattern="contextStore"
# 期望: branches ≥ 80%

# E5: E2E 通过率
pnpm playwright test
# 期望: passRate ≥ 0.95
```

---

*实施计划版本: v1.0 | 架构师: Architect Agent | 日期: 2026-04-04*
