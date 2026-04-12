# 需求分析报告：vibex npm test 修复

**项目**: vibex-test-fix
**阶段**: Phase1 — analyze-requirements
**日期**: 2026-04-12
**分析人**: Analyst

---

## 1. 业务场景分析

### 问题背景
`npm test`（vitest run）存在大量测试失败，开发者无法通过本地测试验证代码正确性，CI 测试门禁失效。根因定位为 `CardTreeNode` 组件依赖 `IntersectionObserver` API，而 jsdom 环境不支持该 API。

### 涉及组件
- `CardTreeNode.tsx` — 树形节点可视化组件，使用 `useIntersectionObserver` hook 实现懒加载
- `useFloatingMode.ts` — 首页悬浮模式 hook，也依赖 IntersectionObserver（但无独立测试）

### 当前测试失败范围（实测）

| 测试文件 | 失败数 | 根因 |
|---|---|---|
| `CardTreeNode.test.tsx` | 15/15 | IntersectionObserver mock 构造错误 |
| `page.test.tsx` | 4 tests | TestingLibraryElementError — 元素未找到 |
| `dashboard/page.test.tsx` | 5 tests | TestingLibraryElementError — 找到多个相同文本元素 |
| `export/page.test.tsx` | 1 test | TestingLibraryElementError — 找到多个相同文本元素 |
| `accessibility.test.tsx` | 1 suite | `jest-axe` 包缺失，import 失败 |

**注**: 任务描述中"3389 passed, 97 failed"数字与实测不符（Vitest 全量运行会因 292 个测试文件导致 OOM），实际失败数量需全量运行才能确认。当前可见失败 ≥26 tests。

---

## 2. 技术可行性评估

### 根因分析

#### A. CardTreeNode IntersectionObserver Mock（核心问题）

**文件**: `src/components/visualization/CardTreeNode/__tests__/CardTreeNode.test.tsx` L21-35

**错误**:
```
TypeError: (_callback) => { return { observe: vi.fn(), ... } } is not a constructor
```

**根因**: `vi.fn((callback) => { return {...} })` 返回的是 mock 函数本身，不是 `return {...}` 中的对象。当执行 `new IntersectionObserver(callback)` 时：
- `new` 运算符调用 `vi.fn()`，得到 `undefined`（vi.fn 默认不返回任何值）
- 后续代码访问 `observer.observe()` → `undefined.observe()` → TypeError

**历史经验**（来自 `docs/learnings/vibex-test-env-fix/`）:
- 此问题曾在 `vibex-test-env-fix` 项目中被识别和修复
- 修复方案 A：在 `jest.setup.ts` 全局添加 IntersectionObserver mock
- 修复方案 B：在测试文件顶部单独 mock
- commit `32667283` 记录了 CardTreeNode 15 tests 修复

**现状**: 现有 mock 在 `CardTreeNode.test.tsx` 的 `beforeAll` 中，但实现有 bug，修复未生效。

#### B. 其他测试失败（非 IntersectionObserver）

1. **`accessibility.test.tsx`**: `jest-axe` 包缺失 → 安装即可
2. **`page.test.tsx` 等**: 测试选择器问题，与 IntersectionObserver 无关，需要独立分析

### 技术方案选项

#### 方案 1：集中式 Mock（推荐）

**思路**: 在 `tests/unit/setup.ts` 全局添加 `IntersectionObserver` mock，所有测试文件共享。

**优点**:
- 一次性解决，无需修改各测试文件
- 符合 `vibex-test-env-fix` 历史经验
- 可控性强（mock 行为集中管理）

**缺点**:
- 需要修改全局 setup 文件
- 需确保 mock 行为不影响其他测试

**实现**:
```typescript
// tests/unit/setup.ts
global.IntersectionObserver = vi.fn((callback: IntersectionObserverCallback) => ({
  observe: vi.fn((el: Element) => {
    // 立即报告元素可见
    callback(
      [{ isIntersecting: true, target: el }] as IntersectionObserverEntry[],
      global.IntersectionObserver as unknown as IntersectionObserver
    );
  }),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
})) as unknown as typeof IntersectionObserver;
```

#### 方案 2：移除 CardTreeNode 依赖 IntersectionObserver

**思路**: 让 `CardTreeNode` 组件支持 props 注入 visibility 状态，测试时直接传 `isVisible={true}`。

**优点**:
- 根本解决问题，组件不再依赖浏览器 API
- 测试更稳定

