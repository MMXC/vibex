# Spec: E3 - Dashboard Fuzzy 搜索规格

## 搜索行为

```typescript
const debounceMs = 300;

function useProjectSearch(projects: Project[]) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, debounceMs);

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return projects;
    return projects.filter(p =>
      p.name.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
  }, [debouncedQuery, projects]);

  return { query, setQuery, filtered };
}
```

## 验收

- 搜索响应 < 2s
- 空结果显示"暂无匹配项目"
- debounce 300ms
