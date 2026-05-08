# E03 AI 辅助需求解析 — QA 验证规格

**Epic**: E03 | **验证策略**: gstack 浏览器交互验证
**E2E 文件**: onboarding-ai.spec.ts（317行）

---

## 页面: Onboarding ClarifyStep

### 验证场景
完成 Onboarding 流程到 ClarifyStep，验证 AI 解析功能、降级路径。

### 四态验证

**理想态（API Key 已配置）**
- ClarifyStep 显示 AI 解析输入框
- 用户输入自然语言需求
- 显示"解析中"状态（spinner 或进度指示）
- 解析完成后显示结构化预览（Chapter/Step/Requirement 分组）
- 用户可编辑/确认结果

**降级态（API Key 未配置）**
- ClarifyStep 正常显示
- 显示引导文案："请配置 API Key 以启用 AI 解析"（或类似）
- 不抛出错误，不阻断 Onboarding 流程
- 用户可跳过 AI 解析继续下一步

**加载态**
- 显示"正在解析..."文案
- 不允许重复提交

**错误态**
- AI 请求超时时显示提示
- 不阻断流程，自动降级为手动输入模式

### 验收断言（gstack /qa 格式）

```javascript
// E03-Q1: Onboarding 可到达 ClarifyStep
// 先完成注册和部分 Onboarding 步骤
await page.goto(`${BASE_URL}/onboarding`)
await page.click('[data-testid="start-btn"]')
// ... 完成前置步骤 ...
await expect(page.locator('[data-testid="clarify-step"]')).toBeVisible()

// E03-Q2: ClarifyStep AI 输入区域存在
const aiInput = page.locator('[data-testid="ai-clarify-input"]')
await expect(aiInput).toBeVisible()

// E03-Q3: 降级态验证（无 API Key）
// 检查引导文案存在且无 error
const guidance = page.locator('text=/配置|API Key|AI 解析/i')
// 降级态下 guidance 可见，或者 AI 结果不可见但页面不报错
const hasGuidance = await guidance.isVisible()
const hasError = await page.locator('.error, [role="alert"]').isVisible()
expect(hasGuidance || !hasError).toBeTruthy()

// E03-Q4: Onboarding 可继续（无论 AI 结果如何）
const nextBtn = page.locator('[data-testid="next-btn"]')
await expect(nextBtn).toBeVisible()
await nextBtn.click()
// 期望不崩溃，停留在 ClarifyStep 或进入下一步
await expect(page).not.toHaveURL(/error/)
```

### 执行方式
`/qa --url http://localhost:3000/onboarding --assert "E03-Q1 to E03-Q4"`
