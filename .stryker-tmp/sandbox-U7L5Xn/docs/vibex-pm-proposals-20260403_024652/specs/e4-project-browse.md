# Epic E4 Spec: 项目浏览体验优化

**Epic**: E4 - 项目浏览体验优化
**优先级**: P2
**工时**: 5-6h
**依赖**: Sprint 3 E3 响应式完成
**状态**: 规划中

---

## 1. Overview

### 1.1 目标
优化项目首页，提供清晰的最近项目浏览和快速创建入口。

### 1.2 用户价值
- 用户能快速找到和打开历史项目
- 一目了然的快速创建入口
- 灵活的项目筛选和排序

---

## 2. Page Structure

### 2.1 首页布局（优化版）

```
┌────────────────────────────────────────────────────────────────┐
│  VibeX Logo        [搜索项目...]           [设置] [用户]         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                    ┌─────────────────────┐                     │
│                    │                     │                     │
│  ┌──────────────┐  │    快速开始         │                     │
│  │              │  │                     │                     │
│  │ 最近项目      │  │  [+ 创建新项目]     │                     │
│  │              │  │                     │                     │
│  │ [卡片][卡片]→ │  │  [+ 从模板创建]     │                     │
│  │              │  │                     │                     │
│  └──────────────┘  └─────────────────────┘                     │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  项目列表                    [网格] [列表]  [全部▼] [排序▼]       │
│                                                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │ [缩略图] │  │ [缩略图] │  │ [缩略图] │  │ [缩略图] │          │
│  │         │  │         │  │         │  │         │          │
│  │ 项目A   │  │ 项目B   │  │ 项目C   │  │ 项目D   │          │
│  │ 2小时前  │  │ 昨天    │  │ 3天前   │  │ 1周前   │          │
│  │ ████░░  │  │ ██████  │  │ ████░░  │  │ ██████  │          │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Design

### 3.1 核心组件

| 组件名 | 文件 | 职责 |
|--------|------|------|
| ProjectHome | `pages/projects/index.tsx` | 项目首页容器 |
| HeroSection | `components/projects/HeroSection.tsx` | Hero 区域（快速开始） |
| RecentProjects | `components/projects/RecentProjects.tsx` | 最近项目横向列表 |
| ProjectCard | `components/projects/ProjectCard.tsx` | 项目卡片 |
| ProjectList | `components/projects/ProjectList.tsx` | 项目列表（网格/列表） |
| ProjectFilters | `components/projects/ProjectFilters.tsx` | 筛选和排序 |
| EmptyState | `components/projects/EmptyState.tsx` | 空状态引导 |

### 3.2 Store Design

```typescript
// stores/projectListStore.ts
interface ProjectListState {
  viewMode: 'grid' | 'list';
  filter: ProjectFilter;
  sortBy: 'modifiedAt' | 'name' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  
  // Actions
  setViewMode: (mode: ProjectListState['viewMode']) => void;
  setFilter: (filter: ProjectFilter) => void;
  setSortBy: (sort: ProjectListState['sortBy']) => void;
  toggleSortOrder: () => void;
}

