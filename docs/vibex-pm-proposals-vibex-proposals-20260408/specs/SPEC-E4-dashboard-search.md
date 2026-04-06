# SPEC: E4 — Dashboard 项目搜索

**Epic:** E4 — P1 体验改善：项目发现  
**Stories:** S4.1, S4.2, S4.3, S4.4, S4.5  
**Owner:** dev  
**Estimated:** 6h

---

## 1. 概述

当用户拥有多个项目后，Dashboard 项目列表无法快速定位目标。本 Epic 在 Dashboard 添加搜索框、实时过滤、键盘导航和空结果处理。

---

## 2. Story S4.1: 搜索框 UI

### 2.1 实现方案

**文件:** `src/pages/Dashboard.tsx`

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [debouncedQuery, setDebouncedQuery] = useState('');

// debounce 实现
useEffect(() => {
  const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
  return () => clearTimeout(timer);
}, [searchQuery]);

return (
  <div className="dashboard" data-testid="dashboard-page">
    <div className="dashboard-header">
      <h1>我的项目</h1>
      <div className="search-bar" data-testid="search-bar">
        <SearchIcon className="search-icon" />
        <input
          type="text"
          data-testid="search-input"
          placeholder="搜索项目..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="search-clear"
            data-testid="search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="清除搜索"
          >
            ×
          </button>
        )}
      </div>
    </div>
    {/* 项目列表 */}
  </div>
);
```

### 2.2 验收标准

```typescript
expect(screen.getByTestId('search-input')).toBeVisible();
expect(screen.getByPlaceholderText('搜索项目...')).toBeInTheDocument();
expect(screen.getByTestId('search-input')).toHaveAttribute('type', 'text');
```

---

## 3. Story S4.2: 实时过滤逻辑

### 3.1 实现方案

```typescript
const filteredProjects = useMemo(() => {
  if (!debouncedQuery.trim()) return projects;
  const q = debouncedQuery.toLowerCase();
  return projects.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.description?.toLowerCase().includes(q)
  );
}, [debouncedQuery, projects]);
```

### 3.2 验收标准

```typescript
fireEvent.change(screen.getByTestId('search-input'), { target: { value: '电商' } });
await waitFor(() => {
  const cards = screen.getAllByTestId('project-card');
  cards.forEach((card) => {
    expect(card.textContent).toMatch(/电商/);
  });
});
```

---

## 4. Story S4.3: 键盘导航支持

### 4.1 实现方案

```typescript
const [focusedIndex, setFocusedIndex] = useState(-1);

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setFocusedIndex((i) => Math.min(i + 1, filteredProjects.length - 1));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setFocusedIndex((i) => Math.max(i - 1, 0));
  } else if (e.key === 'Enter' && focusedIndex >= 0) {
    router.push(`/canvas/${filteredProjects[focusedIndex].id}`);
  }
};

// 项目卡片
filteredProjects.map((project, i) => (
  <div
    key={project.id}
    data-testid="project-card"
    className={focusedIndex === i ? 'focused' : ''}
    onClick={() => router.push(`/canvas/${project.id}`)}
  />
));
```

### 4.2 验收标准

```typescript
fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'a' } });
fireEvent.keyDown(screen.getByTestId('search-input'), { key: 'ArrowDown' });
// focused 项目高亮
```

---

## 5. Story S4.4: 空结果处理

### 5.1 实现方案

```typescript
{filteredProjects.length === 0 ? (
  <div className="empty-search-result" data-testid="empty-search">
    <EmptySearchIcon />
    <h3>未找到项目</h3>
    <p>没有找到与「{debouncedQuery}」相关的项目</p>
    <button
      className="create-project-btn primary"
      data-testid="create-from-search"
      onClick={() => router.push('/canvas/new')}
    >
      创建新项目
    </button>
  </div>
) : (
  <ProjectList projects={filteredProjects} />
)}
```

### 5.2 验收标准

```typescript
fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'xyznonexistent' } });
await waitFor(() => {
  expect(screen.getByTestId('empty-search')).toBeVisible();
  expect(screen.getByText('未找到项目')).toBeInTheDocument();
  expect(screen.getByTestId('create-from-search')).toBeVisible();
});
```

---

## 6. Story S4.5: E2E 测试

**文件:** `e2e/dashboard/project-search.spec.ts`

```typescript
test('dashboard search: filter and keyboard navigation', async ({ page }) => {
  await page.goto('/dashboard');
  // 创建多个项目
  await createProject(page, '电商系统');
  await createProject(page, '社交平台');
  await createProject(page, '医疗系统');
  // 搜索过滤
  await page.fill('[data-testid="search-input"]', '电商');
  await expect(page.getByTestId('project-card')).toHaveCount(1);
  await expect(page.getByText('电商系统')).toBeVisible();
  // 键盘导航
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-testid="project-card"]').first()).toHaveClass(/focused/);
  // Enter 打开
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/canvas\/.+/);
});

test('dashboard search: empty result with create CTA', async ({ page }) => {
  await page.goto('/dashboard');
  await page.fill('[data-testid="search-input"]', 'nonexistent123');
  await expect(page.getByTestId('empty-search')).toBeVisible();
  await page.click('[data-testid="create-from-search"]');
  await expect(page).toHaveURL('/canvas/new');
});
```

---

## 7. 性能需求

| 指标 | 目标 |
|------|------|
| 搜索响应时间 | <300ms（debounce 300ms 后过滤）|
| 100+ 项目性能 | 过滤后只渲染可见项（虚拟列表），FPS > 30 |
| 输入延迟 | <50ms（debounce 之前）|
