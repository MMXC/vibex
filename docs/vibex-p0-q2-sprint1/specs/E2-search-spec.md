# Spec: E2 - Dashboard Fuzzy 搜索详细规格

## E2.1 搜索组件接口

```typescript
interface SearchProps {
  projects: Project[];
  onFilter: (filtered: Project[]) => void;
  debounceMs?: number; // 默认 300
}

// 搜索行为
function useProjectSearch(projects: Project[]) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return projects;
    return projects.filter(p =>
      p.name.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
  }, [debouncedQuery, projects]);

  return { query, setQuery, filtered };
}
```

## E2.2 验收测试用例

```typescript
// E2.3.1 Fuzzy 搜索实现
test('搜索 "shop" 匹配 "MyShop Project"', () => {
  const result = filterProjects(mockProjects, 'shop');
  expect(result).toHaveLength(1);
  expect(result[0].name).toBe('MyShop Project');
});

test('搜索区分大小写但匹配不区分', () => {
  const result = filterProjects(mockProjects, 'SHOP');
  expect(result).toHaveLength(1);
});

test('空字符串返回全量', () => {
  const result = filterProjects(mockProjects, '');
  expect(result).toHaveLength(mockProjects.length);
});

// E2.3.2 空结果处理
test('无结果时显示友好提示', () => {
  const result = filterProjects(mockProjects, 'xyznonexistent');
  expect(result).toHaveLength(0);
  expect(screen.getByText(/暂无.*项目/i)).toBeVisible();
});

// E2.3.3 响应时间
test('搜索响应 < 200ms', () => {
  const start = performance.now();
  filterProjects(mockProjects, 'test');
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(200);
});
```

## E2.3 UI 规范

- 搜索框位置：Dashboard 项目列表顶部
- 搜索框宽度：100%（或固定 max-width: 400px）
- Placeholder：`搜索项目...`
- 搜索图标：左侧 magnifying glass icon
- Debounce：300ms
- 结果更新：实时过滤，不跳页
