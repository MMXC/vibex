# E05 PRD → Canvas 自动流程 — QA 验证规格

**Epic**: E05 | **验证策略**: gstack 浏览器交互验证
**E2E 文件**: prd-canvas-mapping.spec.ts（187行）

---

## 页面: PRD Editor（PRD → Canvas 按钮所在页）

### 验证场景
在 PRD Editor 中，点击"生成 Canvas"按钮，验证 Canvas 三栏自动填充节点。

### 四态验证

**理想态（有 PRD 内容）**
- PRD Editor 正常显示 PRD 内容
- "生成 Canvas"按钮可见且可点击
- 点击后 Canvas 三栏自动填充节点（chapter/step/requirement）
- PRD 内容变更触发 Canvas 更新

**PRD 空状态**
- 无 PRD 内容时，按钮禁用或显示"请先输入 PRD"
- 不触发错误

**加载态**
- 点击"生成 Canvas"后显示 loading 状态
- 不允许重复点击

**错误态**
- 生成失败时显示错误信息
- 不阻塞用户继续编辑 PRD

### 验收断言（gstack /qa 格式）

```javascript
// E05-Q1: PRD Editor 可访问
await expect(page).toHaveURL(/\/prd\/.+|.*prd-editor.+/))
// PRD Editor 核心区域可见

// E05-Q2: "生成 Canvas"按钮存在
const generateBtn = page.locator('[data-testid="generate-canvas-btn"]')
await expect(generateBtn).toBeVisible()

// E05-Q3: 按钮可点击（PRD 有内容时）
// 假设页面已有测试 PRD 数据
const btnDisabled = await generateBtn.getAttribute('disabled')
expect(btnDisabled).toBeNull()  // 按钮未禁用

// E05-Q4: 点击后 Canvas 三栏填充
await generateBtn.click()
await page.waitForTimeout(1500)  // 等待 Canvas 同步
const leftPanel = page.locator('[data-testid="context-panel"]')
const centerPanel = page.locator('[data-testid="flow-panel"]')
const rightPanel = page.locator('[data-testid="design-panel"]')
await expect(leftPanel).toBeVisible()
await expect(centerPanel).toBeVisible()
await expect(rightPanel).toBeVisible()

// E05-Q5: Canvas 节点填充（至少有 1 个节点）
const nodes = page.locator('[data-testid="canvas-node"]')
await expect(nodes.first()).toBeVisible({ timeout: 3000 })
```

### 执行方式
`/qa --url http://localhost:3000/prd/test-prd --assert "E05-Q1 to E05-Q5"`
