# AGENTS.md: canvas-scroll-top-bug

**项目**: canvas-scroll-top-bug
**Agent**: Architect
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行约束（E1 全局约束）

### 1.1 功能约束

| 约束 ID | 描述 | 原因 |
|---------|------|------|
| C1 | `scrollTop` 必须在 canvas mount 时归零为 `0` | 修复 PRD 中 scrollTop=946 导致工具栏不可见 |
| C2 | 使用 `scrollTo({ top: 0, behavior: 'instant' })` 而非直接赋值 `scrollTop = 0` | API 更标准，`behavior: 'instant'` 避免动画 |
| C3 | 不得使用 CSS `overflow: hidden` 作为主要方案 | 全局禁用滚动风险过高，仅作备用降级 |
| C4 | `useEffect` 使用空依赖数组 `[]` | 确保仅 mount 时执行一次，不在后续渲染中重复触发 |

### 1.2 代码质量约束

| 约束 ID | 描述 |
|---------|------|
| C5 | 新增代码必须在 `CanvasPage.tsx` 内，不新建文件 |
| C6 | `npm run build` 必须通过，不得破坏现有编译 |
| C7 | Playwright E2E 测试必须在 CI 中通过 |
| C8 | 不得引入新的 npm 依赖 |

---

## 2. Dev Agent 约束

### 2.1 必须做的事情

- ✅ 在 `CanvasPage.tsx` 中新增 `useEffect` hook，调用 `scrollTo(0, 0)`
- ✅ 验证 `npm run build` 通过
- ✅ 编写 `e2e/canvas-scroll.spec.ts` 覆盖所有三个验收场景
- ✅ 运行 Playwright 测试，全部用例通过

### 2.2 禁止模式（Prohibited Patterns）

以下模式 **禁止使用**，发现即修复：

```typescript
// ❌ 禁止: 硬编码 scrollTop 数值
container.scrollTop = 946;
container.scrollTop = 500;
container.scrollTop = someHardcodedValue;

// ❌ 禁止: 缺少 useEffect cleanup 导致重复执行
useEffect(() => {
  container.scrollTo(0, 0);
}); // 错误：没有依赖数组，会在每次渲染时执行

// ❌ 禁止: 使用 setTimeout 延迟
setTimeout(() => container.scrollTop = 0, 100);

// ❌ 禁止: 使用 CSS overflow: hidden 作为主要方案
.canvasContainer {
  overflow: hidden; // 拒绝：禁用滚动风险太高
}

// ❌ 禁止: 直接操作 scrollTop 而非 scrollTo
container.scrollTop = 0; // 拒绝：偏好 scrollTo API
```

### 2.3 正确实现示例

```typescript
// ✅ 正确: 空依赖数组 useEffect
useEffect(() => {
  const container = document.querySelector('[class*="canvasContainer"]');
  container?.scrollTo({ top: 0, behavior: 'instant' });
}, []); // 空数组：仅 mount 时执行一次

// ✅ 正确: 带条件判断的 scrollTo
useEffect(() => {
  const container = document.querySelector('[class*="canvasContainer"]');
  if (container && container.scrollTop !== 0) {
    container.scrollTo({ top: 0, behavior: 'instant' });
  }
}, []);
```

---

## 3. Tester Agent 约束

### 3.1 E2E 测试必须覆盖

| 测试 ID | 场景 | 断言 |
|---------|------|------|
| T1 | 进入画布后 scrollTop === 0 | `expect(scrollTop).toBe(0)` |
| T2 | 进度条 top ≥ 0 | `expect(boundingBox.top).toBeGreaterThanOrEqual(0)` |
| T3 | Tab 栏 top ≥ 0 | `expect(boundingBox.top).toBeGreaterThanOrEqual(0)` |
| T4 | 工具栏 top ≥ 0 | `expect(boundingBox.top).toBeGreaterThanOrEqual(0)` |
| T5 | 10 次切换后 scrollTop === 0 | `expect(scrollTop).toBe(0)` 循环 10 次 |

### 3.2 禁止模式

```typescript
// ❌ 禁止: 缺少等待导致测试不稳定
await page.click('button');
const scrollTop = await page.evaluate(...); // 错误：未等待 DOM 更新

// ❌ 禁止: 硬编码等待时间而非状态等待
await page.waitForTimeout(500); // 错误：不稳定的测试

// ✅ 正确: 等待 URL 或元素状态
await page.waitForURL('**/canvas');
await page.waitForSelector('[data-testid="canvas-toolbar"]');
```

---

## 4. Reviewer Agent 约束

### 4.1 代码审查清单

- [ ] `useEffect` 使用了空依赖数组 `[]`
- [ ] 使用 `scrollTo` 而非直接赋值 `scrollTop`
- [ ] 无硬编码 scrollTop 数值
- [ ] 无 CSS `overflow: hidden` 作为主要方案
- [ ] `npm run build` 通过
- [ ] Playwright E2E 测试全部通过
- [ ] 无新增 npm 依赖

### 4.2 审查关注点

**重点审查**: 确保修复仅改动 `CanvasPage.tsx` 的一个 `useEffect`，无副作用扩散。

---

## 5. 团队协作约定

### 5.1 文件路径约定

```
vibex-fronted/src/components/canvas/CanvasPage.tsx     ← 修复文件
vibex-fronted/e2e/canvas-scroll.spec.ts                ← E2E 测试文件
```

### 5.2 提交信息约定

```
fix(E1-S1): reset scrollTop to 0 on canvas mount

- Add useEffect in CanvasPage.tsx to call scrollTo(0, 0)
- Add E2E tests covering 3 acceptance criteria
- Zero new dependencies
```

### 5.3 PR 标签

- `type: bugfix`
- `epic: E1`
- `priority: P0`

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: canvas-scroll-top-bug
- **执行日期**: 2026-04-01
