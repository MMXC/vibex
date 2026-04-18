# P2-002: CreateAPIEndpointForm 表单缺失

**严重性**: P2（体验/建议）
**Epic**: E1
**Spec 引用**: specs/E1-api-chapter.md

## 问题描述
Spec E1-api-chapter.md 要求 API 章节属性面板（ChapterPanel）支持通过表单创建 API 端点（path/method/summary），但 `ChapterPanel.tsx` 中不存在 `CreateAPIEndpointForm`。

## 代码证据

```bash
$ grep -n "CreateAPIEndpointForm\|CreateUserStoryForm\|CreateBoundedContextForm" /root/.openclaw/vibex/vibex-fronted/src/components/dds/canvas/ChapterPanel.tsx
37:  api: ['api-endpoint'],
45:  'api-endpoint': 'API 端点',
69:// ==================== Card Creation Forms ====================
71:function CreateUserStoryForm({     // ✅ 存在
84:    <div className={styles.createForm}>
139:function CreateBoundedContextForm({ // ✅ 存在
151:    <div className={styles.createForm}>
195:function CreateFlowStepForm({    // ✅ 存在
208:    <div className={styles.createForm}>
312:  const [showCreateForm, setShowCreateForm] = useState(false);

// ⚠️ CreateAPIEndpointForm 不存在
```

## 修复建议

在 `ChapterPanel.tsx` 中添加：

```typescript
function CreateAPIEndpointForm({
  onSubmit,
}: {
  onSubmit: (data: Partial<APIEndpointCard>) => void;
}) {
  const [method, setMethod] = useState<HTTPMethod>('GET');
  const [path, setPath] = useState('');
  const [summary, setSummary] = useState('');

  return (
    <div className={styles.createForm}>
      <select value={method} onChange={(e) => setMethod(e.target.value as HTTPMethod)}>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        {/* ... */}
      </select>
      <input
        type="text"
        placeholder="path"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        aria-label="API 路径"
      />
      <input
        type="text"
        placeholder="summary"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        aria-label="API 描述"
      />
      <button
        type="button"
        onClick={() => onSubmit({ type: 'api-endpoint', method, path, summary })}
      >
        创建
      </button>
    </div>
  );
}
```

## 影响范围
- `src/components/dds/canvas/ChapterPanel.tsx`
- API 章节 CRUD 流程不完整（只读，无法从 UI 创建端点）
