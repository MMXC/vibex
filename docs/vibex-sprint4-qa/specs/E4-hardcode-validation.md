# Spec: E4 — 硬编码识别验证规格

**对应 Epic**: E4（硬编码识别验证）
**目标文件**: 
- `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx`
- `vibex-fronted/src/stores/dds/DDSCanvasStore.ts`
- `vibex-fronted/src/types/dds/index.ts`

---

## 1. DDSToolbar CHAPTER_LABELS 扩展

### 当前状态（硬编码）

```typescript
// DDSToolbar.tsx:21
const CHAPTER_LABELS: Record<ChapterType, string> = {
  requirement: '需求',
  context: '上下文',
  flow: '流程',
  // ❌ api 和 businessRules 缺失
};
```

### Sprint4 期望状态

```typescript
const CHAPTER_LABELS: Record<ChapterType, string> = {
  requirement: '需求',
  context: '上下文',
  flow: '流程',
  api: 'API规格',           // ✅ 新增
  businessRules: '业务规则', // ✅ 新增
};
```

### 验证用例

```typescript
// T8-U1: 标签数量
const labels = Object.keys(CHAPTER_LABELS);
expect(labels).toHaveLength(5);

// T8-U2: 新标签存在
expect(CHAPTER_LABELS['api']).toBe('API规格');
expect(CHAPTER_LABELS['businessRules']).toBe('业务规则');

// T8-U3: 现有标签不受影响
expect(CHAPTER_LABELS['requirement']).toBe('需求');
expect(CHAPTER_LABELS['context']).toBe('上下文');
expect(CHAPTER_LABELS['flow']).toBe('流程');

// T8-U4: ChapterType 包含新类型
expect(CHANNEL_TYPES).toContain('api');
expect(CHANNEL_TYPES).toContain('businessRules');
```

---

## 2. DDSCanvasStore initialChapters 扩展

### 当前状态（硬编码）

```typescript
// DDSCanvasStore.ts:36
const initialChapters: Record<ChapterType, ChapterData> = {
  requirement: createInitialChapterData('requirement'),
  context: createInitialChapterData('context'),
  flow: createInitialChapterData('flow'),
  // ❌ api 和 businessRules 缺失
};
```

### Sprint4 期望状态

```typescript
const initialChapters: Record<ChapterType, ChapterData> = {
  requirement: createInitialChapterData('requirement'),
  context: createInitialChapterData('context'),
  flow: createInitialChapterData('flow'),
  api: createInitialChapterData('api'),                    // ✅ 新增
  businessRules: createInitialChapterData('businessRules'), // ✅ 新增
};
```

### 验证用例

```typescript
// T9-U1: 章节数量
const chapters = Object.keys(initialChapters);
expect(chapters).toHaveLength(5);

// T9-U2: 新章节存在
expect(initialChapters['api']).toBeDefined();
expect(initialChapters['businessRules']).toBeDefined();

// T9-U3: 新章节结构正确
expect(initialChapters['api'].type).toBe('api');
expect(initialChapters['api'].cards).toEqual([]);
expect(initialChapters['api'].edges).toEqual([]);

// T9-U4: 现有章节不受影响
expect(initialChapters['requirement'].type).toBe('requirement');
expect(initialChapters['context'].type).toBe('context');
expect(initialChapters['flow'].type).toBe('flow');
```

---

## 3. CrossChapterEdgesOverlay 复用验证

### 验证点

DDSEdge 类型已包含 sourceChapter/targetChapter：
```typescript
export interface DDSEdge {
  id: string;
  source: string;
  target: string;
  sourceChapter?: ChapterType;  // ✅ 已存在
  targetChapter?: ChapterType;  // ✅ 已存在
  label?: string;
  guard?: string;
}
```

### 验证用例

```typescript
// T10-U1: DDSEdge 包含跨章节字段
expect('sourceChapter' in DDSEdge).toBe(true);
expect('targetChapter' in DDSEdge).toBe(true);

// T10-U2: 新章节类型赋值
const edge: DDSEdge = {
  id: 'e1',
  source: 'api-1',
  target: 'req-1',
  sourceChapter: 'api',
  targetChapter: 'requirement',
};
expect(edge.sourceChapter).toBe('api');
expect(edge.targetChapter).toBe('requirement');

// T10-U3: 同章节边兼容
const sameChapterEdge: DDSEdge = {
  id: 'e2',
  source: 'api-1',
  target: 'api-2',
  sourceChapter: 'api',
  targetChapter: 'api',
};
expect(sameChapterEdge.sourceChapter).toBe('api');
```
