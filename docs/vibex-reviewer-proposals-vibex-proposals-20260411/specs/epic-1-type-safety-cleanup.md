# SPEC — Epic 1: Type Safety Cleanup

**Epic ID**: EP-001  
**Epic 名称**: 类型安全修复（Type Safety Cleanup）  
**所属项目**: vibex-proposals-20260411  
**优先级**: P0  
**工时**: 5.5h  
**依赖 Epic**: 无

---

## 1. Overview

消除代码库中所有 `as any` 类型断言滥用问题，将 TypeScript 类型安全能力完全激活，消灭因类型绕过导致的运行时拼写错误等低级风险。

---

## 2. 文件清单与修复策略

### F1.1 — `src/lib/canvas-renderer/catalog.ts:101`

**问题代码**:
```typescript
rawCatalog as any as ReturnType<typeof parseCatalog>
```

**修复策略**: 定义中间类型接口 `CatalogParseResult`，使用 `unknown` + 类型守卫替代双断言。

```typescript
interface CatalogParseResult {
  entities: Entity[];
  relationships: Relationship[];
}

function parseCatalog(raw: unknown): CatalogParseResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('[Catalog] Invalid raw catalog: not an object');
  }
  const r = raw as Record<string, unknown>;
  // 类型安全地提取字段...
  return { entities: [], relationships: [] };
}
```

**验收**: `grep "as any" src/lib/canvas-renderer/catalog.ts` 输出 0 行。

---

### F1.2 — `src/lib/canvas-renderer/registry.tsx:208`

**问题代码**:
```typescript
rawRegistry as any
```

**修复策略**: 定义 `RegistryData` 接口，用类型守卫函数 `isRegistryData()` 验证。

```typescript
interface RegistryData {
  items: RegistryItem[];
  version: string;
}

function isRegistryData(raw: unknown): raw is RegistryData {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Record<string, unknown>;
  return Array.isArray(r.items) && typeof r.version === 'string';
}
```

**验收**: `grep "as any" src/lib/canvas-renderer/registry.tsx` 输出 0 行。

---

### F1.3 — `src/hooks/ddd/useDDDStateRestore.ts:41-43`

**问题代码**（连续 3 处）:
```typescript
useContextStore/useModelStore/useDesignStore as any
```

**修复策略**: 创建显式断言函数集中管理类型转换，消除散落在 hook 体内的 `as any`。

```typescript
function assertStore<T>(store: unknown, name: string): T {
  if (!store || typeof store !== 'object') {
    throw new Error(`[useDDDStateRestore] Store "${name}" is not available`);
  }
  return store as T;
}

// 使用
const contextStore = assertStore<ContextStoreType>(useContextStore, 'context');
const modelStore = assertStore<ModelStoreType>(useModelStore, 'model');
const designStore = assertStore<DesignStoreType>(useDesignStore, 'design');
```

**验收**: `grep "as any" src/hooks/ddd/useDDDStateRestore.ts` 输出 0 行。

---

### F1.4 — `src/components/canvas/edges/RelationshipEdge.tsx:5`

**问题**: 注释承认需要 `as any` 规避库缺陷。

**修复策略**: 保留 `as any`（第三方库兼容问题），添加详细注释说明原因和待解决 ticket。

```typescript
// WORKAROUND: third-party library (react-flow) type definitions incomplete.
// The library's internal types don't expose the connection line path we need.
// Ticket: VIBEX-XXXX — Remove this once react-flow types are fixed upstream.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const path = (lineRef.current as any).getSmoothPath?.();
```

**验收**: 此文件 `as any` 行数不超过 1 行，且包含 workaround 注释。

---

### F1.5 — `vibex-backend/src/lib/export-formats.ts:562,570`

**问题代码**:
```typescript
(child as any).characters
```

**修复策略**: AST 节点使用联合类型定义，消除对 `any` 的依赖。

```typescript
interface TextNode {
  type: 'text';
  characters: string;
}

interface ElementNode {
  type: 'element';
  children: ASTNode[];
}

type ASTNode = TextNode | ElementNode | OtherNode;

function getTextContent(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as ASTNode;
  if (n.type === 'text') return n.characters;
  if (n.type === 'element' && 'children' in n) {
    return (n as ElementNode).children.map(getTextContent).join('');
  }
  return '';
}
```

**验收**: `grep "as any" vibex-backend/src/lib/export-formats.ts` 输出 0 行。

---

### F1.6 — E2E 测试文件 `e: any` 参数

**涉及文件**:
- `tests/e2e/step1-fix-test.ts:55`
- `tests/e2e/mermaid-fix-test.ts:57`
- `tests/e2e/final-verification-test.ts:83`
- `tests/e2e/mermaid-new-deploy-test.ts:47`
- `tests/e2e/mermaid-console-test.ts:70`
- `tests/e2e/mermaid-debug-test.ts:63`

**修复策略**: catch 参数统一改为 `unknown`，配合 `instanceof Error` 类型守卫。

```typescript
// Before
} catch (e: any) {
  console.error(e.message);
}

// After
} catch (e: unknown) {
  if (e instanceof Error) {
    console.error(e.message);
  }
}
```

**验收**: 以上 6 个测试文件中的 `e: any` 全部替换为 `e: unknown` + 类型守卫。

---

## 3. 集成测试要求

- 每次修改 catalog.ts / registry.tsx 后，运行相关单元测试
- 修改 useDDDStateRestore.ts 后，运行 DDD 状态恢复流程的集成测试
- E2E 回归测试套件运行通过率 100%

---

## 4. 验收标准

| Story | 验收条件 |
|-------|---------|
| S1.1 | `grep "as any" src/lib/canvas-renderer/catalog.ts` → 0 行 |
| S1.2 | `grep "as any" src/lib/canvas-renderer/registry.tsx` → 0 行 |
| S1.3 | `grep "as any" src/hooks/ddd/useDDDStateRestore.ts` → 0 行 |
| S1.4 | RelationshipEdge.tsx 中 `as any` 行数 ≤ 1，且含 workaround 注释 |
| S1.5 | `grep "as any" vibex-backend/src/lib/export-formats.ts` → 0 行 |
| S1.6 | 6 个 E2E 测试文件的 `e: any` 全部替换 |
| 整体 | `tsc --noEmit` 在两个项目中均输出 0 errors |
