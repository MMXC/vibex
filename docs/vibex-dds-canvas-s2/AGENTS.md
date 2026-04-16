# AGENTS.md — VibeX DDS Canvas Sprint 2

> **项目**: vibex-dds-canvas-s2
> **日期**: 2026-04-16
> **作者**: Architect

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
> **执行日期**: 待定

---

## 1. 开发约束（E2-E6 通用）

### 1.1 代码规范

- **无 any 类型泄漏**：所有类型必须显式定义，禁止 `any`
- **错误不阻断**：解析/网络失败返回 fallback，不抛异常影响 UI
- **乐观 UI**：用户操作后立即更新 store，再异步写 API
- **viewport 存 localStorage**：不写 DB，不同 projectId 独立 key
- **card type 从 data JSON 解析**：`dds_cards.type` 列存 chapter type 已废弃，真正 card type 在 `data` JSON 内

### 1.2 提交规范

- 每个 Unit 独立提交，commit message 格式：`[E{n}-U{m}] <描述>`
- 示例：`[E6-U1] feat: add DDS CRUD backend routes`
- PR 标题格式：`[DDS-S2] E{n}: <功能名>`
- 每个 Unit 必须包含 Vitest 测试

### 1.3 审查要点

- TypeScript 类型覆盖完整（`npx tsc --noEmit` 通过）
- D1 SQL 使用 parameterized query（禁止字符串拼接）
- ReactFlow 节点拖拽后 position 正确回写 store
- AI Draft JSON 解析有 `try/catch`

---

## 2. Backend DDS 路由实现规范

### 2.1 文件结构

```
vibex-backend/src/routes/dds/
├── index.ts        # 路由注册：app.route('/api/v1/dds', dds)
├── chapters.ts     # chapters CRUD + 获取章节卡片
├── cards.ts        # cards CRUD + position + relations
├── edges.ts        # edges 查询
└── types.ts        # Request / Response 类型
```

### 2.2 路由注册

```typescript
// src/index.ts
import dds from './routes/dds';
// ...
app.route('/api/v1/dds', dds);
```

### 2.3 D1 操作规范

```typescript
// ✅ 正确：parameterized query
await env.DB
  .prepare('SELECT * FROM dds_cards WHERE chapter_id = ?')
  .bind(chapterId)
  .all();

// ❌ 错误：字符串拼接（SQL 注入风险）
await env.DB
  .prepare(`SELECT * FROM dds_cards WHERE chapter_id = '${chapterId}'`)
  .all();
```

### 2.4 rowToCard 解析

```typescript
function rowToCard(row: DDSRow): DDSCard {
  const data = JSON.parse(row.data as string);
  return {
    id: row.id as string,
    title: row.title as string,
    position: {
      x: row.position_x as number,
      y: row.position_y as number,
    },
    createdAt: new Date(row.created_at as number).toISOString(),
    updatedAt: new Date(row.updated_at as number).toISOString(),
    type: data.type,         // card type 从 data JSON 读
    ...data,                 // 展开 data 字段
  };
}
```

### 2.5 统一错误响应

```typescript
import { apiError } from '@/lib/api-error';

// 路由中使用
if (!chapter) {
  return c.json({ error: { code: 'NOT_FOUND', message: 'Chapter not found' }, success: false }, 404);
}
```

---

## 3. Frontend 实现规范

### 3.1 useDDSAPI 使用

```typescript
// ✅ 正确：在组件/hook 中使用
const api = useDDSAPI();
const result = await api.getCards(chapterId);
if (result.success) {
  setCards(result.data);
} else {
  showError(result.error.message);
}

// ✅ 独立调用（不用 hook）
const api = createDDSAPI('/api');
const result = await api.getCards(chapterId);
```

### 3.2 乐观 UI 模式

```typescript
// ✅ 正确：先写 store，再调 API
async function handleCreateCard(card: Omit<DDSCard, 'id'>) {
  const tempId = crypto.randomUUID();
  const optimisticCard = { ...card, id: tempId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  
  // 1. 乐观 UI：立即写入 store
  ddsChapterActions.addCard(chapter, optimisticCard as DDSCard);
  
  // 2. 异步写 API
  const result = await api.createCard(chapterId, card);
  if (!result.success) {
    // 3. 失败时回滚
    ddsChapterActions.deleteCard(chapter, tempId);
    showError(result.error.message);
  }
}
```

