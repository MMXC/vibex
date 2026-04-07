# Implementation Plan: canvas-scroll-top-bug

**项目**: canvas-scroll-top-bug
**Agent**: Architect
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行概要

| 字段 | 值 |
|------|-----|
| **Epic** | E1: scrollTop 归零修复 |
| **总工时** | 0.5h |
| **优先级** | P0 |
| **依赖** | 无 |
| **可并行** | ✅ |

**任务拆分**:

| Story ID | 任务 | 工时 | 负责人 |
|----------|------|------|--------|
| E1-S1 | scrollTop 归零修复 | 0.25h | Dev |
| E1-S2 | 三栏面板区域可见性验证 | 0.1h | Dev |
| E1-S3 | 回归测试（10次切换） | 0.15h | Tester |

---

## 2. E1-S1: scrollTop 归零修复

### 2.1 修改文件

- `vibex-fronted/src/components/canvas/CanvasPage.tsx`

### 2.2 变更内容

在 `CanvasPage.tsx` 中新增 `useEffect`，在 canvas 组件挂载时重置滚动位置：

```typescript
// 文件: vibex-fronted/src/components/canvas/CanvasPage.tsx
// 位置: 在现有的 useEffect hooks 之后新增

useEffect(() => {
  // E1-S1: 重置 canvasContainer 滚动位置
  const container = document.querySelector('[class*="canvasContainer"]');
  if (container) {
    container.scrollTo({ top: 0, behavior: 'instant' });
  }
}, []); // 空依赖数组：仅 canvas mount 时执行一次，不在后续渲染中重复执行
```

**关键决策**:

- 使用 `[class*="canvasContainer"]` 选择器匹配 CSS Modules 生成的类名
- `behavior: 'instant'` 确保立即归位，无动画延迟
- 空依赖数组 `[]` 确保仅在 mount 时执行，避免性能开销

### 2.3 验收标准

```typescript
// E2E 断言
expect(canvasContainer.scrollTop).toBe(0);
```

---

## 3. E1-S2: 三栏面板区域可见性验证

### 3.1 验证目标

确认以下元素在进入画布后 top ≥ 0（不被 scrollTop 推出视口）：

- 阶段进度条 (`[data-testid="progress-bar"]`)
- Tab 栏 (`[data-testid="tab-bar"]`)
- 工具栏 (`[data-testid="canvas-toolbar"]`)

### 3.2 验证方式

手动截图 + Playwright E2E boundingBox 断言：

```typescript
const box = await element.boundingBox();
expect(box?.top ?? -1).toBeGreaterThanOrEqual(0);
```

### 3.3 验收标准

- 进度条 top ≥ 0
- Tab 栏 top ≥ 0
- 工具栏 top ≥ 0

---

## 4. E1-S3: 回归测试

### 4.1 测试场景

反复切换 10 次，验证每次进入画布时 scrollTop 都为 0，无累积效应。

### 4.2 测试用例

```typescript
// 文件: vibex-fronted/e2e/canvas-scroll.spec.ts

test('scrollTop stays 0 after 10 repeated switches', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 10; i++) {
    await page.click('[data-testid="switch-to-canvas"]');
    await page.waitForURL('**/canvas');
    await page.waitForTimeout(100);

    const scrollTop = await page.evaluate(() => {
      const c = document.querySelector('[class*="canvasContainer"]');
      return c?.scrollTop ?? -1;
    });
    expect(scrollTop).toBe(0);

    await page.click('[data-testid="switch-to-requirements"]');
    await page.waitForURL('**/');
  }
});
```

### 4.3 验收标准

- 10 次切换中，每次 scrollTop === 0
- 无控制台 Error 级别错误

---

## 5. 实现步骤（线性执行）

```
Step 1: E1-S1 实现
  ├── 5min: 在 CanvasPage.tsx 新增 useEffect
  ├── 5min: npm run build 验证编译通过
  └── 5min: 本地 Playwright 单测验证 scrollTop === 0

Step 2: E1-S2 验证
  ├── 3min: Playwright 截图确认工具栏可见
  └── 3min: boundingBox 断言通过

Step 3: E1-S3 回归
  ├── 5min: 编写 10次切换 E2E 测试
  └── 5min: 运行测试，全部通过
```

---

## 6. 验证命令

```bash
# 1. 编译验证
cd /root/.openclaw/vibex/vibex-fronted
npm run build

# 2. 启动开发服务器
npm run dev &
sleep 5

# 3. Playwright E2E 测试
npx playwright test e2e/canvas-scroll.spec.ts --project=chromium

# 4. 单次切换验证
# 访问 /canvas，检查控制台：
# document.querySelector('[class*="canvasContainer"]')?.scrollTop
# 期望输出: 0

# 5. 截图验证（手动）
# 截图 /canvas 页面，确认进度条、Tab 栏、工具栏在视口内
```

---

## 7. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| CSS Modules 类名不匹配选择器 | 低 | 中 | 验证选择器 `[class*="canvasContainer"]` 匹配 CSS Modules 输出 |
| scrollTop 重置时机不对 | 低 | 中 | 使用空依赖数组 useEffect，确保 mount 时执行 |
| 修复影响画布内容滚动 | 低 | 低 | 确认 overflow: auto 仍然保留，不使用 CSS 方案 |
| 测试环境与生产行为差异 | 中 | 中 | Playwright 使用真实 Chromium，与用户行为一致 |

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: canvas-scroll-top-bug
- **执行日期**: 2026-04-01
