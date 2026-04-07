# Spec: E5 - 测试策略统一

**Epic ID**: E5  
**Epic 名称**: 测试策略统一  
**优先级**: P2  
**预估工时**: 3h（E5-S1: 1h + E5-S2: 2h）

---

## 1. Overview

明确 Jest（单元/集成）与 Playwright（E2E）的职责边界，统一前端测试策略，消除测试职责模糊导致的 CI 不稳定性。

**当前问题**:
- `beacon`/`requestAnimationFrame` 相关测试混入 Jest（无法正确测试异步行为）
- `waitForTimeout` 硬编码等待普遍存在（flaky 测试根源）
- Jest 与 Playwright 测试文件位置无明确规范

---

## 2. Story Specs

### E5-S1: 测试策略文档编写

#### 功能点
编写 `docs/TESTING_STRATEGY.md`，明确 Jest/Playwright 职责边界。

#### 文档结构

```markdown
# VibeX 前端测试策略

## 1. 测试金字塔

```
        ┌──────────────┐
        │   E2E Tests  │  ← Playwright (~10%)
        │  (User Flow)  │
       ┌┴──────────────┴┐
       │ Integration Tests│  ← Jest + Testing Library (~30%)
       │   (Component)   │
      ┌┴────────────────┴┐
      │   Unit Tests     │  ← Jest (~60%)
      │  (Pure Funcs)    │
      └──────────────────┘
```

## 2. Jest 职责范围（Unit + Integration）

### 2.1 适用场景
- ✅ 纯函数计算（utils, helpers）
- ✅ React 组件逻辑（useState, useReducer, 自定义 hooks 业务逻辑）
- ✅ 数据转换（parsers, formatters）
- ✅ Store 逻辑（actions, reducers, selectors）
- ✅ API Mock 层（MSW handlers）

### 2.2 不适用场景（必须使用 Playwright）
- ❌ `requestAnimationFrame` 相关测试
- ❌ `navigator.sendBeacon` 相关测试
- ❌ DOM 渲染结果验证（使用 Testing Library 代替）
- ❌ 跨浏览器行为差异
- ❌ 网络请求完整生命周期（从发起到响应）

### 2.3 禁止模式
```typescript
// ❌ 禁止
await page.waitForTimeout(5000);

// ✅ 推荐
await page.waitForSelector('[data-testid="loaded"]', { timeout: 5000 });
```

## 3. Playwright 职责范围（E2E）

### 3.1 适用场景
- ✅ 完整用户流程（登录 → 编辑 → 保存 → 退出）
- ✅ 跨页面交互
- ✅ `beacon`/`requestAnimationFrame` 行为
- ✅ 网络请求完整生命周期
- ✅ 视觉回归（截图对比）
- ✅ 冲突场景（E1-S3）
- ✅ 自动保存场景

### 3.2 测试文件规范
```
tests/
├── e2e/
│   ├── auth/
│   │   └── login.spec.ts
│   ├── canvas/
│   │   ├── conflict-*.spec.ts    ← E1-S3
│   │   └── auto-save.spec.ts   ← beacon/rAF
│   └── smoke/
│       └── homepage.spec.ts
├── unit/                        ← Jest
│   ├── utils/
│   └── hooks/
└── integration/                 ← Jest + Testing Library
    └── components/
```

## 4. CI 配置

```yaml
# .github/workflows/test.yml
jobs:
  jest:
    run: npm test -- --coverage
  
  playwright:
    run: npx playwright test
  
  # 契约测试 (E4)
  contracts:
    run: npm run test:contracts
```

## 5. 覆盖率要求

| 层级 | 覆盖率目标 |
|------|-----------|
| Unit | ≥ 80% |
| Integration | ≥ 60% |
| E2E | 关键路径全覆盖 |

## 6. Flaky 测试处理

1. 使用 `test.skip` 标记 flaky 测试，限期修复
2. 禁止在 Jest 中测试异步浏览器行为
3. Playwright 测试添加 `retries: 2` 配置
```

#### 验收标准
```typescript
expect(fs.existsSync('docs/TESTING_STRATEGY.md')).toBe(true);
expect(doc.hasJestScope).toBe(true);
expect(doc.hasPlaywrightScope).toBe(true);
expect(doc.hasForbiddenPatterns).toBe(true); // waitForTimeout 禁止
expect(doc.hasCoverageTargets).toBe(true);
expect(doc.hasFileStructure).toBe(true);
```

---

### E5-S2: beacon/rAF 测试迁移

#### 功能点
将 `beacon` 和 `requestAnimationFrame` 相关测试从 Jest 迁移到 Playwright。

#### 迁移清单

| 原 Jest 测试 | 迁移目标 Playwright Spec |
|-------------|------------------------|
| `useAutoSave.test.ts` (beacon 测试) | `tests/e2e/canvas/auto-save.spec.ts` |
| `SaveIndicator.test.ts` (rAF 测试) | `tests/e2e/canvas/save-indicator.spec.ts` |

#### 技术规格

**Playwright auto-save.spec.ts**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Auto-save beacon', () => {
  test('should send beacon on canvas change', async ({ page }) => {
    await page.goto('/canvas/test-canvas');
    
    // Mock navigator.sendBeacon
    const beaconCalls: any[] = [];
    await page.addInitScript(() => {
      (window.navigator as any).sendBeacon = (url: string, data: any) => {
        beaconCalls.push({ url, data });
        return true;
      };
    });
    
    await page.locator('[data-testid="canvas"]').fill('{}');
    
    // 等待 beacon 调用
    await expect.poll(async () => beaconCalls.length, { timeout: 5000 }).toBeGreaterThan(0);
    expect(beaconCalls[0].url).toContain('/v1/canvas/snapshots');
  });
});
```

#### 验收标准
```typescript
// Jest 中无 beacon/rAF 测试
const jestBeaconTests = execSync(
  'grep -r "sendBeacon\\|requestAnimationFrame" tests/unit/ --include="*.test.ts"'
);
expect(jestBeaconTests.toString()).toHaveLength(0);

// Playwright 有覆盖
const playwrightSpecs = fs.readdirSync('tests/e2e/canvas/');
expect(playwrightSpecs.filter(s => s.includes('auto-save') || s.includes('save-indicator'))).toBeGreaterThan(0);
```

#### 文件变更
| 文件 | 操作 |
|------|------|
| `tests/e2e/canvas/auto-save.spec.ts` | 新建 |
| `tests/e2e/canvas/save-indicator.spec.ts` | 新建 |
| `tests/unit/useAutoSave.test.ts` | 修改（移除 beacon 测试）|
| `tests/unit/SaveIndicator.test.ts` | 修改（移除 rAF 测试）|

---

## 3. 风险缓解

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| Dev 习惯难改 | 🟡 中 | 文档 + Code Review 双重约束，PR 中检测到违规则要求修改 |
| 迁移期间测试覆盖空白 | 🟢 低 | 迁移与新增同步进行，不存在空窗期 |

---

*Spec 由 PM Agent 生成于 2026-04-03*
