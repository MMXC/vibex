# Spec — E1: 品牌一致性修复

> **Epic**: E1
> **Epic 名称**: 品牌一致性修复
> **关联提案**: P0-1 /pagelist 风格修复
> **Sprint**: Sprint 1
> **总工时**: 4h
> **状态**: 已决策进 Sprint 1

---

## 1. 背景

`/pagelist` 页面视觉完全脱离 VibeX 深色赛博朋克风格。当前页面使用浅灰白背景，与应用其他页面风格割裂，影响品牌一致性。

## 2. Scope

### In Scope
- `/pagelist` 页面背景色改为 `var(--color-bg-primary)` 深色
- 页面内所有组件样式与 VibeX 深色主题对齐
- 全局 CSS 变量（`--color-bg-primary`, `--color-text-primary` 等）正确应用

### Out of Scope
- 不改动 `/pagelist` 的功能逻辑（仅样式修复）
- 不修改其他页面的样式
- 不改动 API 接口

## 3. 功能点

### F1.1 — `/pagelist` 页面样式重写

**功能点 ID**: E1.S1.F1.1

#### 技术实现

1. **定位问题组件**
   ```bash
   find . -path "*/pagelist*" -name "*.css" -o -path "*/pagelist*" -name "*.module.css"
   ```
   确认问题文件列表

2. **替换背景色**
   - 移除硬编码浅色背景：`background-color: #f8fafc` 或 `rgb(248, 250, 252)`
   - 替换为 CSS 变量：`background-color: var(--color-bg-primary)`

3. **验证文本颜色**
   - 文本颜色应为 `var(--color-text-primary)` 或 `var(--color-text-secondary)`
   - 不应出现硬编码 `#1e293b` 等不协调颜色

4. **验证组件色彩**
   - 按钮、卡片、输入框等组件背景色使用 CSS 变量

## 4. 验收标准（expect() 断言）

### 样式验收

```typescript
describe('E1.S1.F1.1 — /pagelist 样式修复', () => {
  it('AC1: 页面背景色为深色，无浅灰白背景', async () => {
    await page.goto('/pagelist')
    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    )
    // 浅灰白背景 rgb(248, 250, 252) 不应出现
    expect(bgColor).not.toBe('rgb(248, 250, 252)')
  })

  it('AC2: CSS 变量 var(--color-bg-primary) 生效', async () => {
    await page.goto('/pagelist')
    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue('--color-bg-primary').trim()
    )
    // CSS 变量应被定义（非空）
    expect(bgColor.length).toBeGreaterThan(0)
  })

  it('AC3: 构建无 CSS module not found 错误', () => {
    const { stderr } = execSync('npm run build', { encoding: 'utf8' })
    expect(stderr).not.toContain('CSS module not found')
    expect(stderr).not.toContain('Module not found')
  })
})
```

## 5. 依赖

| 依赖项 | 依赖类型 | 说明 |
|--------|----------|------|
| `global.css` 中 CSS 变量已定义 | 前置依赖 | 确保 `--color-bg-primary` 等变量存在 |
| Next.js 构建工具链正常 | 前置依赖 | 确保 CSS 模块解析正常 |

## 6. 工时估算

| 步骤 | 工时 | 说明 |
|------|------|------|
| 问题定位 + diff 分析 | 0.5h | 确认问题文件和具体违规样式 |
| 样式修复 | 2h | 替换背景色 + 验证文本/组件色彩 |
| 跨浏览器验证（可选） | 0.5h | 验证 Chrome/Firefox/Safari |
| 构建验证 + CI | 1h | npm run build + PR review |
| **合计** | **4h** | |

## 7. 页面集成标注

【需页面集成】`/pagelist`

## 8. 验收标准汇总（Given/When/Then）

| ID | Given | When | Then |
|----|-------|------|------|
| E1.S1.F1.1.AC1 | 用户访问 `/pagelist` | 页面加载完成 | 背景色为 `var(--color-bg-primary)`，无浅灰白背景 |
| E1.S1.F1.1.AC2 | CSS 变量被定义 | 页面渲染 | `--color-bg-primary` 非空，背景色生效 |
| E1.S1.F1.1.AC3 | 开发者运行构建 | 构建完成 | 无 CSS module not found 错误 |