**缺点**:
- 改变组件 API，有向后兼容风险
- 需要修改生产代码
- 工期更长

#### 方案 3：修改 CardTreeNode.test.tsx 中的 Mock 实现

**思路**: 修复 `CardTreeNode.test.tsx` 中的 `vi.fn()` 用法，改为正确返回 mock 对象。

**实现**:
```typescript
beforeAll(() => {
  global.IntersectionObserver = vi.fn((callback: IntersectionObserverCallback) => ({
    observe: (el: Element) => {
      mockObserve(el);
      callback(
        [{ isIntersecting: true, target: el }] as IntersectionObserverEntry[],
        global.IntersectionObserver as unknown as IntersectionObserver
      );
    },
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  })) as unknown as typeof IntersectionObserver;
});
```

**注意**: 关键区别是 `vi.fn((callback) => ({...}))` 直接返回对象（不在回调里 return），而原代码的 `return {...}` 在 `vi.fn()` 执行上下文中被忽略。

---

## 3. 风险矩阵

| 风险 | 可能性 | 影响 | 等级 | 缓解 |
|---|---|---|---|---|
| CardTreeNode mock 全局化影响其他测试 | 低 | 中 | 🟡 中 | 验证全量测试通过 |
| jest-axe 包缺失导致 accessibility 测试无法运行 | 高 | 低 | 🟡 中 | 安装包或跳过该测试 |
| `page.test.tsx` 等元素查找问题根因不同 | 中 | 中 | 🟡 中 | 逐文件分析 |
| Vitest 全量运行 OOM（292 个测试文件） | 中 | 高 | 🟠 高 | 分批运行或增加 NODE_OPTIONS |
| 全量测试失败数远超 97（实际可能更多） | 高 | 高 | 🔴 极高 | 先修复核心问题，再排查其他 |

---

## 4. 工期估算

| 任务 | 估算工时 | 备注 |
|---|---|---|
| 修复 IntersectionObserver mock（集中式） | 1h | 修改 setup.ts + 验证 CardTreeNode 测试 |
| 修复 `jest-axe` 包缺失 | 0.5h | `pnpm add -D jest-axe` |
| 分析并修复 `page.test.tsx` 等测试 | 2-4h | 需逐文件分析根因 |
| 全量测试验证 | 1h | 分批运行验证 |
| **合计** | **4.5-6.5h** | |

---

## 5. 依赖分析

- **上游**: 无阻塞依赖
- **下游**: 
  - `jest-axe` 包安装 → 可能影响 `package.json` / `pnpm-lock.yaml`
  - `setup.ts` 修改 → 影响所有 vitest 测试
- **工具依赖**: Vitest 2.x, jsdom, `@testing-library/react`

---

## 6. 验收标准

### 必须满足（验收红线）
1. `npx vitest run CardTreeNode --no-coverage` → 15/15 tests passed
2. `npx vitest run src/app/__tests__/accessibility.test.tsx` → 0 failures（安装 jest-axe 后）
3. `npx vitest run src/app/page.test.tsx` → 0 failures
4. `npx vitest run src/app/dashboard/page.test.tsx` → 0 failures
5. `npx vitest run src/app/export/page.test.tsx` → 0 failures

### 建议满足
6. 全量测试（分批运行）无新增失败
7. CI 测试门禁 (`npm test`) 退出码为 0

---

## 7. 待澄清项

1. **"3389 passed, 97 failed"** 的数字来源不明 — 当前无法全量运行确认该数字
2. **`page.test.tsx` / `dashboard/page.test.tsx`** 的失败是否已知问题还是新发现？
3. 是否有其他使用 IntersectionObserver 但未 Mock 的测试文件？（`useFloatingMode.ts` 无独立测试）

---

## 8. 评审结论

**推荐**: 有条件通过，建议先修复核心的 IntersectionObserver 问题 + jest-axe，再评估其他测试失败数量。

**理由**:
- CardTreeNode 15 个测试全灭是明确的技术债务，有历史经验可循，修复成本低（1h）
- 其他测试失败（26+ tests）根因各异，需逐个分析，不应与 IntersectionObserver 问题混为一谈
- Vitest 全量运行 OOM 问题应作为独立风险项处理

**行动建议**: 先执行 Phase1 修复（IntersectionObserver + jest-axe），再执行 Phase2 全量测试排查。

---

## 执行决策

- **决策**: 有条件推荐
- **执行项目**: vibex-test-fix
- **执行日期**: 待定（Phase1 修复先行）
