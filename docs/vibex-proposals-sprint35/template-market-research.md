# VibeX Sprint 35 — 模板市场功能调研

**Agent**: ARCHITECT | **日期**: 2026-05-11 | **项目**: vibex-proposals-sprint35
**类型**: 调研文档（不实施）
**归属**: S35-P004

---

## 1. 背景

当前 VibeX 模板系统支持：
- CRUD（创建/读取/更新/删除模板）
- 导入导出（`.vibex` 格式，VibexExportSchema JSON）
- 页面：`src/pages/TemplatePage.tsx` + `src/features/template/`

缺少的能力：**模板市场**（模板上传/分享/评分/发现）

---

## 2. 用户故事

### 用户故事 1：发现高质量模板

```
As a 前端工程师
I want to 在模板市场中搜索和浏览社区模板
So that 找到符合我项目需求的模板，减少从零设计的时间
```

**验收标准**：
- 用户可以按分类（DDD/Flow/Component）筛选模板
- 用户可以按关键词搜索模板名称和描述
- 用户可以看到模板的评分（1-5星）和下载量
- 用户可以预览模板内容（卡片结构/流程节点）

### 用户故事 2：分享团队最佳实践

```
As a 团队 lead
I want to 将团队的标准项目模板上传到市场
So that 团队成员可以快速复用，减少重复造轮子
```

**验收标准**：
- 用户可以上传自己的模板（含名称/描述/分类/标签）
- 上传的模板自动归属到用户账号
- 用户可以查看自己上传的模板列表
- 用户可以删除自己的模板（软删除）

### 用户故事 3：获得社区反馈

```
As a 独立开发者
I want to 看到其他人对我模板的评分和反馈
So that 了解模板质量，持续改进
```

**验收标准**：
- 用户可以对任意模板评分（1-5星，每人每模板限 1 次）
- 用户可以看到模板的平均评分和评分人数
- 用户可以看到模板的累计下载次数

---

## 3. MVP 用户旅程

```
1. 用户进入"模板市场"页面
2. 浏览推荐/热门模板（默认排序：评分 × 下载量）
3. 点击模板卡片 → 进入模板详情页
4. 预览模板内容（只读，不可直接修改）
5. 点击"使用此模板" → 复制到自己的项目
6. （可选）点击"收藏" / "评分"
```

**MVP 范围**：只读市场（发现+使用），暂不实现模板上传/评分功能（后续迭代）。

---

## 4. API 设计草稿

### 4.1 列表/搜索模板

```
GET /api/templates/marketplace
```

**Query Parameters**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `category` | string | 否 | 分类：ddd/flow/component |
| `search` | string | 否 | 搜索关键词（匹配 name + description）|
| `page` | number | 否 | 页码，默认 1 |
| `limit` | number | 否 | 每页数量，默认 20 |

