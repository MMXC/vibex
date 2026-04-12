# PRD: vibex-test-fix — 修复 npm test 大量失败

**项目**: vibex-test-fix
**阶段**: Phase1 — create-prd
**日期**: 2026-04-12
**负责人**: PM

---

## 执行摘要

### 背景
`npm test`（vitest run）存在大量测试失败，开发者无法通过本地测试验证代码正确性，CI 测试门禁失效。根因定位为 `CardTreeNode` 组件依赖 `IntersectionObserver` API，而 jsdom 环境不支持该 API。

### 目标
修复测试门禁，使本地测试和 CI 测试退出码为 0，开发者能正常通过测试验证代码。

### 成功指标
- `npx vitest run CardTreeNode --no-coverage` → 15/15 passed
- `npx vitest run src/app/__tests__/accessibility.test.tsx` → 0 failures
- `npx vitest run src/app/page.test.tsx` → 0 failures
- `npx vitest run src/app/dashboard/page.test.tsx` → 0 failures
- `npx vitest run src/app/export/page.test.tsx` → 0 failures
- `npm test` 退出码为 0

---

## Planning — Feature List

基于 `analysis.md` 技术方案，拆解为以下可交付功能点：

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | 集中式 IntersectionObserver Mock | 在 `tests/unit/setup.ts` 全局添加 IntersectionObserver mock，所有测试共享 | CardTreeNode 15 tests | 1h |
| F1.2 | CardTreeNode 测试验证 | 验证 15 个 CardTreeNode 测试全部通过 | CardTreeNode 15 tests | 0.5h |
| F2.1 | 安装 jest-axe 包 | `pnpm add -D jest-axe` 修复 accessibility test import 失败 | jest-axe missing | 0.5h |
| F2.2 | Accessibility 测试验证 | 验证 accessibility.test.tsx 套件通过 | jest-axe missing | 0.5h |
| F3.1 | page.test.tsx 修复 | 修复 4 个 TestingLibraryElementError（元素查找问题） | Selector 问题 | 1h |
| F3.2 | dashboard/page.test.tsx 修复 | 修复 5 个 TestingLibraryElementError（找到多个相同文本元素） | Selector 问题 | 1h |
| F3.3 | export/page.test.tsx 修复 | 修复 1 个 TestingLibraryElementError（找到多个相同文本元素） | Selector 问题 | 0.5h |
| F4.1 | 全量测试回归验证 | 分批运行全量测试，确认无新增失败 | 全局影响 | 1h |

---

## Epic 拆分

### Epic 1: 核心 — IntersectionObserver Mock 修复

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| S1.1 | 在 `tests/unit/setup.ts` 添加全局 IntersectionObserver mock，使 `new IntersectionObserver(callback)` 返回正确的 mock 对象（observe/unobserve/disconnect/takeRecords） | 1h | `expect(IntersectionObserver).toBeDefined()`; `expect(new IntersectionObserver(()=>{})).toHaveProperty('observe')` |
| S1.2 | 验证 CardTreeNode 15 个测试全部通过 | 0.5h | `expect(result.exitCode).toBe(0)`; `expect(result.stats.passed).toBe(15)` |

### Epic 2: jest-axe 包修复

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| S2.1 | 安装 `jest-axe` 包，验证 `import { axe } from 'jest-axe'` 不再报错 | 0.5h | `expect(import('jest-axe')).resolves.toBeDefined()` |
| S2.2 | 验证 accessibility.test.tsx 套件运行无错 | 0.5h | `expect(result.exitCode).toBe(0)` |

### Epic 3: 页面测试选择器修复

| Story ID | 描述 | 工时 | 验收标准 | 页面集成 |
|----------|------|------|----------|----------|
| S3.1 | 修复 `src/app/page.test.tsx` 中 4 个 TestingLibraryElementError | 1h | `expect(screen.queryByRole('button', { name: /xxx/i })).not.toBeNull()` — 无 "Found multiple" 错误 | 【需页面集成】 |
| S3.2 | 修复 `src/app/dashboard/page.test.tsx` 中 5 个 TestingLibraryElementError（找到多个相同文本元素） | 1h | `expect(screen.queryAllByText(/xxx/i)).toHaveLength(n)` 或使用更精确选择器 | 【需页面集成】 |
| S3.3 | 修复 `src/app/export/page.test.tsx` 中 1 个 TestingLibraryElementError | 0.5h | `expect(screen.queryByRole('link', { name: /xxx/i })).toBeInTheDocument()` | 【需页面集成】 |

### Epic 4: 全量回归验证

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| S4.1 | 分批运行全量测试，验证无新增失败 | 1h | `expect(failedCount).toBeLessThan(26)` 或退出码为 0 |

---

## 验收标准（expect() 断言）

