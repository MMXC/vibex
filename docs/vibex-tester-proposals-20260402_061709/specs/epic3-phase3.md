# Epic 3: 视觉回归 + 用户旅程（Phase 3）

## Spec 规格

### S3.1: 引入 pixelmatch 截图对比

**工时**: 1d  
**负责人**: tester

**修复方案**:

```typescript
// tests/visual/canvas-visual.spec.ts
import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'
import pixelmatch from 'pixelmatch'

test('视觉回归: Canvas 首页', async ({ page }) => {
  await page.goto('/canvas')
  await page.waitForLoadState('networkidle')
  
  // 截图当前状态
  const screenshot = await page.screenshot({ fullPage: true })
  
  // 读取 baseline
  const baselinePath = join(__dirname, '../visual-baselines/canvas-homepage.png')
  const baseline = readFileSync(baselinePath)
  
  // 对比
  const diff = pixelmatch(baseline, screenshot, null, 1280, 720, { threshold: 0.01 })
  const diffRatio = diff / (1280 * 720)
  
  expect(diffRatio).toBeLessThan(0.01) // 差异 < 1%
})
```

**关键页面清单**:
- Canvas 首页 (`canvas-homepage.png`)
- 设计系统组件 (`design-system-components.png`)
- ContextTree 面板 (`context-tree-panel.png`)
- ComponentTree 面板 (`component-tree-panel.png`)

**验收标准**:
- `expect(diffPixels / totalPixels).toBeLessThan(0.01)`（差异 <1%）
- 差异 >1% 时 CI 失败并告警

---

### S3.2: 建立视觉回归 baseline 管理机制

**工时**: 0.5d  
**负责人**: tester

**修复方案**:

```
tests/
├── visual-baselines/
│   ├── canvas-homepage.png
│   ├── design-system-components.png
│   ├── context-tree-panel.png
│   └── component-tree-panel.png
├── visual/
│   ├── canvas-visual.spec.ts
│   └── ...
└── update-baselines.ts  # 更新 baseline 脚本
```

```bash
# 更新 baseline
npm run test:visual:update
```

**验收标准**:
- `expect(fs.existsSync('tests/visual-baselines/')).toBe(true)`
- `expect(fs.existsSync('tests/visual-baselines/canvas-homepage.png')).toBe(true)`

---

### S3.3–S3.4: 用户旅程 E2E 测试

**工时**: 1.5d（0.5d + 1d）  
**负责人**: tester

#### 用户旅程：创建项目 → 添加限界上下文

```typescript
// tests/e2e/user-journey-create-project.spec.ts
import { test, expect } from '@playwright/test'

test('用户旅程: 创建项目 → 添加限界上下文', async ({ page }) => {
  // 1. 创建项目
  await page.goto('/')
  await page.click('[data-testid="new-project-btn"]')
  await page.fill('[data-testid="project-name-input"]', 'Test Project')
  await page.click('[data-testid="create-project-submit"]')
  
  // 验证项目创建成功
  await expect(page.locator('.project-created')).toBeVisible()
  await expect(page).toHaveURL(/\/project\/.+/)

  // 2. 添加限界上下文
  await page.click('[data-testid="add-context-btn"]')
  await page.fill('[data-testid="context-name-input"]', 'Test Context')
  await page.click('[data-testid="add-context-submit"]')
  
  // 验证上下文添加成功
  await expect(page.locator('.bounded-context')).toHaveCount(1)
})
```

#### 用户旅程：生成组件树 → 导出代码

```typescript
// tests/e2e/user-journey-generate-export.spec.ts
import { test, expect } from '@playwright/test'

test('用户旅程: 生成组件树 → 导出代码', async ({ page }) => {
  await page.goto('/canvas')
  await page.waitForLoadState('networkidle')

  // 1. 生成组件树
  await page.click('[data-testid="generate-btn"]')
  await page.waitForSelector('.component-tree .node', { timeout: 10000 })
  
  // 验证组件树节点存在
  const nodes = page.locator('.component-tree .node')
  await expect(nodes).not.toHaveCount(0)

  // 2. 导出代码
  await page.click('[data-testid="export-btn"]')
  
  // 验证导出成功
  await expect(page.locator('.export-success')).toBeVisible()
  await expect(page.locator('.export-code')).toContainText('export default')
})
```

**验收标准**:
- 全流程无 JS 错误（`page.on('console', msg => expect(msg.type()).not.toBe('error'))`）
- 组件树节点数 >0
- `.export-success` 元素可见

---

### S3.5: 补充组件状态命名规范 + TS strict

**工时**: 0.5d  
**负责人**: dev

**修复方案**:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnnecessaryCondition": true
  }
}
```

**命名规范文档**（`docs/testing/component-state-naming.md`）:

| 状态类型 | 命名规范 | 示例 |
|---------|---------|------|
| Boolean 状态 | `is` / `has` / `can` 前缀 | `isActive`, `hasChildren`, `canExport` |
| 异步加载状态 | `isLoading` / `isPending` | `isLoading: boolean` |
| 错误状态 | `error` / `isError` | `error: Error \| null` |
| 禁用状态 | `disabled` | `disabled: boolean` |
| 展开/折叠 | `isExpanded` / `isCollapsed` | `isExpanded: boolean` |

**验收标准**:
- `expect(tsConfig.compilerOptions.strict).toBe(true)`
- `npx tsc --strict` 退出码为 0

---

### S3.6: 建立 commit message lint 规则

**工时**: 0.25d  
**负责人**: dev

**修复方案**:

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-case': [2, 'always', 'sentence-case'],
  },
}
```

**验收标准**:
- `commitlint --from HEAD~1 --to HEAD` 通过
- CI 中 commitlint 检查失败则 PR 不可合并
