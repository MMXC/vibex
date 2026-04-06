# Epic E06 Spec: 项目版本对比

> **Epic ID**: E06
> **Epic 名称**: 项目版本对比（变更历史）
> **优先级**: P1
> **预计工时**: 3h
> **关联 Feature**: F06
> **关联提案**: P006

---

## 1. 概述

每次保存项目时自动生成版本快照，支持查看版本历史列表和两版本对比（差异高亮），方便用户追溯需求变更历史。

---

## 2. 数据模型

### 2.1 版本快照

```typescript
// KV Key: version:{projectId}:{versionId}
interface VersionSnapshot {
  id: string           // "v_{timestamp}_{hash}"
  projectId: string
  versionNumber: number
  description: string  // 用户填写的版本描述
  authorId: string
  createdAt: string    // ISO timestamp
  content: {
    requirements: string
    domainModel: DomainModel
    contexts: Context[]
    uiPrototype?: UISpec
  }
}
```

### 2.2 版本列表

```typescript
// KV Key: versions:{projectId} (sorted set by timestamp)
// Score = Unix timestamp
interface VersionListItem {
  id: string
  versionNumber: number
  description: string
  authorId: string
  createdAt: string
}
```

---

## 3. 用户流程

```
用户编辑项目并点击「保存」
    ↓
弹出保存对话框，填写版本描述（可选）
    ↓
保存时自动创建版本快照
    ↓
保存成功提示
    ↓
用户点击「历史」查看版本列表
    ↓
选择两个版本进行对比
    ↓
查看差异高亮（side-by-side 或 unified）
```

---

## 4. 组件设计

### 4.1 VersionList

| 属性 | 类型 | 说明 |
|------|------|------|
| projectId | string | 项目 ID |

**展示**: 版本列表（时间倒序），支持分页加载

### 4.2 VersionListItem

| 属性 | 类型 | 说明 |
|------|------|------|
| version | VersionListItem | 版本数据 |
| isSelected | boolean | 是否选中对比 |
| onSelect | () => void | 选中回调 |

### 4.3 VersionCompare

| 属性 | 类型 | 说明 |
|------|------|------|
| leftVersion | VersionSnapshot | 左侧版本 |
| rightVersion | VersionSnapshot | 右侧版本 |
| mode | 'side-by-side' \| 'unified' | 对比模式 |

**差异高亮规则**:
- 新增内容：绿色背景
- 删除内容：红色背景 + 删除线
- 修改内容：黄色背景

---

## 5. API 设计

### POST /api/v1/versions

自动随项目保存触发，无需显式调用。

### GET /api/v1/projects/:projectId/versions

**Query 参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码 |
| limit | number | 每页数量（默认 20） |

**响应**:
```json
{
  "versions": [
    {
      "id": "v_1712736000_abc123",
      "versionNumber": 5,
      "description": "添加订单模块",
      "authorId": "user_xxx",
      "createdAt": "2026-04-10T10:00:00Z"
    }
  ],
  "total": 12,
  "page": 1
}
```

### GET /api/v1/versions/:versionId

**响应**:
```json
{
  "version": {
    "id": "v_1712736000_abc123",
    "projectId": "proj_xxx",
    "versionNumber": 5,
    "description": "添加订单模块",
    "authorId": "user_xxx",
    "createdAt": "2026-04-10T10:00:00Z",
    "content": {
      "requirements": "...",
      "domainModel": { ... },
      "contexts": [ ... ]
    }
  }
}
```

### GET /api/v1/versions/compare

**Query 参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| left | versionId | 左侧版本 |
| right | versionId | 右侧版本 |

---

## 6. 差异对比算法

```typescript
// src/services/diffService.ts
interface DiffResult {
  type: 'added' | 'removed' | 'changed' | 'unchanged'
  path: string          // e.g., "entities[0].fields"
  leftValue?: any
  rightValue?: any
}

export function compareVersions(
  left: VersionSnapshot['content'],
  right: VersionSnapshot['content']
): DiffResult[] {
  const results: DiffResult[] = []
  
  // 1. 需求文本差异（使用 diff-match-patch）
  const requirementsDiff = diffMatchPatch.diff(
    left.requirements || '',
    right.requirements || ''
  )
  
  // 2. 实体列表差异
  const leftEntities = left.domainModel?.entities || []
  const rightEntities = right.domainModel?.entities || []
  
  // 找出新增/删除/修改的实体
  const leftEntityNames = new Set(leftEntities.map(e => e.name))
  const rightEntityNames = new Set(rightEntities.map(e => e.name))
  
  for (const entity of rightEntities) {
    if (!leftEntityNames.has(entity.name)) {
      results.push({ type: 'added', path: `entities.${entity.name}` })
    }
  }
  
  for (const entity of leftEntities) {
    if (!rightEntityNames.has(entity.name)) {
      results.push({ type: 'removed', path: `entities.${entity.name}` })
    }
  }
  
  return results
}
```

