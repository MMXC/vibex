# Spec: 卡片 CRUD API 接口规格

## 数据模型

```typescript
// 章节枚举
type ChapterType = 'requirement' | 'context' | 'flow';

// Project DDS 根
// POST /api/v1/dds/projects/:projectId
// → 201 { projectId, chapters: [...] }

// 卡片 CRUD
// GET    /api/v1/dds/chapters/:chapterId/cards   → 200 { cards: [...] }
// POST   /api/v1/dds/chapters/:chapterId/cards   → 201 { card }
// PUT    /api/v1/dds/cards/:cardId              → 200 { card }
// DELETE /api/v1/dds/cards/:cardId             → 204

// 关系 CRUD
// PUT    /api/v1/dds/cards/:cardId/relations   → 200 { edges }
// 示例请求体：
// { "relations": [{ "targetId": "uuid", "type": "upstream" }] }

// 布局持久化
// PUT    /api/v1/dds/cards/:cardId/position    → 200 { card }
// 请求体：{ "position": { "x": 100, "y": 200 } }
```

## 统一响应格式

```typescript
// 成功
{ "data": Card | Card[] | null, "success": true }

// 错误
{ "error": { "code": string, "message": string }, "success": false }
```
