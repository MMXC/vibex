# Spec: Epic 4 — 双重断言消除

**Epic**: E4  
**优先级**: P1  
**预计工时**: 1.5h  
**关联 Issue**: R-P1-1, R-P1-2, R-P1-3

---

## 概述

消除所有 `props as any as T` 双重断言模式，将其替换为类型安全的显式类型。这是 Epic 1 类型定义完成后的下游任务。

---

## Story S4.1: props as any as 替换为显式类型

### 目标
将所有 `as any as` 双重断言替换为类型安全的显式类型声明。

### 修改文件
- `components/ui/FlowNodes.tsx`
- `components/ui/CardTreeNode.tsx`
- `components/ui/PageNode.tsx`
- `components/ui/CardTreeRenderer.tsx`（第 92、101 行附近）

### 实现

```typescript
// ============================================
// CardTreeNode.tsx
// ============================================

// 修复前
const CardTreeNode = (props: any) => {
  const { data, selected } = props as any as CardNodeData;
  // ...
};

// 修复后
import { CardNodeData } from '@/types/flow';

interface CardTreeNodeProps {
  data: CardNodeData;
  selected?: boolean;
  onToggle?: (id: string) => void;
}

const CardTreeNode = ({ data, selected, onToggle }: CardTreeNodeProps) => {
  // data 已经是 CardNodeData 类型，无需断言
};

// ============================================
// PageNode.tsx
// ============================================

// 修复前
const PageNode = (props: any) => {
  const { data, selected } = props as any as PageNodeData;
  // ...
};

// 修复后
import { PageNodeData } from '@/types/flow';

interface PageNodeProps {
  data: PageNodeData;
  selected?: boolean;
}

const PageNode = ({ data, selected }: PageNodeProps) => {
  // ...
};

// ============================================
// CardTreeRenderer.tsx (第 92, 101 行)
// ============================================

// 修复前 (第 92 行)
const node = nodeData as any;  // ❌ 双重断言

// 修复后
import { CardNodeData } from '@/types/flow';
const node = nodeData as CardNodeData;  // ✅ 单次断言或无需断言

// 修复前 (第 101 行)
const item = items[0] as any;

// 修复后
const item = items[0] as CardNodeData;
```

### 验收标准

```typescript
// spec/s4.1-double-assertion.spec.ts

import { readFileSync, execSync } from 'fs';
import { glob } from 'glob';

const targetFiles = [
  'components/ui/FlowNodes.tsx',
  'components/ui/CardTreeNode.tsx',
  'components/ui/PageNode.tsx',
  'components/ui/CardTreeRenderer.tsx',
];

describe('S4.1 双重断言消除', () => {
  targetFiles.forEach((file) => {
    it(`${file} 无 as any as`, () => {
      const content = readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/as any as/);
    });
  });

  it('CardTreeRenderer 无节点 as any', () => {
    const content = readFileSync('components/ui/CardTreeRenderer.tsx', 'utf-8');
    expect(content).not.toMatch(/as any;/);
  });
});

describe('E4 集成验收', () => {
  it('所有组件文件无双重断言', () => {
    const tsxFiles = glob.sync('components/**/*.tsx', { ignore: ['node_modules/**'] });
    for (const file of tsxFiles) {
      const content = readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/as any as/);
    }
  });

  it('tsc --noEmit 零错误', () => {
    const result = execSync('npx tsc --noEmit', { encoding: 'utf-8' });
    expect(result).toBe('');
  });

  it('E2E 测试通过', () => {
    const result = execSync('npx playwright test', { encoding: 'utf-8' });
    expect(result).toContain('passed');
  });
});
```

---

## 变更范围汇总

| 文件 | 行号 | 原代码 | 修复后 |
|------|------|--------|--------|
| CardTreeNode.tsx | 多处 | `props as any as CardNodeData` | `props: CardTreeNodeProps` |
| PageNode.tsx | 多处 | `props as any as PageNodeData` | `props: PageNodeProps` |
| FlowNodes.tsx | 多处 | `props as any as {...}` | 使用具体节点类型 |
| CardTreeRenderer.tsx | ~92 | `as any` | `as CardNodeData` |
| CardTreeRenderer.tsx | ~101 | `as any` | `as CardNodeData` |

---

## 实施注意事项

1. **依赖顺序**：Epic 4 需在 Epic 1 类型定义完成后实施，因为 S1.1 提供了 `CardNodeData` 等类型定义。
2. **过渡策略**：如遇复杂类型传递链，可使用 `as unknown as T` 作为安全过渡，但需添加 TODO 后续优化。
3. **验证节点**：每个文件修复后立即运行 `npx tsc --noEmit` 验证。