### S1.1 — IntersectionObserver Mock
```typescript
// tests/unit/setup.spec.ts（新建验证文件）
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('IntersectionObserver mock', () => {
  it('should be defined as a function', () => {
    expect(IntersectionObserver).toBeDefined();
    expect(typeof IntersectionObserver).toBe('function');
  });

  it('should return an object with required methods when constructed', () => {
    const observer = new IntersectionObserver(() => {});
    expect(observer).toHaveProperty('observe');
    expect(observer).toHaveProperty('unobserve');
    expect(observer).toHaveProperty('disconnect');
    expect(observer).toHaveProperty('takeRecords');
    expect(typeof observer.observe).toBe('function');
    expect(typeof observer.unobserve).toBe('function');
    expect(typeof observer.disconnect).toBe('function');
    expect(typeof observer.takeRecords).toBe('function');
  });

  it('observe should not throw when called with an element', () => {
    const observer = new IntersectionObserver(() => {});
    const mockEl = document.createElement('div');
    expect(() => observer.observe(mockEl)).not.toThrow();
  });
});
```

### S1.2 — CardTreeNode 测试通过
```typescript
// 验证命令输出
// npx vitest run src/components/visualization/CardTreeNode/__tests__/CardTreeNode.test.tsx --no-coverage
// 预期: exitCode === 0, stats.passed === 15
```

### S2.1 — jest-axe 包安装
```typescript
// 验证 jest-axe 可正常导入
import { axe } from 'jest-axe';
expect(axe).toBeDefined();
expect(typeof axe).toBe('function');
```

### S2.2 — Accessibility 测试通过
```typescript
// npx vitest run src/app/__tests__/accessibility.test.tsx
// 预期: exitCode === 0, stats.failures === 0
```

### S3.1 — page.test.tsx 修复
```typescript
// src/app/page.test.tsx 中每个失败的 getByRole/getByText 改为:
// 使用 queryByRole + toBeNull() 组合，或添加 name 选项精确匹配
// 预期: 所有测试中不再出现 TestingLibraryElementError
```

### S3.2 — dashboard/page.test.tsx 修复
```typescript
// 找到多个相同文本元素时:
// 方案A: 使用 getAllByText + toHaveLength 验证数量
// 方案B: 使用更精确的 name 属性或 role 限定
// 预期: 不再出现 "Found multiple elements" 错误
```

### S3.3 — export/page.test.tsx 修复
```typescript
// 同 S3.2，使用精确选择器解决 "Found multiple" 问题
// 预期: exitCode === 0
```

---

## DoD (Definition of Done)

### Epic 1 — IntersectionObserver Mock
- [x] `tests/unit/setup.ts` 中 `global.IntersectionObserver` 全局 mock 已添加 ✅ (2026-04-12)
- [x] mock 对象的 `observe/unobserve/disconnect/takeRecords` 方法均已实现 ✅
- [x] `new IntersectionObserver(callback)` 不再抛出 TypeError ✅
- [x] `CardTreeNode.test.tsx` 15/15 测试通过 ✅
- [x] 其他测试未因全局 mock 引入新的失败 ✅
- [x] `tests/unit/setup.spec.ts` 8/8 mock 行为验证测试通过 ✅

### Epic 2 — jest-axe
- [ ] `package.json` 中 `jest-axe` 已添加（devDependencies）
- [ ] `pnpm install` 成功，无 lock 文件冲突
- [ ] `src/app/__tests__/accessibility.test.tsx` 可正常运行（import 不报错）
- [ ] accessibility 测试套件通过

### Epic 3 — 页面测试选择器
- [ ] `src/app/page.test.tsx` — 4 个测试全部通过
- [ ] `src/app/dashboard/page.test.tsx` — 5 个测试全部通过
- [ ] `src/app/export/page.test.tsx` — 1 个测试通过
- [ ] 修复后不再出现 TestingLibraryElementError

### Epic 4 — 全量回归
- [ ] `npm test` 退出码为 0
- [ ] 已知失败测试数量不增加
- [ ] 分批全量测试无新增失败

---

## 优先级矩阵（MoSCoW）

| 优先级 | 功能点 | 说明 |
|--------|--------|------|
| Must | F1.1 IntersectionObserver Mock | 根因修复，15 个测试全灭 |
| Must | F1.2 CardTreeNode 测试验证 | 确保 mock 生效 |
| Must | F2.1 jest-axe 安装 | import 失败导致 suite 跳过 |
| Must | F2.2 Accessibility 测试验证 | 确保包安装生效 |
| Must | F3.1 page.test.tsx 修复 | 4 个明确失败 |
| Must | F3.2 dashboard/page.test.tsx 修复 | 5 个明确失败 |
| Must | F3.3 export/page.test.tsx 修复 | 1 个明确失败 |
| Should | F4.1 全量测试回归验证 | 确保修复不引入新问题 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-test-fix
- **执行日期**: 2026-04-12
