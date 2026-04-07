# IMPLEMENTATION_PLAN: VibeX Reviewer Proposals 2026-04-11

> **项目**: vibex-reviewer-proposals-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## Sprint 规划

| Sprint | 周期 | 内容 | 工时 |
|--------|------|------|------|
| Sprint 1 | Day 1 | E1: 类型安全修复 | 5.5h |
| Sprint 2 | Day 1 PM | E2: 空 catch 修复 | 1.5h |
| Sprint 3 | Day 2 AM | E3: ESLint 规则 | 3h |

**总工时**: 10h | **团队**: 1 Dev

---

## Sprint 1: 类型安全修复（5.5h）

### S1.1: catalog.ts（1h）

```bash
grep -n "as any" vibex-fronted/src/lib/canvas-renderer/catalog.ts
```

```typescript
// 修复：添加类型守卫
function isCanvasNode(v: unknown): v is CanvasNode {
  return typeof v === 'object' && v !== null && 'id' in v;
}
```

### S1.2: registry.tsx（1h）

```typescript
// 修复：unknown + 类型守卫
const data = response as unknown;
if (isComponentRegistry(data)) {
  // safe
}
```

### S1.3: useDDDStateRestore.ts（1.5h）

```typescript
// 修复：显式接口
interface DDDState {
  nodes: CanvasNode[];
  edges: Edge[];
}
```

### S1.4-1.6: 其他文件（2h）

```bash
grep -rn "as any" vibex-fronted/src/ vibex-backend/src/ --include="*.ts" --include="*.tsx"
```

---

## Sprint 2: 空 catch 修复（1.5h）

### S2.1: NotificationService.ts（0.5h）

```typescript
catch (error) {
  console.error('[NotificationService]', error);
}
```

### S2.2: PrototypePage.ts（0.5h）

```typescript
catch (error) {
  console.error('[PrototypePage]', error);
}
```

### S2.3: 全局检查（0.5h）

```bash
grep -rn "} catch { }" vibex-fronted/src/ vibex-backend/src/ | wc -l
# 应为 0
```

---

## Sprint 3: ESLint 规则（3h）

### E3: 引入 @typescript-eslint

```bash
pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

---

## 验收命令

```bash
echo "=== as any ===" && grep -rn "as any" vibex-fronted/src/ vibex-backend/src/ | wc -l
echo "=== 空 catch ===" && grep -rn "} catch { }" vibex-fronted/src/ vibex-backend/src/ | wc -l
pnpm exec tsc --noEmit
pnpm run lint
```

**目标**: 全部为 0

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
