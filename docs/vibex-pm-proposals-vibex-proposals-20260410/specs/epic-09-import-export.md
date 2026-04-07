# Epic E09 Spec: 需求导入导出

> **Epic ID**: E09
> **Epic 名称**: 需求导入导出
> **优先级**: P2
> **预计工时**: 1h
> **关联 Feature**: F09
> **关联提案**: P009

---

## 1. 概述

支持用户导入已有需求文档（Markdown/JSON/YAML 格式），以及导出分析结果为指定格式。

---

## 2. 支持格式

### 2.1 导入格式

| 格式 | 文件扩展名 | 解析方式 |
|------|-----------|---------|
| Markdown | .md, .markdown | 提取标题/列表/段落 |
| JSON | .json | 解析为需求对象 |
| YAML | .yaml, .yml | 解析为需求对象 |

### 2.2 导出格式

| 格式 | 文件扩展名 | 内容 |
|------|-----------|------|
| Markdown | .md | 需求文本 + 领域模型 + 限界上下文 |
| JSON | .json | 完整分析结果 |
| YAML | .yaml | 简化版分析结果 |

---

## 3. 导入 Schema

```typescript
// 期望的导入结构
interface ImportRequirement {
  title?: string
  description?: string
  entities?: string[]
  contexts?: string[]
  // ... 其他字段
}

// Markdown 示例
# 电商平台需求

## 概述
这是一个电商平台系统

## 实体
- 用户
- 订单
- 商品

## 上下文
- 订单上下文
- 用户上下文
```

---

## 4. 组件设计

### 4.1 ImportModal

| 属性 | 类型 | 说明 |
|------|------|------|
| isOpen | boolean | 弹窗显示状态 |
| onImport | (content: ImportRequirement) => void | 导入回调 |
| onClose | () => void | 关闭回调 |

**功能**:
- 文件选择 + 拖拽上传
- 格式自动检测
- 预览解析结果
- 确认导入

### 4.2 ExportModal

| 属性 | 类型 | 说明 |
|------|------|------|
| isOpen | boolean | 弹窗显示状态 |
| projectData | ProjectData | 项目数据 |
| onClose | () => void | 关闭回调 |

**功能**:
- 格式选择（Markdown/JSON/YAML）
- 预览导出内容
- 下载文件

---

## 5. 实现细节

```typescript
// src/services/importService.ts
export async function parseImportFile(file: File): Promise<ImportRequirement> {
  const content = await file.text()
  const ext = file.name.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'json':
      return JSON.parse(content)
    case 'yaml':
    case 'yml':
      return yaml.parse(content)
    case 'md':
    case 'markdown':
      return parseMarkdown(content)
    default:
      throw new Error(`不支持的格式: ${ext}`)
  }
}

function parseMarkdown(content: string): ImportRequirement {
  // 提取标题
  const titleMatch = content.match(/^#\s+(.+)$/m)
  // 提取实体列表
  const entityMatches = content.match(/^##.*\n([\s\S]*?)(?=##|$)/gm)
  // ...
  return { title: titleMatch?.[1], entities: [], contexts: [] }
}

// src/services/exportService.ts
export function exportProject(data: ProjectData, format: 'json' | 'yaml' | 'markdown'): Blob {
  switch (format) {
    case 'json':
      return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    case 'yaml':
      return new Blob([yaml.stringify(data)], { type: 'text/yaml' })
    case 'markdown':
      return new Blob([generateMarkdown(data)], { type: 'text/markdown' })
  }
}
```

---

## 6. Stories 实现细节

### E09-S1: 导入功能（0.5h）

- [ ] `ImportModal` 组件
- [ ] 文件选择和拖拽
- [ ] 格式解析逻辑
- [ ] 解析结果预览
- [ ] 导入后填充需求

### E09-S2: 导出功能（0.5h）

- [ ] `ExportModal` 组件
- [ ] 格式选择 UI
- [ ] 导出内容生成
- [ ] 文件下载

---

## 7. 验收测试用例

```typescript
describe('E09 需求导入导出', () => {
  it('E09-S1: Markdown 导入', async ({ page }) => {
    const file = new File([
      '# 订单系统\n## 实体\n- 订单\n- 用户'
    ], 'requirements.md', { type: 'text/markdown' })
    await page.setInputFiles('#import-input', file)
    await expect(page.locator('#requirement-input')).toHaveValue(/订单/)
  })

  it('E09-S1: JSON 导入', async ({ page }) => {
    const file = new File([
      JSON.stringify({ title: 'test', entities: ['Order', 'User'] })
    ], 'requirements.json', { type: 'application/json' })
    await page.setInputFiles('#import-input', file)
    await expect(page.locator('#requirement-input')).toContainText('test')
  })

  it('E09-S2: 导出 Markdown', async ({ page }) => {
    await page.goto('/projects/proj_xxx')
    await page.click('#export-btn')
    await page.click('.format-option[data-format="markdown"]')
    await page.click('#download-btn')
    // 验证下载
    const downloads = await page.context().newCDPSession(page).then(s => 
      s.send('Download.getDownloads')
    )
    expect(downloads.length).toBe(1)
  })

  it('E09-S2: 导出 JSON', async ({ page }) => {
    await page.goto('/projects/proj_xxx')
    await page.click('#export-btn')
    await page.click('.format-option[data-format="json"]')
    await expect(page.locator('.export-preview')).toContainText('"domainModel"')
  })
})
```
