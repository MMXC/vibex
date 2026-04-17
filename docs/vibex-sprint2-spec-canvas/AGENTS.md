# AGENTS.md — vibex-sprint2-spec-canvas

**项目**: vibex-sprint2-spec-canvas
**角色**: Architect
**日期**: 2026-04-17

---

## 技术栈约束

| 技术 | 约束 |
|------|------|
| 状态管理 | 强制使用 `DDSCanvasStore`（Zustand），不得新建独立 store |
| DAG 渲染 | 强制复用 `DDSFlow`（React Flow），不得新建独立 Flow 实例 |
| 滚动容器 | 强制复用 `DDSScrollContainer`，扩展 scroll-snap 行为 |
| AI 组件 | 强制复用 `AIDraftDrawer`，扩展卡片预览功能 |
| 样式 | 强制使用 CSS Modules（`.module.css`），不得使用 Tailwind |
| 测试 | 强制使用 Vitest + React Testing Library |

---

## 文件路径规范

| 类型 | 路径 | 规范 |
|------|------|------|
| 新建卡片组件 | `components/dds/cards/*.tsx` | 按类型命名 |
| 章节面板 | `components/dds/ChapterPanel.tsx` | 新建 |
| 骨架屏 | `components/dds/skeleton/*.tsx` | 新建目录 |
| D1 Persistence | `services/dds/ddsPersistence.ts` | 扩展或新建 |
| Store 测试 | `stores/dds/__tests__/DDSCanvasStore.test.ts` | 扩展已有 |

---

## 代码规范

### 卡片 Schema 渲染

```typescript
// ✅ 正确：按 cardType 分发到对应卡片组件
const CardRenderer = ({ card }: { card: DDSCard }) => {
  switch (card.cardType) {
    case 'user-story':
      return <UserStoryCard card={card as UserStoryCard} />;
    case 'bounded-context':
      return <BoundedContextCard card={card as BoundedContextCard} />;
    case 'flow-step':
      return <FlowStepCard card={card as FlowStepCard} />;
    default:
      return <div>未知卡片类型</div>;
  }
};

// ❌ 错误：硬编码渲染，不使用 schema-driven
// const CardRenderer = ({ card }) => <div>{card.title}</div>;
```

### 跨章节边数据

```typescript
// ✅ 正确：边数据包含 sourceChapter/targetChapter
const edge: DDSEdge = {
  id: generateId(),
  source: reqCard.id,
  target: ctxCard.id,
  sourceChapter: 'requirement',
  targetChapter: 'context',
};

// ❌ 错误：跨章节边不区分章节
// const edge = { source: reqCard.id, target: ctxCard.id };
```

### D1 持久化

```typescript
// ✅ 正确：乐观更新 + 失败回滚
const handleAddCard = async (card) => {
  const tempId = crypto.randomUUID();
  store.addCard({ ...card, id: tempId }); // 乐观更新
  try {
    await ddsPersistence.saveCard({ ...card, id: tempId });
  } catch {
    store.deleteCard(tempId); // 回滚
    toast.error('保存失败，请重试');
  }
};

// ❌ 错误：直接写入 D1，不更新 store
// await ddsPersistence.saveCard(card);
```

---

## 不可违背的设计决策

1. **三章节固定**：不实现章节数量可配置，MVP 固定为 requirement/context/flow
2. **禁止 loading spinner**：加载状态必须使用骨架屏（PRD 明确要求）
3. **AI 草稿用户确认写入**：不实现自动写入，用户必须点击"确认"
4. **乐观更新**：所有写操作先更新 UI，后写 D1，失败回滚
5. **跨章节边全局可见**：跨章节边在所有章节面板上可见（使用 React Flow 全局边层）

---

## 性能红线

- 章节切换响应时间: ≤ 300ms（DOM 操作，不含网络）
- 卡片保存: 乐观更新 UI，API 写操作异步，不阻塞交互
- React Flow 节点数: 单章节 ≤ 50 节点（超出后考虑虚拟化）
- D1 查询: 首次加载 < 2s（P95）

## 跨章节边一致性规则（强制）

⚠️ **删除操作必须遍历所有章节**：
- 删除卡片时：遍历 `chapters[chapter].edges`，删除所有 `source === cardId` 或 `target === cardId` 的边（不限于当前章节）
- 删除边时：从 `chapters[sourceChapter].edges` 和 `chapters[targetChapter].edges` 两端同时删除副本

```typescript
// ✅ 正确：删除边时同步清理两端副本
const handleDeleteEdge = (edge: DDSEdge) => {
  set((state) => ({
    chapters: {
      ...state.chapters,
      [edge.sourceChapter]: {
        ...state.chapters[edge.sourceChapter],
        edges: state.chapters[edge.sourceChapter].edges.filter(e => e.id !== edge.id),
      },
      [edge.targetChapter]: {
        ...state.chapters[edge.targetChapter],
        edges: state.chapters[edge.targetChapter].edges.filter(e => e.id !== edge.id),
      },
    },
  }));
};

// ❌ 错误：只从 sourceChapter 删除（targetChapter 留下脏数据）
// const handleDeleteEdge = (edge) => { ...仅删 source... };
```