type ProjectFilter = 'all' | 'in-progress' | 'completed' | 'archived';
```

---

## 4. Feature Details

### 4.1 Hero Section

**布局**: 左右两栏，左侧最近项目，右侧快速开始

**快速开始按钮**:
- 主按钮: "创建新项目" → `/projects/new`
- 次按钮: "从模板创建" → `/projects/new?template=true`

**视觉规格**:
- 按钮尺寸: 高度 48px, 圆角 8px
- 主按钮: 背景蓝色 (#3B82F6), 白色文字
- 次按钮: 边框蓝色, 透明背景

### 4.2 Recent Projects

**布局**: 横向滚动容器，显示最近 5 个项目

**卡片规格**:
- 宽度: 200px
- 高度: 150px
- 显示内容: 缩略图、名称、修改时间、Phase 进度条

**交互**:
- 鼠标悬停显示完整名称（截断时）
- 点击打开项目

### 4.3 Project Card

**网格视图卡片**:
```
┌─────────────────────┐
│      [缩略图]        │  ← Canvas 截图，16:9 比例
│                     │
├─────────────────────┤
│ 项目名称             │  ← 单行，超长截断
│ 2小时前              │  ← 相对时间
│ ████████░░ Phase 2  │  ← 进度条 + 当前阶段
└─────────────────────┘
```

**列表视图卡片**:
```
┌──────────────────────────────────────────────────────────┐
│ [缩略图] 项目名称          2小时前    Phase 2    [打开]     │
└──────────────────────────────────────────────────────────┘
```

**悬停操作菜单**:
- 打开 (打开项目)
- 复制 (复制项目)
- 删除 (删除项目，需确认)

### 4.4 Filters & Sorting

**筛选条件**:
- 全部 (all) - 默认
- 进行中 (in-progress)
- 已完成 (completed)
- 已归档 (archived)

**排序选项**:
- 最近修改 (modifiedAt) - 默认
- 名称 (name)
- 创建时间 (createdAt)

---

## 5. Screenshot Generation

### 5.1 缩略图生成

```typescript
// utils/thumbnail.ts
const generateThumbnail = async (canvasElement: HTMLElement): Promise<Blob> => {
  const canvas = await html2canvas(canvasElement, {
    scale: 0.5, // 缩小比例
    backgroundColor: '#ffffff',
    logging: false,
  });
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png', 0.8);
  });
};
```

### 5.2 缩略图存储

```typescript
// 在项目保存时生成并存储
const saveProjectWithThumbnail = async (project: Project) => {
  const thumbnail = await generateThumbnail(canvasRef.current);
  
  await projectService.update(project.id, {
    thumbnail: await uploadToStorage(thumbnail),
    // ... other fields
  });
};
```

---

## 6. Empty State

### 6.1 空状态设计

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                      📋                                  │
│                                                          │
│              还没有项目                                   │
│                                                          │
│         创建一个新项目，开始你的 DDD 建模之旅              │
│                                                          │
│              [+ 创建第一个项目]                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Empty State 组件

```typescript
// components/projects/EmptyState.tsx
const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-6xl mb-4">📋</div>
      <h2 className="text-xl font-semibold mb-2">还没有项目</h2>
      <p className="text-gray-500 mb-6">
        创建一个新项目，开始你的 DDD 建模之旅
      </p>
      <Link href="/projects/new">
        <Button variant="primary" size="lg">
          [+ 创建第一个项目]
        </Button>
      </Link>
    </div>
  );
};
```

---

## 7. Technical Implementation

### 7.1 项目列表加载

```typescript
// hooks/useProjectList.ts
const useProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    projectService.list()
      .then(setProjects)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  
  return { projects, loading, error };
};
```

### 7.2 虚拟滚动（大量项目优化）

```typescript
// 对于超过 50 个项目的场景，使用虚拟滚动
import { useVirtualizer } from '@tanstack/react-virtual';

const ProjectGrid: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <ProjectCard
            key={virtualRow.key}
            project={projects[virtualRow.index]}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              width: '100%',
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

### 7.3 Intersection Observer 懒加载

```typescript
// 对于横向滚动列表，使用 IntersectionObserver
const useLazyLoad = (ref: RefObject<HTMLElement>) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [ref]);
  
  return isVisible;
};
```

---

## 8. Acceptance Criteria

### E4-S1: 最近项目横向列表
- [ ] `expect(recentProjectsSection.isVisible()).toBe(true)` 最近项目区域可见
- [ ] `expect(projectCards.length()).toBeGreaterThan(0)` 有项目卡片
- [ ] `expect(projectCard.find('.thumbnail').isVisible()).toBe(true)` 缩略图可见
- [ ] `expect(projectCard.find('.name').getText()).toBeTruthy()` 名称非空
- [ ] `expect(projectCard.find('.modified-time').getText()).toMatch(/\d+.*前/)` 时间格式正确
- [ ] `expect(projectCard.find('.phase-progress').isVisible()).toBe(true)` Phase进度可见

### E4-S2: 快速创建入口
- [ ] `expect(heroSection.isVisible()).toBe(true)` Hero区域可见
- [ ] `expect(createNewBtn.isVisible()).toBe(true)` 新建按钮可见
- [ ] `expect(templateBtn.isVisible()).toBe(true)` 模板按钮可见
- [ ] `expect(createNewBtn.isClickable()).toBe(true)` 新建可点击
- [ ] `expect(templateBtn.isClickable()).toBe(true)` 模板可点击