**Response**:
```json
{
  "templates": [
    {
      "id": "tpl_abc123",
      "name": "电商领域模型模板",
      "description": "包含商品/订单/用户三个限界上下文",
      "authorId": "usr_xyz",
      "authorName": "Alice",
      "category": "ddd",
      "tags": ["电商", "DDD", "BoundedContext"],
      "downloads": 128,
      "avgRating": 4.3,
      "ratingCount": 27,
      "createdAt": "2026-04-01T08:00:00Z",
      "updatedAt": "2026-05-01T12:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### 4.2 获取模板详情

```
GET /api/templates/marketplace/:id
```

**Response**:
```json
{
  "id": "tpl_abc123",
  "name": "电商领域模型模板",
  "description": "包含商品/订单/用户三个限界上下文",
  "authorId": "usr_xyz",
  "authorName": "Alice",
  "category": "ddd",
  "tags": ["电商", "DDD", "BoundedContext"],
  "downloads": 128,
  "avgRating": 4.3,
  "ratingCount": 27,
  "content": {
    "chapters": [...],
    "cards": [...],
    "metadata": {...}
  },
  "createdAt": "2026-04-01T08:00:00Z",
  "updatedAt": "2026-05-01T12:00:00Z"
}
```

### 4.3 上传模板（future）

```
POST /api/templates/marketplace
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "我的模板",
  "description": "描述内容",
  "category": "ddd",
  "tags": ["标签1", "标签2"],
  "content": {
    "chapters": [...],
    "cards": [...],
    "metadata": {...}
  }
}
```

**Response**: `201 Created` + 模板详情

### 4.4 评分（future）

```
POST /api/templates/marketplace/:id/rate
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "rating": 5
}
```

**Response**: `200 OK` + 更新后的平均评分

---

## 5. 技术方案选项

### 方案 A：自建模板市场（数据库 + CDN）

**架构**：
- 数据库：PostgreSQL（模板元数据）+ S3/CDN（模板内容 JSON）
- API：Next.js API routes（`/api/templates/marketplace/*`）
- 前端：模板市场页面（`pages/template/marketplace/index.tsx`）

**Pros**：
- ✅ 完全可控，可定制评分算法/推荐系统
- ✅ 数据完全自控，无第三方依赖
- ✅ 可以实现复杂的权限管理（私有模板/团队模板）

**Cons**：
- ❌ 需要数据库（PostgreSQL），增加基础设施成本
- ❌ 需要 CDN/对象存储，存储成本
- ❌ 开发成本：4-6 人天
- ❌ 冷启动问题：新市场没有内容，需要种子数据

**依赖项**：
- PostgreSQL（vibex-backend 已有 `src/db/`）
- S3 或兼容对象存储（Vibex 当前使用 `public/` 本地存储，MVP 可先用本地）
- Next.js API routes（现有架构）

**工时估算**：4-6 人天
- 数据库 schema 设计：0.5 人天
- API routes 开发（CRUD）：1 人天
- 前端市场页面：2 人天
- 集成测试 + 文档：1 人天

---

### 方案 B：GitHub Gist 集成

**架构**：
- 模板存储：GitHub Gist（public gist 即公开模板）
- 搜索：GitHub Search API
- 评分：GitHub Star（Gist 无评分，改用 star count）

**Pros**：
- ✅ 无存储成本，利用 GitHub 基础设施
- ✅ 利用 GitHub 账号体系（无需自建鉴权）
- ✅ 用户已有 GitHub 账号，门槛低
- ✅ 开发成本低：2-3 人天

**Cons**：
- ❌ 缺少评分系统（只能用 star count）
- ❌ 缺少分类/标签功能（Gist 没有结构化 metadata）
- ❌ 用户体验受限：需要 GitHub 账号，需要跳转到 Gist 页面
- ❌ 无法实现私有模板/团队模板
- ❌ API 限流：GitHub Search API 30 req/min

**依赖项**：
- GitHub OAuth（现有 `src/components/auth/`）
- GitHub API（REST）

**工时估算**：2-3 人天
- GitHub OAuth 集成：0.5 人天
- Gist API 搜索/列表：1 人天
- 前端页面：1 人天

---

### 方案 C：社区平台集成（如 Notion API）

**架构**：模板发布到 Notion 页面，通过 Notion API 读取展示。

**Pros**：
- ✅ 富文本编辑能力，模板内容展示丰富
- ✅ Notion 用户量大，传播快

**Cons**：
- ❌ 依赖 Notion API，有限流风险
- ❌ Notion 页面格式与 VibexExportSchema 不对齐，需要转换
- ❌ 第三方依赖强

**工时估算**：3-4 人天（转换层复杂）

---

## 6. 安全考量：模板代码沙箱隔离

模板内容（VibexExportSchema JSON）可能包含：
1. 用户编写的 prompt 文本
2. 潜在恶意脚本（通过模板分享传播）
3. 导入时执行的代码引用

**安全原则**：
- **只读展示**：模板内容仅用于预览，不执行任何代码
- **JSON Schema 校验**：导入前验证模板符合 `VibexExportSchema`
- **禁止 eval/new Function**：绝不解析模板内容为可执行代码
- **CSP 策略**：在模板预览页面设置严格 CSP

**导入时的安全边界**：
```
用户上传模板 → 验证 Schema → 存储 → 其他用户使用 → 导入到自己的 Canvas
```
- 导入时，`chapters[].cards[].content` 等字段直接写入 Zustand store
- 不存在 XSS 风险（React 默认转义）
- 潜在的 RCE 风险：用户可能在自己的 Canvas 中触发导入的某些 action → 需要 RBAC 校验

**结论**：MVP 阶段，模板内容仅展示+导入，无需执行代码，安全风险可控。

---

## 7. 推荐方案

### 推荐：方案 A（自建）— Phase 1 MVP

**理由**：
1. **完全可控**：评分/分类/下载量等指标可自由定制
2. **与现有架构一致**：使用 Next.js API routes + 现有数据库
3. **可扩展**：Phase 1 只做"模板发现"，Phase 2 再加"上传/评分"
4. **工时合理**：4-6 人天，与 Sprint 35 其他任务并行

**实施建议**：
- Phase 1（2 人天）：只读市场 — 列表/搜索/预览/使用
- Phase 2（2 人天）：上传 + 评分
- Phase 3（2 人天）：私有模板/团队模板

---

## 8. 数据模型

### MarketplaceTemplate

```sql
CREATE TABLE marketplace_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  author_id UUID NOT NULL REFERENCES users(id),
  category VARCHAR(50), -- ddd/flow/component
  tags TEXT[], -- ARRAY['tag1', 'tag2']
  downloads INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  content JSONB NOT NULL, -- VibexExportSchema
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketplace_category ON marketplace_templates(category);
CREATE INDEX idx_marketplace_rating ON marketplace_templates(avg_rating DESC);
```

### TemplateRating（future）

```sql
CREATE TABLE template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES marketplace_templates(id),
  user_id UUID NOT NULL REFERENCES users(id),
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(template_id, user_id) -- 每人每模板限 1 次评分
);
```

---

## 9. 调研结论

| 结论项 | 内容 |
|--------|------|
| 推荐方案 | 方案 A（自建），Phase 1 做只读市场，Phase 2 加上传/评分 |
| MVP 范围 | 模板列表/搜索/预览/使用，不含上传/评分 |
| 安全结论 | 模板仅展示+导入，不执行代码，风险可控 |
| 工时 | Phase 1: 2 人天，Phase 2: 2 人天 |
| Sprint 36 建议 | Phase 1 实施模板市场只读功能 |

---

## 10. 后续行动

- [ ] Sprint 36 决策：确认 Phase 1 MVP 范围（是否包含上传/评分）
- [ ] 如果采用方案 A：设计数据库 schema，调研现有 PostgreSQL 集成
- [ ] 种子数据：需要准备 5-10 个示例模板用于演示
- [ ] 调研文档签字归档，供 Sprint 36 参考

---

*本文档由 Architect Agent 生成。*
*仅供决策参考，不实施代码。*