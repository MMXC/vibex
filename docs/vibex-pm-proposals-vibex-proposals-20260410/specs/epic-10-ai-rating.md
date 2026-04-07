# Epic E10 Spec: AI 生成结果评分

> **Epic ID**: E10
> **Epic 名称**: AI 生成结果评分
> **优先级**: P2
> **预计工时**: 1h
> **关联 Feature**: F10
> **关联提案**: P010

---

## 1. 概述

在 AI 分析结果页面提供 1-5 星评分和文字反馈入口，收集用户对生成质量的评价，为后续 AI 优化提供数据支撑。

---

## 2. 用户流程

```
用户查看分析结果
    ↓
点击评分入口（星星图标）
    ↓
展开评分面板
    ↓
选择 1-5 星 + 可选文字反馈
    ↓
提交评分
    ↓
显示提交成功
```

---

## 3. 数据模型

```typescript
// KV Key: rating:{analysisId}
interface Rating {
  id: string
  analysisId: string
  userId: string
  score: number          // 1-5
  feedback?: string     // 可选文字反馈
  createdAt: string     // ISO timestamp
}
```

---

## 4. 组件设计

### 4.1 StarRating

| 属性 | 类型 | 说明 |
|------|------|------|
| value | number | 当前评分 |
| onChange | (value: number) => void | 评分变化回调 |
| readonly | boolean | 只读模式（查看他人评分时） |

**交互**:
- 悬浮时预览高亮
- 点击选中
- 支持 1-5 星

### 4.2 FeedbackForm

| 属性 | 类型 | 说明 |
|------|------|------|
| onSubmit | (data: { score: number; feedback: string }) => void | 提交回调 |

---

## 5. API 设计

### POST /api/v1/ratings

**请求**:
```json
{
  "analysisId": "analysis_xxx",
  "score": 5,
  "feedback": "分析结果非常准确，建议很实用"
}
```

**响应**:
```json
{
  "rating": {
    "id": "rating_xxx",
    "analysisId": "analysis_xxx",
    "score": 5,
    "createdAt": "2026-04-10T10:00:00Z"
  }
}
```

### GET /api/v1/analyses/:analysisId/rating

**响应**:
```json
{
  "rating": {
    "score": 4,
    "feedback": "结果不错",
    "createdAt": "2026-04-10T10:00:00Z"
  },
  "averageScore": 4.2,
  "totalRatings": 128
}
```

---

## 6. 实现细节

```typescript
// src/hooks/useRating.ts
export function useRating(analysisId: string) {
  const [rating, setRating] = useState<Rating | null>(null)
  const [stats, setStats] = useState({ averageScore: 0, totalRatings: 0 })
  
  useEffect(() => {
    fetch(`/api/v1/analyses/${analysisId}/rating`)
      .then(res => res.json())
      .then(data => {
        setRating(data.rating)
        setStats(data)
      })
  }, [analysisId])
  
  const submitRating = async (score: number, feedback?: string) => {
    const res = await fetch('/api/v1/ratings', {
      method: 'POST',
      body: JSON.stringify({ analysisId, score, feedback })
    })
    const data = await res.json()
    setRating(data.rating)
    return data
  }
  
  return { rating, stats, submitRating }
}
```

---

## 7. Stories 实现细节

### E10-S1: 评分 UI（0.5h）

- [ ] `StarRating` 组件
- [ ] `FeedbackForm` 组件
- [ ] 评分面板展开/收起
- [ ] 提交成功提示

### E10-S2: 评分数据存储（0.5h）

- [ ] 评分 API 实现（POST /api/v1/ratings）
- [ ] 查询评分 API（GET /api/v1/analyses/:id/rating）
- [ ] 评分数据写入 KV
- [ ] 统计平均分

---

## 8. 验收测试用例

```typescript
describe('E10 AI 生成结果评分', () => {
  it('E10-S1: 显示评分入口', async ({ page }) => {
    await page.goto('/analysis/result/123')
    await expect(page.locator('.star-rating')).toBeVisible()
  })

  it('E10-S1: 5 星评分交互', async ({ page }) => {
    await page.goto('/analysis/result/123')
    await page.click('.star[data-value="5"]')
    await expect(page.locator('.star[data-value="5"]')).toHaveClass(/selected/)
  })

  it('E10-S1: 提交评分', async ({ page }) => {
    await page.goto('/analysis/result/123')
    await page.click('.star[data-value="5"]')
    await page.fill('#feedback-input', '分析结果非常准确')
    await page.click('#submit-rating')
    await expect(page.locator('.rating-success')).toBeVisible()
  })

  it('E10-S2: 查看平均分', async ({ page }) => {
    await page.goto('/analysis/result/123')
    await expect(page.locator('.average-score')).toContainText('4.2')
    await expect(page.locator('.total-ratings')).toContainText('(128)')
  })
})
```
