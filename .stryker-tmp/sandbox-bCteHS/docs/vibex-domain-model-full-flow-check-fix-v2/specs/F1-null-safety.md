# Spec: F1 空值保护措施

## F1.1 组件层空值保护

### 涉及组件
- `BoundedContextChart`
- `DomainModelChart`
- `BusinessFlowChart`
- FallbackWrapper（通用兜底组件）

### 实现要求
```typescript
// Before
<div>{mermaidCode}</div>

// After
{mermaidCode ? (
  <MermaidChart code={mermaidCode} />
) : (
  <FallbackUI message="暂无数据，请先生成" type="empty" />
)}
```

### 兜底场景
| 场景 | Fallback Message | Fallback Type |
|------|------------------|---------------|
| mermaidCode 为 null/undefined/空字符串 | 暂无数据，请先生成 | empty |
| 网络错误 / 请求失败 | 网络错误，请重试 | error |
| 加载中（超过 5s） | 加载超时，请重试 | timeout |

### 测试用例
```typescript
describe('空值保护', () => {
  it('mermaidCode 为空时显示 fallback', () => {
    render(<DomainModelChart mermaidCode={null} />);
    expect(screen.getByText('暂无数据，请先生成')).toBeInTheDocument();
  });
  it('mermaidCode 为空字符串时显示 fallback', () => {
    render(<DomainModelChart mermaidCode="" />);
    expect(screen.getByText('暂无数据，请先生成')).toBeInTheDocument();
  });
  it('网络错误时显示错误提示', () => {
    render(<DomainModelChart error={new Error('network')} />);
    expect(screen.getByText('网络错误，请重试')).toBeInTheDocument();
  });
});
```

---

## F1.2 Hook 层空值保护

### 涉及 Hook
- `useDDDStream`
- `useDomainModel`
- `useBusinessFlow`

### 实现要求
```typescript
// Before
return { data: streamData, loading, error };

// After
return {
  data: streamData ?? {},
  loading,
  error,
  isEmpty: !streamData || Object.keys(streamData).length === 0
};
```

### 测试用例
```typescript
describe('useDDDStream 空值保护', () => {
  it('后端返回 null 时返回空对象', () => {
    const { result } = renderHook(() => useDDDStream(null));
    expect(result.current.data).toEqual({});
    expect(result.current.isEmpty).toBe(true);
  });
  it('后端返回 undefined 时返回空对象', () => {
    const { result } = renderHook(() => useDDDStream(undefined));
    expect(result.current.data).toEqual({});
  });
  it('不抛出异常', () => {
    expect(() => renderHook(() => useDDDStream(null))).not.toThrow();
  });
});
```

---

## F1.3 Reducer 层空值保护

### 涉及 Slice
- `boundedContextSlice`
- `domainModelSlice`
- `businessFlowSlice`

### 实现要求
```typescript
// Before
case 'SET_MODEL':
  return { ...state, model: action.payload };

// After
case 'SET_MODEL':
  if (!action.payload || typeof action.payload !== 'object') {
    return state; // 拦截非法数据
  }
  return { ...state, model: action.payload };
```

### 测试用例
```typescript
describe('Reducer 空值保护', () => {
  it('非法 payload 不改变状态', () => {
    const initial = { model: { id: '1' } };
    const result = domainModelSlice.reducer(initial, { type: 'SET_MODEL', payload: null });
    expect(result).toEqual(initial);
  });
  it('非法字符串 payload 不改变状态', () => {
    const initial = { model: { id: '1' } };
    const result = domainModelSlice.reducer(initial, { type: 'SET_MODEL', payload: 'invalid' });
    expect(result).toEqual(initial);
  });
  it('正常 payload 正常更新', () => {
    const initial = { model: null };
    const result = domainModelSlice.reducer(initial, { type: 'SET_MODEL', payload: { id: '2' } });
    expect(result.model).toEqual({ id: '2' });
  });
});
```

---

*Spec by PM Agent | 2026-03-29*