---

## 7. Stories 实现细节

### E06-S1: 版本快照生成（1h）

- [ ] 项目保存时自动触发快照创建
- [ ] 生成唯一 versionId（时间戳 + hash）
- [ ] 快照内容包含 requirements、domainModel、contexts、uiPrototype
- [ ] 快照存入 KV（`version:{projectId}:{versionId}`）
- [ ] 版本列表 sorted set 更新（`versions:{projectId}`）
- [ ] 可选：填写版本描述

### E06-S2: 版本历史列表（1h）

- [ ] 路由 `/projects/:id/history`
- [ ] `VersionList` 组件（分页加载）
- [ ] `VersionListItem` 组件（选中状态）
- [ ] 支持选择两个版本（最多 2 个）
- [ ] 「对比」按钮在选中 2 个版本后激活

### E06-S3: 版本对比视图（1h）

- [ ] `VersionCompare` 组件
- [ ] Side-by-side 对比模式
- [ ] Unified 对比模式
- [ ] 差异高亮（添加/删除/修改）
- [ ] 切换对比版本
- [ ] 返回历史列表

---

## 8. 验收测试用例

```typescript
describe('E06 项目版本对比', () => {
  it('E06-S1: 保存时生成版本快照', async ({ page }) => {
    await page.goto('/projects/proj_xxx')
    await page.click('#save-btn')
    await page.fill('#version-description', '添加订单模块')
    await page.click('#confirm-save')
    const response = await page.waitForResponse(resp => resp.url().includes('/versions'))
    expect(response.status()).toBe(200)
    await expect(page.locator('.toast')).toContainText('保存成功')
  })

  it('E06-S1: 版本号递增', async ({ page }) => {
    await page.goto('/projects/proj_xxx')
    await page.click('#save-btn')
    await page.fill('#version-description', '第一次保存')
    await page.click('#confirm-save')
    await page.click('#save-btn')
    await page.fill('#version-description', '第二次保存')
    await page.click('#confirm-save')
    const history = await page.goto('/projects/proj_xxx/history')
    const versions = page.locator('.version-item')
    await expect(versions.nth(0)).toContainText('版本 2')
    await expect(versions.nth(1)).toContainText('版本 1')
  })

  it('E06-S2: 版本历史列表', async ({ page }) => {
    await page.goto('/projects/proj_xxx/history')
    await expect(page.locator('.version-item')).toHaveCount.greaterThan(0)
    await expect(page.locator('.version-item').first()).toContainText('版本描述')
  })

  it('E06-S2: 可选中两个版本', async ({ page }) => {
    await page.goto('/projects/proj_xxx/history')
    await page.click('.version-item:nth-child(1)')
    await page.click('.version-item:nth-child(2)')
    await expect(page.locator('#compare-btn')).toBeEnabled()
  })

  it('E06-S3: 对比视图高亮新增', async ({ page }) => {
    await page.goto('/projects/proj_xxx/history')
    await page.click('.version-item:nth-child(2)')
    await page.click('.version-item:nth-child(1)')
    await page.click('#compare-btn')
    await expect(page.locator('.diff-added')).toBeVisible()
  })

  it('E06-S3: 对比视图高亮删除', async ({ page }) => {
    await page.goto('/projects/proj_xxx/history')
    await page.click('.version-item:nth-child(1)')
    await page.click('.version-item:nth-child(2)')
    await page.click('#compare-btn')
    await expect(page.locator('.diff-removed')).toBeVisible()
  })

  it('E06-S3: 切换对比模式', async ({ page }) => {
    await page.goto('/projects/proj_xxx/compare?left=v1&right=v2')
    await page.click('.mode-toggle[data-mode="unified"]')
    await expect(page.locator('.diff-unified-view')).toBeVisible()
  })
})
```

---

## 9. 性能与存储

| 项目 | 说明 |
|------|------|
| 快照保留策略 | 保留最近 50 个版本，超出后合并早期版本 |
| 存储估算 | 单个快照约 10-50KB，50 个版本约 0.5-2.5MB |
| 加载策略 | 版本列表分页（20/页），完整快照按需加载 |
