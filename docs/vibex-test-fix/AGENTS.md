# AGENTS.md — vibex-test-fix 开发约束

**项目**: vibex-test-fix
**日期**: 2026-04-12

> 所有 Agent 在执行 vibex-test-fix 相关任务前必须阅读本文档。

---

## 核心约束

### 🔴 禁止事项

1. **禁止修改生产代码** — 只改测试文件（`*.test.tsx`、`setup.ts`、`package.json`）
2. **禁止删除测试文件** — 只修复，不移除测试覆盖
3. **禁止引入新的 npm 包** — 除 `jest-axe` 外，不添加其他依赖
4. **禁止修改 vitest.config.ts** — 配置文件不需要改动
5. **禁止全局安装 jest-axe** — 只加 devDependencies

### 🟡 并行执行约束

**禁止两个 Agent 同时修改同一文件**。Epic 1/2/3 可并行，但必须按文件隔离：
- Agent A → Epic 1 (`setup.ts`)
- Agent B → Epic 2 (`package.json`)
- Agent C → Epic 3 (`page.test.tsx` 等)

### 🟡 变更范围（白名单）

| 文件 | 允许操作 |
|------|---------|
| `vibex-fronted/tests/unit/setup.ts` | 添加 IntersectionObserver mock |
| `vibex-fronted/package.json` | 添加 `jest-axe` |
| `vibex-fronted/pnpm-lock.yaml` | 自动更新（pnpm install 后） |
| `vibex-fronted/src/components/visualization/CardTreeNode/__tests__/CardTreeNode.test.tsx` | 删除冗余本地 mock |
| `vibex-fronted/src/app/page.test.tsx` | 修复选择器 |
| `vibex-fronted/src/app/dashboard/page.test.tsx` | 修复选择器 |
| `vibex-fronted/src/app/export/page.test.tsx` | 修复选择器 |

### 🟢 必须执行

1. **每修改一个文件后立即验证** — 不批量修改后统一验证，定位成本高
2. **先跑卡住的测试，确认失败信息** — 读代码不如跑测试来得准确
3. **全量测试用分批方式** — 避免 OOM：`npx vitest run <path> --no-coverage`

---

## IntersectionObserver Mock 使用规范

```typescript
// ✅ 正确：直接赋值给 global，不包装 vi.fn() 返回值
global.IntersectionObserver = vi.fn(
  (callback: IntersectionObserverCallback): IntersectionObserver => ({
    observe: vi.fn((el) => { callback([{ isIntersecting: true, target: el }] as any, {} as any); }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => []),
  })
) as unknown as typeof IntersectionObserver;

// ❌ 错误：vi.fn() 之后又 return 对象（return 在 vi.fn 执行上下文之外）
// ❌ 错误：省略 TypeScript 类型 cast，导致运行时报"不是构造函数"
```

### 何时不需要单独 mock

`setup.ts` 中已添加全局 mock 后，以下场景**不需要**单独添加本地 mock：
- 组件通过 `useIntersectionObserver` hook 使用 IntersectionObserver
- 组件内部直接使用 `new IntersectionObserver()`
- 任何在测试中创建 observer 的场景

---

## jest-axe 使用规范

```typescript
// ✅ 正确：必须搭配 container
import { axe } from 'jest-axe';
const { container } = render(<MyComponent />);
const results = await axe(container);
expect(results).toHaveNoViolations();

// ✅ 正确：setup.ts 已导入 @testing-library/jest-dom，所有测试文件自动获得 toBeInTheDocument() 等 matcher，无需重复 import
```

**注意**：`@testing-library/jest-dom` 已在 `setup.ts` 顶部导入，所有测试文件自动获得 `toBeInTheDocument()` 等 matcher。

---

## 选择器修复规范

### "Found multiple elements" 错误

```typescript
// ❌ 错误：模糊匹配找到多个
const buttons = screen.getByText('Submit');

// ✅ 方案 A：使用精确 role + name
const button = screen.getByRole('button', { name: '提交表单' });

// ✅ 方案 B：使用 getAllByText 并验证数量
const items = screen.getAllByText(/loading/i);
expect(items).toHaveLength(2);

// ✅ 方案 C：使用 data-testid（不推荐，除非以上都无法解决）
const el = screen.getByTestId('unique-submit-button');
```

---

## 测试运行命令

```bash
cd /root/.openclaw/vibex/vibex-fronted

# 单个文件（推荐，每次修改后执行）
npx vitest run src/components/visualization/CardTreeNode/__tests__/CardTreeNode.test.tsx --no-coverage

# 按目录分批（避免 OOM）
npx vitest run src/app --no-coverage
npx vitest run src/components --no-coverage
npx vitest run src/stores --no-coverage

# 全量测试（最后执行）
npm test
```

---

## 工作目录

```
/root/.openclaw/vibex/vibex-fronted
```

**注意**：前端代码在 `vibex-fronted/` 子目录，后端 `vibex-backend/` 不受影响。