### 3.3 ReactFlow viewport 持久化

```typescript
// DDSCanvasPage.tsx
const { getViewport, setViewport: rfSetViewport } = useReactFlow();

useEffect(() => {
  // 监听 viewport 变化 → 写 localStorage
  const unsub = onMoveEnd((_, viewport) => {
    setViewport(viewport);
    localStorage.setItem(`dds-viewport-${projectId}`, JSON.stringify(viewport));
  });
  return unsub;
}, [projectId]);

// 初始化恢复
useEffect(() => {
  const saved = localStorage.getItem(`dds-viewport-${projectId}`);
  if (saved) {
    const viewport = JSON.parse(saved);
    setViewport(viewport);
    rfSetViewport(viewport);
  }
}, [projectId]);
```

### 3.4 AI Draft LLM 调用

```typescript
// AIDraftDrawer.tsx
import { buildCardGenerationPrompt } from '@/services/dds/prompts';

async function handleGenerate(input: string) {
  setIsGenerating(true);
  try {
    const prompt = buildCardGenerationPrompt(input, activeChapter);
    const response = await llmProvider.generate({
      messages: [{ role: 'user', content: prompt }],
    });
    const parsed = JSON.parse(response.content);
    setDraftCards(parsed.cards);
  } catch (err) {
    setError('卡片生成失败，请重试');
  } finally {
    setIsGenerating(false);
  }
}
```

---

## 4. 测试规范

### 4.1 Backend Vitest

```typescript
// routes/__tests__/dds-cards.test.ts
describe('DDS Cards API', () => {
  it('GET /chapters/:id/cards returns cards', async () => {
    const res = await app.request(
      '/api/v1/dds/chapters/test-chapter-id/cards',
      env
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('POST /chapters/:id/cards creates card', async () => {
    const res = await app.request(
      '/api/v1/dds/chapters/test-chapter-id/cards',
      {
        method: 'POST',
        body: JSON.stringify({ type: 'user-story', title: 'Test', position: { x: 0, y: 0 } }),
      },
      env
    );
    expect(res.status).toBe(201);
  });
});
```

### 4.2 Frontend Vitest

```typescript
// hooks/__tests__/useDDSAPI.test.ts
// Mock fetch，验证 API client 正确构造请求
```

### 4.3 Playwright E2E

```typescript
// e2e/dds-persistence.spec.ts
test('创建卡片 → 刷新 → 卡片存在', async ({ page }) => {
  await page.goto('/dds-canvas?projectId=test-id&chapter=requirement');
  await page.waitForSelector('.react-flow__node');
  // ... 创建操作
  await page.reload();
  await page.waitForSelector('.react-flow__node');
  // 断言卡片数量
});
```

---

## 5. 参考文档

- Sprint 1 架构: `docs/vibex-dds-canvas/architecture.md`
- PRD: `docs/vibex-dds-canvas/prd.md`
- Specs: `docs/vibex-dds-canvas/specs/`
  - `api-card-crud.md` — API 接口规格（**Sprint 2 核心**）
  - `schema-card-types.md` — 类型定义
  - `dds-canvas-state.md` — Zustand store 规格
  - `layout-scroll-snap.md` — CSS 布局规格
  - `ai-draft-flow.md` — AI Draft 流程
- D1 Migration: `vibex-backend/prisma/migrations/005_dds_tables.sql`

---

## 6. Phase2 Dev → Tester → Reviewer 映射

| Epic | Dev | Tester | Reviewer |
|------|-----|--------|---------|
| E2a | dev-epic2a-scrollcontainer | tester-epic2a-scrollcontainer | reviewer-epic2a-scrollcontainer |
| E2b | dev-epic2b-reactflow集成 | tester-epic2b-reactflow集成 | reviewer-epic2b-reactflow集成 |
| E3 | dev-epic3-章节画布 | tester-epic3-章节画布 | reviewer-epic3-章节画布 |
| E4 | dev-epic4-工具栏 | tester-epic4-工具栏 | reviewer-epic4-工具栏 |
| E5 | dev-epic5-ai对话 | tester-epic5-ai对话 | reviewer-epic5-ai对话 |
| E6 | dev-epic6-数据持久化 | tester-epic6-数据持久化 | reviewer-epic6-数据持久化 |

---

*Architect Agent | 2026-04-16*