### E4-S3: 视图切换与筛选排序
- [ ] `expect(viewToggle.isVisible()).toBe(true)` 视图切换可见
- [ ] `expect(viewToggle.find('grid').isClickable()).toBe(true)` 网格视图可切换
- [ ] `expect(viewToggle.find('list').isClickable()).toBe(true)` 列表视图可切换
- [ ] `expect(filterTabs.isVisible()).toBe(true)` 筛选标签可见
- [ ] `expect(sortDropdown.isVisible()).toBe(true)` 排序下拉可见
- [ ] `expect(projectCards.length()).toChangeWhenFilter('进行中')` 筛选生效

### E4-S4: 项目卡片悬停操作
- [ ] `expect(projectCard.hover().find('.actions').isVisible()).toBe(true)` 悬停显示操作菜单
- [ ] `expect(projectCard.find('.action-open').isClickable()).toBe(true)` 打开可点击
- [ ] `expect(projectCard.find('.action-duplicate').isClickable()).toBe(true)` 复制可点击
- [ ] `expect(projectCard.find('.action-delete').isClickable()).toBe(true)` 删除可点击

### E4-S5: 空状态引导
- [ ] `expect(emptyState.isVisible()).toBe(true)` 空状态可见
- [ ] `expect(emptyState.find('.guide-text').getText()).toContain('创建')` 引导文案正确
- [ ] `expect(emptyState.find('.create-btn').isClickable()).toBe(true)` 创建按钮可点击

---

## 9. Test Cases

### TC-E4-001: 显示最近项目
```typescript
test('TC-E4-001: 首页应显示最近项目横向列表', async ({ page }) => {
  await page.goto('/projects');
  
  const recentSection = page.locator('#recent-projects');
  await expect(recentSection).toBeVisible();
  
  const cards = recentSection.locator('.recent-project-card');
  await expect(cards.first()).toBeVisible();
});
```

### TC-E4-002: 视图切换
```typescript
test('TC-E4-002: 应支持网格/列表视图切换', async ({ page }) => {
  await page.goto('/projects');
  
  // Default should be grid
  await expect(page.locator('.project-grid')).toBeVisible();
  
  // Switch to list
  await page.click('#view-toggle-list');
  await expect(page.locator('.project-list')).toBeVisible();
  
  // Switch back to grid
  await page.click('#view-toggle-grid');
  await expect(page.locator('.project-grid')).toBeVisible();
});
```

### TC-E4-003: 筛选和排序
```typescript
test('TC-E4-003: 筛选和排序应生效', async ({ page }) => {
  await page.goto('/projects');
  
  // Filter by "进行中"
  await page.selectOption('#filter-select', 'in-progress');
  await expect(page.locator('.project-card')).toHaveCount(2);
  
  // Sort by name
  await page.selectOption('#sort-select', 'name');
  const firstCard = page.locator('.project-card').first();
  await expect(firstCard).toContainText('A项目'); // Alphabetically first
});
```

### TC-E4-004: 悬停显示操作
```typescript
test('TC-E4-004: 悬停项目卡片应显示操作菜单', async ({ page }) => {
  await page.goto('/projects');
  
  const card = page.locator('.project-card').first();
  await card.hover();
  
  await expect(card.locator('.hover-actions')).toBeVisible();
  await expect(card.locator('.action-open')).toBeVisible();
  await expect(card.locator('.action-duplicate')).toBeVisible();
  await expect(card.locator('.action-delete')).toBeVisible();
});
```

### TC-E4-005: 空状态
```typescript
test('TC-E4-005: 无项目时应显示空状态', async ({ page }) => {
  // Mock empty project list
  await page.goto('/projects');
  
  const emptyState = page.locator('#empty-state');
  await expect(emptyState).toBeVisible();
  await expect(emptyState).toContainText('还没有项目');
  await expect(emptyState.locator('#create-first-btn')).toBeVisible();
});
```

---

## 10. Milestone

| 日期 | 里程碑 |
|------|--------|
| Week 1 | 完成 Hero 区域和最近项目列表 |
| Week 2 | 完成项目卡片和视图切换 |
| Week 3 | 完成筛选排序和空状态 |
| Week 4 | 完成测试和响应式适配 |
