# Spec: Epic 2 — Zustand Middleware 泛型修复

**Epic**: E2  
**优先级**: P0  
**预计工时**: 1h  
**关联 Issue**: R-P0-3, R-P2-2

---

## 概述

为所有 Zustand middleware 的 `StoreSlice<any>` 提供明确的泛型参数，消除隐式 any，提升 store 类型安全性。

---

## Story S2.1: middleware.ts StoreSlice<any> 替换

### 目标
修复 `stores/ddd/middleware.ts` 中的 4 处 `StoreSlice<any>` 泛型未定义问题（第 94-96、146-148、273-275 行附近）。

### 修改文件
- `stores/ddd/middleware.ts`

### 实现

```typescript
// 修复前
function createSomeMiddleware<T extends StoreSlice<any>>(config: T) {
  return (set, get) => config(set, get);
}

// 问题：T extends StoreSlice<any> 中的 any 是隐式的

// 修复后

// 1. 定义完整的 Store 类型
type DDDStore = ReturnType<typeof createDDDStore>;

// 2. 所有 middleware 使用明确的类型
function createSomeMiddleware<T extends StoreSlice<DDDStore>>(config: T) {
  return (set: StoreApi<DDDStore>['setState'], get: StoreApi<DDDStore>['getState']) =>
    config(set, get);
}

// 3. 如果需要泛型约束
function createMiddleware<TStore extends object, TSlice = TStore>(
  config: MiddlewareConfig<TStore, TSlice>
): MiddlewareType {
  // 完整的类型安全实现
}
```

### 验收标准

```typescript
// spec/s2.1-middleware-generics.spec.ts

import { readFileSync, execSync } from 'fs';
import { glob } from 'glob';

describe('S2.1 StoreSlice 泛型修复', () => {
  const filePath = 'stores/ddd/middleware.ts';

  it('stores/ddd/middleware.ts 无 StoreSlice<any>', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).not.toMatch(/StoreSlice<any>/);
  });

  it('middleware.ts 中的 StoreSlice 有明确的泛型参数', () => {
    const content = readFileSync(filePath, 'utf-8');
    // 确保所有 StoreSlice 使用了具体类型
    const matches = content.match(/StoreSlice<[^>]+>/g);
    if (matches) {
      matches.forEach((match: string) => {
        expect(match).not.toBe('StoreSlice<any>');
      });
    }
  });

  it('tsc 编译无错误', () => {
    const result = execSync('npx tsc --noEmit stores/ddd/middleware.ts', { encoding: 'utf-8' });
    expect(result).toBe('');
  });
});

describe('E2 集成验收', () => {
  it('所有 stores 文件无 StoreSlice<any>', () => {
    const tsFiles = glob.sync('stores/**/*.ts', { ignore: ['node_modules/**'] });
    for (const file of tsFiles) {
      const content = readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/StoreSlice<any>/);
    }
  });
});
```

---

## 变更范围

| 行号 | 原代码 | 修复后 |
|------|--------|--------|
| 94-96 | `StoreSlice<any>` | `StoreSlice<DDDStore>` |
| 146-148 | `StoreSlice<any>` | `StoreSlice<DDDStore>` |
| 273-275 | `StoreSlice<any>` | `StoreSlice<DDDStore>` |

> 注：具体行号需以实际文件为准，以 grep 搜索 `StoreSlice<any>` 的结果为准。
